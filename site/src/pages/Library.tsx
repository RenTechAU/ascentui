import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { LAYERS, PHASES, countItems, type CatalogItem, type Phase, type Status, type Tier } from '../catalog';
import { previewBySlug, PREVIEWS } from '../previews';
import { Stage } from './Component';

const STATUS: Record<Status, string> = { built: 'Built', 'part-built': 'Part built', planned: 'Planned' };

function Row({ item }: { item: CatalogItem }) {
  return (
    <li className="lib-row">
      <div className="lib-name">
        {previewBySlug(item.slug) ? <a href={`#c-${item.slug}`}>{item.name}</a> : <span>{item.name}</span>}
        {(item.module ?? item.group) && <small>{item.module ?? item.group}</small>}
      </div>
      <p>{item.description}</p>
      <div className="lib-tags">
        <Badge tone={item.tier === 'free' ? 'success' : 'purple'}>{item.tier === 'free' ? 'Free' : 'Pro'}</Badge>
        <Badge>Phase {item.phase}</Badge>
        <Badge tone={item.status === 'planned' ? 'neutral' : 'info'}>{STATUS[item.status]}</Badge>
      </div>
    </li>
  );
}

export function Library({ items }: { items: CatalogItem[] }) {
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [phase, setPhase] = useState<'all' | `${Phase}`>('all');

  const all = countItems(items);
  const shown = items.filter((i) => (tier === 'all' || i.tier === tier) && (phase === 'all' || String(i.phase) === phase));
  const now = countItems(shown);
  const built = items.filter((i) => i.status !== 'planned').length;

  return (
    <main>
      <section className="wrap sec page">
        <div className="sec-head">
          <h1>The library</h1>
          <p>
            Every component is free. Screens that work are Pro. The full catalog is {all.total} items: {all.free} free
            and {all.pro} Pro, shipping in five phases.
          </p>
          <p className="small">
            AscentUI is in pre-release. {built} of {all.total} items are built or part built today; the rest are planned.
          </p>
        </div>

        <section className="gallery-wrap" aria-labelledby="ready">
          <div className="lib-layer-head">
            <h2 id="ready">Ready to use</h2>
            <span>{PREVIEWS.length} components, live. Open one for code, props and install.</span>
          </div>
          <div className="gallery">
            {PREVIEWS.map((p) => {
              const Thumb = p.Thumb ?? p.Demo;
              return (
                <a key={p.slug} className="g-card" href={`#c-${p.slug}`}>
                  {/* inert: the preview inside is for looking at; the whole card is the link */}
                  <div inert>
                    <Stage className="g-stage">
                      <Thumb />
                    </Stage>
                  </div>
                  <div className="g-meta">
                    <span>{p.name}</span>
                    <small>{p.description}</small>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <div className="lib-filters">
          <SegmentedControl
            aria-label="Filter by tier"
            value={tier}
            onChange={setTier}
            options={[
              { value: 'all', label: 'All', count: all.total },
              { value: 'free', label: 'Free', count: all.free },
              { value: 'pro', label: 'Pro', count: all.pro },
            ]}
          />
          <SegmentedControl
            aria-label="Filter by phase"
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'all', label: 'All phases' },
              ...PHASES.map((p) => ({ value: `${p.id}` as const, label: `Phase ${p.id}`, ariaLabel: `Phase ${p.id}: ${p.name}` })),
            ]}
          />
        </div>

        <p className="lib-count" aria-live="polite">
          Showing {now.total} of {all.total}: {now.free} free, {now.pro} Pro
          {phase !== 'all' && <> · Phase {phase}: {PHASES.find((p) => String(p.id) === phase)?.name}</>}
        </p>

        {LAYERS.map((layer) => {
          const rows = shown.filter((i) => i.layer === layer.id);
          if (rows.length === 0) return null;
          const c = countItems(rows);
          return (
            <section className="lib-layer" key={layer.id} aria-labelledby={`layer-${layer.id}`}>
              <div className="lib-layer-head">
                <h2 id={`layer-${layer.id}`}>{layer.label}</h2>
                <span>{c.total} {c.total === 1 ? 'item' : 'items'} · {c.free} free · {c.pro} Pro</span>
              </div>
              <p className="small">{layer.blurb}</p>
              <ul className="lib-list">
                {rows.map((i) => <Row key={i.slug} item={i} />)}
              </ul>
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
              <tr><td>Total</td><td className="num">{all.total}</td><td className="num">{all.free}</td><td className="num">{all.pro}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
