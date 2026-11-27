// Launch-offer pricing. The first 100 buyers pay the launch price; the 100 is one pool across
// both plans. Amounts are in US cents. Keep in step with site/src/content.ts (a test checks it).

export type Plan = 'individual' | 'team';
export const PLANS: readonly Plan[] = ['individual', 'team'];
export const isPlan = (v: unknown): v is Plan => v === 'individual' || v === 'team';

export const CURRENCY = 'usd';
export const LAUNCH_SPOTS = 100;

export const PRICE_TABLE: Record<Plan, { launchCents: number; regularCents: number; seats: number }> = {
  individual: { launchCents: 14900, regularCents: 29900, seats: 1 },
  team: { launchCents: 39900, regularCents: 69900, seats: 10 },
};

export function spotsRemaining(spotsSold: number): number {
  return Math.max(0, LAUNCH_SPOTS - Math.max(0, Math.floor(spotsSold)));
}

export interface Quote {
  plan: Plan;
  amountCents: number;
  currency: string;
  launchOffer: boolean;
  seats: number;
}

/** The price that applies to the next buyer, given how many launch spots are already sold. */
export function quote(plan: Plan, spotsSold: number): Quote {
  const row = PRICE_TABLE[plan];
  const launchOffer = spotsRemaining(spotsSold) > 0;
  return { plan, amountCents: launchOffer ? row.launchCents : row.regularCents, currency: CURRENCY, launchOffer, seats: row.seats };
}
