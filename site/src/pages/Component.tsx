import { Tooltip } from '@kit/tooltip';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/code-block';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { CopyButton } from '../components/CopyButton';
import { Toc, type TocItem } from '../components/Toc';
import { PMS, shadcn, usePm, type Pm } from '../prefs';
import { previewBySlug, PREVIEWS, type Preview } from '../previews';
import { behaviourOf } from '../previews/behaviour';
import { importsOf, withDependencies } from '../previews/kit-sources';

type Theme = 'light' | 'dark';

/** The live preview area. It carries its own theme, so a light preview sits inside the dark site. */
export function Stage({ theme = 'light', children, className = 'stage' }: { theme?: Theme; children: ReactNode; className?: string }) {
  return (
    <div className={className} data-theme={theme}>
      {children}
    </div>
  );
}

function Section({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`comp-sec prose ${className}`} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

const fileOf = (name: string) => `${name}.tsx`;

/** Components this one is built from, then ones built from it, then the rest of its group. */
function related(p: Preview): Preview[] {
  const mine = p.install.map(fileOf);
  const owner = (file: string) => PREVIEWS.find((q) => q !== p && q.install.map(fileOf).includes(file));
  const from = mine.flatMap(importsOf).map(owner);
  const by = PREVIEWS.filter((q) => q !== p && q.install.map(fileOf).some((f) => importsOf(f).some((d) => mine.includes(d))));
  const group = PREVIEWS.filter((q) => q !== p && q.group === p.group);
  const out: Preview[] = [];
  for (const q of [...from, ...by, ...group]) if (q && !out.includes(q)) out.push(q);
  return out.slice(0, 6);
}

function PmTabs({ pm, setPm, id }: { pm: Pm; setPm: (p: Pm) => void; id: string }) {
  return (
    <SegmentedControl
      aria-label="Package manager"
      size="sm"
      variant="underline"
      kind="tabs"
      value={pm}
      onChange={setPm}
      options={PMS.map((m) => ({ value: m, label: m, controls: id }))}
    />
  );
}

function Installation({ p, registry }: { p: Preview; registry: string }) {
  const [how, setHow] = useState<'cli' | 'manual'>('cli');
  const [pm, setPm] = usePm();
  const urls = p.install.map((n) => `${registry}/r/${n}.json`).join(' ');
  const files = withDependencies(p.install.map(fileOf));
  const extra = files.filter((f) => !p.install.map(fileOf).includes(f));
  return (
    <>
      <SegmentedControl
        aria-label="How to install"
        kind="tabs"
        value={how}
        onChange={setHow}
        options={[
          { value: 'cli', label: 'CLI', controls: 'install-panel' },
          { value: 'manual', label: 'Manual', controls: 'install-panel' },
        ]}
      />
      <div id="install-panel" role="tabpanel" aria-label={how === 'cli' ? 'CLI' : 'Manual'} className="install-panel">
        {how === 'cli' ? (
          <>
            <p>Add the theme once per app, then the component. The CLI brings the parts it is built from.</p>
            <PmTabs pm={pm} setPm={setPm} id="pm-panel" />
            <div id="pm-panel" role="tabpanel" aria-label={pm} className="install-steps">
              <CodeBlock code={shadcn(pm, `add ${registry}/r/theme.json`)} language="bash" filename="1. The theme, once" />
              <CodeBlock code={shadcn(pm, `add ${urls}`)} language="bash" filename={`2. ${p.name}`} />
            </div>
            <p className="small">
              Then import <code>styles/ascentui/tokens.css</code> once at your app's entry. The{' '}
              <a href="#docs-install">installation guide</a> covers the registry namespace and Pro keys.
            </p>
          </>
        ) : (
          <ol className="steps">
            <li>
              Copy <code>tokens.css</code> from the <a href="#docs-theming">theme</a> into <code>styles/ascentui/</code> and import it once at your
              app's entry.
            </li>
            <li>
              Copy {files.length === 1 ? 'this file' : 'these files'} into <code>components/ui/</code>, side by side:{' '}
              {files.map((f, i) => (
                <span key={f}>
                  {i > 0 && ', '}
                  <code>{f}</code>
                </span>
              ))}
              .{extra.length > 0 && ` ${p.name} is built from ${extra.join(', ')}, which ${extra.length === 1 ? 'it imports' : 'it imports'} from "./".`} The
              Code view above shows {p.sources.length === 1 ? 'the file' : 'each file'}, and Copy code copies {p.sources.length === 1 ? 'it' : 'them all'}.
            </li>
            <li>Import it where you need it. Its styles come inside the file, so there is no CSS to wire up. It needs React 19.</li>
          </ol>
        )}
      </div>
    </>
  );
}

function Page({ p, registry }: { p: Preview; registry: string }) {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [theme, setTheme] = useState<Theme>('light');
  const [run, setRun] = useState(0);
  const [pm] = usePm();
  const urls = p.install.map((n) => `${registry}/r/${n}.json`).join(' ');
  const b = behaviourOf(p);
  const rel = related(p);
  const allCode = p.sources.length === 1 ? p.sources[0].code : p.sources.map((s) => `// components/ui/${s.file}\n${s.code}`).join('\n\n');
  const prompt = [
    `Use the AscentUI MCP server to add the ${p.name} component to this project.`,
    `If the AscentUI MCP server is not connected, read ${registry}/llms.txt and install it with the shadcn CLI: npx shadcn@latest add ${urls}`,
    `Install the theme first if styles/ascentui/tokens.css is missing (${registry}/r/theme.json) and import it once at the app's entry.`,
    'Pass data in through props; do not add a fetch inside the component. Do not rewrite the component or move its styles into a global stylesheet.',
  ].join('\n');

  const toc: TocItem[] = useMemo(
    () =>
      [
        { id: 'when', label: 'When to use' },
        { id: 'installation', label: 'Installation' },
        { id: 'usage', label: 'Usage' },
        p.examples.length ? { id: 'examples', label: 'Examples' } : null,
        { id: 'api', label: 'API reference' },
        p.keyboard ? { id: 'keyboard', label: 'Keyboard interactions' } : null,
        { id: 'built-in', label: 'Built in for you' },
        { id: 'accessibility', label: 'Accessibility' },
        { id: 'motion', label: 'Motion' },
        { id: 'responsive', label: 'Responsive behaviour' },
        rel.length ? { id: 'related', label: 'Related components' } : null,
      ].filter((x): x is TocItem => !!x),
    [p, rel.length],
  );

  return (
    <div className="with-toc">
      <article className="comp-body">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#library-components">Components</a> <span aria-hidden>/</span> {p.group} <span aria-hidden>/</span> <span aria-current="page">{p.name}</span>
        </nav>
        <div className="sec-head">
          <h1>{p.name}</h1>
          <p>{p.description}</p>
        </div>

        <CodeBlock code={shadcn(pm, `add ${urls}`)} language="bash" filename="Install" />

        <div className="comp-toolbar">
          <SegmentedControl
            aria-label="Show"
            size="sm"
            value={view}
            onChange={setView}
            options={[{ value: 'preview', label: 'Preview' }, { value: 'code', label: 'Code' }]}
          />
          {view === 'preview' && (
            <>
              <SegmentedControl
                aria-label="Preview theme"
                size="sm"
                value={theme}
                onChange={setTheme}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              />
              <Button className="round" variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>Reset</Button>
            </>
          )}
          <span className="comp-toolbar-end">
            <Tooltip content="Copies a prompt for your coding agent. The AscentUI MCP server is planned; until then the prompt falls back to llms.txt and the CLI.">
              <CopyButton text={prompt} label={`Copy an agent prompt for ${p.name}`}>MCP</CopyButton>
            </Tooltip>
            <CopyButton text={allCode} label={`Copy the code for ${p.name}`}>Copy code</CopyButton>
          </span>
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
          <Section id="when" title="When to use">
            <ul>{p.when.map((w) => <li key={w}>{w}</li>)}</ul>
          </Section>
          <Section id="when-not" title="When not to use">
            <ul>{p.whenNot.map((w) => <li key={w}>{w}</li>)}</ul>
          </Section>
        </div>

        <Section id="installation" title="Installation">
          <Installation p={p} registry={registry} />
        </Section>

        <Section id="usage" title="Usage">
          <CodeBlock code={p.usage} language="tsx" filename="example.tsx" />
        </Section>

        {p.examples.length > 0 && (
          <Section id="examples" title="Examples">
            {p.examples.map((e) => (
              <div key={e.title} className="comp-example">
                <h3>{e.title}</h3>
                <CodeBlock code={e.code} language="tsx" />
              </div>
            ))}
          </Section>
        )}

        <Section id="api" title="API reference">
          {p.props.map((t) => (
            <div key={t.component} className="table-scroll">
              <h3>{t.component}</h3>
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
          <Section id="keyboard" title="Keyboard interactions">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Key</th><th>What it does</th></tr></thead>
                <tbody>
                  {p.keyboard.map(([k, a]) => (
                    <tr key={k}><td><kbd>{k}</kbd></td><td>{a}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section id="built-in" title="Built in for you">
          <p>The care that is easy to forget, already done. You get it without asking; the next three sections have the detail.</p>
          {b.summary.length > 0 && <ul className="checks">{b.summary.map((x) => <li key={x}>{x}</li>)}</ul>}
        </Section>
        <Section id="accessibility" title="Accessibility">
          <ul className="checks">{b.a11y.map((x) => <li key={x}>{x}</li>)}</ul>
          {b.a11y.length === 0 && <p>See <a href="#docs-accessibility">Accessibility</a> for what every component does.</p>}
        </Section>
        <Section id="motion" title="Motion">
          <ul className="checks">{b.motion.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
        <Section id="responsive" title="Responsive behaviour">
          <ul className="checks">{b.responsive.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>

        {rel.length > 0 && (
          <Section id="related" title="Related components">
            <ul className="related">
              {rel.map((r) => (
                <li key={r.slug}>
                  <a href={`#c-${r.slug}`}>
                    <span>{r.name}</span>
                    <small>{r.description}</small>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
      <Toc items={toc} />
    </div>
  );
}

export function ComponentPage({ slug, registry }: { slug: string; registry: string }) {
  const p = previewBySlug(slug);
  return (
    <main id="main">
      <div className="wrap comp page">
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
