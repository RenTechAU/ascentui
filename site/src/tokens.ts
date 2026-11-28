// Reads tokens/src/tokens.css at build time (imported as text) and turns it into data for the
// design-system pages, so those pages always show what the theme file really says.
import css from '@tokens/tokens.css?raw';

export type Context = 'light' | 'dark' | 'shared' | 'touch' | 'reduced';

export interface Token {
  name: string;
  /** Value per context it is set in. Light and dark colours, shared sizes, touch and reduced-motion overrides. */
  values: Partial<Record<Context, string>>;
  /** The group comment above it, e.g. "Ground" */
  group: string;
  /** The rest of that comment, e.g. "the page, then surfaces on it, then washes on surfaces" */
  groupNote: string;
  /** A comment on the same line, e.g. "body text in apps" */
  note?: string;
}

function contextOf(stack: string[]): Context | null {
  const media = stack.find((s) => s.startsWith('@media'));
  if (media?.includes('pointer: coarse')) return 'touch';
  if (media?.includes('prefers-reduced-motion')) return 'reduced';
  const sel = stack[stack.length - 1] ?? '';
  if (/data-theme="light"/.test(sel)) return 'light';
  if (/\.dark|data-theme="dark"/.test(sel)) return 'dark';
  if (sel === ':root') return 'shared';
  return null;
}

function splitComment(text: string): [string, string] {
  const m = /^([^:.]+)[:.]\s*(.*)$/s.exec(text);
  return m ? [m[1].trim(), m[2].trim()] : [text.trim(), ''];
}

export function parseTokens(source: string): { tokens: Token[]; layer: string | null; header: string } {
  const tokens = new Map<string, Token>();
  const stack: string[] = [];
  let buf = '';
  let group = '';
  let groupNote = '';
  let lastName: string | null = null;
  let sinceDecl = ''; // text since the last declaration, to tell a trailing comment from a heading
  let header = '';
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      const text = source.slice(i + 2, end).replace(/^\s*\*\s?/gm, '').trim();
      i = end + 2;
      if (!stack.length) {
        if (!header) header = text;
        continue;
      }
      const ctx = contextOf(stack);
      if (lastName && !sinceDecl.includes('\n') && ctx) {
        const t = tokens.get(lastName);
        if (t) t.note = text;
      } else {
        [group, groupNote] = splitComment(text);
      }
      continue;
    }
    const ch = source[i];
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
      lastName = null;
    } else if (ch === '}') {
      stack.pop();
      buf = '';
      lastName = null;
    } else if (ch === ';') {
      const decl = buf.trim();
      buf = '';
      sinceDecl = '';
      const m = /^(--asc-[a-z0-9-]+)\s*:\s*([\s\S]+)$/.exec(decl);
      const ctx = contextOf(stack);
      if (m && ctx) {
        const [, name, value] = m;
        const t = tokens.get(name) ?? { name, values: {}, group, groupNote };
        t.values[ctx] = value.replace(/\s+/g, ' ').trim();
        // Dark and touch blocks have no comments: the light or shared block named the group.
        if (!tokens.has(name)) tokens.set(name, t);
        lastName = name;
      } else lastName = null;
    } else {
      buf += ch;
      sinceDecl += ch;
    }
    i++;
  }
  const layer = /@layer\s+([a-z0-9-]+)/.exec(source)?.[1] ?? null;
  return { tokens: [...tokens.values()], layer, header };
}

export const THEME = parseTokens(css);
export const tokensBy = (test: (t: Token) => boolean) => THEME.tokens.filter(test);
export const token = (name: string) => THEME.tokens.find((t) => t.name === name);

// ---------------------------------------------------------------- colour maths for contrast notes

type Rgba = [number, number, number, number];

export function parseColour(v: string): Rgba | null {
  const s = v.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(s)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const n = (k: number) => parseInt(full.slice(k, k + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(s)?.[1];
  if (rgb) {
    const p = rgb.split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  return null;
}

/** A colour laid over an opaque ground. */
export function over(top: Rgba, ground: Rgba): Rgba {
  const a = top[3];
  return [top[0] * a + ground[0] * (1 - a), top[1] * a + ground[1] * (1 - a), top[2] * a + ground[2] * (1 - a), 1];
}

const lum = ([r, g, b]: Rgba) => {
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** WCAG contrast ratio of a (possibly see-through) colour on an opaque ground. */
export function contrast(fg: Rgba, bg: Rgba): number {
  const a = lum(over(fg, bg));
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export const isColour = (v: string | undefined) => !!v && parseColour(v) !== null;
