// The HTTP handlers, each a plain (Request) => Response function, so the same code runs on
// Vercel functions and Supabase edge functions. Every side effect goes through `Deps`.
import { bearerToken, generateKey, hashKey, looksLikeKey, verifyKey } from './keys.js';
import { checkItemAccess } from './licence.js';
import { WebhookError, type PaymentProvider } from './payments.js';
import { LAUNCH_SPOTS, isPlan, quote, spotsRemaining } from './pricing.js';
import type { Auth, RegistrySource, Store } from './store.js';

export interface Deps {
  store: Store;
  payments: PaymentProvider;
  auth: Auth;
  registry: RegistrySource;
  /** Public address of the website, without a trailing slash. */
  siteUrl: string;
  /** True when any part is running without its real account behind it. */
  mock: boolean;
}

export type Handler = (request: Request) => Promise<Response>;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

const fail = (status: number, code: string, message: string, headers?: Record<string, string>) =>
  json({ error: message, code }, status, headers);

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** GET: how many launch-price spots are left. Driven by real purchases only. */
export const launchOfferHandler = (deps: Deps): Handler => async () => {
  const remaining = spotsRemaining(await deps.store.launchSpotsSold());
  return json({ total: LAUNCH_SPOTS, remaining, mock: deps.mock });
};

/** POST { plan, email? }: start a hosted checkout and return its address. */
export const createCheckoutHandler = (deps: Deps): Handler => async (request) => {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');
  const body = await readJson(request);
  if (!isPlan(body.plan)) return fail(400, 'bad_plan', 'Plan must be "individual" or "team".');
  const email = typeof body.email === 'string' && /^\S+@\S+\.\S+$/.test(body.email) ? body.email : undefined;

  const q = quote(body.plan, await deps.store.launchSpotsSold());
  try {
    const session = await deps.payments.createCheckout({
      quote: q,
      email,
      successUrl: `${deps.siteUrl}/#pricing`,
      cancelUrl: `${deps.siteUrl}/#pricing`,
    });
    return json({
      url: session.url,
      plan: q.plan,
      amountCents: q.amountCents,
      currency: q.currency,
      launchOffer: q.launchOffer,
      mock: deps.payments.name === 'mock',
    });
  } catch {
    return fail(502, 'checkout_failed', 'Checkout could not be started. Please try again.');
  }
};

/** POST from the payment provider. Verifies the signature, then records the purchase once. */
export const paymentWebhookHandler = (deps: Deps): Handler => async (request) => {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');
  const rawBody = await request.text(); // the signature covers the exact bytes
  let event;
  try {
    event = await deps.payments.parseWebhook(rawBody, request.headers);
  } catch (err) {
    if (err instanceof WebhookError) return fail(400, 'bad_webhook', err.message);
    throw err;
  }
  if (event.type === 'ignored') return json({ received: true, recorded: false, reason: event.reason });
  const { created } = await deps.store.recordPurchase({
    email: event.email,
    plan: event.plan,
    amountCents: event.amountCents,
    currency: event.currency,
    provider: deps.payments.name,
    providerReference: event.reference,
    launchOffer: event.launchOffer,
  });
  // A repeat delivery is acknowledged without recording anything twice.
  return json({ received: true, recorded: created });
};

/**
 * Access keys for the signed-in customer.
 *   GET            list keys (prefix and dates only)
 *   POST { label? } create a key; the full key is returned once and never again
 *   DELETE ?id=…   revoke a key
 */
export const accessKeysHandler = (deps: Deps): Handler => async (request) => {
  const user = await deps.auth.getUser(request);
  if (!user) return fail(401, 'sign_in_required', deps.mock ? 'Mock mode: sign-in is not connected.' : 'Sign in to manage access keys.');

  const view = (k: { id: string; prefix: string; label: string | null; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }) =>
    ({ id: k.id, prefix: k.prefix, label: k.label, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt, revokedAt: k.revokedAt });

  if (request.method === 'GET') return json({ keys: (await deps.store.listKeys(user.email)).map(view) });

  if (request.method === 'POST') {
    if (!(await deps.store.hasActiveSeat(user.email)))
      return fail(403, 'no_licence', 'No Pro licence was found for this email. Sign in with the email you paid with.');
    const active = (await deps.store.listKeys(user.email)).filter((k) => !k.revokedAt);
    if (active.length >= MAX_ACTIVE_KEYS) return fail(409, 'too_many_keys', `You can have ${MAX_ACTIVE_KEYS} active keys. Revoke one first.`);
    const body = await readJson(request);
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 60) || null : null;
    const generated = await generateKey();
    const record = await deps.store.createKey({ ownerEmail: user.email, hash: generated.hash, prefix: generated.prefix, label });
    return json({ key: generated.key, ...view(record), note: 'Copy this key now. It is not shown again.' }, 201);
  }

  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return fail(400, 'missing_id', 'Say which key to revoke with ?id=.');
    return (await deps.store.revokeKey(user.email, id)) ? json({ revoked: true }) : fail(404, 'not_found', 'No such active key.');
  }
  return fail(405, 'method_not_allowed', 'Use GET, POST or DELETE.');
};

export const MAX_ACTIVE_KEYS = 5;

/** GET /r/<name>.json. Free items are open; Pro items need `Authorization: Bearer <key>`. */
export const registryHandler = (deps: Deps): Handler => async (request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, 'method_not_allowed', 'Use GET.');
  const match = /\/r\/([a-z0-9][a-z0-9-]*)\.json$/.exec(new URL(request.url).pathname);
  const item = match ? await deps.registry.get(match[1]!) : null;
  if (!item) return fail(404, 'not_found', 'No such registry item.');

  if (item.tier === 'free')
    return new Response(item.json, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });

  const presented = bearerToken(request.headers.get('authorization'));
  let state = null;
  let keyId: string | null = null;
  if (presented && looksLikeKey(presented)) {
    const record = await deps.store.findKeyByHash(await hashKey(presented));
    if (record && (await verifyKey(presented, record.hash))) {
      keyId = record.id;
      state = { revokedAt: record.revokedAt, ownerHasActiveSeat: await deps.store.hasActiveSeat(record.ownerEmail) };
    }
  }
  const access = checkItemAccess(item.tier, presented != null, state);
  if (!access.allowed)
    return fail(access.status, access.code, access.message, access.status === 401 ? { 'www-authenticate': 'Bearer realm="AscentUI Pro"' } : undefined);
  if (keyId) await deps.store.touchKey(keyId);
  return new Response(item.json, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' } });
};
