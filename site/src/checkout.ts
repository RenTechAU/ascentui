// How the pricing page starts a purchase. The page takes a CheckoutClient through props;
// it never fetches on its own. With no API address configured the site runs in mock mode,
// which says so on the page and takes no payment.

export type PlanId = 'individual' | 'team';

export interface CheckoutResult {
  /** Where to send the buyer. Null in mock mode. */
  url: string | null;
  message: string;
}

export interface CheckoutClient {
  mode: 'live' | 'mock';
  start(plan: PlanId): Promise<CheckoutResult>;
}

export function mockCheckout(): CheckoutClient {
  return {
    mode: 'mock',
    async start(plan) {
      const name = plan === 'team' ? 'Team' : 'Individual';
      return { url: null, message: `Mock mode: checkout is not connected yet. No payment was taken for ${name}.` };
    },
  };
}

/** Calls the platform's checkout handler (platform/src/handlers.ts) and returns the hosted payment page. */
export function httpCheckout(apiBase: string, fetcher: typeof fetch = fetch): CheckoutClient {
  return {
    mode: 'live',
    async start(plan) {
      try {
        const res = await fetcher(`${apiBase.replace(/\/$/, '')}/api/checkout`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan }),
        });
        const data = (await res.json()) as { url?: string; error?: string; mock?: boolean };
        if (!res.ok || !data.url) return { url: null, message: data.error ?? 'Checkout could not be started. Please try again.' };
        if (data.mock) return { url: null, message: 'Mock mode: the payment provider is not connected yet. No payment was taken.' };
        return { url: data.url, message: 'Opening checkout…' };
      } catch {
        return { url: null, message: 'Checkout could not be reached. Please try again.' };
      }
    },
  };
}

export function checkoutFromEnv(): CheckoutClient {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  return base ? httpCheckout(base) : mockCheckout();
}
