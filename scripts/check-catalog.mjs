// Fails if site/src/catalog.ts and the phase table in docs/CATALOG.md §5 disagree.
// Run from anywhere: node scripts/check-catalog.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { CATALOG, countsByPhase, countItems } = await loadTs(`${root}site/src/catalog.ts`);
const doc = readFileSync(`${root}docs/CATALOG.md`, 'utf8');

// Rows look like: | **1. Core** | … | … | 40 | 0 |   and   | | | **Total: 114** | **53** | **61** |
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.replace(/\*/g, '').trim());
const section = doc.slice(doc.indexOf('## 5.'), doc.indexOf('## 6.'));
const expected = {};
let total = null;
for (const line of section.split('\n')) {
  const c = cells(line);
  const phase = /^(\d)\./.exec(c[0] ?? '');
  if (phase) expected[phase[1]] = { free: Number(c[3]), pro: Number(c[4]) };
  const t = /^Total: (\d+)$/.exec(c[2] ?? '');
  if (t) total = { total: Number(t[1]), free: Number(c[3]), pro: Number(c[4]) };
}

const problems = [];
if (!total || Object.keys(expected).length !== 5) problems.push('Could not read the phase table in docs/CATALOG.md §5.');

const actual = countsByPhase(CATALOG);
for (const [phase, want] of Object.entries(expected)) {
  const got = actual[phase];
  if (!got || got.free !== want.free || got.pro !== want.pro)
    problems.push(`Phase ${phase}: catalog.ts has ${got?.free} free / ${got?.pro} Pro, CATALOG.md says ${want.free} / ${want.pro}.`);
}
const all = countItems(CATALOG);
if (total && (all.total !== total.total || all.free !== total.free || all.pro !== total.pro))
  problems.push(`Total: catalog.ts has ${all.total} (${all.free} free, ${all.pro} Pro), CATALOG.md says ${total.total} (${total.free}, ${total.pro}).`);

const seen = new Set();
for (const i of CATALOG) {
  if (seen.has(i.slug)) problems.push(`Duplicate slug: ${i.slug}`);
  seen.add(i.slug);
}

if (problems.length) {
  console.error('Catalog check failed:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Catalog check passed: ${all.total} items, ${all.free} free, ${all.pro} Pro.`);
