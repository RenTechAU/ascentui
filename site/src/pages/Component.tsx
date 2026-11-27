import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/code-block';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { CATALOG } from '../catalog';
import { previewBySlug, PREVIEWS, type Preview } from '../previews';

type Theme = 'light' | 'dark';

/** The live preview area. It carries its own theme, so a light preview sits inside the dark site. */
export function Stage({ theme = 'light', children, className = 'stage' }: { theme?: Theme; children: ReactNode; className?: string }) {
  return (
    <div className={className} data-theme={theme}>
      {children}
    </div>
  );
}

/** Components in the side list: every catalog component, the ones with a preview as links. */
function SideNav({ current }: { current: string }) {
  const groups = new Map<string, { slug: string; name: string; live: boolean }[]>();
  for (const c of CATALOG.filter((i) => i.layer === 'component')) {
    const list = groups.get(c.group ?? 'Other') ?? [];
    list.push({ slug: c.slug, name: c.name, live: !!previewBySlug(c.slug) });
    groups.set(c.group ?? 'Other', list);
  }
  return (
    <nav className="comp-nav" aria-label="Components">
      {[...groups].map(([group, items]) => (
        <div key={group} className="comp-nav-group">
          <p>{group}</p>
          {items.map((i) =>
            i.live ? (
              <a key={i.slug} href={`#c-${i.slug}`} aria-current={i.slug === current ? 'page' : undefined}>{i.name}</a>
            ) : (
              <span key={i.slug} title="Planned">{i.name}</span>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="comp-sec prose">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Page({ p, registry }: { p: Preview; registry: string }) {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [theme, setTheme] = useState<Theme>('light');
  const [run, setRun] = useState(0);
  const install = `npx shadcn@latest add ${p.install.map((n) => `${registry}/r/${n}.json`).join(' ')}`;
  const index = PREVIEWS.indexOf(p);
  const prev = PREVIEWS[index - 1];
  const next = PREVIEWS[index + 1];

  return (
    <article className="comp-body">
      <p className="crumbs">
        <a href="#library">Library</a> <span aria-hidden>/</span> {p.group} <span aria-hidden>/</span> {p.name}
      </p>
      <div className="sec-head">
        <h1>{p.name}</h1>
        <p>{p.description}</p>
      </div>

      <CodeBlock code={install} language="bash" filename="Terminal" />

      <div className="comp-toolbar">
        <SegmentedControl
          aria-label="Show"
          value={view}
          onChange={setView}
          options={[{ value: 'preview', label: 'Preview' }, { value: 'code', label: 'Code' }]}
        />
        {view === 'preview' && (
          <>
            <SegmentedControl
              aria-label="Theme"
              value={theme}
              onChange={setTheme}
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
            />
            <Button className="round" variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>Reset</Button>
          </>
        )}
      </div>

      {view === 'preview' ? (
        <Stage theme={theme} key={run}>
          <p.Demo />
        </Stage>
      ) : (
        <div className="comp-code">
          {p.sources.map((s) => (
            <CodeBlock key={s.file} code={s.code} language="tsx" filename={`components/ui/${s.file}`} maxHeight={520} showLineNumbers />
          ))}
        </div>
      )}

      <div className="comp-when">
        <Section title="When to use">
          <ul>{p.when.map((w) => <li key={w}>{w}</li>)}</ul>
        </Section>
        <Section title="When not to">
          <ul>{p.whenNot.map((w) => <li key={w}>{w}</li>)}</ul>
        </Section>
      </div>

      <Section title="Built in for you">
        <p>The care that is easy to forget, already done. You get it without asking.</p>
        <ul className="checks">{p.builtIn.map((b) => <li key={b}>{b}</li>)}</ul>
      </Section>

      <Section title="Usage">
        <CodeBlock code={p.usage} language="tsx" filename="example.tsx" />
        {p.examples.map((e) => (
          <div key={e.title} className="comp-example">
            <h3>{e.title}</h3>
            <CodeBlock code={e.code} language="tsx" />
          </div>
        ))}
      </Section>

      <Section title="Props">
        {p.props.map((t) => (
          <div key={t.component} className="table-scroll">
            {p.props.length > 1 && <h3>{t.component}</h3>}
            <table>
              <thead>
                <tr><th>Prop</th><th>Type</th><th>Default</th><th>What it does</th></tr>
              </thead>
              <tbody>
                {t.rows.map((r) => (
                  <tr key={r.name}>
                    <td><code>{r.name}</code></td>
                    <td><code>{r.type}</code></td>
                    <td>{r.def ? <code>{r.def}</code> : '–'}</td>
                    <td>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      {p.keyboard && (
        <Section title="Keyboard">
          <table>
            <tbody>
              {p.keyboard.map(([k, a]) => (
                <tr key={k}><td><kbd>{k}</kbd></td><td>{a}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <div className="docs-next">
        {prev ? <a href={`#c-${prev.slug}`}>← {prev.name}</a> : <span />}
        {next && <a href={`#c-${next.slug}`}>{next.name} →</a>}
      </div>
    </article>
  );
}

export function ComponentPage({ slug, registry }: { slug: string; registry: string }) {
  const p = previewBySlug(slug);
  return (
    <main>
      <div className="wrap comp page">
        <SideNav current={slug} />
        {p ? (
          <Page key={p.slug} p={p} registry={registry} />
        ) : (
          <article className="comp-body">
            <div className="sec-head">
              <h1>Not built yet</h1>
              <p>This component is planned. See the <a href="#library">library</a> for what is ready today.</p>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
