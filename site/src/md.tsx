// A tiny markdown renderer for the docs and licence pages. It handles what those pages use:
// headings, paragraphs, bold, inline code, links, lists, tables and fenced code. Nothing else.
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/ui/code-block';

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'code'; lang: string; code: string };

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) body.push(lines[i]);
      i++;
      blocks.push({ kind: 'code', lang: fence[1], code: body.join('\n') });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      i++;
      continue;
    }
    if (line.trim().startsWith('|')) {
      const rows: string[][] = [];
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(cells(lines[i]));
      const body = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      blocks.push({ kind: 'table', head: body[0] ?? [], rows: body.slice(1) });
      continue;
    }
    const bullet = /^(\s*)([-*]|\d+\.)\s+/;
    if (bullet.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      for (; i < lines.length && bullet.test(lines[i]); i++) items.push(lines[i].replace(bullet, ''));
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    const para: string[] = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*([-*]|\d+\.)\s|\|)/.test(lines[i]); i++) para.push(lines[i].trim());
    blocks.push({ kind: 'para', text: para.join(' ') });
  }
  return blocks;
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, k) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={k}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={k}>{inline(part.slice(2, -2))}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return <a key={k} href={link[2]}>{link[1]}</a>;
    return part;
  });
}

const LANG: Record<string, string> = { bash: 'Terminal', json: 'components.json', css: 'CSS', tsx: 'TypeScript', text: 'Prompt' };

const plain = (text: string) => text.replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

/** Section headings (level 2 and 3) with ids unique on the page, for "On this page". */
export function headings(source: string): { id: string; label: string; level: 2 | 3 }[] {
  const used = new Map<string, number>();
  const out: { id: string; label: string; level: 2 | 3 }[] = [];
  for (const b of parseMarkdown(source)) {
    if (b.kind !== 'heading' || b.level === 1) continue;
    const label = plain(b.text);
    const base = 'h-' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section');
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    out.push({ id: n ? `${base}-${n + 1}` : base, label, level: b.level });
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  const ids = headings(source);
  let h = 0;
  return (
    <div className="prose">
      {parseMarkdown(source).map((b, k) => {
        switch (b.kind) {
          case 'heading': {
            const Tag = (['h1', 'h2', 'h3'] as const)[b.level - 1];
            const id = b.level === 1 ? undefined : ids[h++]?.id;
            return <Tag key={k} id={id}>{inline(b.text)}</Tag>;
          }
          case 'para':
            return <p key={k}>{inline(b.text)}</p>;
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return <Tag key={k}>{b.items.map((it, n) => <li key={n}>{inline(it)}</li>)}</Tag>;
          }
          case 'table':
            return (
              <div className="table-scroll" key={k}>
                <table>
                  <thead><tr>{b.head.map((h, n) => <th key={n}>{inline(h)}</th>)}</tr></thead>
                  <tbody>
                    {b.rows.map((r, n) => <tr key={n}>{r.map((c, m) => <td key={m}>{inline(c)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            );
          case 'code':
            return <CodeBlock key={k} code={b.code} language={b.lang || 'text'} filename={LANG[b.lang]} />;
        }
      })}
    </div>
  );
}
