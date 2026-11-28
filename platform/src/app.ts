// One entry point: builds the dependencies from environment variables and routes a Request to
// its handler. Anything whose variables are missing runs in mock mode, and responses say so.
import { accessKeysHandler, createCheckoutHandler, json, launchOfferHandler, paymentWebhookHandler, registryHandler, type Deps, type Handler } from './handlers.js';
import { MockPaymentProvider, ShopifyProvider, StripeCheckoutProvider, type PaymentProvider } from './payments.js';
import { MemoryRegistry, MemoryStore, noAuth, type RegistrySource } from './store.js';
import { SupabaseStore, supabaseAuth } from './supabase.js';

export type Env = Record<string, string | undefined>;

/** Every variable the platform reads. Names only; see .env.example for what each one is. */
export const ENV_NAMES = [
  'SITE_URL',
  'PAYMENT_PROVIDER',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_INDIVIDUAL_LAUNCH',
  'STRIPE_PRICE_INDIVIDUAL',
  'STRIPE_PRICE_TEAM_LAUNCH',
  'STRIPE_PRICE_TEAM',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export interface Options {
  /** Where registry items come from. Defaults to an empty registry. */
  registry?: RegistrySource;
  fetch?: typeof fetch;
}

function paymentsFromEnv(env: Env, fetcher?: typeof fetch): PaymentProvider {
  if (env.PAYMENT_PROVIDER === 'shopify') return new ShopifyProvider();
  const prices = {
    individual: { launch: env.STRIPE_PRICE_INDIVIDUAL_LAUNCH, regular: env.STRIPE_PRICE_INDIVIDUAL },
    team: { launch: env.STRIPE_PRICE_TEAM_LAUNCH, regular: env.STRIPE_PRICE_TEAM },
  };
  const complete = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
    && prices.individual.launch && prices.individual.regular && prices.team.launch && prices.team.regular;
  if (!complete) return new MockPaymentProvider();
  return new StripeCheckoutProvider({
    secretKey: env.STRIPE_SECRET_KEY!,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET!,
    prices: prices as { individual: { launch: string; regular: string }; team: { launch: string; regular: string } },
    fetch: fetcher,
  });
}

export function depsFromEnv(env: Env, options: Options = {}): Deps {
  const payments = paymentsFromEnv(env, options.fetch);
  const hasDatabase = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
  return {
    payments,
    store: hasDatabase
      ? new SupabaseStore({ url: env.SUPABASE_URL!, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY!, fetch: options.fetch })
      : new MemoryStore(),
    auth: hasDatabase ? supabaseAuth({ url: env.SUPABASE_URL!, anonKey: env.SUPABASE_ANON_KEY!, fetch: options.fetch }) : noAuth,
    registry: options.registry ?? new MemoryRegistry(),
    siteUrl: (env.SITE_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
    mock: payments.name === 'mock' || !hasDatabase,
  };
}

/** Routes by path. Mount it on any runtime that speaks Request and Response. */
export function createApp(deps: Deps): Handler {
  const routes: [RegExp, Handler][] = [
    [/\/api\/checkout\/?$/, createCheckoutHandler(deps)],
    [/\/api\/webhook\/?$/, paymentWebhookHandler(deps)],
    [/\/api\/keys\/?$/, accessKeysHandler(deps)],
    [/\/api\/launch-offer\/?$/, launchOfferHandler(deps)],
    [/\/r\/[^/]+\.json$/, registryHandler(deps)],
  ];
  // The browser calls checkout and keys from the website, which may be on another address.
  const cors = {
    'access-control-allow-origin': deps.siteUrl,
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    vary: 'origin',
  };
  return async (request) => {
    const path = new URL(request.url).pathname;
    const handler = routes.find(([pattern]) => pattern.test(path))?.[1];
    if (!handler) return json({ error: 'Not found.', code: 'not_found' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let response: Response;
    try {
      response = await handler(request);
    } catch {
      // Details stay in the server log, not in the response.
      response = json({ error: 'Something went wrong.', code: 'server_error' }, 500);
    }
    if (path.includes('/api/') && !path.endsWith('/webhook')) for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
    return response;
  };
}
