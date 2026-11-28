// The search palette: ⌘K or Ctrl+K anywhere, or the search box in the sidebar.
// Built on the kit's Dialog, so focus stays inside, Escape closes it and focus goes back
// to where it was. The list follows the combobox pattern: arrows move, Enter opens.
import { Dialog } from '@kit/dialog';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { search, type SearchItem } from '../nav';
import { focusMain } from '../router';

export function Palette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const chosen = useRef<string | null>(null);
  const id = useId();
  // Grouped by kind, in the order each kind first matches, so the best match still comes first.
  const groups = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const r of search(query)) map.set(r.kind, [...(map.get(r.kind) ?? []), r]);
    return [...map];
  }, [query]);
  const results = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      chosen.current = null;
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    chosen.current = item.href;
    onOpenChange(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = results.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (n) setActive((a) => (a + 1) % n);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (n) setActive((a) => (a - 1 + n) % n);
    } else if (e.key === 'Home' && e.ctrlKey) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End' && e.ctrlKey) {
      e.preventDefault();
      setActive(Math.max(0, n - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    }
  };

  // Navigate once the dialog has closed and handed focus back, then move focus to the new page.
  const onClosed = () => {
    const href = chosen.current;
    chosen.current = null;
    if (!href) return;
    if (window.location.hash !== href) window.location.hash = href;
    focusMain();
  };

  let index = 0;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Components, docs and design-system pages."
      initialFocus={input}
      onClosed={onClosed}
      className="palette"
      closeLabel="Close search"
    >
      <input
        ref={input}
        className="palette-input"
        type="text"
        role="combobox"
        aria-label="Search the site"
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={results.length ? `${id}-${active}` : undefined}
        placeholder="Type a name, such as table or colors"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <ul ref={list} className="palette-list" id={`${id}-list`} role="listbox" aria-label="Results">
        {groups.map(([kind, items]) => (
          <li key={kind} role="presentation">
            <div className="palette-head" id={`${id}-g-${kind.replace(/\s/g, '')}`} aria-hidden>{kind}</div>
            <ul role="group" aria-labelledby={`${id}-g-${kind.replace(/\s/g, '')}`}>
              {items.map((r) => {
                const i = index++;
                return (
                  <li
                    key={r.href}
                    id={`${id}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    className="palette-opt"
                    onPointerMove={() => i !== active && setActive(i)}
                    onClick={() => choose(r)}
                  >
                    <span className="palette-name">{r.label}</span>
                    {r.soon && <span className="soon">Soon</span>}
                    {r.hint && <span className="palette-kind">{r.hint}</span>}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <p className="palette-foot" aria-live="polite">
        {results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : `Nothing matches "${query}".`}
        <span aria-hidden> · ↑↓ to move, Enter to open, Esc to close</span>
      </p>
    </Dialog>
  );
}

/** ⌘K on a Mac, Ctrl+K elsewhere, from anywhere on the site. */
export function usePaletteShortcut(toggle: () => void) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggle]);
}

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
