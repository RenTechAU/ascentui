// Everything the handlers read or write goes through these interfaces. Production passes the
// Supabase implementations (supabase.ts); tests and mock mode pass the in-memory ones below.
import type { PurchaseStatus, Tier } from './licence.js';
import { normaliseEmail } from './licence.js';
import { seatLimit } from './licence.js';
import type { Plan } from './pricing.js';

export interface NewPurchase {
  email: string;
  plan: Plan;
  amountCents: number;
  currency: string;
  provider: string;
  providerReference: string;
  launchOffer: boolean;
}

export interface KeyRecord {
  id: string;
  ownerEmail: string;
  hash: string;
  prefix: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface Store {
  /** Paid purchases made at the launch price, across both plans. */
  launchSpotsSold(): Promise<number>;
  /**
   * Records a purchase and gives the buyer the first seat. Safe to call twice with the same
   * provider reference: the second call changes nothing and returns `created: false`.
   */
  recordPurchase(purchase: NewPurchase): Promise<{ created: boolean }>;
  /** True when this person holds a seat on a purchase that is paid and not refunded. */
  hasActiveSeat(email: string): Promise<boolean>;
  listKeys(email: string): Promise<KeyRecord[]>;
  createKey(key: { ownerEmail: string; hash: string; prefix: string; label: string | null }): Promise<KeyRecord>;
  /** Revokes one of this person's keys. False when there is no such key. */
  revokeKey(email: string, keyId: string): Promise<boolean>;
  findKeyByHash(hash: string): Promise<KeyRecord | null>;
  touchKey(keyId: string): Promise<void>;
}

/** Who is signed in, worked out from the request. Null when nobody is. */
export interface Auth {
  getUser(request: Request): Promise<{ email: string } | null>;
}

export interface RegistryItem {
  tier: Tier;
  /** The shadcn registry item, as JSON text. */
  json: string;
}

/** Where registry items come from. Where Pro items are kept in production is not decided. */
export interface RegistrySource {
  get(name: string): Promise<RegistryItem | null>;
}

// ---------------------------------------------------------------- in-memory fakes

interface MemoryPurchase extends NewPurchase { id: string; status: PurchaseStatus; seats: string[] }

export class MemoryStore implements Store {
  purchases: MemoryPurchase[] = [];
  keys: KeyRecord[] = [];
  private n = 0;
  constructor(private readonly now: () => Date = () => new Date()) {}

  async launchSpotsSold() {
    return this.purchases.filter((p) => p.launchOffer && p.status === 'paid').length;
  }

  async recordPurchase(purchase: NewPurchase) {
    const exists = this.purchases.some((p) => p.provider === purchase.provider && p.providerReference === purchase.providerReference);
    if (exists) return { created: false };
    const email = normaliseEmail(purchase.email);
    this.purchases.push({ ...purchase, email, id: `pur_${++this.n}`, status: 'paid', seats: [email] });
    return { created: true };
  }

  /** Test helper: the buyer gives a seat to someone else. */
  addSeat(providerReference: string, email: string) {
    const p = this.purchases.find((x) => x.providerReference === providerReference);
    if (!p) throw new Error('No such purchase');
    if (p.seats.length >= seatLimit(p.plan)) throw new Error('No seats left');
    p.seats.push(normaliseEmail(email));
  }

  /** Test helper. */
  refund(providerReference: string) {
    const p = this.purchases.find((x) => x.providerReference === providerReference);
    if (p) p.status = 'refunded';
  }

  async hasActiveSeat(email: string) {
    const e = normaliseEmail(email);
    return this.purchases.some((p) => p.status === 'paid' && p.seats.includes(e));
  }

  async listKeys(email: string) {
    const e = normaliseEmail(email);
    return this.keys.filter((k) => k.ownerEmail === e);
  }

  async createKey(key: { ownerEmail: string; hash: string; prefix: string; label: string | null }) {
    const record: KeyRecord = {
      id: `key_${++this.n}`,
      ownerEmail: normaliseEmail(key.ownerEmail),
      hash: key.hash,
      prefix: key.prefix,
      label: key.label,
      createdAt: this.now().toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    };
    this.keys.push(record);
    return record;
  }

  async revokeKey(email: string, keyId: string) {
    const k = this.keys.find((x) => x.id === keyId && x.ownerEmail === normaliseEmail(email) && !x.revokedAt);
    if (!k) return false;
    k.revokedAt = this.now().toISOString();
    return true;
  }

  async findKeyByHash(hash: string) {
    return this.keys.find((k) => k.hash === hash) ?? null;
  }

  async touchKey(keyId: string) {
    const k = this.keys.find((x) => x.id === keyId);
    if (k) k.lastUsedAt = this.now().toISOString();
  }
}

export class MemoryRegistry implements RegistrySource {
  constructor(private readonly items: Record<string, RegistryItem> = {}) {}
  async get(name: string) {
    return this.items[name] ?? null;
  }
}

/** Test helper: the signed-in person is named by an `x-test-user` header. */
export const headerAuth: Auth = {
  async getUser(request) {
    const email = request.headers.get('x-test-user');
    return email ? { email } : null;
  },
};

/** Mock mode: nobody can sign in. */
export const noAuth: Auth = { async getUser() { return null; } };
