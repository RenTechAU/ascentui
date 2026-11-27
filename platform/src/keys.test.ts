import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bearerToken, constantTimeEqual, generateKey, hashKey, looksLikeKey, verifyKey } from './keys.js';

test('a generated key has the asc_ prefix, a hash and a short display prefix', async () => {
  const k = await generateKey();
  assert.match(k.key, /^asc_[A-Za-z0-9_-]{43}$/);
  assert.match(k.hash, /^[0-9a-f]{64}$/);
  assert.equal(k.prefix, k.key.slice(0, 12));
  assert.ok(!k.hash.includes(k.key.slice(4)), 'the hash does not contain the key');
  assert.equal(k.hash, await hashKey(k.key));
});

test('keys are different every time', async () => {
  const keys = await Promise.all(Array.from({ length: 50 }, () => generateKey()));
  assert.equal(new Set(keys.map((k) => k.key)).size, 50);
});

test('hashKey is SHA-256 in hex', async () => {
  assert.equal(await hashKey('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('verifyKey accepts the right key and rejects others', async () => {
  const a = await generateKey();
  const b = await generateKey();
  assert.equal(await verifyKey(a.key, a.hash), true);
  assert.equal(await verifyKey(b.key, a.hash), false);
  assert.equal(await verifyKey('not-a-key', a.hash), false);
  assert.equal(await verifyKey(a.key + 'x', a.hash), false);
});

test('constantTimeEqual compares whole strings', () => {
  assert.equal(constantTimeEqual('abc', 'abc'), true);
  assert.equal(constantTimeEqual('abc', 'abd'), false);
  assert.equal(constantTimeEqual('abc', 'abcd'), false);
  assert.equal(constantTimeEqual('', ''), true);
});

test('looksLikeKey and bearerToken', () => {
  assert.equal(looksLikeKey('asc_' + 'a'.repeat(43)), true);
  assert.equal(looksLikeKey('aui_' + 'a'.repeat(43)), false);
  assert.equal(looksLikeKey('asc_short'), false);
  assert.equal(bearerToken('Bearer abc'), 'abc');
  assert.equal(bearerToken('bearer   abc '), 'abc');
  assert.equal(bearerToken('Basic abc'), null);
  assert.equal(bearerToken(null), null);
});
