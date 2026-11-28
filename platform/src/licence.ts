// Licence checks: who may hold a seat, and whether a key unlocks a registry item.
import type { Plan } from './pricing.js';
import { PRICE_TABLE } from './pricing.js';

export type Tier = 'free' | 'pro';
export type PurchaseStatus = 'paid' | 'refunded';

export interface KeyState {
  revokedAt: string | null;
  /** True when the key's owner holds a seat on a purchase that is paid and not refunded. */
  ownerHasActiveSeat: boolean;
}

export type Access =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; code: 'key_required' | 'key_invalid' | 'key_revoked' | 'no_licence'; message: string };

/** Free items are open. Pro items need a known, unrevoked key whose owner holds an active seat. */
export function checkItemAccess(tier: Tier, presentedKey: boolean, key: KeyState | null): Access {
  if (tier === 'free') return { allowed: true };
  if (!presentedKey)
    return { allowed: false, status: 401, code: 'key_required', message: 'This is a Pro item. Send your access key as "Authorization: Bearer <key>".' };
  if (!key) return { allowed: false, status: 403, code: 'key_invalid', message: 'This access key is not recognised.' };
  if (key.revokedAt) return { allowed: false, status: 403, code: 'key_revoked', message: 'This access key has been revoked. Create a new one in your account.' };
  if (!key.ownerHasActiveSeat)
    return { allowed: false, status: 403, code: 'no_licence', message: 'This key is not attached to an active Pro licence.' };
  return { allowed: true };
}

export const seatLimit = (plan: Plan) => PRICE_TABLE[plan].seats;

export interface SeatCheck { allowed: boolean; remaining: number; reason?: string }

/** Whether another person can be given a seat on a purchase. */
export function canAssignSeat(
  purchase: { plan: Plan; status: PurchaseStatus },
  activeSeatEmails: string[],
  email: string,
): SeatCheck {
  const limit = seatLimit(purchase.plan);
  const taken = new Set(activeSeatEmails.map(normaliseEmail));
  const remaining = Math.max(0, limit - taken.size);
  if (purchase.status !== 'paid') return { allowed: false, remaining, reason: 'This purchase is not active.' };
  if (taken.has(normaliseEmail(email))) return { allowed: false, remaining, reason: 'This person already has a seat.' };
  if (remaining === 0) return { allowed: false, remaining, reason: `All ${limit} seats are in use.` };
  return { allowed: true, remaining };
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();
