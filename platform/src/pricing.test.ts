import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ENV_NAMES } from './app.js';
import { canAssignSeat, checkItemAccess, seatLimit } from './licence.js';
import { LAUNCH_SPOTS, PRICE_TABLE, quote, spotsRemaining } from './pricing.js';

test('the launch price applies while spots remain, for both plans', () => {
  assert.deepEqual(quote('individual', 0), { plan: 'individual', amountCents: 14900, currency: 'usd', launchOffer: true, seats: 1 });
  assert.deepEqual(quote('team', 99), { plan: 'team', amountCents: 39900, currency: 'usd', launchOffer: true, seats: 10 });
});

test('the regular price applies once 100 are sold', () => {
  assert.equal(quote('individual', 100).amountCents, 29900);
  assert.equal(quote('individual', 100).launchOffer, false);
  assert.equal(quote('team', 250).amountCents, 69900);
});

test('spots remaining never goes below zero or above 100', () => {
  assert.equal(spotsRemaining(0), 100);
  assert.equal(spotsRemaining(37), 63);
  assert.equal(spotsRemaining(100), 0);
  assert.equal(spotsRemaining(140), 0);
  assert.equal(spotsRemaining(-5), 100);
});

test('prices match the website (site/src/content.ts)', () => {
  const content = readFileSync(new URL('../../site/src/content.ts', import.meta.url), 'utf8');
  const row = (plan: string) => new RegExp(`${plan}: \\{ launch: (\\d+), launchSpots: (\\d+), regular: (\\d+)`).exec(content);
  for (const plan of ['individual', 'team'] as const) {
    const m = row(plan);
    assert.ok(m, `found ${plan} in content.ts`);
    assert.equal(Number(m[1]) * 100, PRICE_TABLE[plan].launchCents);
    assert.equal(Number(m[2]), LAUNCH_SPOTS);
    assert.equal(Number(m[3]) * 100, PRICE_TABLE[plan].regularCents);
  }
  assert.match(content, /seats: 10/);
});

test('.env.example lists exactly the variables the code reads', () => {
  const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const names = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)];
  assert.deepEqual(names.map((m) => m[1]).sort(), [...ENV_NAMES].sort());
  for (const m of names) assert.ok(m[1] === 'PAYMENT_PROVIDER' || m[2] === '', `${m[1]} has no value in the example`);
});

test('seat limits', () => {
  assert.equal(seatLimit('individual'), 1);
  assert.equal(seatLimit('team'), 10);
  const team = { plan: 'team' as const, status: 'paid' as const };
  assert.deepEqual(canAssignSeat(team, ['a@x.com'], 'b@x.com'), { allowed: true, remaining: 9 });
  assert.equal(canAssignSeat(team, ['a@x.com'], 'A@X.com ').allowed, false);
  const full = Array.from({ length: 10 }, (_, i) => `p${i}@x.com`);
  assert.equal(canAssignSeat(team, full, 'new@x.com').allowed, false);
  assert.equal(canAssignSeat({ plan: 'individual', status: 'paid' }, ['a@x.com'], 'b@x.com').allowed, false);
  assert.equal(canAssignSeat({ plan: 'team', status: 'refunded' }, [], 'b@x.com').allowed, false);
});

test('does this key unlock this registry item', () => {
  const good = { revokedAt: null, ownerHasActiveSeat: true };
  assert.deepEqual(checkItemAccess('free', false, null), { allowed: true });
  assert.deepEqual(checkItemAccess('pro', true, good), { allowed: true });
  const denied = (a: ReturnType<typeof checkItemAccess>) => (a.allowed ? null : [a.status, a.code]);
  assert.deepEqual(denied(checkItemAccess('pro', false, null)), [401, 'key_required']);
  assert.deepEqual(denied(checkItemAccess('pro', true, null)), [403, 'key_invalid']);
  assert.deepEqual(denied(checkItemAccess('pro', true, { ...good, revokedAt: '2027-01-01T00:00:00Z' })), [403, 'key_revoked']);
  assert.deepEqual(denied(checkItemAccess('pro', true, { ...good, ownerHasActiveSeat: false })), [403, 'no_licence']);
});
