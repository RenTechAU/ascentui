import { useEffect, useMemo, useRef, useState } from 'react';
import './ComboBox.css';

// A debounced, search-as-you-type select. Filters an already-loaded options list
// client-side — fine up to a few thousand rows (units/customers are well under
// that). If either list grows past ~5k, swap the in-memory filter for a
// `GET /admin/{units,customers}/search?q=` endpoint and feed its results in here.
//
// Renders a plain text input (so it inherits the surrounding `.ncf` input height
// and padding) plus an absolutely-positioned results menu.

export interface ComboOption {
  key: string;
  label: string;
  sub?: string;
  /** Lowercased haystack the typed query is matched against. */
  search: string;
}

export function ComboBox({
  options,
  value,
  onChange,
  placeholder,
  emptyOption,
  limit = 50,
}: {
  options: ComboOption[];
  value: string;
  onChange: (key: string) => void;
  placeholder: string;
  /** A label for a "no selection / use the default" row (value === ''). */
  emptyOption?: string;
  limit?: number;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-filter ~150ms after typing stops, not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [q]);

  // Close when clicking away.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = options.find((o) => o.key === value);
  const matches = useMemo(() => {
    const pool = debounced ? options.filter((o) => o.search.includes(debounced)) : options;
    return pool.slice(0, limit);
  }, [debounced, options, limit]);

  const pick = (key: string) => {
    onChange(key);
    setOpen(false);
    setQ('');
  };

  return (
    <div className="combo" ref={wrapRef}>
      <input
        type="text"
        className="combo-input"
        placeholder={placeholder}
        value={open ? q : (selected?.label ?? '')}
        onFocus={() => {
          setQ('');
          setOpen(true);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {/* The caret is drawn in CSS — the same one a <select> gets. */}
      <span className="combo-caret" aria-hidden />
      {open && (
        <div className="combo-menu">
          {emptyOption && (
            <button
              type="button"
              className={`combo-opt${value === '' ? ' on' : ''}`}
              onClick={() => pick('')}
            >
              <span className="combo-opt-l">{emptyOption}</span>
            </button>
          )}
          {matches.length === 0 ? (
            <div className="combo-empty">No matches</div>
          ) : (
            matches.map((o) => (
              <button
                type="button"
                key={o.key}
                className={`combo-opt${o.key === value ? ' on' : ''}`}
                onClick={() => pick(o.key)}
              >
                <span className="combo-opt-l">{o.label}</span>
                {o.sub && <span className="combo-opt-s">{o.sub}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
