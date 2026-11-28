"use client";
/**
 * DataTable: a list of records with sorting and paging, loading and empty states, and row opening.
 * It owns the table; your screen owns the search and filters above it and passes in the rows that match.
 * Opening a record: onOpen fires on a click on the row, or on Enter or Space while the row has focus.
 * The arrow keys move between rows. openId marks the row whose record is open, say in a side panel,
 * so it stays marked while the panel shows it. Rows carry data-row-id, and focusTableRow(id) puts
 * focus back on a row when the panel closes.
 * On narrow screens the table scrolls sideways inside its own box; the header stays in view.
 * Built from IconButton, Skeleton and EmptyState.
 * The parts below "shared with the Data Grid" are exported for the Pro Data Grid, which builds on them.
 */
import {
  useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode,
} from "react";
import { EmptyState } from "./empty-state";
import { IconButton } from "./icon-button";
import { Skeleton } from "./skeleton";

const css = `@layer asc {
.asc-dt{display:flex;flex-direction:column;gap:var(--asc-space-8);min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);font-variant-numeric:tabular-nums}
.asc-dt__scroll{position:relative;overflow:auto;overscroll-behavior-x:contain;border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-dt__scroll:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-dt__table{display:block;width:100%;border-collapse:collapse}
.asc-dt__head{display:block;position:sticky;top:0;z-index:2}
.asc-dt__body{display:block}
.asc-dt__row{display:grid;align-items:center;column-gap:var(--asc-space-12);box-sizing:border-box;padding:0 var(--asc-space-12);border-bottom:1px solid var(--asc-border)}
.asc-dt__body .asc-dt__row:last-child{border-bottom:0}
.asc-dt__head .asc-dt__row{min-height:var(--asc-control-lg);background:var(--asc-surface);border-bottom-color:var(--asc-border-strong)}
.asc-dt__body .asc-dt__row{min-height:calc(var(--asc-control-md) + var(--asc-space-8));transition:background-color var(--asc-duration),box-shadow var(--asc-duration)}
.asc-dt__body .asc-dt__row[data-clickable]{cursor:pointer}
.asc-dt__body .asc-dt__row:hover{background:var(--asc-subtle)}
.asc-dt__body .asc-dt__row[aria-current="true"]{background:color-mix(in srgb,var(--asc-primary) 9%,var(--asc-surface));box-shadow:inset 3px 0 0 var(--asc-primary)}
.asc-dt__body .asc-dt__row:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-dt__th{position:relative;display:flex;align-items:center;min-width:0;padding:0;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);text-align:left;white-space:nowrap;user-select:none}
.asc-dt__th[data-align="right"]{justify-content:flex-end;text-align:right}
.asc-dt__th-label{overflow:hidden;text-overflow:ellipsis}
.asc-dt__sort{display:inline-flex;align-items:center;gap:var(--asc-space-4);max-width:100%;min-height:var(--asc-control-md);margin:0 calc(var(--asc-space-4) * -1);padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius-sm);background:none;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color var(--asc-duration),background-color var(--asc-duration)}
.asc-dt__sort:hover{color:var(--asc-ink);background:var(--asc-subtle-strong)}
.asc-dt__sort:focus-visible{outline:2px solid var(--asc-focus);outline-offset:0}
.asc-dt__th[aria-sort] .asc-dt__sort{color:var(--asc-ink)}
.asc-dt__arrow{width:12px;height:12px;flex:none;opacity:.35;transition:transform var(--asc-duration) var(--asc-ease),opacity var(--asc-duration)}
.asc-dt__sort:hover .asc-dt__arrow{opacity:.7}
.asc-dt__th[aria-sort] .asc-dt__arrow{opacity:1}
.asc-dt__th[aria-sort="descending"] .asc-dt__arrow{transform:rotate(180deg)}
.asc-dt__td{display:flex;align-items:center;gap:var(--asc-space-6);min-width:0;padding:var(--asc-space-4) 0;overflow:hidden}
.asc-dt__td[data-align="right"]{justify-content:flex-end;text-align:right}
.asc-dt__empty{border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-dt__foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--asc-space-8);color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-dt__pages{display:flex;align-items:center;gap:var(--asc-space-2)}
.asc-dt__page{padding:0 var(--asc-space-6);color:var(--asc-ink);font-weight:500;white-space:nowrap}
@media (pointer:coarse){.asc-dt__pages .asc-btn[data-size]{--h:var(--asc-control-md)}}
.asc-dt__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
}`;

// ---------------------------------------------------------------- types

export interface Column<T> {
  /** Unique and stable */
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** A grid track: "1fr" (default), "2fr", "120px". fr columns share the room left */
  width?: string;
  /** The narrowest an fr column gets before the table scrolls sideways, in px. Default 96 */
  minWidth?: number;
  /** right for numbers and money, so the digits line up */
  align?: "left" | "right";
  /** Makes the header sort the rows by this value. Empty values go last */
  sortValue?: (row: T) => string | number | null | undefined;
}

export type Sort = { key: string; dir: "asc" | "desc" };

export type DataTableProps<T> = {
  /** What the table lists, e.g. "Cases". Names it for screen readers */
  label: string;
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
  /** Opens a record, e.g. in a side panel. Fires on a click on the row, and on Enter or Space when it has focus.
   *  Not when the click lands on a button, link or field inside the row */
  onOpen?: (row: T) => void;
  /** The key of the row whose record is open. It is marked, and announced as current, until this changes */
  openId?: string | number | null;
  /** The sort, controlled. Or start from defaultSort and hear about changes in onSortChange */
  sort?: Sort | null;
  defaultSort?: Sort | null;
  onSortChange?: (sort: Sort | null) => void;
  /** Shows placeholder rows while the first load runs */
  loading?: boolean;
  loadingRows?: number;
  /** When there are no rows: text for a simple message, or your own EmptyState */
  empty?: ReactNode;
  /** Rows per page. The paging bar hides when everything fits on one page */
  pageSize?: number;
  /** The box scrolls past this height, with the header kept in view. "none" lets the page scroll instead */
  maxHeight?: CSSProperties["maxHeight"];
  className?: string;
  style?: CSSProperties;
};

// ---------------------------------------------------------------- shared with the Data Grid

export const MIN_COL = 48;
export const FR_FLOOR = 96;
const FR = /^\s*([\d.]*)fr\s*$/;
const PX = /^\s*(\d+(?:\.\d+)?)px\s*$/;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const nf = new Intl.NumberFormat();

/** The table's own styles. The Data Grid renders them too, so both share one sheet */
export function DataTableStyles() {
  return <style href="asc-data-table" precedence="asc">{css}</style>;
}

export const TableIcon = ({ d, className }: { d: string; className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
export const TABLE_ICONS = {
  arrow: "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  left: "M10 3.5 5.5 8l4.5 4.5",
  right: "M6 3.5 10.5 8 6 12.5",
  first: "M11.5 3.5 7 8l4.5 4.5M4.5 3.5v9",
  last: "M4.5 3.5 9 8l-4.5 4.5M11.5 3.5v9",
};

/** Sorts a copy of rows by one column. Empty values always go last */
export function sortRows<T>(rows: T[], col: Column<T> | undefined, dir: Sort["dir"] | undefined): T[] {
  if (!col?.sortValue || !dir) return rows;
  const sv = col.sortValue;
  const d = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = sv(a), bv = sv(b);
    const ae = av == null || av === "", be = bv == null || bv === "";
    if (ae || be) return ae === be ? 0 : ae ? 1 : -1;
    return (typeof av === "number" && typeof bv === "number" ? av - bv : collator.compare(String(av), String(bv))) * d;
  });
}

/** Up, then down, then off */
export const nextSort = (s: Sort | null | undefined, key: string): Sort | null =>
  s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null;

/** A column's grid track, and the px it needs at least. A dragged width wins over the declared one */
export function columnTrack(c: { width?: string; minWidth?: number }, dragged?: number): { css: string; px: number } {
  if (dragged != null) return { css: `${dragged}px`, px: dragged };
  const w = c.width ?? "1fr";
  if (FR.test(w)) return { css: `minmax(${c.minWidth ?? FR_FLOOR}px, ${w.trim()})`, px: c.minWidth ?? FR_FLOOR };
  const px = PX.exec(w);
  return { css: w, px: px ? Number(px[1]) : FR_FLOOR };
}

/** One grid template for the header and every row, so every cell lines up with its heading.
 *  Tracks never size to their content; fr columns stop at a floor and the box scrolls sideways */
export function rowGrid(tracks: { css: string; px: number }[]): CSSProperties {
  const sum = tracks.reduce((a, t) => a + t.px, 0);
  return { gridTemplateColumns: tracks.map((t) => t.css).join(" "), minWidth: `calc(${sum}px + ${tracks.length + 1} * var(--asc-space-12))` };
}

/** True when a click on a row landed on a control inside it, or ended a text selection: not an "open" */
export function isInnerClick(e: MouseEvent<HTMLElement>): boolean {
  const hit = (e.target as Element).closest("button,a,input,select,textarea,label,[contenteditable],[data-no-open]");
  if (hit && hit !== e.currentTarget && e.currentTarget.contains(hit)) return true;
  return !!window.getSelection?.()?.toString();
}

/** Puts focus on a table row by its key, e.g. after the side panel showing it closes */
export function focusTableRow(id: string | number, within: ParentNode = document): boolean {
  const el = within.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(String(id))}"]`);
  el?.focus();
  return !!el;
}

/** Paging over the whole ordered list. A new search starts at page 1; one row in or out keeps your page */
export function useTablePaging<T>(rows: T[], ordered: T[], keyOf: (r: T) => string, pageSize: number, resetOn: unknown[]) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => (ordered.length <= pageSize ? ordered : ordered.slice((current - 1) * pageSize, current * pageSize)),
    [ordered, current, pageSize],
  );
  const prevKeys = useRef<Set<string> | null>(null);
  useEffect(() => {
    const next = new Set(rows.map(keyOf));
    const prev = prevKeys.current;
    prevKeys.current = next;
    if (!prev) return;
    let moved = 0;
    for (const k of next) if (!prev.has(k) && ++moved > 1) break;
    for (const k of prev) if (moved <= 1 && !next.has(k)) moved++;
    if (moved > 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), resetOn);
  return { current, pageCount, pageRows, setPage };
}

/** Roving focus over the rows: one row is in the Tab order, the arrow keys move between them.
 *  The row in the Tab order is the one last focused, else the open one, else the first */
export function useRowFocus(pageKeys: string[], openKey: string | null) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const tabKey = focusKey && pageKeys.includes(focusKey) ? focusKey : openKey && pageKeys.includes(openKey) ? openKey : (pageKeys[0] ?? null);
  /** Handles the arrow keys on a row. Returns true when it moved focus */
  const moveKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return false;
    const body = e.currentTarget.closest("tbody");
    if (!body) return false;
    const rows = [...body.querySelectorAll<HTMLElement>("[data-row-id]")];
    const i = rows.indexOf(e.currentTarget);
    const j = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : i + (e.key === "ArrowDown" ? 1 : -1);
    const to = rows[Math.max(0, Math.min(rows.length - 1, j))];
    e.preventDefault();
    if (to && to !== e.currentTarget) to.focus();
    return true;
  };
  return { tabKey, setFocusKey, moveKey };
}

/** The paging bar under a table */
export function TablePager({ label, current, pageCount, total, pageSize, goTo }: {
  label: string; current: number; pageCount: number; total: number; pageSize: number; goTo: (page: number) => void;
}) {
  return (
    <div className="asc-dt__foot">
      <span aria-live="polite">
        {nf.format((current - 1) * pageSize + 1)}–{nf.format(Math.min(current * pageSize, total))} of {nf.format(total)}
      </span>
      <nav className="asc-dt__pages" aria-label={`${label} pages`}>
        <IconButton size="sm" icon={<TableIcon d={TABLE_ICONS.first} />} label="First page" disabled={current === 1} onClick={() => goTo(1)} />
        <IconButton size="sm" icon={<TableIcon d={TABLE_ICONS.left} />} label="Previous page" disabled={current === 1} onClick={() => goTo(current - 1)} />
        <span className="asc-dt__page">Page {nf.format(current)} of {nf.format(pageCount)}</span>
        <IconButton size="sm" icon={<TableIcon d={TABLE_ICONS.right} />} label="Next page" disabled={current === pageCount} onClick={() => goTo(current + 1)} />
        <IconButton size="sm" icon={<TableIcon d={TABLE_ICONS.last} />} label="Last page" disabled={current === pageCount} onClick={() => goTo(pageCount)} />
      </nav>
    </div>
  );
}

/** A sortable heading's button and its screen reader hint */
export function SortButton({ label, sorted, onClick }: { label: string; sorted: Sort["dir"] | null; onClick: () => void }) {
  return (
    <button type="button" className="asc-dt__sort" onClick={onClick}>
      <span className="asc-dt__th-label">{label}</span>
      <TableIcon d={TABLE_ICONS.arrow} className="asc-dt__arrow" />
      <span className="asc-dt__vh">
        {sorted === "asc" ? ", sorted up. Select to sort down" : sorted === "desc" ? ", sorted down. Select to stop sorting" : ", select to sort"}
      </span>
    </button>
  );
}

export const ariaSort = (dir: Sort["dir"] | null | undefined) => (dir ? (dir === "asc" ? "ascending" : "descending") : undefined);

// ---------------------------------------------------------------- component

export function DataTable<T>({
  label, rows, columns, getRowKey, onOpen, openId, sort: sortProp, defaultSort = null, onSortChange,
  loading = false, loadingRows = 5, empty = "Nothing to show yet", pageSize = 25, maxHeight = "70vh", className, style,
}: DataTableProps<T>) {
  const [innerSort, setInnerSort] = useState<Sort | null>(defaultSort);
  const sort = sortProp !== undefined ? sortProp : innerSort;
  const setSort = (s: Sort | null) => {
    if (sortProp === undefined) setInnerSort(s);
    onSortChange?.(s);
  };

  const keyOf = (r: T) => String(getRowKey(r));
  const sorted = useMemo(() => sortRows(rows, columns.find((c) => c.key === sort?.key), sort?.dir), [rows, columns, sort]);
  const { current, pageCount, pageRows, setPage } = useTablePaging(rows, sorted, keyOf, pageSize, [sort?.key, sort?.dir]);
  const scroller = useRef<HTMLDivElement>(null);
  const goTo = (p: number) => {
    setPage(p);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  const openKey = openId == null ? null : String(openId);
  const pageKeys = pageRows.map(keyOf);
  const { tabKey, setFocusKey, moveKey } = useRowFocus(pageKeys, openKey);
  const rowStyle = rowGrid(columns.map((c) => columnTrack(c)));

  const head = (
    <tr role="row" className="asc-dt__row" style={rowStyle}>
      {columns.map((c) => {
        const dir = sort?.key === c.key ? sort.dir : null;
        return (
          <th key={c.key} role="columnheader" scope="col" className="asc-dt__th" data-align={c.align} aria-sort={ariaSort(dir)}>
            {c.sortValue ? <SortButton label={c.label} sorted={dir} onClick={() => setSort(nextSort(sort, c.key))} /> : <span className="asc-dt__th-label">{c.label}</span>}
          </th>
        );
      })}
    </tr>
  );

  const body = loading
    ? Array.from({ length: loadingRows }, (_, i) => (
        <tr key={`sk${i}`} role="row" className="asc-dt__row" style={rowStyle} aria-hidden="true">
          {columns.map((c, j) => (
            <td key={c.key} role="cell" className="asc-dt__td">
              <Skeleton width={`${55 + ((i * 7 + j * 13) % 35)}%`} height={10} />
            </td>
          ))}
        </tr>
      ))
    : pageRows.map((r) => {
        const k = keyOf(r);
        const isOpen = openKey === k;
        return (
          <tr
            key={k}
            role="row"
            className="asc-dt__row"
            style={rowStyle}
            data-row-id={k}
            aria-current={isOpen ? "true" : undefined}
            data-clickable={onOpen ? true : undefined}
            tabIndex={onOpen ? (tabKey === k ? 0 : -1) : undefined}
            onFocus={onOpen ? (e) => e.target === e.currentTarget && setFocusKey(k) : undefined}
            onClick={onOpen ? (e) => !isInnerClick(e) && onOpen(r) : undefined}
            onKeyDown={
              onOpen
                ? (e) => {
                    if (e.target !== e.currentTarget || moveKey(e)) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(r);
                    }
                  }
                : undefined
            }
          >
            {columns.map((c) => (
              <td key={c.key} role="cell" className="asc-dt__td" data-align={c.align}>
                {c.render(r)}
              </td>
            ))}
          </tr>
        );
      });

  return (
    <div className={["asc-dt", className].filter(Boolean).join(" ")} style={style}>
      <DataTableStyles />
      {!loading && rows.length === 0 ? (
        <div className="asc-dt__empty">
          {typeof empty === "string" || typeof empty === "number" ? <EmptyState size="sm" title={empty} /> : empty}
        </div>
      ) : (
        <div className="asc-dt__scroll" ref={scroller} style={{ maxHeight }} tabIndex={0} role="region" aria-label={`${label}, scrollable`}>
          <table className="asc-dt__table" role="table" aria-label={label} aria-busy={loading || undefined} aria-rowcount={loading ? undefined : sorted.length + 1}>
            <thead role="rowgroup" className="asc-dt__head">{head}</thead>
            <tbody role="rowgroup" className="asc-dt__body">{body}</tbody>
          </table>
          {loading && <span className="asc-dt__vh" role="status">Loading {label.toLowerCase()}</span>}
        </div>
      )}
      {!loading && pageCount > 1 && <TablePager label={label} current={current} pageCount={pageCount} total={sorted.length} pageSize={pageSize} goTo={goTo} />}
    </div>
  );
}
