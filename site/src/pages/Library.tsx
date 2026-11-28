import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LAYERS, PHASES, countItems, type CatalogItem, type Layer, type Status, type Tier } from '../catalog';
import { CopyButton } from '../components/CopyButton';
import { registry } from '../nav';
import { usePref } from '../prefs';
import { previewBySlug } from '../previews';
import { replaceHash, type SectionId } from '../router';
import { Stage } from './Component';

const STATUS: Record<Status, string> = { built: 'Built', 'part-built': 'Part built', planned: 'Planned' };

/** Library sections in the order the page shows them, each a catalog layer. */
export const SECTIONS: { id: SectionId; layer: Layer }[] = [
  { id: 'components', layer: 'component' },
  { id: 'screens', layer: 'screen' },
  { id: 'blocks', layer: 'block' },
  { id: 'illustrations', layer: 'illustration' },
  { id: 'motion', layer: 'motion' },
  { id: 'starter-apps', layer: 'starter' },
  { id: 'agent-kit', layer: 'agent-kit' },
  { id: 'theme', layer: 'theme' },
];
const layerInfo = (id: Layer) => LAYERS.find((l) => l.id === id)!;

/** Where a built item without a component page is shown instead. */
const ELSEWHERE: Record<string, string> = {
  'tokens-and-brand-config': '#ds-colors',
  'number-count-up': '#c-stat-card',
  'skeleton-shimmer': '#c-skeleton-and-spinner',
  'overlay-enter-and-exit': '#c-dialog-and-drawer',
  'press-and-focus-feedback': '#ds-motion',
};

export const installCommand = (names: string[]) => `npx shadcn@latest add ${names.map((n) => `${registry}/r/${n}.json`).join(' ')}`;

function Tags({ item }: { item: CatalogItem }) {
  return (
    <div className="lib-tags">
      <Badge tone={item.tier === 'free' ? 'success' : 'purple'}>{item.tier === 'free' ? 'Free' : 'Pro'}</Badge>
      <Badge>Phase {item.phase}</Badge>
      <Badge tone={item.status === 'planned' ? 'neutral' : 'info'}>{STATUS[item.status]}</Badge>
    </div>
  );
}

/** A card with a live preview, for a built component. */
function LiveCard({ item }: { item: CatalogItem }) {
  const p = previewBySlug(item.slug)!;
  const Thumb = p.Thumb ?? p.Demo;
  return (
    <article className="lc">
      {/* inert: the preview is for looking at; the name is the link, and it covers the card */}
      <div className="lc-stage" inert>
        <Stage className="g-stage">
          <Thumb />
        </Stage>
      </div>
      <div className="lc-meta">
        <h3 className="lc-name">
          <a className="lc-link" href={`#c-${item.slug}`}>{item.name}</a>
        </h3>
        <p>{p.description}</p>
      </div>
      <div className="lc-foot">
        <Badge tone={item.tier === 'free' ? 'success' : 'purple'}>{item.tier === 'free' ? 'Free' : 'Pro'}</Badge>
        {item.tier === 'free' && (
          <CopyButton className="copy-btn lc-copy" text={installCommand(p.install)} label={`Copy the install command for ${item.name}`} />
        )}
      </div>
    </article>
  );
}

/** A quiet card for everything without a preview yet. */
function PlanCard({ item }: { item: CatalogItem }) {
  const href = ELSEWHERE[item.slug];
  const sub = item.module ?? item.group;
  return (
    <article className="lc lc-plan" data-status={item.status}>
      <div className="lc-meta">
        {sub && <small>{sub}</small>}
        <h3 className="lc-name">
          {href ? <a className="lc-link" href={href}>{item.name}</a> : item.name}
        </h3>
        <p>{item.description}</p>
      </div>
      <Tags item={item} />
    </article>
  );
}

function Row({ item }: { item: CatalogItem }) {
  return (
    <li className="lib-row">
      <div className="lib-name">
        {previewBySlug(item.slug) ? <a href={`#c-${item.slug}`}>{item.name}</a> : <span>{item.name}</span>}
        {(item.module ?? item.group) && <small>{item.module ?? item.group}</small>}
      </div>
      <p>{item.description}</p>
      <Tags item={item} />
    </li>
  );
}

type Built = 'all' | 'built' | 'planned';

// Screens are shown by the app they build, as affectUI names its screens. Display only: catalog modules and slugs stay put.
const APP_OF: Record<string, string> = {
  CRM: 'CRM', Dispatch: 'Dispatch', 'Field app': 'Field app', Phone: 'Field app',
  'Quotes + payments': 'Finance', 'Assets + warranty': 'Products and warranty',
  'Sign-in and account': 'Admin', 'App basics': 'Admin', Brand: 'Admin', AI: 'AI',
};
const APP_ORDER = ['CRM', 'Dispatch', 'Field app', 'Finance', 'Products and warranty', 'Admin', 'AI'];
function byApp(rows: CatalogItem[]) {
  const groups = new Map<string, CatalogItem[]>();
  for (const r of rows) {
    const app = APP_OF[r.module ?? ''] ?? 'Other';
    groups.set(app, [...(groups.get(app) ?? []), r]);
  }
  return [...groups].sort(([a], [b]) => (APP_ORDER.indexOf(a) + 99) % 99 - (APP_ORDER.indexOf(b) + 99) % 99);
}
const isBuilt = (i: CatalogItem) => i.status !== 'planned';

export function Library({ items, section: fromRoute }: { items: CatalogItem[]; section: SectionId | null }) {
  const [section, setSection] = useState<'all' | SectionId>(fromRoute ?? 'all');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [built, setBuilt] = useState<Built>('all');
  const [view, setView] = usePref<'grid' | 'list'>('asc-site-library-view', 'grid', ['grid', 'list']);

  // The sidebar and the address can pick a section too.
  useEffect(() => setSection(fromRoute ?? 'all'), [fromRoute]);
  const pickSection = (s: 'all' | SectionId) => {
    setSection(s);
    replaceHash(s === 'all' ? 'library' : `library-${s}`);
  };

  const all = countItems(items);
  const inSection = items.filter((i) => section === 'all' || SECTIONS.find((s) => s.id === section)?.layer === i.layer);
  const shown = inSection.filter((i) => (tier === 'all' || i.tier === tier) && (built === 'all' || (built === 'built') === isBuilt(i)));
  const now = countItems(shown);
  const builtCount = items.filter(isBuilt).length;
  const layers = SECTIONS.filter((s) => section === 'all' || s.id === section).map((s) => layerInfo(s.layer));

  return (
    <main id="main">
      <section className="wrap sec page lib">
        <div className="sec-head">
          <h1>Library</h1>
          <p>
            Business components, screens and blocks. The basic components are free; power pieces and screens that work are Pro. {all.total} items
            in the catalog, {builtCount} built so far.
          </p>
        </div>

        <div className="lib-filters">
          <nav className="lib-tabs" aria-label="Section">
            {[{ id: 'all' as const, label: 'All', count: all.total }, ...SECTIONS.map((s) => ({ id: s.id, label: layerInfo(s.layer).label, count: items.filter((i) => i.layer === s.layer).length }))].map((t) => (
              <button key={t.id} type="button" className="lib-tab" aria-pressed={section === t.id} onClick={() => pickSection(t.id)}>
                {t.label} <small>{t.count}</small>
              </button>
            ))}
          </nav>
          <div className="lib-tools" role="group" aria-label="Filters">
            <label className="lib-select">
              <span>Tier</span>
              <select value={tier} onChange={(e) => setTier(e.target.value as 'all' | Tier)}>
                <option value="all">All</option>
                <option value="free">Free ({countItems(inSection).free})</option>
                <option value="pro">Pro ({countItems(inSection).pro})</option>
              </select>
            </label>
            <label className="lib-select">
              <span>Status</span>
              <select value={built} onChange={(e) => setBuilt(e.target.value as Built)}>
                <option value="all">All</option>
                <option value="built">Built ({inSection.filter(isBuilt).length})</option>
                <option value="planned">Planned ({inSection.filter((i) => !isBuilt(i)).length})</option>
              </select>
            </label>
            <p className="lib-count" aria-live="polite">
              {now.total} of {all.total} · {now.free} free · {now.pro} Pro
            </p>
            <div className="lib-view">
              <SegmentedControl
                aria-label="View"
                size="sm"
                value={view}
                onChange={setView}
                options={[{ value: 'grid', label: 'Cards' }, { value: 'list', label: 'List' }]}
              />
            </div>
          </div>
        </div>


        {layers.map((layer) => {
          const rows = shown.filter((i) => i.layer === layer.id);
          if (rows.length === 0) return null;
          const c = countItems(rows);
          const live = rows.filter((i) => previewBySlug(i.slug));
          const rest = rows.filter((i) => !previewBySlug(i.slug));
          return (
            <section className="lib-layer" key={layer.id} aria-labelledby={`layer-${layer.id}`}>
              <div className="lib-layer-head">
                <h2 id={`layer-${layer.id}`}>{layer.label}</h2>
                <span>{c.total} {c.total === 1 ? 'item' : 'items'} · {c.free} free · {c.pro} Pro</span>
              </div>
              <p className="small">{layer.blurb}</p>
              {layer.id === 'screen' ? (
                byApp(rows).map(([app, list]) => (
                  <div className="lib-app" key={app}>
                    <h3>{app} <small>{list.length}</small></h3>
                    {view === 'grid'
                      ? <div className="lc-grid lc-grid-plan">{list.map((i) => previewBySlug(i.slug) ? <LiveCard key={i.slug} item={i} /> : <PlanCard key={i.slug} item={i} />)}</div>
                      : <ul className="lib-list">{list.map((i) => <Row key={i.slug} item={i} />)}</ul>}
                  </div>
                ))
              ) : view === 'grid' ? (
                <>
                  {live.length > 0 && <div className="lc-grid">{live.map((i) => <LiveCard key={i.slug} item={i} />)}</div>}
                  {rest.length > 0 && <div className="lc-grid lc-grid-plan">{rest.map((i) => <PlanCard key={i.slug} item={i} />)}</div>}
                </>
              ) : (
                <ul className="lib-list">{rows.map((i) => <Row key={i.slug} item={i} />)}</ul>
              )}
            </section>
          );
        })}
        {shown.length === 0 && <p className="small">Nothing matches those filters.</p>}

        <div className="table-scroll">
          <table className="lib-phases">
            <caption>Phases</caption>
            <thead><tr><th>Phase</th><th>What it covers</th><th>Free</th><th>Pro</th></tr></thead>
            <tbody>
              {PHASES.map((p) => {
                const c = countItems(items.filter((i) => i.phase === p.id));
                return (
                  <tr key={p.id}><td>{p.id}. {p.name}</td><td>{p.theme}</td><td className="num">{c.free}</td><td className="num">{c.pro}</td></tr>
                );
              })}
              <tr><td>Total</td><td>{all.total} items</td><td className="num">{all.free}</td><td className="num">{all.pro}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
