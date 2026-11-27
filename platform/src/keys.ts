// Access keys. A key is shown to its owner once and never stored: the database keeps only a
// SHA-256 hash and a short prefix (enough to tell keys apart in a list). Uses Web Crypto only,
// so it runs on Node 20+, Vercel functions and Supabase edge functions.

export const KEY_PREFIX = 'asc_';
/** `asc_` plus the first 8 characters of the secret part. Safe to show and store. */
const SHOWN = KEY_PREFIX.length + 8;
const KEY_SHAPE = /^asc_[A-Za-z0-9_-]{43}$/;

export interface GeneratedKey {
  /** The full key. Hand it to the owner once; do not store or log it. */
  key: string;
  /** Hex SHA-256 of the key. This is what is stored. */
  hash: string;
  /** Short, non-secret start of the key, for display. */
  prefix: string;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return toHex(new Uint8Array(digest));
}

export async function generateKey(): Promise<GeneratedKey> {
  const secret = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  const key = KEY_PREFIX + toBase64Url(secret);
  return { key, hash: await hashKey(key), prefix: key.slice(0, SHOWN) };
}

export const looksLikeKey = (value: string) => KEY_SHAPE.test(value);

/** Compares two strings without stopping at the first difference. */
export function constantTimeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** True when `key` hashes to `storedHash`. */
export async function verifyKey(key: string, storedHash: string): Promise<boolean> {
  if (!looksLikeKey(key)) return false;
  return constantTimeEqual(await hashKey(key), storedHash);
}

/** The key from an `Authorization: Bearer <key>` header, or null. */
export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header ?? '');
  return m ? m[1]! : null;
}
