// End-to-end tests of the handlers against in-memory fakes. No network: every fetch is a fake.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp, depsFromEnv } from './app.js';
import type { Deps } from './handlers.js';
import { ShopifyProvider, StripeCheckoutProvider, stripeSignature } from './payments.js';
import { MemoryRegistry, MemoryStore, headerAuth } from './store.js';
import { SupabaseStore, supabaseAuth } from './supabase.js';

const WEBHOOK_SECRET = 'whsec_test_not_a_real_secret';
const NOW = 1_800_000_000;

interface Call { url: string; init: RequestInit }

function setup() {
  const calls: Call[] = [];
  const fakeStripe: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify({ id: `cs_test_${calls.length}`, url: `https://checkout.stripe.test/pay/${calls.length}` }));
  };
  const store = new MemoryStore();
  const deps: Deps = {
    store,
    auth: headerAuth,
    payments: new StripeCheckoutProvider({
      secretKey: 'sk_test_not_a_real_key',
      webhookSecret: WEBHOOK_SECRET,
      prices: { individual: { launch: 'price_ind_launch', regular: 'price_ind' }, team: { launch: 'price_team_launch', regular: 'price_team' } },
      fetch: fakeStripe,
      now: () => NOW,
    }),
    registry: new MemoryRegistry({
      'data-table': { tier: 'free', json: '{"name":"data-table"}' },
      'cases-board': { tier: 'pro', json: '{"name":"cases-board"}' },
    }),
    siteUrl: 'https://site.test',
    mock: false,
  };
  return { app: createApp(deps), store, calls };
}

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://api.test${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (path: string, headers: Record<string, string> = {}) => new Request(`https://api.test${path}`, { headers });

function completed(id: string, email: string, plan: string, amount: number, launch: boolean) {
  return JSON.stringify({
    type: 'checkout.session.completed',
    data: { object: { id, payment_status: 'paid', amount_total: amount, currency: 'usd', customer_details: { email }, metadata: { plan, launch_offer: String(launch) } } },
  });
}

async function webhook(app: (r: Request) => Promise<Response>, body: string, opts: { secret?: string; at?: number } = {}) {
  const signature = await stripeSignature(opts.secret ?? WEBHOOK_SECRET, body, opts.at ?? NOW);
  return app(new Request('https://api.test/api/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body }));
}

// ---------------------------------------------------------------- checkout

test('checkout: creates a Stripe session at the launch price', async () => {
  const { app, calls } = setup();
  const res = await app(post('/api/checkout', { plan: 'team', email: 'buyer@example.com' }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    url: 'https://checkout.stripe.test/pay/1', plan: 'team', amountCents: 39900, currency: 'usd', launchOffer: true, mock: false,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, 'https://api.stripe.com/v1/checkout/sessions');
  const form = new URLSearchParams(String(calls[0]!.init.body));
  assert.equal(form.get('mode'), 'payment');
  assert.equal(form.get('line_items[0][price]'), 'price_team_launch');
  assert.equal(form.get('metadata[plan]'), 'team');
  assert.equal(form.get('metadata[launch_offer]'), 'true');
  assert.equal(form.get('customer_email'), 'buyer@example.com');
  assert.equal(form.get('success_url'), 'https://site.test/#pricing');
});

test('checkout: uses the regular price once 100 launch spots are sold', async () => {
  const { app, store, calls } = setup();
  for (let i = 0; i < 100; i++)
    await store.recordPurchase({ email: `b${i}@example.com`, plan: i % 2 ? 'team' : 'individual', amountCents: 1, currency: 'usd', provider: 'stripe', providerReference: `cs_${i}`, launchOffer: true });
  const res = await app(post('/api/checkout', { plan: 'individual' }));
  const body = (await res.json()) as { amountCents: number; launchOffer: boolean };
  assert.equal(body.amountCents, 29900);
  assert.equal(body.launchOffer, false);
  assert.equal(new URLSearchParams(String(calls[0]!.init.body)).get('line_items[0][price]'), 'price_ind');
  const offer = await (await app(get('/api/launch-offer'))).json();
  assert.deepEqual(offer, { total: 100, remaining: 0, mock: false });
});

test('checkout: rejects an unknown plan and the wrong method', async () => {
  const { app, calls } = setup();
  assert.equal((await app(post('/api/checkout', { plan: 'enterprise' }))).status, 400);
  assert.equal((await app(get('/api/checkout'))).status, 405);
  assert.equal(calls.length, 0);
});

// ---------------------------------------------------------------- webhook

test('webhook: a signed, paid checkout records one purchase and one seat', async () => {
  const { app, store } = setup();
  const res = await webhook(app, completed('cs_1', 'Buyer@Example.com', 'individual', 14900, true));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: true, recorded: true });
  assert.equal(store.purchases.length, 1);
  assert.equal(store.purchases[0]!.email, 'buyer@example.com');
  assert.equal(store.purchases[0]!.launchOffer, true);
  assert.equal(await store.hasActiveSeat('buyer@example.com'), true);
  assert.equal(await store.launchSpotsSold(), 1);
});

test('webhook: the same event delivered twice is recorded once', async () => {
  const { app, store } = setup();
  const body = completed('cs_1', 'buyer@example.com', 'team', 39900, true);
  await webhook(app, body);
  const again = await webhook(app, body);
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), { received: true, recorded: false });
  assert.equal(store.purchases.length, 1);
});

test('webhook: a wrong, missing or old signature is refused and nothing is recorded', async () => {
  const { app, store } = setup();
  const body = completed('cs_1', 'buyer@example.com', 'individual', 14900, true);
  assert.equal((await webhook(app, body, { secret: 'whsec_wrong' })).status, 400);
  assert.equal((await webhook(app, body, { at: NOW - 3600 })).status, 400);
  assert.equal((await app(new Request('https://api.test/api/webhook', { method: 'POST', body }))).status, 400);
  // A valid signature for a different body does not carry over.
  const signature = await stripeSignature(WEBHOOK_SECRET, body, NOW);
  const tampered = body.replace('individual', 'team');
  assert.equal((await app(new Request('https://api.test/api/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: tampered }))).status, 400);
  assert.equal(store.purchases.length, 0);
});

test('webhook: other events and unpaid sessions are acknowledged but not recorded', async () => {
  const { app, store } = setup();
  const other = await webhook(app, JSON.stringify({ type: 'payment_intent.created', data: { object: {} } }));
  assert.equal(((await other.json()) as { recorded: boolean }).recorded, false);
  const unpaid = completed('cs_2', 'buyer@example.com', 'individual', 14900, true).replace('"paid"', '"unpaid"');
  assert.equal(((await (await webhook(app, unpaid)).json()) as { recorded: boolean }).recorded, false);
  assert.equal(store.purchases.length, 0);
});

// ---------------------------------------------------------------- access keys

test('keys: sign-in is required', async () => {
  const { app } = setup();
  assert.equal((await app(get('/api/keys'))).status, 401);
  assert.equal((await app(post('/api/keys', {}))).status, 401);
});

test('keys: someone with no licence cannot create one', async () => {
  const { app, store } = setup();
  const res = await app(post('/api/keys', {}, { 'x-test-user': 'stranger@example.com' }));
  assert.equal(res.status, 403);
  assert.equal(store.keys.length, 0);
});

test('keys: a buyer creates a key, sees it once, and only the hash is stored', async () => {
  const { app, store } = setup();
  await webhook(app, completed('cs_1', 'buyer@example.com', 'individual', 14900, true));
  const as = { 'x-test-user': 'buyer@example.com' };
  const created = await app(post('/api/keys', { label: 'Laptop' }, as));
  assert.equal(created.status, 201);
  const body = (await created.json()) as { key: string; id: string; prefix: string };
  assert.match(body.key, /^asc_/);
  assert.equal(JSON.stringify(store.keys).includes(body.key), false, 'the key is not in the store');
  assert.match(store.keys[0]!.hash, /^[0-9a-f]{64}$/);

  const listed = await (await app(get('/api/keys', as))).text();
  assert.equal(listed.includes(body.key), false, 'the key is not listed again');
  assert.equal(listed.includes(store.keys[0]!.hash), false, 'the hash is not listed');
  assert.ok(listed.includes(body.prefix));

  // Another customer cannot see or revoke it.
  await webhook(app, completed('cs_2', 'other@example.com', 'individual', 14900, true));
  const other = { 'x-test-user': 'other@example.com' };
  assert.deepEqual(await (await app(get('/api/keys', other))).json(), { keys: [] });
  assert.equal((await app(new Request(`https://api.test/api/keys?id=${body.id}`, { method: 'DELETE', headers: other }))).status, 404);
});

test('keys: at most five active keys', async () => {
  const { app } = setup();
  await webhook(app, completed('cs_1', 'buyer@example.com', 'individual', 14900, true));
  const as = { 'x-test-user': 'buyer@example.com' };
  for (let i = 0; i < 5; i++) assert.equal((await app(post('/api/keys', {}, as))).status, 201);
  assert.equal((await app(post('/api/keys', {}, as))).status, 409);
});

// ---------------------------------------------------------------- registry

async function buyerWithKey() {
  const ctx = setup();
  await webhook(ctx.app, completed('cs_1', 'buyer@example.com', 'team', 39900, true));
  const res = await ctx.app(post('/api/keys', {}, { 'x-test-user': 'buyer@example.com' }));
  const { key, id } = (await res.json()) as { key: string; id: string };
  return { ...ctx, key, id };
}

test('registry: free items are open to anyone', async () => {
  const { app } = setup();
  const res = await app(get('/r/data-table.json'));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { name: 'data-table' });
});

test('registry: a Pro item without a key is 401 JSON', async () => {
  const { app } = setup();
  const res = await app(get('/r/cases-board.json'));
  assert.equal(res.status, 401);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  assert.equal(((await res.json()) as { code: string }).code, 'key_required');
  assert.match(res.headers.get('www-authenticate') ?? '', /Bearer/);
});

test('registry: a Pro item with an unknown or malformed key is 403 JSON', async () => {
  const { app } = setup();
  for (const key of ['asc_' + 'x'.repeat(43), 'nonsense']) {
    const res = await app(get('/r/cases-board.json', { authorization: `Bearer ${key}` }));
    assert.equal(res.status, 403);
    assert.equal(((await res.json()) as { code: string }).code, 'key_invalid');
  }
});

test('registry: a valid key unlocks a Pro item and is marked as used', async () => {
  const { app, store, key } = await buyerWithKey();
  const res = await app(get('/r/cases-board.json', { authorization: `Bearer ${key}` }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { name: 'cases-board' });
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);
  assert.ok(store.keys[0]!.lastUsedAt);
});

test('registry: a revoked key stops working', async () => {
  const { app, key, id } = await buyerWithKey();
  const del = await app(new Request(`https://api.test/api/keys?id=${id}`, { method: 'DELETE', headers: { 'x-test-user': 'buyer@example.com' } }));
  assert.equal(del.status, 200);
  const res = await app(get('/r/cases-board.json', { authorization: `Bearer ${key}` }));
  assert.equal(res.status, 403);
  assert.equal(((await res.json()) as { code: string }).code, 'key_revoked');
});

test('registry: a key stops working when the purchase is refunded', async () => {
  const { app, store, key } = await buyerWithKey();
  store.refund('cs_1');
  const res = await app(get('/r/cases-board.json', { authorization: `Bearer ${key}` }));
  assert.equal(res.status, 403);
  assert.equal(((await res.json()) as { code: string }).code, 'no_licence');
});

test('registry: a team mate with a seat can create and use their own key', async () => {
  const { app, store } = await buyerWithKey();
  store.addSeat('cs_1', 'mate@example.com');
  const res = await app(post('/api/keys', {}, { 'x-test-user': 'mate@example.com' }));
  const { key } = (await res.json()) as { key: string };
  assert.equal((await app(get('/r/cases-board.json', { authorization: `Bearer ${key}` }))).status, 200);
});

test('registry: unknown items are 404', async () => {
  const { app } = setup();
  assert.equal((await app(get('/r/nope.json'))).status, 404);
  assert.equal((await app(get('/somewhere-else'))).status, 404);
});

// ---------------------------------------------------------------- mock mode and adapters

test('mock mode: with no environment variables nothing real is called and responses say so', async () => {
  const deps = depsFromEnv({}, { fetch: async () => { throw new Error('network used in mock mode'); } });
  assert.equal(deps.mock, true);
  assert.equal(deps.payments.name, 'mock');
  const app = createApp(deps);
  const res = await app(post('/api/checkout', { plan: 'individual' }));
  const body = (await res.json()) as { mock: boolean; url: string };
  assert.equal(body.mock, true);
  assert.equal(body.url, 'http://localhost:5173/#pricing');
  assert.equal((await app(post('/api/webhook', {}))).status, 400);
  const keys = await app(get('/api/keys'));
  assert.equal(keys.status, 401);
  assert.match(((await keys.json()) as { error: string }).error, /Mock mode/);
});

test('shopify is a stub marked not decided', async () => {
  const deps = depsFromEnv({ PAYMENT_PROVIDER: 'shopify' });
  assert.ok(deps.payments instanceof ShopifyProvider);
  await assert.rejects(() => deps.payments.createCheckout({ quote: { plan: 'team', amountCents: 1, currency: 'usd', launchOffer: false, seats: 10 }, successUrl: '', cancelUrl: '' }), /not decided/);
  assert.equal((await createApp(deps)(post('/api/checkout', { plan: 'team' }))).status, 502);
});

test('supabase store: sends the service key and the expected requests (fake fetch)', async () => {
  const calls: Call[] = [];
  const replies: unknown[] = [97, true, [{ id: 'k1', owner_email: 'a@x.com', key_hash: 'h', key_prefix: 'asc_12345678', label: null, created_at: 't', last_used_at: null, revoked_at: null }]];
  const fake: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(replies.shift()));
  };
  const store = new SupabaseStore({ url: 'https://project.supabase.test/', serviceRoleKey: 'service_role_placeholder', fetch: fake });
  assert.equal(await store.launchSpotsSold(), 3);
  assert.deepEqual(await store.recordPurchase({ email: 'a@x.com', plan: 'team', amountCents: 39900, currency: 'usd', provider: 'stripe', providerReference: 'cs_1', launchOffer: true }), { created: true });
  assert.equal((await store.findKeyByHash('h'))?.prefix, 'asc_12345678');
  assert.equal(calls[0]!.url, 'https://project.supabase.test/rest/v1/rpc/launch_offer_spots_remaining');
  assert.equal(calls[1]!.url, 'https://project.supabase.test/rest/v1/rpc/record_purchase');
  assert.equal(JSON.parse(String(calls[1]!.init.body)).p_provider_reference, 'cs_1');
  assert.equal(calls[2]!.url, 'https://project.supabase.test/rest/v1/access_keys?key_hash=eq.h&limit=1');
  for (const c of calls) assert.equal((c.init.headers as Record<string, string>).apikey, 'service_role_placeholder');
});

test('supabase auth: only a confirmed email counts as signed in', async () => {
  let reply: unknown = { email: 'A@X.com', email_confirmed_at: '2027-01-01T00:00:00Z' };
  const auth = supabaseAuth({ url: 'https://project.supabase.test', anonKey: 'anon_placeholder', fetch: async () => new Response(JSON.stringify(reply)) });
  const req = get('/api/keys', { authorization: 'Bearer session_token_placeholder' });
  assert.deepEqual(await auth.getUser(req), { email: 'a@x.com' });
  reply = { email: 'a@x.com', email_confirmed_at: null };
  assert.equal(await auth.getUser(req), null);
  assert.equal(await auth.getUser(get('/api/keys')), null);
});
