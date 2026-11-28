// The site's structure in one place: what the sidebar lists, what search finds.
import { CATALOG, type CatalogItem } from './catalog';
import { REGISTRY_BASE } from './content';
import accessibility from './docs/accessibility.md?raw';
import agents from './docs/agents.md?raw';
import changelog from './docs/changelog.md?raw';
import install from './docs/install.md?raw';
import introduction from './docs/introduction.md?raw';
import loop from './docs/loop.md?raw';
import skills from './docs/skills.md?raw';
import theming from './docs/theming.md?raw';
import { previewBySlug } from './previews';
import type { DocId, DsId } from './router';

// Examples in the docs use the registry address, or a placeholder until the domain is decided.
export const registry = REGISTRY_BASE ?? 'https://<your-domain>';
const fill = (source: string) => source.replaceAll('{{REGISTRY}}', registry);

export interface DocPage { id: DocId; title: string; source: string }

export const DOCS: DocPage[] = [
  { id: 'introduction', title: 'Introduction', source: fill(introduction) },
  { id: 'install', title: 'Installation', source: fill(install) },
  { id: 'theming', title: 'Theming', source: fill(theming) },
  { id: 'accessibility', title: 'Accessibility', source: fill(accessibility) },
  { id: 'agents', title: 'Using with agents', source: fill(agents) },
  { id: 'skills', title: 'Agent skills', source: fill(skills) },
  { id: 'loop', title: 'The loop', source: fill(loop) },
  { id: 'changelog', title: 'Changelog', source: fill(changelog) },
];

export const DS_PAGES: { id: DsId; title: string; blurb: string }[] = [
  { id: 'colors', title: 'Colors', blurb: 'Every colour variable, in light and dark, with what it is for.' },
  { id: 'typography', title: 'Typography', blurb: 'One typeface, five sizes, and what changes on touch screens.' },
  { id: 'radius', title: 'Radius', blurb: 'Four corner sizes.' },
  { id: 'shadows', title: 'Shadows', blurb: 'A hairline lift for controls and a real shadow for things that float.' },
  { id: 'spacing', title: 'Spacing', blurb: 'The space steps and the control heights.' },
  { id: 'motion', title: 'Motion', blurb: 'One easing curve, two durations, and reduced motion.' },
  { id: 'focus', title: 'Focus', blurb: 'The keyboard focus ring and how components show it.' },
  { id: 'layers', title: 'Layers', blurb: 'The CSS layer your styles beat, and what sits above what.' },
];

/** Components as the sidebar groups them, in catalog order. */
export function componentGroups(): { group: string; items: (CatalogItem & { live: boolean })[] }[] {
  const groups = new Map<string, (CatalogItem & { live: boolean })[]>();
  for (const c of CATALOG.filter((i) => i.layer === 'component')) {
    const list = groups.get(c.group ?? 'Other') ?? [];
    list.push({ ...c, live: !!previewBySlug(c.slug) });
    groups.set(c.group ?? 'Other', list);
  }
  return [...groups].map(([group, items]) => ({ group, items }));
}

export interface SearchItem {
  href: string;
  label: string;
  /** Shown beside the name: the section it belongs to */
  kind: 'Component' | 'Docs' | 'Design system' | 'Page';
  hint?: string;
  /** Extra words that should also find it */
  keywords?: string;
  soon?: boolean;
}

export const SEARCH: SearchItem[] = [
  ...CATALOG.filter((i) => i.layer === 'component').map((c): SearchItem => ({
    href: `#c-${c.slug}`,
    label: c.name,
    kind: 'Component',
    hint: c.group,
    keywords: c.description,
    soon: !previewBySlug(c.slug),
  })),
  ...DOCS.map((d): SearchItem => ({ href: `#docs-${d.id}`, label: d.title, kind: 'Docs' })),
  ...DS_PAGES.map((d): SearchItem => ({ href: `#ds-${d.id}`, label: d.title, kind: 'Design system', keywords: d.blurb })),
  { href: '#library', label: 'Library', kind: 'Page', keywords: 'catalog components screens blocks' },
  { href: '#pricing', label: 'Pricing', kind: 'Page', keywords: 'pro buy plans' },
  { href: '#licence', label: 'Licence', kind: 'Page', keywords: 'license terms' },
  { href: '#top', label: 'Home', kind: 'Page' },
];

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Names that start with the query first, then names that contain it, then other words that match. */
export function search(query: string): SearchItem[] {
  const q = fold(query.trim());
  if (!q) return SEARCH.filter((s) => !s.soon);
  const scored: [number, SearchItem][] = [];
  for (const s of SEARCH) {
    const name = fold(s.label);
    const words = name.split(/[^a-z0-9]+/);
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (words.some((w) => w.startsWith(q))) score = 1;
    else if (name.includes(q)) score = 2;
    else if (fold(`${s.kind} ${s.hint ?? ''} ${s.keywords ?? ''}`).split(/[^a-z0-9]+/).some((w) => w.startsWith(q)) && q.length > 2) score = 3;
    if (score >= 0) scored.push([score + (s.soon ? 0.5 : 0), s]);
  }
  return scored.sort((a, b) => a[0] - b[0]).map(([, s]) => s);
}
