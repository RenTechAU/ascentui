// Payments behind one interface, so the provider can change without touching the handlers.
// Stripe Checkout is implemented. Shopify is a stub: the choice is not decided.
import { constantTimeEqual } from './keys.js';
import { isPlan, type Plan, type Quote } from './pricing.js';

export interface CheckoutRequest {
  quote: Quote;
  /** Pre-fills the buyer's email on the payment page, when known. */
  email?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  /** Where to send the buyer to pay. */
  url: string;
  /** The provider's id for this checkout. Becomes the purchase's provider reference. */
  reference: string;
}

export type PaymentEvent =
  | {
      type: 'purchase';
      reference: string;
      email: string;
      plan: Plan;
      amountCents: number;
      currency: string;
      launchOffer: boolean;
    }
  | { type: 'ignored'; reason: string };

/** Thrown when a webhook cannot be trusted or understood. Maps to HTTP 400. */
export class WebhookError extends Error {}

export interface PaymentProvider {
  readonly name: 'stripe' | 'shopify' | 'mock';
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Verifies the signature on a raw webhook body and returns what happened. Throws WebhookError. */
  parseWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent>;
}

// ---------------------------------------------------------------- Stripe Checkout

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  /** Price ids created in the Stripe dashboard, one per plan and price point. */
  prices: Record<Plan, { launch: string; regular: string }>;
  fetch?: typeof fetch;
  /** Seconds since 1970. Injected in tests. */
  now?: () => number;
  /** How old a webhook signature may be, in seconds. */
  toleranceSeconds?: number;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The value of a `Stripe-Signature` header for a body. Exported for tests. */
export async function stripeSignature(secret: string, rawBody: string, timestamp: number): Promise<string> {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${rawBody}`)}`;
}

export class StripeCheckoutProvider implements PaymentProvider {
  readonly name = 'stripe' as const;
  constructor(private readonly config: StripeConfig) {}

  async createCheckout({ quote, email, successUrl, cancelUrl }: CheckoutRequest): Promise<CheckoutSession> {
    const prices = this.config.prices[quote.plan];
    const form = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price]': quote.launchOffer ? prices.launch : prices.regular,
      'line_items[0][quantity]': '1',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[plan]': quote.plan,
      'metadata[launch_offer]': String(quote.launchOffer),
    });
    if (email) form.set('customer_email', email);
    const res = await (this.config.fetch ?? fetch)('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.config.secretKey}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !data.id || !data.url) throw new Error(`Stripe did not create a checkout session: ${data.error?.message ?? res.status}`);
    return { url: data.url, reference: data.id };
  }

  async parseWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent> {
    const header = headers.get('stripe-signature') ?? '';
    const parts = header.split(',').map((p) => p.trim().split('='));
    const timestamp = Number(parts.find(([k]) => k === 't')?.[1]);
    const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
    if (!Number.isFinite(timestamp) || signatures.length === 0) throw new WebhookError('Missing or malformed signature.');

    const expected = await hmacHex(this.config.webhookSecret, `${timestamp}.${rawBody}`);
    if (!signatures.some((s) => constantTimeEqual(s, expected))) throw new WebhookError('Signature does not match.');
    const now = (this.config.now ?? (() => Math.floor(Date.now() / 1000)))();
    if (Math.abs(now - timestamp) > (this.config.toleranceSeconds ?? 300)) throw new WebhookError('Signature is too old.');

    let event: { type?: string; data?: { object?: Record<string, unknown> } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new WebhookError('Body is not JSON.');
    }
    if (event.type !== 'checkout.session.completed') return { type: 'ignored', reason: `event ${event.type ?? 'unknown'}` };

    const session = event.data?.object ?? {};
    if (session.payment_status !== 'paid') return { type: 'ignored', reason: 'not paid yet' };
    const metadata = (session.metadata ?? {}) as Record<string, string>;
    const details = (session.customer_details ?? {}) as { email?: string };
    const email = details.email ?? (session.customer_email as string | undefined);
    if (typeof session.id !== 'string' || !email || !isPlan(metadata.plan) || typeof session.amount_total !== 'number')
      throw new WebhookError('Checkout session is missing the plan, email, id or amount.');
    return {
      type: 'purchase',
      reference: session.id,
      email,
      plan: metadata.plan,
      amountCents: session.amount_total,
      currency: String(session.currency ?? 'usd'),
      launchOffer: metadata.launch_offer === 'true',
    };
  }
}

// ---------------------------------------------------------------- Shopify (not decided)

/** Placeholder. Whether to sell through Shopify is not decided; see docs/SETUP.md step 5. */
export class ShopifyProvider implements PaymentProvider {
  readonly name = 'shopify' as const;
  async createCheckout(): Promise<CheckoutSession> {
    throw new Error('Shopify is not implemented: the payment provider is not decided.');
  }
  async parseWebhook(): Promise<PaymentEvent> {
    throw new WebhookError('Shopify is not implemented: the payment provider is not decided.');
  }
}

// ---------------------------------------------------------------- mock mode

/** Used when no provider is configured. Takes no money and says so. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock' as const;
  async createCheckout({ cancelUrl }: CheckoutRequest): Promise<CheckoutSession> {
    return { url: cancelUrl, reference: `mock_${crypto.randomUUID()}` };
  }
  async parseWebhook(): Promise<PaymentEvent> {
    throw new WebhookError('Mock mode: no payment provider is configured, so webhooks are not accepted.');
  }
}
