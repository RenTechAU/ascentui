// "On this page": the sections of a long page, on wide screens, with the one in view marked.
// Links scroll and move focus to the section rather than changing the address, which the
// hash router uses for pages.
import { useEffect, useState, type MouseEvent } from 'react';

export interface TocItem { id: string; label: string; level?: 2 | 3 }

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = items.find((i) => seen.get(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: '-64px 0px -60% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    setActive(id);
  };
  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-head">On this page</p>
      <ul>
        {items.map((i) => (
          <li key={i.id} data-level={i.level ?? 2}>
            <a href={`#${i.id}`} onClick={go(i.id)} aria-current={active === i.id ? 'location' : undefined}>{i.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
