// The Store and Auth interfaces on Supabase, over its REST API with plain fetch (no SDK).
// The request shapes are unit-tested against a fake fetch. They have NOT been run against a
// live Supabase project yet: do that during docs/SETUP.md step 9.
import { normaliseEmail } from './licence.js';
import { LAUNCH_SPOTS } from './pricing.js';
import type { Auth, KeyRecord, NewPurchase, Store } from './store.js';

export interface SupabaseConfig {
  /** Project URL, e.g. https://abcd.supabase.co */
  url: string;
  /** Service role key. Server only. Never sent to a browser. */
  serviceRoleKey: string;
  fetch?: typeof fetch;
}

interface KeyRow {
  id: string; owner_email: string; key_hash: string; key_prefix: string; label: string | null;
  created_at: string; last_used_at: string | null; revoked_at: string | null;
}

const toRecord = (r: KeyRow): KeyRecord => ({
  id: r.id, ownerEmail: r.owner_email, hash: r.key_hash, prefix: r.key_prefix, label: r.label,
  createdAt: r.created_at, lastUsedAt: r.last_used_at, revokedAt: r.revoked_at,
});

export class SupabaseStore implements Store {
  private readonly base: string;
  constructor(private readonly config: SupabaseConfig) {
    this.base = config.url.replace(/\/$/, '') + '/rest/v1';
  }

  private async call<T>(method: string, path: string, body?: unknown, prefer?: string): Promise<T> {
    const res = await (this.config.fetch ?? fetch)(this.base + path, {
      method,
      headers: {
        apikey: this.config.serviceRoleKey,
        authorization: `Bearer ${this.config.serviceRoleKey}`,
        'content-type': 'application/json',
        ...(prefer ? { prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Database request failed (${res.status}) for ${method} ${path.split('?')[0]}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  private keysPath(filter: Record<string, string>) {
    return '/access_keys?' + new URLSearchParams(filter).toString();
  }

  async launchSpotsSold() {
    const remaining = await this.call<number>('POST', '/rpc/launch_offer_spots_remaining', {});
    return LAUNCH_SPOTS - remaining;
  }

  async recordPurchase(p: NewPurchase) {
    const created = await this.call<boolean>('POST', '/rpc/record_purchase', {
      p_email: p.email, p_plan: p.plan, p_amount_cents: p.amountCents, p_currency: p.currency,
      p_provider: p.provider, p_provider_reference: p.providerReference, p_launch_offer: p.launchOffer,
    });
    return { created };
  }

  hasActiveSeat(email: string) {
    return this.call<boolean>('POST', '/rpc/has_active_seat', { p_email: email });
  }

  async listKeys(email: string) {
    const rows = await this.call<KeyRow[]>('GET', this.keysPath({ owner_email: `eq.${normaliseEmail(email)}`, order: 'created_at.desc' }));
    return rows.map(toRecord);
  }

  async createKey(key: { ownerEmail: string; hash: string; prefix: string; label: string | null }) {
    const row = await this.call<KeyRow>('POST', '/rpc/create_access_key', {
      p_email: key.ownerEmail, p_hash: key.hash, p_prefix: key.prefix, p_label: key.label,
    });
    return toRecord(row);
  }

  async revokeKey(email: string, keyId: string) {
    const rows = await this.call<KeyRow[]>(
      'PATCH',
      this.keysPath({ id: `eq.${keyId}`, owner_email: `eq.${normaliseEmail(email)}`, revoked_at: 'is.null' }),
      { revoked_at: new Date().toISOString() },
      'return=representation',
    );
    return rows.length > 0;
  }

  async findKeyByHash(hash: string) {
    const rows = await this.call<KeyRow[]>('GET', this.keysPath({ key_hash: `eq.${hash}`, limit: '1' }));
    return rows[0] ? toRecord(rows[0]) : null;
  }

  async touchKey(keyId: string) {
    await this.call('PATCH', this.keysPath({ id: `eq.${keyId}` }), { last_used_at: new Date().toISOString() });
  }
}

/**
 * Works out who is signed in by asking Supabase to check the sign-in token the browser sent.
 * Only an email Supabase has confirmed counts, because access is matched on email.
 */
export function supabaseAuth(config: { url: string; anonKey: string; fetch?: typeof fetch }): Auth {
  return {
    async getUser(request) {
      const authorization = request.headers.get('authorization');
      if (!authorization?.toLowerCase().startsWith('bearer ')) return null;
      const res = await (config.fetch ?? fetch)(config.url.replace(/\/$/, '') + '/auth/v1/user', {
        headers: { apikey: config.anonKey, authorization },
      });
      if (!res.ok) return null;
      const user = (await res.json()) as { email?: string; email_confirmed_at?: string | null };
      if (!user.email || !user.email_confirmed_at) return null;
      return { email: normaliseEmail(user.email) };
    },
  };
}
