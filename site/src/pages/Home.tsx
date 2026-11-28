import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Showcase } from '../showcase/Showcase';
import { CodeBlock } from '@/components/ui/code-block';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextReveal } from '@/components/ui/text-reveal';
import { CATALOG, LAYERS, countItems, type Tier } from '../catalog';
import { PARTS, PITCH, REGISTRY_BASE } from '../content';
import { Plans } from '../Plans';
import { goTo } from '../router';

export function Home() {
  const [tier, setTier] = useState<'all' | Tier>('all');
  const layers = LAYERS.map((l) => ({ ...l, counts: countItems(CATALOG.filter((i) => i.layer === l.id)) })).filter(
    (l) => tier === 'all' || (tier === 'free' ? l.counts.free > 0 : l.counts.pro > 0),
  );
  const totals = countItems(CATALOG);
  const install = `npx shadcn@latest add ${REGISTRY_BASE ?? 'https://<your-domain>'}/r/data-table.json`;

  return (
    <>
      <main id="main">
        <section className="hero">
          <div className="wrap hero-in">
            <a className="pill" href="#pricing">
              <b>Free tier</b>
              <span className="pill-long">The basics are free. Power pieces and working screens are Pro →</span>
              <span className="pill-short">The basics are free →</span>
            </a>
            <TextReveal as="h1" className="h1" text="UI for businesses" />
            <p className="lede">Business-ready React components for CRM, services, finance and AI.</p>
            <div className="cta">
              <Button className="light" size="lg" onClick={goTo('library')}>Browse library</Button>
              <Button className="round" variant="secondary" size="lg" onClick={goTo('docs-install')}>Get started</Button>
            </div>
          </div>
          <Showcase />
        </section>

        <section className="wrap pitch" aria-label="Why AscentUI">
          {PITCH.map((p) => (
            <div key={p.title}>
              <h2>{p.title}</h2>
              <p>{p.body}</p>
            </div>
          ))}
        </section>

        <div className="band" id="how">
          <section className="wrap sec">
            <div className="sec-head">
              <h2>Screens that work, not just screens</h2>
              <p>
                Component libraries stop at the pixels. Every Pro screen comes with a backend recipe your
                coding agent follows, with rules taken from a system a real service business runs on.
              </p>
            </div>
            <div className="parts">
              {PARTS.map((p) => (
                <div className="part" key={p.title}>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
            <CodeBlock code={install} language="bash" filename="Terminal" />
            <div className="works">
              Or ask your assistant to add it:
              <span>Claude Code</span>
              <span>Cursor</span>
              <span>v0</span>
              <span>Codex</span>
            </div>
          </section>
        </div>

        <section className="wrap sec">
          <div className="sec-row">
            <h2>The library</h2>
            <SegmentedControl
              aria-label="Filter by tier"
              value={tier}
              onChange={setTier}
              options={[
                { value: 'all', label: 'All', count: totals.total },
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
              ]}
            />
          </div>
          <div className="mods">
            {layers.map((l) => (
              <Card key={l.id}>
                <div className="mod">
                  <div className="mod-top">
                    <h3>{l.label}</h3>
                    <span className="mod-tags">
                      {l.counts.free > 0 && <Badge tone="success">{l.counts.free} free</Badge>}
                      {l.counts.pro > 0 && <Badge tone="purple">{l.counts.pro} Pro</Badge>}
                    </span>
                  </div>
                  <p>{l.blurb}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="band">
          <section className="wrap sec">
            <div className="sec-head">
              <h2>Pay once. Build as many as you like.</h2>
              <p>No subscription. Use it in your own projects and your clients'.</p>
            </div>
            <Plans onFree={goTo('library')} onBuy={goTo('pricing')} />
          </section>
        </div>
      </main>

    </>
  );
}
