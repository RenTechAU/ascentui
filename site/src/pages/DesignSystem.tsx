// The design system: the theme's variables shown live. Values are read from tokens/src/tokens.css
// at build time (see tokens.ts), and every swatch and sample paints with the variable itself,
// so these pages cannot drift from the theme.
import { Button } from '@kit/button';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Toc, type TocItem } from '../components/Toc';
import { DS_PAGES } from '../nav';
import { KIT } from '../previews/kit-sources';
import type { DsId } from '../router';
import { contrast, isColour, over, parseColour, THEME, token, tokensBy, type Token } from '../tokens';

const v = (name: string) => `var(${name})`;

function Pair({ children, className = '' }: { children: (theme: 'light' | 'dark') => ReactNode; className?: string }) {
  return (
    <div className={`ds-pair ${className}`}>
      {(['light', 'dark'] as const).map((t) => (
        <div key={t} className="ds-pane" data-theme={t}>
          <span className="ds-pane-label">{t === 'light' ? 'Light' : 'Dark'}</span>
          {children(t)}
        </div>
      ))}
    </div>
  );
}

function Sec({ id, title, note, children }: { id: string; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="ds-sec" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {note && <p className="ds-note">{note}</p>}
      {children}
    </section>
  );
}

const slug = (s: string) => 'h-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const valueIn = (t: Token, theme: 'light' | 'dark') => t.values[theme] ?? t.values.light ?? t.values.shared ?? '';
const Code = ({ children }: { children: ReactNode }) => <code className="ds-code">{children}</code>;

// ---------------------------------------------------------------- colours

const USAGE: Record<string, string> = {
  '--asc-page': 'The background of the whole app.',
  '--asc-surface': 'Cards, dialogs, inputs and menus sitting on the page.',
  '--asc-subtle': 'A faint wash on a surface: hover, table stripes, a footer bar.',
  '--asc-subtle-strong': 'A firmer wash: pressed and selected rows, the search box.',
  '--asc-border': 'Hairlines between rows and around quiet areas.',
  '--asc-border-strong': 'Edges that must be seen, such as an empty checkbox.',
  '--asc-ink': 'Body text and headings.',
  '--asc-muted': 'Secondary text people still need to read: help text, descriptions.',
  '--asc-faint': 'Icons and decorative text. Too light for text people must read.',
  '--asc-placeholder': 'Placeholder text in empty fields only.',
  '--asc-primary': 'The one main button on a screen; tooltips.',
  '--asc-on-primary': 'Text and icons on the primary colour.',
  '--asc-focus': 'The keyboard focus ring.',
  '--asc-success': 'Words and icons for done, paid, saved.',
  '--asc-success-soft': 'The ground behind success words.',
  '--asc-warning': 'Words and icons for soon, low, check this.',
  '--asc-warning-soft': 'The ground behind warning words.',
  '--asc-danger': 'Words and icons for overdue, failed, delete.',
  '--asc-danger-soft': 'The ground behind danger words.',
  '--asc-info': 'Words and icons for in progress, scheduled, new.',
  '--asc-info-soft': 'The ground behind info words.',
  '--asc-backdrop': 'The dimmed page behind a dialog or drawer.',
};

type Rgba = NonNullable<ReturnType<typeof parseColour>>;
const grade = (r: number, text: boolean) =>
  r >= 4.5 ? (text ? 'passes for text' : 'passes') : r >= 3 ? (text ? 'large text and graphics only' : 'passes for graphics') : text ? 'decorative only' : 'below 3:1, so pair it with a label or edge';

/** A short contrast note for the tokens where contrast matters, in one theme. */
function contrastNote(t: Token, theme: 'light' | 'dark'): string | null {
  const c = (name: string) => {
    const tok = token(name);
    return tok ? parseColour(valueIn(tok, theme)) : null;
  };
  const me = parseColour(valueIn(t, theme));
  const surface = c('--asc-surface');
  const page = c('--asc-page');
  if (!me || !surface || !page) return null;
  const fmt = (r: number) => `${r.toFixed(1)}:1`;
  const n = t.name;
  if (['--asc-ink', '--asc-muted', '--asc-faint', '--asc-placeholder'].includes(n)) {
    const r = Math.min(contrast(me, surface), contrast(me, page));
    return `${fmt(r)} on page and surface: ${grade(r, true)}`;
  }
  const status = /^--asc-(success|warning|danger|info)$/.exec(n)?.[1];
  if (status) {
    const soft = c(`--asc-${status}-soft`);
    const r1 = contrast(me, surface);
    const r2 = soft ? contrast(me, over(soft, surface) as Rgba) : r1;
    return `${fmt(r1)} on surface, ${fmt(r2)} on its soft ground: ${grade(Math.min(r1, r2), true)}`;
  }
  if (n === '--asc-on-primary') {
    const p = c('--asc-primary');
    if (!p) return null;
    const r = contrast(me, over(p, surface) as Rgba);
    return `${fmt(r)} on primary: ${grade(r, true)}`;
  }
  if (n === '--asc-primary' || n === '--asc-focus' || n.startsWith('--asc-hue-')) {
    const r = contrast(me, surface);
    return `${fmt(r)} on surface: ${grade(r, false)}`;
  }
  return null;
}

function Colors() {
  const colours = tokensBy((t) => isColour(t.values.light) || isColour(t.values.dark));
  const groups = new Map<string, { note: string; items: Token[] }>();
  for (const t of colours) {
    const g = groups.get(t.group) ?? { note: t.groupNote, items: [] };
    g.items.push(t);
    groups.set(t.group, g);
  }
  return (
    <>
      {[...groups].map(([group, g]) => (
        <Sec key={group} id={slug(group)} title={group} note={g.note ? g.note.replace(/^./, (x) => x.toUpperCase()) : undefined}>
          <div className="ds-swatches">
            {g.items.map((t) => (
              <div key={t.name} className="ds-swatch-row">
                <div className="ds-swatch-name">
                  <Code>{t.name}</Code>
                  <p>{USAGE[t.name] ?? (t.name.startsWith('--asc-hue-') ? 'A chart, dot and avatar hue. Never for text.' : t.note ?? '')}</p>
                </div>
                <Pair className="ds-pair-tight">
                  {(theme) => {
                    const note = contrastNote(t, theme);
                    const soft = /-soft$/.test(t.name);
                    const text = /^--asc-(ink|muted|faint|placeholder|success|warning|danger|info)$/.test(t.name);
                    // Text colours show as words on a surface; on-primary as words on the primary colour.
                    const chip: CSSProperties = text
                      ? { background: v('--asc-surface') }
                      : t.name === '--asc-on-primary'
                        ? { background: v('--asc-primary') }
                        : { background: v(t.name) };
                    return (
                      <div className="ds-swatch">
                        <span className="ds-chip" style={chip}>
                          {text && <span className="ds-chip-text" style={{ color: v(t.name) }}>Aa</span>}
                          {t.name === '--asc-on-primary' && <span className="ds-chip-text" style={{ color: v(t.name) }}>Aa</span>}
                          {soft && <span className="ds-chip-text" style={{ color: v(t.name.replace(/-soft$/, '')) }}>Aa</span>}
                        </span>
                        <span className="ds-val">
                          {valueIn(t, theme)}
                          {!t.values[theme] && theme === 'dark' && <em> (same as light)</em>}
                        </span>
                        {note && <span className="ds-contrast">{note}</span>}
                      </div>
                    );
                  }}
                </Pair>
              </div>
            ))}
          </div>
        </Sec>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- typography

function Typography() {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  const touch = (name: string) => token(name)?.values.touch;
  return (
    <>
      <Sec id="h-typefaces" title="Typefaces" note="One typeface for everything, and a monospace only for codes and numbers that must line up.">
        {['--asc-font', '--asc-font-mono'].map((n) => (
          <div key={n} className="ds-type-face">
            <Code>{n}</Code>
            <span className="ds-val">{token(n)?.values.shared}</span>
            <Pair>{() => <p className="ds-sample" style={{ fontFamily: v(n), fontSize: 20, lineHeight: '28px' }}>CASE-1042 · Pool pump not priming · 1,250.50</p>}</Pair>
          </div>
        ))}
      </Sec>
      <Sec id="h-scale" title="Type scale" note={<>Size and line height in pairs. <strong>sm</strong> is body text in apps. On touch screens the small sizes step up, so text stays readable at arm's length.</>}>
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Size</th><th>Desk</th><th>Touch screens</th><th>Line height</th></tr></thead>
            <tbody>
              {sizes.map((s) => {
                const size = token(`--asc-text-${s}`);
                const lead = token(`--asc-leading-${s}`);
                if (!size) return null;
                return (
                  <tr key={s}>
                    <td><Code>--asc-text-{s}</Code>{size.note && <small> {size.note}</small>}</td>
                    <td>{size.values.shared}</td>
                    <td>{touch(size.name) ?? 'same'}</td>
                    <td>{lead ? <>{lead.values.shared}{lead.values.touch && ` (touch ${lead.values.touch})`}</> : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pair>
          {() => (
            <div className="ds-scale">
              {sizes.map((s) => (
                <p key={s} style={{ fontSize: v(`--asc-text-${s}`), lineHeight: token(`--asc-leading-${s}`) ? v(`--asc-leading-${s}`) : 1.4 }}>
                  {s} · Annual heat pump service
                </p>
              ))}
              <p style={{ fontSize: v('--asc-text-sm'), lineHeight: v('--asc-leading-sm'), color: 'var(--asc-muted)' }}>Muted help text, in sm.</p>
            </div>
          )}
        </Pair>
      </Sec>
      <Sec id="h-controls-text" title="Text in controls" note="Buttons and inputs read their own size. Inputs go to 16px on touch screens: below that, iPhones zoom the whole page when a field is tapped.">
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Variable</th><th>Desk</th><th>Touch screens</th></tr></thead>
            <tbody>
              {['--asc-control-text', '--asc-input-text'].map((n) => (
                <tr key={n}><td><Code>{n}</Code></td><td>{token(n)?.values.shared}</td><td>{touch(n) ?? 'same'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>
    </>
  );
}

// ---------------------------------------------------------------- radius, shadows, spacing

function Radius() {
  const radii = tokensBy((t) => t.name.startsWith('--asc-radius'));
  return (
    <Sec id="h-corners" title="Corners" note="Small for chips and tooltips, the default for controls, large for cards and dialogs, full for pills and avatars.">
      <Pair>
        {() => (
          <div className="ds-boxes">
            {radii.map((t) => (
              <div key={t.name} className="ds-box-cell">
                <span className="ds-box" style={{ borderRadius: v(t.name) }} />
                <Code>{t.name}</Code>
                <span className="ds-val">{t.values.shared}</span>
              </div>
            ))}
          </div>
        )}
      </Pair>
    </Sec>
  );
}

function Shadows() {
  const shadows = tokensBy((t) => t.name.startsWith('--asc-shadow'));
  return (
    <>
      <Sec id="h-elevation" title="Elevation" note="Controls get a half-pixel hairline with a faint lift instead of a border. Only things that float above the page, such as dialogs, menus and toasts, get a real shadow.">
        <Pair>
          {() => (
            <div className="ds-boxes">
              {shadows.map((t) => (
                <div key={t.name} className="ds-box-cell">
                  <span className="ds-box ds-box-shadow" style={{ boxShadow: v(t.name) }} />
                  <Code>{t.name}</Code>
                </div>
              ))}
            </div>
          )}
        </Pair>
      </Sec>
      <Sec id="h-values" title="Values">
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Variable</th><th>Light</th><th>Dark</th></tr></thead>
            <tbody>
              {shadows.map((t) => (
                <tr key={t.name}><td><Code>{t.name}</Code></td><td className="ds-small">{t.values.light}</td><td className="ds-small">{t.values.dark ?? 'same'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>
    </>
  );
}

function Spacing() {
  const space = tokensBy((t) => t.name.startsWith('--asc-space'));
  const controls = tokensBy((t) => /^--asc-control-(sm|md|lg)$/.test(t.name));
  return (
    <>
      <Sec id="h-space" title="Space steps" note="Gaps and padding come from these steps only, so spacing stays even across components.">
        <div className="ds-space">
          {space.map((t) => (
            <div key={t.name} className="ds-space-row">
              <Code>{t.name}</Code>
              <span className="ds-val">{t.values.shared}</span>
              <span className="ds-bar" style={{ width: v(t.name) }} />
            </div>
          ))}
        </div>
      </Sec>
      <Sec id="h-control-heights" title="Control heights" note="One height scale for buttons, inputs and selects, so a row of them always lines up. On touch screens they grow to thumb-sized targets.">
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Variable</th><th>Desk</th><th>Touch screens</th></tr></thead>
            <tbody>
              {controls.map((t) => (
                <tr key={t.name}><td><Code>{t.name}</Code></td><td>{t.values.shared}</td><td>{t.values.touch ?? 'same'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pair>
          {() => (
            <div className="ds-controls">
              <Button size="sm" variant="secondary">sm</Button>
              <Button size="md" variant="secondary">md</Button>
              <Button size="lg">lg</Button>
            </div>
          )}
        </Pair>
      </Sec>
    </>
  );
}

// ---------------------------------------------------------------- motion

function Curve({ value }: { value: string }) {
  const n = /cubic-bezier\(([^)]+)\)/.exec(value)?.[1].split(',').map(Number);
  if (!n || n.length !== 4) return null;
  const [x1, y1, x2, y2] = n;
  const P = (x: number, y: number) => `${8 + x * 104} ${112 - y * 104}`;
  return (
    <svg className="ds-curve" viewBox="0 0 120 120" role="img" aria-label={`Easing curve ${value}`}>
      <path d="M8 112H112M8 112V8" stroke="var(--asc-border-strong)" fill="none" />
      <path d={`M${P(0, 0)} C${P(x1, y1)} ${P(x2, y2)} ${P(1, 1)}`} stroke="var(--asc-ink)" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Motion() {
  const [on, setOn] = useState(false);
  const ease = token('--asc-ease');
  const durations = tokensBy((t) => t.name.startsWith('--asc-duration'));
  return (
    <>
      <Sec id="h-easing" title="Easing" note="One curve for everything that moves: quick to start, gentle to settle.">
        <div className="ds-type-face">
          <Code>--asc-ease</Code>
          <span className="ds-val">{ease?.values.shared}</span>
        </div>
        <Pair>{() => <Curve value={ease?.values.shared ?? ''} />}</Pair>
      </Sec>
      <Sec id="h-durations" title="Durations" note="Short for colour and small changes, slow for things that travel, such as a sliding pill or a dialog.">
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Variable</th><th>Value</th><th>With less motion</th></tr></thead>
            <tbody>
              {durations.map((t) => (
                <tr key={t.name}><td><Code>{t.name}</Code></td><td>{t.values.shared}</td><td>{t.values.reduced ?? 'same'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ds-note">Try them. With your device set to reduce motion, the dots jump instead of gliding, because both durations become zero.</p>
        <Button variant="secondary" size="sm" onClick={() => setOn((x) => !x)} aria-pressed={on}>{on ? 'Move back' : 'Move'}</Button>
        <Pair>
          {() => (
            <div className="ds-tracks">
              {durations.map((t) => (
                <div key={t.name} className="ds-track">
                  <span className="ds-dot" data-on={on || undefined} style={{ transition: `left ${v(t.name)} var(--asc-ease)` } as CSSProperties} />
                  <small>{t.name.replace('--asc-', '')}</small>
                </div>
              ))}
            </div>
          )}
        </Pair>
      </Sec>
      <Sec id="h-reduced" title="Less motion" note="If someone has asked their device for less motion, the theme sets every duration to zero. Components only animate through these variables, so one switch covers all of them; the few that animate in script, such as Stat Card's count-up, check the same setting.">
        <span />
      </Sec>
    </>
  );
}

// ---------------------------------------------------------------- focus and layers

const kitFiles = Object.keys(KIT).sort();
const nameOf = (file: string) => file.replace(/\.tsx$/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

function Focus() {
  const focus = token('--asc-focus');
  const users = kitFiles.filter((f) => /outline:2px solid var\(--asc-focus\)/.test(KIT[f]));
  return (
    <>
      <Sec id="h-ring" title="The focus ring" note="A 2px ring in the focus colour, drawn outside the control with a small gap. It shows for keyboard focus only (:focus-visible), never on a mouse click.">
        <div className="ds-type-face">
          <Code>--asc-focus</Code>
          <span className="ds-val">light {focus?.values.light} · dark {focus?.values.dark}</span>
        </div>
        <Pair>
          {(theme) => (
            <div className="ds-controls">
              <span className="ds-focus-sample">Focused</span>
              <span className="ds-contrast">{focus && contrastNote(focus, theme)}</span>
            </div>
          )}
        </Pair>
        <p className="ds-note">Tab to this button to see the real ring: <Button size="sm" variant="secondary">Save case</Button></p>
      </Sec>
      <Sec id="h-where" title="Where it is used" note="Read from the component files. Every one of these draws the ring the same way.">
        <ul className="ds-list">
          {users.map((f) => <li key={f}>{nameOf(f)}</li>)}
        </ul>
        <p className="ds-note">Dialogs move focus into themselves and back to the opener when they close; their own box shows no ring, the control inside does.</p>
      </Sec>
    </>
  );
}

const LAYER_USE: Record<string, string> = {
  'tooltip.tsx': 'The hint bubble, above nearby content',
  'combo-box.tsx': 'The open list, above the fields below it',
  'data-table.tsx': 'The Columns and Group menus (30), the sticky header (2), column resize handles (1)',
  'toaster.tsx': 'Toasts, above everything on the page; inside an open dialog they move into it',
  'checkbox.tsx': 'The tick, above its box',
  'switch.tsx': 'The thumb, above its track',
  'segmented-control.tsx': 'The labels, above the sliding pill',
  'chart.tsx': 'The plot area, above what sits around it',
};

function Layers() {
  const backdrop = token('--asc-backdrop');
  const rows = kitFiles
    .map((f) => ({ f, z: [...new Set([...KIT[f].matchAll(/z-index:\s*(\d+)/g)].map((m) => Number(m[1])))].sort((a, b) => b - a), top: /showModal\(\)/.test(KIT[f]) }))
    .filter((r) => r.z.length || r.top)
    .sort((a, b) => (b.top ? 1e12 : Math.max(...b.z)) - (a.top ? 1e12 : Math.max(...a.z)));
  return (
    <>
      <Sec id="h-css-layer" title="The CSS layer" note={<>The theme and every component put their styles in one CSS cascade layer, <Code>@layer {THEME.layer ?? 'asc'}</Code>. Anything you write outside a layer beats it, so a plain rule changes a component without <Code>!important</Code>.</>}>
        <pre className="ds-pre">{`/* yours, unlayered: wins */\n.asc-btn { border-radius: 0; }`}</pre>
      </Sec>
      <Sec id="h-stacking" title="What sits above what" note="Read from the component files. Dialogs and drawers use the browser's top layer, which is above any z-index on the page.">
        <div className="table-scroll">
          <table className="ds-table">
            <thead><tr><th>Component</th><th>Stacking</th><th>For</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.f}>
                  <td>{nameOf(r.f)}</td>
                  <td>{r.top ? 'Top layer' : r.z.join(', ')}</td>
                  <td>{r.top ? 'The dialog or drawer, opened as a modal' : LAYER_USE[r.f] ?? 'Parts inside the component'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>
      <Sec id="h-backdrop" title="Backdrop" note="The dimmed page behind a dialog or drawer.">
        <Pair>
          {(theme) => (
            <div className="ds-backdrop">
              <span className="ds-backdrop-page">Page</span>
              <span className="ds-backdrop-dim" style={{ background: v('--asc-backdrop') }} />
              <span className="ds-backdrop-dialog">Dialog</span>
              <span className="ds-val ds-backdrop-val">{backdrop && valueIn(backdrop, theme)}</span>
            </div>
          )}
        </Pair>
      </Sec>
    </>
  );
}

// ---------------------------------------------------------------- page

const PAGES: Record<DsId, () => ReactNode> = {
  colors: Colors,
  typography: Typography,
  radius: Radius,
  shadows: Shadows,
  spacing: Spacing,
  motion: Motion,
  focus: Focus,
  layers: Layers,
};

/** Section headings of a page, for "On this page". Worked out the same way the page names them. */
function tocFor(id: DsId): TocItem[] {
  switch (id) {
    case 'colors': {
      const seen: string[] = [];
      for (const t of tokensBy((t) => isColour(t.values.light) || isColour(t.values.dark))) if (!seen.includes(t.group)) seen.push(t.group);
      return seen.map((g) => ({ id: slug(g), label: g }));
    }
    case 'typography': return [{ id: 'h-typefaces', label: 'Typefaces' }, { id: 'h-scale', label: 'Type scale' }, { id: 'h-controls-text', label: 'Text in controls' }];
    case 'radius': return [];
    case 'shadows': return [{ id: 'h-elevation', label: 'Elevation' }, { id: 'h-values', label: 'Values' }];
    case 'spacing': return [{ id: 'h-space', label: 'Space steps' }, { id: 'h-control-heights', label: 'Control heights' }];
    case 'motion': return [{ id: 'h-easing', label: 'Easing' }, { id: 'h-durations', label: 'Durations' }, { id: 'h-reduced', label: 'Less motion' }];
    case 'focus': return [{ id: 'h-ring', label: 'The focus ring' }, { id: 'h-where', label: 'Where it is used' }];
    case 'layers': return [{ id: 'h-css-layer', label: 'The CSS layer' }, { id: 'h-stacking', label: 'What sits above what' }, { id: 'h-backdrop', label: 'Backdrop' }];
  }
}

export function DesignSystem({ current }: { current: DsId }) {
  const meta = DS_PAGES.find((p) => p.id === current)!;
  const index = DS_PAGES.indexOf(meta);
  const prev = DS_PAGES[index - 1];
  const next = DS_PAGES[index + 1];
  const Body = PAGES[current];
  const toc = useMemo(() => tocFor(current), [current]);
  return (
    <main id="main">
      <div className="wrap docs page">
        <div className="with-toc">
          <article className="ds-body" key={current}>
            <nav className="crumbs" aria-label="Breadcrumb">
              <a href="#design-system">Design system</a> <span aria-hidden>/</span> <span aria-current="page">{meta.title}</span>
            </nav>
            <div className="sec-head">
              <h1>{meta.title}</h1>
              <p>{meta.blurb}</p>
              <p className="small">
                Read from <code>tokens/src/tokens.css</code> when the site is built, and painted with the variables themselves, so this
                page always matches the theme. Light and dark sit side by side. To change a value, see <a href="#docs-theming">Theming</a>.
              </p>
            </div>
            <Body />
            <div className="docs-next">
              {prev ? <a href={`#ds-${prev.id}`}>← {prev.title}</a> : <span />}
              {next && <a href={`#ds-${next.id}`}>{next.title} →</a>}
            </div>
          </article>
          <Toc key={current} items={toc} />
        </div>
      </div>
    </main>
  );
}
