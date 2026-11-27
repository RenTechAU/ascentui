"use client";
/**
 * ComboBox: pick one from a long list by typing to search, such as a customer or a product.
 * Follows the WAI-ARIA combobox pattern: arrow keys move, Enter picks, Escape closes. Can offer
 * "Create …" when nothing matches. Built on the form kit (./field).
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Field, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-combo{position:relative;min-width:0}
.asc-combo .asc-input__el{padding-right:calc(var(--px) + 20px);text-overflow:ellipsis}
.asc-combo__caret{position:absolute;right:0;top:0;bottom:0;display:grid;place-items:center;width:calc(var(--px) * 2 + 14px);color:var(--asc-faint);cursor:pointer}
.asc-combo__caret svg{width:14px;height:14px;transition:transform var(--asc-duration) var(--asc-ease)}
.asc-combo[data-open] .asc-combo__caret svg{transform:rotate(180deg)}
.asc-combo__pop{position:absolute;left:0;right:0;top:calc(100% + var(--asc-space-4));z-index:50;box-sizing:border-box;max-height:min(296px,50vh);overflow-y:auto;overscroll-behavior:contain;padding:var(--asc-space-4);border-radius:var(--asc-radius-lg);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-pop);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-combo__pop[data-side="top"]{top:auto;bottom:calc(100% + var(--asc-space-4))}
.asc-combo__pop[hidden]{display:none}
.asc-combo__list{margin:0;padding:0;list-style:none}
.asc-combo__opt{display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;min-height:var(--asc-control-md);padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-sm);cursor:pointer;-webkit-tap-highlight-color:transparent}
.asc-combo__opt[aria-selected="true"]{background:var(--asc-subtle-strong)}
.asc-combo__opt[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
.asc-combo__text{display:flex;flex-direction:column;flex:1;min-width:0}
.asc-combo__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-combo__desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-combo__check{width:14px;height:14px;flex:none;color:var(--asc-ink)}
.asc-combo__opt[data-create]{color:var(--asc-muted)}
.asc-combo__opt[data-create] .asc-combo__check{color:var(--asc-faint)}
.asc-combo__note{margin:0;padding:var(--asc-space-6) var(--asc-space-8);color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
}`;

export type ComboBoxOption = {
  value: string;
  label: string;
  /** A second muted line, e.g. a suburb or an email. It is searched too */
  description?: string;
  /** Other words that should find this option, e.g. a phone number or an old name */
  keywords?: string;
  disabled?: boolean;
};

export type ComboBoxProps = FieldParts & {
  options: ComboBoxOption[];
  /** The chosen option's value, or null for none */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null, option: ComboBoxOption | null) => void;
  /** Offer "Create …" for text that matches nothing. You add the option and select it */
  onCreate?: (text: string) => void;
  /** The words on the create option. Defaults to: Create "text" */
  createLabel?: (text: string) => ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  /** Sends the value with a form, in a hidden input */
  name?: string;
  id?: string;
  /** How many matches to show at once. The rest are found by typing more */
  limit?: number;
  /** Shown when nothing matches */
  emptyText?: ReactNode;
  autoFocus?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

/** Lower case, accents removed, so "jose" finds "José" */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4.5 6.5 8 10l3.5-3.5" />
  </svg>
);
const Check = ({ plus }: { plus?: boolean }) => (
  <svg className="asc-combo__check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={plus ? "M8 3.5v9M3.5 8h9" : "M3.5 8.5 6.5 11.5 12.5 5"} />
  </svg>
);

type Row = { option: ComboBoxOption; create?: false } | { option: null; create: true };

export function ComboBox({
  label, description, error, hideLabel, required, options, value, defaultValue = null, onChange, onCreate,
  createLabel = (t) => `Create "${t}"`, placeholder, disabled, size = "md", name, id, limit = 50,
  emptyText = "No matches", autoFocus, className, style, "aria-label": ariaLabel,
}: ComboBoxProps) {
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const selected = options.find((o) => o.value === current) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null: showing the chosen label, not a search
  const [active, setActive] = useState(-1);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const q = fold(query?.trim() ?? "");
  const matches = useMemo(() => {
    if (!q) return options;
    const hits = options.filter((o) => fold(`${o.label} ${o.description ?? ""} ${o.keywords ?? ""}`).includes(q));
    // Labels that start with the search come first
    return hits.sort((a, b) => Number(fold(b.label).startsWith(q)) - Number(fold(a.label).startsWith(q)));
  }, [options, q]);
  const shown = matches.slice(0, limit);
  const text = query?.trim() ?? "";
  const canCreate = !!onCreate && text !== "" && !options.some((o) => fold(o.label) === fold(text));
  const rows: Row[] = [...shown.map((option) => ({ option })), ...(canCreate ? [{ option: null, create: true as const }] : [])];
  const enabled = (i: number) => rows[i] && !rows[i]!.option?.disabled;

  const openList = (at?: "first" | "last") => {
    if (disabled) return;
    const rect = wrap.current?.getBoundingClientRect();
    if (rect) setSide(rect.bottom + 300 > innerHeight && rect.top > 300 ? "top" : "bottom");
    setOpen(true);
    const sel = rows.findIndex((r) => r.option && r.option.value === current);
    setActive(sel >= 0 ? sel : at === "last" ? rows.length - 1 : rows.findIndex((_, i) => enabled(i)));
  };
  const close = () => {
    setOpen(false);
    setQuery(null);
    setActive(-1);
  };
  const choose = (row: Row | undefined) => {
    if (!row) return;
    if (row.create) onCreate?.(text);
    else if (!row.option.disabled) {
      if (value === undefined) setInner(row.option.value);
      onChange?.(row.option.value, row.option);
    } else return;
    close();
  };
  const move = (by: 1 | -1) => {
    if (!rows.length) return;
    let i = active;
    for (let n = 0; n < rows.length; n++) {
      i = (i + by + rows.length) % rows.length;
      if (enabled(i)) return setActive(i);
    }
  };

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList(e.key === "ArrowUp" ? "last" : "first");
      else if (!e.altKey) move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(rows[active]);
    } else if (e.key === "Escape" && (open || query != null)) {
      // Handled here, so a dialog around the field does not close too
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  // Typing a new search starts again from the top match
  useEffect(() => {
    if (open && query != null) setActive(rows.findIndex((_, i) => enabled(i)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  // Keep the active option in view
  useLayoutEffect(() => {
    if (open && active >= 0) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  // Close on a click outside
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && close();
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const listId = useId();
  const optId = (i: number) => `${listId}-opt-${i}`;

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-combo-box" precedence="asc">{css}</style>
          <div className="asc-combo" ref={wrap} data-open={open || undefined}>
            <InputBox controlId={c.id} size={size} invalid={!!c["aria-invalid"]} disabled={disabled}>
              <input
                {...c}
                ref={input}
                type="text"
                role="combobox"
                aria-label={ariaLabel}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={`${c.id}-list`}
                aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus={autoFocus}
                className="asc-input__el"
                placeholder={placeholder}
                disabled={disabled}
                value={query ?? selected?.label ?? ""}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!open) openList();
                }}
                onClick={() => !open && openList()}
                onKeyDown={keys}
                onBlur={() => {
                  // Clearing the text and leaving the field clears the choice
                  if (query != null && query.trim() === "" && current != null) {
                    if (value === undefined) setInner(null);
                    onChange?.(null, null);
                  }
                  close();
                }}
              />
              <span
                className="asc-combo__caret"
                aria-hidden
                onMouseDown={(e) => {
                  e.preventDefault();
                  input.current?.focus();
                  open ? close() : openList();
                }}
              >
                <Chevron />
              </span>
            </InputBox>
            <div className="asc-combo__pop" data-side={side} hidden={!open}>
              <ul className="asc-combo__list" role="listbox" id={`${c.id}-list`} ref={list} aria-label={typeof label === "string" ? label : ariaLabel}>
                {rows.map((r, i) => (
                  <li
                    key={r.option ? r.option.value : "create"}
                    id={optId(i)}
                    role="option"
                    className="asc-combo__opt"
                    aria-selected={i === active}
                    aria-disabled={r.option?.disabled || undefined}
                    data-create={r.create || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerMove={() => i !== active && enabled(i) && setActive(i)}
                    onClick={() => choose(r)}
                  >
                    {r.option ? (
                      <>
                        <span className="asc-combo__text">
                          <span className="asc-combo__label">{r.option.label}</span>
                          {r.option.description && <span className="asc-combo__desc">{r.option.description}</span>}
                        </span>
                        {r.option.value === current && <Check />}
                      </>
                    ) : (
                      <>
                        <Check plus />
                        <span className="asc-combo__text"><span className="asc-combo__label">{createLabel(text)}</span></span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {rows.length === 0 && <p className="asc-combo__note">{emptyText}</p>}
              {matches.length > shown.length && (
                <p className="asc-combo__note">Showing {shown.length} of {matches.length}. Keep typing to narrow it down.</p>
              )}
            </div>
            <span className="asc-vh" role="status">
              {open && query != null ? (matches.length === 0 ? "No matches" : `${matches.length} ${matches.length === 1 ? "match" : "matches"}`) : ""}
            </span>
            {name && <input type="hidden" name={name} value={current ?? ""} />}
          </div>
        </>
      )}
    </Field>
  );
}
