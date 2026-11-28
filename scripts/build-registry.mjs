// Builds what agents and the shadcn CLI read, into site/public/ (generated, not committed):
//   r/<name>.json   one shadcn registry item per free component in ui/src/components, CSS included
//   r/theme.json    the token file the components read
//   r/index.json    the registry index
//   llms.txt        a short index of the catalog and docs
//   llms-full.txt   the catalog and all the docs in one file
// Reads ui/ and tokens/ only; never writes there. Run: node scripts/build-registry.mjs
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(root + p, 'utf8');
const { CATALOG, LAYERS, PHASES, countItems } = await loadTs(`${root}site/src/catalog.ts`);
const { REGISTRY_BASE, PRICES } = await loadTs(`${root}site/src/content.ts`);

const base = (REGISTRY_BASE ?? 'https://<your-domain>').replace(/\/$/, '');
const out = `${root}site/public/`;
rmSync(`${out}r`, { recursive: true, force: true });
mkdirSync(`${out}r`, { recursive: true });

// ---------------------------------------------------------------- registry items

const UI_PEERS = JSON.parse(read('ui/package.json')).peerDependencies ?? {};
const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const words = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

/** npm packages a source file imports, apart from React itself. */
function packagesOf(source) {
  const found = new Set();
  for (const m of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (spec.startsWith('.') || spec === 'react' || spec.startsWith('react/') || spec === 'react-dom') continue;
    found.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
  }
  // Pin to the range the ui package is built against, so the CLI does not install a newer major.
  return [...found].sort().map((name) => (UI_PEERS[name] ? `${name}@${UI_PEERS[name]}` : name));
}

// Files whose name does not match their catalog slug. Without this, field would match text-field.
const CATALOG_SLUG = { field: 'form-kit', 'date-picker': 'date-and-time-picker' };
const catalogEntry = (name) =>
  CATALOG_SLUG[name]
    ? CATALOG.find((i) => i.slug === CATALOG_SLUG[name])
    : CATALOG.find((i) => i.layer === 'component' && (i.slug === name || i.slug.startsWith(`${name}-`) || i.slug.endsWith(`-${name}`)));

// Shared parts with no catalog item of their own, installed alongside the components that use them.
const HELPER_DESCRIPTION = {
  'menu-button': 'A button that opens a short menu of actions, on the WAI-ARIA menu button pattern. App Shell and List Row use it.',
};

const dir = 'ui/src/components/';
const all = readdirSync(root + dir);
const items = [];

for (const file of all.filter((f) => f.endsWith('.tsx')).sort()) {
  const stem = file.replace(/\.tsx$/, '');
  const name = kebab(stem);
  const source = read(dir + file);
  const entry = catalogEntry(name);
  // Every component is one file with its CSS inside.
  const files = [{ path: `ui/${file}`, type: 'registry:ui', content: source }];
  const dependencies = packagesOf(source);
  // Other components this one is built from, e.g. Button uses Spinner: installed alongside automatically.
  const siblings = [...source.matchAll(/from\s+['"]\.\/([a-z0-9-]+)['"]/g)].map((m) => `${base}/r/${m[1]}.json`);
  items.push({
    $schema: ITEM_SCHEMA,
    name,
    type: 'registry:ui',
    title: words(stem).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    description: entry?.description ?? HELPER_DESCRIPTION[name] ?? `${words(stem)} component.`,
    ...(dependencies.length ? { dependencies } : {}),
    registryDependencies: [`${base}/r/theme.json`, ...new Set(siblings)],
    files,
    docs: `One file, styles inside. Reads the AscentUI theme (${base}/r/theme.json): import styles/ascentui/tokens.css once at your app's entry. Requires React 19.`,
    meta: { tier: 'free', license: 'MIT', catalog: entry?.slug ?? null },
  });
}

items.unshift({
  $schema: ITEM_SCHEMA,
  name: 'theme',
  type: 'registry:file',
  title: 'Theme',
  description: 'The CSS variables every AscentUI component reads: light and dark, touch-screen sizes and reduced motion.',
  files: [
    { path: 'styles/tokens.css', type: 'registry:file', target: 'styles/ascentui/tokens.css', content: read('tokens/src/tokens.css') },
  ],
  docs: "Import styles/ascentui/tokens.css once at your app's entry. It is the only stylesheet: every component carries its own styles.",
  meta: { tier: 'free', license: 'MIT', catalog: 'tokens-and-brand-config' },
});

// Until the registry address is decided, items point at each other through the @ascentui namespace
// (set up once in components.json, see Installation), not by URL.
if (REGISTRY_BASE == null)
  for (const i of items)
    if (i.registryDependencies) i.registryDependencies = i.registryDependencies.map((u) => `@ascentui/${u.split('/r/')[1].replace(/\.json$/, '')}`);

for (const i of items) writeFileSync(`${out}r/${i.name}.json`, JSON.stringify(i, null, 2) + '\n');
writeFileSync(`${out}r/index.json`, JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'ascentui',
  homepage: base,
  items: items.map(({ $schema, files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })),
}, null, 2) + '\n');

// ---------------------------------------------------------------- llms.txt and llms-full.txt

const DOCS = ['introduction', 'install', 'theming', 'accessibility', 'agents', 'skills', 'loop', 'changelog'];
// The design-system pages, as in site/src/nav.ts (DS_PAGES). Each shows the theme's variables live.
const DESIGN_SYSTEM = [
  ['colors', 'Colors', 'every colour variable in light and dark, with contrast ratios'],
  ['typography', 'Typography', 'the typeface and type scale, and touch-screen sizes'],
  ['radius', 'Radius', 'corner sizes'],
  ['shadows', 'Shadows', 'control hairlines and floating shadows'],
  ['spacing', 'Spacing', 'space steps and control heights'],
  ['motion', 'Motion', 'easing, durations and reduced motion'],
  ['focus', 'Focus', 'the keyboard focus ring'],
  ['layers', 'Layers', 'the asc CSS layer and what sits above what'],
];
const doc = (id) => read(`site/src/docs/${id}.md`).replaceAll('{{REGISTRY}}', base).replace(/\]\(#/g, `](${base}/#`).trim();
const title = (md) => /^#\s+(.*)$/m.exec(md)?.[1] ?? '';
const total = countItems(CATALOG);
const TIER = { free: 'Free', pro: 'Pro' };
const STATUS = { built: 'built', 'part-built': 'part built', planned: 'planned' };

const summary = [
  '# AscentUI',
  '',
  '> Business-ready React components and screens for people who build apps with coding agents. Every component is free (MIT). Screens that work are Pro (one payment, lifetime), each with a backend recipe: contract, mock client, agent guide and checks.',
  '',
  `Status: pre-release. The catalog is ${total.total} items (${total.free} free, ${total.pro} Pro) in five phases. Most items are planned; each is marked below.`,
  REGISTRY_BASE == null ? '\nThe site address is not decided yet. Links use the placeholder https://<your-domain>.' : '',
  PRICES.individual && PRICES.team
    ? `\nPro pricing (USD, one-time): Individual ${PRICES.individual.launch} for the first ${PRICES.individual.launchSpots} buyers then ${PRICES.individual.regular}; Team (${PRICES.team.seats} seats) ${PRICES.team.launch} then ${PRICES.team.regular}. The first ${PRICES.individual.launchSpots} is one pool across both plans. Pro is not on sale yet.`
    : '',
].filter((l) => l !== '').join('\n').replace(/\n(?=>|Status|The site|Pro pricing)/g, '\n\n').replace(/\n{3,}/g, '\n\n');

const rules = [
  '## Rules for agents',
  '',
  '- Install items with the shadcn CLI, or copy the files. Do not rewrite a component that exists here.',
  '- Each component is one `.tsx` file with its styles inside (React 19). Do not move its styles into a global stylesheet.',
  '- Install the theme once. Components read only its `--asc-*` variables, which handle light and dark, touch-screen sizing and reduced motion. Change the look there, not in a component.',
  '- Data comes in through props or a typed client. Do not add a fetch inside a component.',
  '- Pro source needs an access key sent as `Authorization: Bearer <key>`. Never write a key into source code or commit it.',
].join('\n');

const llms = [
  summary,
  '',
  rules,
  '',
  '## Docs',
  '',
  ...DOCS.map((id) => `- [${title(doc(id))}](${base}/#docs-${id})`),
  `- [Library](${base}/#library): every item with its tier, phase and status`,
  '',
  '## Design system',
  '',
  ...DESIGN_SYSTEM.map(([id, name, what]) => `- [${name}](${base}/#ds-${id}): ${what}`),
  `- [Theme file](${base}/r/theme.json): the tokens.css every component reads`,
  '',
  '## More',
  '',
  `- [Pricing](${base}/#pricing)`,
  `- [Pro licence, draft](${base}/#licence)`,
  `- [Everything in one file](${base}/llms-full.txt)`,
  '',
  '## Installable now',
  '',
  ...items.map((i) => `- [${i.title}](${base}/r/${i.name}.json): ${i.description}`),
  `- [Registry index](${base}/r/index.json)`,
  '',
  '## Catalog',
  '',
  ...LAYERS.map((l) => {
    const c = countItems(CATALOG.filter((i) => i.layer === l.id));
    return `- ${l.label}: ${c.total} (${c.free} free, ${c.pro} Pro)`;
  }),
  '',
].join('\n');

const catalogFull = LAYERS.flatMap((l) => [
  `### ${l.label}`,
  '',
  ...CATALOG.filter((i) => i.layer === l.id).map((i) =>
    `- ${i.name}${i.module ? ` (${i.module})` : ''}: ${i.description} [${TIER[i.tier]}, phase ${i.phase}, ${STATUS[i.status]}]`),
  '',
]);

const full = [
  summary,
  '',
  rules,
  '',
  '## Installable now',
  '',
  ...items.map((i) => `- ${i.title}: ${base}/r/${i.name}.json${i.dependencies ? ` (needs ${i.dependencies.join(', ')})` : ''}`),
  '',
  '## Catalog',
  '',
  'Phases: ' + PHASES.map((p) => `${p.id}. ${p.name}`).join('; ') + '.',
  '',
  ...catalogFull,
  '## Docs',
  '',
  // Push each page's headings down one level so the file keeps a single top heading.
  ...DOCS.map((id) => doc(id).replace(/^(#{1,5}) /gm, '##$1 ') + '\n'),
  '## Design system',
  '',
  'Pages that show the theme variables live, read from the theme file when the site is built:',
  '',
  ...DESIGN_SYSTEM.map(([id, name, what]) => `- ${name} (${base}/#ds-${id}): ${what}`),
  '',
  '### The theme file',
  '',
  '```css',
  read('tokens/src/tokens.css').trim(),
  '```',
  '',
  '## Pro licence (draft, not yet legal text)',
  '',
  doc('licence').replace(/^# .*\n+/, '').replace(/^(#{1,5}) /gm, '#$1 '),
  '',
].join('\n');

writeFileSync(`${out}llms.txt`, llms);
writeFileSync(`${out}llms-full.txt`, full);
console.log(`Registry built: ${items.length} items (${items.map((i) => i.name).join(', ')}), llms.txt, llms-full.txt.`);
