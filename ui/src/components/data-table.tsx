"use client";
/**
 * DataTable: a list of records with sorting, column choices, resizing and reordering, saved
 * views, grouping, selection with bulk actions, and paging. It owns the table; your screen owns
 * the search and filters above it and passes in the rows that match.
 * Nothing is saved behind your back: column choices and views come in and go out through props.
 * useTableStorage(key) keeps them in this browser if that is all you need.
 * On narrow screens the table scrolls sideways inside its own box; the header stays in view.
 * Built from Button, IconButton, Checkbox, Select, TextField, Badge, Skeleton and EmptyState.
 */
import {
  useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent,
  type PointerEvent as ReactPointerEvent, type ReactNode,
} from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { IconButton } from "./icon-button";
import { Select } from "./select";
import { Skeleton } from "./skeleton";
import { TextField } from "./text-field";

const css = `@layer asc {
.asc-dt{display:flex;flex-direction:column;gap:var(--asc-space-8);min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);font-variant-numeric:tabular-nums}
.asc-dt__bar{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-8)}
.asc-dt__views{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-2);min-width:0}
.asc-dt__view{display:inline-flex;align-items:center}
.asc-dt__save{display:flex;align-items:center;gap:var(--asc-space-4)}
.asc-dt__save .asc-field{width:160px}
.asc-dt__tools{display:flex;align-items:center;gap:var(--asc-space-8);margin-left:auto}
.asc-dt__tools .asc-field{width:auto}
.asc-dt__cols{position:relative}
.asc-dt__menu{position:absolute;right:0;top:calc(100% + var(--asc-space-4));z-index:30;box-sizing:border-box;width:260px;max-width:calc(100vw - var(--asc-space-24));max-height:min(380px,60vh);overflow-y:auto;padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-pop)}
.asc-dt__menu[hidden]{display:none}
.asc-dt__menu-title{margin:var(--asc-space-4) 0;color:var(--asc-muted);font-size:var(--asc-text-xs);font-weight:500}
.asc-dt__menu-row{display:flex;align-items:center;gap:var(--asc-space-2)}
.asc-dt__menu-row .asc-choice{flex:1;min-width:0}
.asc-dt__menu-foot{display:flex;flex-wrap:wrap;gap:var(--asc-space-4);margin-top:var(--asc-space-4);padding-top:var(--asc-space-4);border-top:1px solid var(--asc-border)}
.asc-dt__bulk{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-8);min-height:var(--asc-control-md);padding:var(--asc-space-4) var(--asc-space-4) var(--asc-space-4) var(--asc-space-12);border-radius:var(--asc-radius);background:var(--asc-subtle-strong)}
.asc-dt__bulk-n{font-weight:500;margin-right:auto}
.asc-dt__scroll{position:relative;overflow:auto;overscroll-behavior-x:contain;border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-dt__scroll:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-dt__table{display:block;width:100%;border-collapse:collapse}
.asc-dt__head{display:block;position:sticky;top:0;z-index:2}
.asc-dt__body{display:block}
.asc-dt__row{display:grid;align-items:center;column-gap:var(--asc-space-12);box-sizing:border-box;padding:0 var(--asc-space-12);border-bottom:1px solid var(--asc-border)}
.asc-dt__body .asc-dt__row:last-child{border-bottom:0}
.asc-dt__head .asc-dt__row{min-height:var(--asc-control-lg);background:var(--asc-surface);border-bottom-color:var(--asc-border-strong)}
.asc-dt__body .asc-dt__row{min-height:calc(var(--asc-control-md) + var(--asc-space-8))}
.asc-dt__body .asc-dt__row[data-clickable]{cursor:pointer}
.asc-dt__body .asc-dt__row:hover{background:var(--asc-subtle)}
.asc-dt__body .asc-dt__row[data-selected]{background:var(--asc-subtle-strong)}
.asc-dt__body .asc-dt__row:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-dt__th{position:relative;display:flex;align-items:center;min-width:0;padding:0;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);text-align:left;white-space:nowrap;user-select:none}
.asc-dt__th[data-align="right"]{justify-content:flex-end;text-align:right}
.asc-dt__th[data-dragging]{opacity:.5}
.asc-dt__th[data-drop]{box-shadow:inset 2px 0 0 var(--asc-focus)}
.asc-dt__th-label{overflow:hidden;text-overflow:ellipsis}
.asc-dt__sort{display:inline-flex;align-items:center;gap:var(--asc-space-4);max-width:100%;min-height:var(--asc-control-sm);margin:0 calc(var(--asc-space-4) * -1);padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius-sm);background:none;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color var(--asc-duration),background-color var(--asc-duration)}
.asc-dt__sort:hover{color:var(--asc-ink);background:var(--asc-subtle-strong)}
.asc-dt__sort:focus-visible{outline:2px solid var(--asc-focus);outline-offset:0}
.asc-dt__th[aria-sort] .asc-dt__sort{color:var(--asc-ink)}
.asc-dt__arrow{width:12px;height:12px;flex:none;opacity:.35;transition:transform var(--asc-duration) var(--asc-ease),opacity var(--asc-duration)}
.asc-dt__sort:hover .asc-dt__arrow{opacity:.7}
.asc-dt__th[aria-sort] .asc-dt__arrow{opacity:1}
.asc-dt__th[aria-sort="descending"] .asc-dt__arrow{transform:rotate(180deg)}
.asc-dt__resize{position:absolute;top:0;bottom:0;right:calc(var(--asc-space-6) * -1 - 1px);z-index:1;width:var(--asc-space-12);cursor:col-resize;touch-action:none}
.asc-dt__resize::after{content:"";position:absolute;top:25%;bottom:25%;left:50%;width:2px;margin-left:-1px;border-radius:1px;background:var(--asc-border-strong);opacity:0;transition:opacity var(--asc-duration)}
.asc-dt__th:hover .asc-dt__resize::after{opacity:1}
.asc-dt__resize:hover::after,.asc-dt__resize[data-active]::after,.asc-dt__resize:focus-visible::after{background:var(--asc-focus);opacity:1}
.asc-dt__resize:focus-visible{outline:none}
.asc-dt__td{display:flex;align-items:center;gap:var(--asc-space-6);min-width:0;padding:var(--asc-space-4) 0;overflow:hidden}
.asc-dt__td[data-align="right"]{justify-content:flex-end;text-align:right}
.asc-dt__sel{display:flex;align-items:center;justify-content:center}
.asc-dt__acts{justify-content:flex-end;gap:var(--asc-space-2);opacity:0;overflow:visible;transition:opacity var(--asc-duration)}
.asc-dt__row:hover .asc-dt__acts,.asc-dt__row:focus-within .asc-dt__acts,.asc-dt__row[data-selected] .asc-dt__acts{opacity:1}
@media (hover:none){.asc-dt__acts{opacity:1}}
.asc-dt__group{display:block;box-sizing:border-box;padding:0 var(--asc-space-8);background:var(--asc-subtle);border-bottom:1px solid var(--asc-border)}
.asc-dt__group-th{display:block;padding:0;text-align:left;font-weight:400}
.asc-dt__group-btn{position:sticky;left:var(--asc-space-8);display:inline-flex;align-items:center;gap:var(--asc-space-6);min-height:var(--asc-control-md);padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius-sm);background:none;color:var(--asc-ink);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);cursor:pointer}
.asc-dt__group-btn:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-dt__group-btn svg{width:12px;height:12px;color:var(--asc-faint);transition:transform var(--asc-duration) var(--asc-ease)}
.asc-dt__group-btn[aria-expanded="false"] svg{transform:rotate(-90deg)}
.asc-dt__muted{color:var(--asc-muted);font-weight:400}
.asc-dt__empty{border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-dt__foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--asc-space-8);color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-dt__pages{display:flex;align-items:center;gap:var(--asc-space-2)}
.asc-dt__page{padding:0 var(--asc-space-6);color:var(--asc-ink);font-weight:500;white-space:nowrap}
.asc-dt__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
}`;

// ---------------------------------------------------------------- types

export interface Column<T> {
  /** Unique, and stable: saved views and layouts refer to columns by key */
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** A grid track: "1fr" (default), "2fr", "120px". fr columns share the room left */
  width?: string;
  /** The narrowest an fr column gets before the table scrolls sideways, in px. Default 96 */
  minWidth?: number;
  /** right for numbers and money, so the digits line up */
  align?: "left" | "right";
  /** Can be hidden from the Columns menu. Columns without it always show */
  optional?: boolean;
  /** An optional column that starts hidden */
  defaultHidden?: boolean;
  /** Makes the header sort the rows by this value. Empty values go last */
  sortValue?: (row: T) => string | number | null | undefined;
}

export type Sort = { key: string; dir: "asc" | "desc" };

export interface GroupOption<T> {
  key: string;
  label: string;
  groupOf: (row: T) => string;
}

/** A named snapshot of the columns, order, grouping and sort */
export interface SavedView {
  id: string;
  name: string;
  /** The columns it shows */
  cols: string[];
  group: string;
  sort?: Sort | null;
  order?: string[];
}

/** Everything a person can change about how the table looks */
export interface TableLayout {
  /** Columns switched off. Stored as the hidden ones, so a column you add later shows to everyone */
  hidden: string[];
  order: string[];
  /** Widths someone dragged, in px, by column key */
  widths: Record<string, number>;
  sort: Sort | null;
  group: string;
  /** The saved view in use, or "" for All */
  view: string;
}

export interface Selection {
  /** Row keys, as getRowKey returns them, turned to strings */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export type DataTableProps<T> = {
  /** What the table lists, e.g. "Cases". Names it for screen readers */
  label: string;
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
  /** Names a row for screen readers, e.g. on its checkbox: "Select CASE-1042". Default: its key */
  rowLabel?: (row: T) => string;
  /** Ways to group rows, offered in a Group menu */
  groups?: GroupOption<T>[];
  /** Opens a row. The row becomes focusable and Enter opens it too */
  onRowClick?: (row: T) => void;
  /** Turns on a checkbox column. You own the set of selected keys */
  selection?: Selection;
  /** Shown in a bar when rows are selected, e.g. an Archive button. Gets the keys and a clear function */
  bulkActions?: (keys: string[], clear: () => void) => ReactNode;
  /** Small buttons at the end of each row, shown on hover and focus (always on touch screens) */
  rowActions?: (row: T) => ReactNode;
  /** Room for rowActions: a fixed track, so every row lines up. Default "96px" */
  rowActionsWidth?: string;
  /** Shows placeholder rows while the first load runs */
  loading?: boolean;
  loadingRows?: number;
  /** When there are no rows: text for a simple message, or your own EmptyState */
  empty?: ReactNode;
  /** Rows per page. The paging bar hides when everything fits on one page */
  pageSize?: number;
  /** The box scrolls past this height, with the header kept in view. "none" lets the page scroll instead */
  maxHeight?: CSSProperties["maxHeight"];
  /** Saved views. Leave out to keep them for this visit only */
  views?: SavedView[];
  onViewsChange?: (views: SavedView[]) => void;
  /** Columns, order, widths, sort and grouping. Controlled with layout, or start from defaultLayout */
  layout?: TableLayout;
  defaultLayout?: Partial<TableLayout>;
  onLayoutChange?: (layout: TableLayout) => void;
  /** The bar above the table: views, Group and Columns. Turn it off for a small, fixed table */
  toolbar?: boolean;
  className?: string;
  style?: CSSProperties;
};

// ---------------------------------------------------------------- helpers

const MIN_COL = 48;
const FR_FLOOR = 96;
const FR = /^\s*([\d.]*)fr\s*$/;
const PX = /^\s*(\d+(?:\.\d+)?)px\s*$/;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const nf = new Intl.NumberFormat();

/** Keeps a table's views and layout in this browser's localStorage. Spread the result onto DataTable.
 *  Client-side only. If storage is blocked or full, it quietly works for this visit only */
export function useTableStorage(key: string) {
  const read = <V,>(k: string, fallback: V): V => {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as V) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode or full: keep going without saving */
    }
  };
  const [views, setViews] = useState<SavedView[]>(() => read(`asc-table:${key}:views`, []));
  const [defaultLayout] = useState<Partial<TableLayout> | undefined>(() => read(`asc-table:${key}:layout`, undefined));
  return {
    views,
    onViewsChange: (v: SavedView[]) => {
      setViews(v);
      write(`asc-table:${key}:views`, v);
    },
    defaultLayout,
    onLayoutChange: (l: TableLayout) => write(`asc-table:${key}:layout`, l),
  };
}

const Svg = ({ d, className }: { d: string; className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const I = {
  arrow: "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  chevron: "M4.5 6.5 8 10l3.5-3.5",
  columns: "M2.5 3.5h11v9h-11zM6.25 3.5v9M9.75 3.5v9",
  plus: "M8 3.5v9M3.5 8h9",
  x: "M4.5 4.5l7 7M11.5 4.5l-7 7",
  left: "M10 3.5 5.5 8l4.5 4.5",
  right: "M6 3.5 10.5 8 6 12.5",
  first: "M11.5 3.5 7 8l4.5 4.5M4.5 3.5v9",
  last: "M4.5 3.5 9 8l-4.5 4.5M11.5 3.5v9",
  up: "M3.5 10 8 5.5l4.5 4.5",
  down: "M3.5 6 8 10.5 12.5 6",
};

// ---------------------------------------------------------------- component

export function DataTable<T>({
  label, rows, columns, getRowKey, rowLabel, groups, onRowClick, selection, bulkActions, rowActions, rowActionsWidth = "96px",
  loading = false, loadingRows = 5, empty = "Nothing to show yet", pageSize = 25, maxHeight = "70vh",
  views: viewsProp, onViewsChange, layout: layoutProp, defaultLayout, onLayoutChange, toolbar = true, className, style,
}: DataTableProps<T>) {
  const uid = useId();
  const defaultHidden = useMemo(() => columns.filter((c) => c.defaultHidden).map((c) => c.key), [columns]);
  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);
  const base: TableLayout = { hidden: defaultHidden, order: defaultOrder, widths: {}, sort: null, group: "", view: "" };

  const [innerLayout, setInnerLayout] = useState<TableLayout>(() => ({ ...base, ...defaultLayout }));
  const L = layoutProp ?? innerLayout;
  const setLayout = (patch: Partial<TableLayout>) => {
    const next = { ...L, ...patch };
    if (!layoutProp) setInnerLayout(next);
    onLayoutChange?.(next);
  };
  const [innerViews, setInnerViews] = useState<SavedView[]>([]);
  const views = viewsProp ?? innerViews;
  const setViews = (v: SavedView[]) => {
    if (!viewsProp) setInnerViews(v);
    onViewsChange?.(v);
  };

  // A width being dragged lives here until the pointer lets go, then is saved once
  const [dragW, setDragW] = useState<Record<string, number> | null>(null);
  const widths = dragW ?? L.widths;
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => setCollapsed(new Set()), [L.group]);

  // ---- columns, in the reader's order. A key added since lands where it is declared
  const colByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const orderedKeys = useMemo(() => {
    const known = L.order.filter((k) => colByKey.has(k));
    return [...known, ...columns.filter((c) => !known.includes(c.key)).map((c) => c.key)];
  }, [L.order, columns, colByKey]);
  const shown = (k: string) => !colByKey.get(k)!.optional || !L.hidden.includes(k);
  const cols = orderedKeys.filter(shown).map((k) => colByKey.get(k)!);

  // ---- one grid template for the header and every row. Tracks never size to their content,
  // so every row lines up with its heading; fr columns stop at a floor and the box scrolls sideways
  const selW = "calc(var(--asc-control-sm) * .67 + var(--asc-space-4))";
  const tracks = cols.map((c) => {
    if (widths[c.key] != null) return { css: `${widths[c.key]}px`, px: widths[c.key]! };
    const w = c.width ?? "1fr";
    const fr = FR.exec(w);
    if (fr) return { css: `minmax(${c.minWidth ?? FR_FLOOR}px, ${w.trim()})`, px: c.minWidth ?? FR_FLOOR };
    const px = PX.exec(w);
    return { css: w, px: px ? Number(px[1]) : FR_FLOOR };
  });
  const actPx = PX.exec(rowActionsWidth);
  const template = [selection ? selW : null, ...tracks.map((t) => t.css), rowActions ? rowActionsWidth : null].filter(Boolean).join(" ");
  const count = tracks.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);
  const sumPx = tracks.reduce((a, t) => a + t.px, 0) + (rowActions ? (actPx ? Number(actPx[1]) : 96) : 0);
  const minWidth = `calc(${sumPx}px${selection ? ` + ${selW}` : ""} + ${count + 1} * var(--asc-space-12))`;
  const rowStyle: CSSProperties = { gridTemplateColumns: template, minWidth };

  // ---- sort, group, page: over the whole set, then a page is a window onto it
  const keyOf = (r: T) => String(getRowKey(r));
  const sortedRows = useMemo(() => {
    const col = L.sort ? colByKey.get(L.sort.key) : null;
    if (!L.sort || !col?.sortValue) return rows;
    const sv = col.sortValue;
    const dir = L.sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sv(a), bv = sv(b);
      const ae = av == null || av === "", be = bv == null || bv === "";
      if (ae || be) return ae === be ? 0 : ae ? 1 : -1;
      return (typeof av === "number" && typeof bv === "number" ? av - bv : collator.compare(String(av), String(bv))) * dir;
    });
  }, [rows, L.sort, colByKey]);

  const groupOpt = groups?.find((g) => g.key === L.group) ?? null;
  const groupOf = useMemo(() => (groupOpt ? (r: T) => groupOpt.groupOf(r) || "–" : null), [groupOpt]);
  const orderedRows = useMemo(() => {
    if (!groupOf) return sortedRows;
    return sortedRows.map((r) => ({ r, k: groupOf(r) })).sort((a, b) => collator.compare(a.k, b.k)).map((x) => x.r);
  }, [sortedRows, groupOf]);
  const groupTotals = useMemo(() => {
    if (!groupOf) return null;
    const m = new Map<string, number>();
    for (const r of orderedRows) m.set(groupOf(r), (m.get(groupOf(r)) ?? 0) + 1);
    return m;
  }, [orderedRows, groupOf]);

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => (orderedRows.length <= pageSize ? orderedRows : orderedRows.slice((current - 1) * pageSize, current * pageSize)),
    [orderedRows, current, pageSize],
  );
  // A new search is a new question, answered from page 1. One row in or out (a save, an archive) is
  // an edit to the list you were reading, and keeps your page
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
  useEffect(() => setPage(1), [L.sort?.key, L.sort?.dir, L.group]);
  const scroller = useRef<HTMLDivElement>(null);
  const goTo = (p: number) => {
    setPage(p);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  // ---- selection. "Select all" means the rows on this page: ticking a box while looking at 25 rows
  // must never select 5,000. Selection survives paging, so more than a page is still possible
  const pageKeys = pageRows.map(keyOf);
  const onPage = selection ? pageKeys.filter((k) => selection.selected.has(k)).length : 0;
  const allOnPage = pageKeys.length > 0 && onPage === pageKeys.length;
  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    for (const k of pageKeys) allOnPage ? next.delete(k) : next.add(k);
    selection.onChange(next);
  };
  const toggleRow = (k: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (!next.delete(k)) next.add(k);
    selection.onChange(next);
  };

  // ---- changes to the layout. Any change leaves the saved view, which is a snapshot
  const toggleSort = (c: Column<T>) => {
    const s = L.sort;
    setLayout({ view: "", sort: s?.key !== c.key ? { key: c.key, dir: "asc" } : s.dir === "asc" ? { key: c.key, dir: "desc" } : null });
  };
  const toggleCol = (k: string) => setLayout({ view: "", hidden: L.hidden.includes(k) ? L.hidden.filter((x) => x !== k) : [...L.hidden, k] });
  const moveCol = (k: string, by: -1 | 1) => {
    const next = [...orderedKeys];
    const i = next.indexOf(k);
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setLayout({ view: "", order: next });
  };
  const dropCol = (target: string) => {
    setDropKey(null);
    if (!dragKey || dragKey === target) return setDragKey(null);
    const next = orderedKeys.filter((k) => k !== dragKey);
    next.splice(next.indexOf(target), 0, dragKey);
    setLayout({ view: "", order: next });
    setDragKey(null);
  };
  const clearView = () => setLayout({ view: "", hidden: defaultHidden, group: "", sort: null, order: defaultOrder });
  const applyView = (v: SavedView) =>
    setLayout({
      view: v.id,
      // A view names what it shows, so a column added since it was saved stays off in it
      hidden: columns.filter((c) => c.optional && !v.cols.includes(c.key)).map((c) => c.key),
      group: v.group,
      sort: v.sort ?? null,
      order: v.order ?? defaultOrder,
    });
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState("");
  const saveRef = useRef<HTMLButtonElement>(null);
  const saveView = (e: FormEvent) => {
    e.preventDefault();
    const name = viewName.trim();
    if (!name) return;
    const v: SavedView = { id: `v${Date.now().toString(36)}`, name, cols: cols.map((c) => c.key), group: L.group, sort: L.sort, order: orderedKeys };
    setViews([...views, v]);
    setLayout({ view: v.id });
    setNaming(false);
    setViewName("");
  };
  const deleteView = (id: string) => {
    setViews(views.filter((v) => v.id !== id));
    if (L.view === id) clearView();
  };

  // ---- resize: pointer capture, so the drag keeps going off the handle; arrows from the keyboard
  const startResize = (e: ReactPointerEvent<HTMLSpanElement>, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = e.currentTarget.parentElement;
    if (!cell) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    resizing.current = { key, startX: e.clientX, startW: cell.getBoundingClientRect().width };
    setDragW({ ...L.widths });
  };
  const moveResize = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const r = resizing.current;
    if (!r) return;
    const w = Math.round(Math.max(MIN_COL, r.startW + e.clientX - r.startX));
    setDragW((prev) => (prev?.[r.key] === w ? prev : { ...prev, [r.key]: w }));
  };
  const endResize = () => {
    if (!resizing.current) return;
    resizing.current = null;
    if (dragW) setLayout({ widths: dragW });
    setDragW(null);
  };
  const keyResize = (e: KeyboardEvent<HTMLSpanElement>, key: string) => {
    const step = e.shiftKey ? 48 : 16;
    const now = widths[key] ?? e.currentTarget.parentElement?.getBoundingClientRect().width ?? FR_FLOOR;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setLayout({ widths: { ...L.widths, [key]: Math.round(Math.max(MIN_COL, now + (e.key === "ArrowRight" ? step : -step))) } });
    } else if (e.key === "Enter" || e.key === "Delete") {
      e.preventDefault();
      resetWidth(key);
    }
  };
  const resetWidth = (key: string) => {
    const { [key]: _gone, ...rest } = L.widths;
    setLayout({ widths: rest });
  };

  // ---- the Columns menu: closes on Escape and on a click outside
  const [menu, setMenu] = useState(false);
  const menuWrap = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => !menuWrap.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [menu]);

  const selectedKeys = selection ? [...selection.selected] : [];
  const clearSelection = () => selection?.onChange(new Set());
  const allCols = cols.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

  // ---------------------------------------------------------------- render

  const head = (
    <tr role="row" className="asc-dt__row" style={rowStyle}>
      {selection && (
        <th role="columnheader" className="asc-dt__th asc-dt__sel" scope="col">
          <Checkbox
            aria-label={allOnPage ? "Clear selection on this page" : "Select all rows on this page"}
            checked={allOnPage}
            indeterminate={onPage > 0 && !allOnPage}
            onChange={toggleAll}
            disabled={!pageRows.length}
          />
        </th>
      )}
      {cols.map((c) => {
        const sorted = L.sort?.key === c.key ? L.sort.dir : null;
        return (
          <th
            key={c.key}
            role="columnheader"
            scope="col"
            className="asc-dt__th"
            data-align={c.align}
            aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
            data-dragging={dragKey === c.key || undefined}
            data-drop={(dropKey === c.key && dragKey !== c.key) || undefined}
            draggable
            onDragStart={(e) => {
              if (resizing.current) return e.preventDefault();
              e.dataTransfer.effectAllowed = "move";
              setDragKey(c.key);
            }}
            onDragOver={(e) => {
              if (!dragKey) return;
              e.preventDefault();
              if (dropKey !== c.key) setDropKey(c.key);
            }}
            onDragLeave={() => dropKey === c.key && setDropKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              dropCol(c.key);
            }}
            onDragEnd={() => {
              setDragKey(null);
              setDropKey(null);
            }}
          >
            {c.sortValue ? (
              <button type="button" className="asc-dt__sort" onClick={() => toggleSort(c)}>
                <span className="asc-dt__th-label">{c.label}</span>
                <Svg d={I.arrow} className="asc-dt__arrow" />
                <span className="asc-dt__vh">
                  {sorted === "asc" ? ", sorted up. Select to sort down" : sorted === "desc" ? ", sorted down. Select to stop sorting" : ", select to sort"}
                </span>
              </button>
            ) : (
              <span className="asc-dt__th-label">{c.label}</span>
            )}
            <span
              className="asc-dt__resize"
              role="separator"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label={`Resize ${c.label}. Left and right arrows change the width, Enter resets it`}
              aria-valuenow={widths[c.key]}
              aria-valuemin={MIN_COL}
              data-active={resizing.current?.key === c.key || undefined}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onPointerDown={(e) => startResize(e, c.key)}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                resetWidth(c.key);
              }}
              onKeyDown={(e) => keyResize(e, c.key)}
            />
          </th>
        );
      })}
      {rowActions && <th role="columnheader" className="asc-dt__th" scope="col"><span className="asc-dt__vh">Actions</span></th>}
    </tr>
  );

  const renderRow = (r: T) => {
    const k = keyOf(r);
    const isSel = !!selection?.selected.has(k);
    return (
      <tr
        key={k}
        role="row"
        className="asc-dt__row"
        style={rowStyle}
        data-selected={isSel || undefined}
        aria-selected={selection ? isSel : undefined}
        data-clickable={onRowClick ? true : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onClick={onRowClick ? () => onRowClick(r) : undefined}
        onKeyDown={onRowClick ? (e) => e.target === e.currentTarget && e.key === "Enter" && onRowClick(r) : undefined}
      >
        {selection && (
          <td role="cell" className="asc-dt__td asc-dt__sel" onClick={(e) => e.stopPropagation()}>
            <Checkbox aria-label={`Select ${rowLabel ? rowLabel(r) : k}`} checked={isSel} onChange={() => toggleRow(k)} />
          </td>
        )}
        {cols.map((c) => (
          <td key={c.key} role="cell" className="asc-dt__td" data-align={c.align}>
            {c.render(r)}
          </td>
        ))}
        {rowActions && (
          <td role="cell" className="asc-dt__td asc-dt__acts" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            {rowActions(r)}
          </td>
        )}
      </tr>
    );
  };

  // This page's runs of each group, in order. Only the first can have started on an earlier page
  const grouped = useMemo(() => {
    if (!groupOf) return null;
    const m = new Map<string, T[]>();
    for (const r of pageRows) {
      const k = groupOf(r);
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
    }
    const start = (current - 1) * pageSize;
    const prev = start > 0 ? orderedRows[start - 1] : undefined;
    const continued = prev !== undefined ? groupOf(prev) : null;
    return [...m.entries()].map(([name, gr]) => ({ name, rows: gr, continued: name === continued }));
  }, [pageRows, groupOf, orderedRows, current, pageSize]);

  const body = loading ? (
    Array.from({ length: loadingRows }, (_, i) => (
      <tr key={`sk${i}`} role="row" className="asc-dt__row" style={rowStyle} aria-hidden="true">
        {Array.from({ length: allCols }, (_, j) => (
          <td key={j} role="cell" className="asc-dt__td">
            <Skeleton width={j === 0 && selection ? 14 : `${55 + ((i * 7 + j * 13) % 35)}%`} height={10} />
          </td>
        ))}
      </tr>
    ))
  ) : grouped ? (
    grouped.map(({ name, rows: gr, continued }) => {
      const open = !collapsed.has(name);
      return [
        <tr key={`g:${name}`} role="row" className="asc-dt__group" style={{ minWidth }}>
          <th role="rowheader" scope="colgroup" colSpan={allCols} className="asc-dt__group-th">
            <button
              type="button"
              className="asc-dt__group-btn"
              aria-expanded={open}
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (!next.delete(name)) next.add(name);
                  return next;
                })
              }
            >
              <Svg d={I.chevron} />
              {name}
              {continued && <span className="asc-dt__muted">continued</span>}
              <Badge size="sm">{nf.format(groupTotals?.get(name) ?? gr.length)}</Badge>
            </button>
          </th>
        </tr>,
        ...(open ? gr.map(renderRow) : []),
      ];
    })
  ) : (
    pageRows.map(renderRow)
  );

  const activeView = views.find((v) => v.id === L.view);

  return (
    <div className={["asc-dt", className].filter(Boolean).join(" ")} style={style}>
      <style href="asc-data-table" precedence="asc">{css}</style>
      {toolbar && <div className="asc-dt__bar">
        {(
          <div className="asc-dt__views" role="group" aria-label="Views">
            <Button size="sm" variant={L.view ? "ghost" : "secondary"} aria-pressed={!L.view} onClick={clearView}>All</Button>
            {views.map((v) => (
              <span key={v.id} className="asc-dt__view">
                <Button size="sm" variant={L.view === v.id ? "secondary" : "ghost"} aria-pressed={L.view === v.id} onClick={() => applyView(v)}>
                  {v.name}
                </Button>
                {L.view === v.id && <IconButton size="sm" icon={<Svg d={I.x} />} label={`Delete view ${v.name}`} onClick={() => deleteView(v.id)} />}
              </span>
            ))}
            {naming ? (
              <form
                className="asc-dt__save"
                onSubmit={saveView}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") return;
                  e.preventDefault();
                  e.stopPropagation();
                  setNaming(false);
                  requestAnimationFrame(() => saveRef.current?.focus());
                }}
              >
                <TextField size="sm" label="View name" hideLabel placeholder="Name this view" autoFocus value={viewName} onChange={(e) => setViewName(e.target.value)} />
                <Button size="sm" type="submit" disabled={!viewName.trim()}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>Cancel</Button>
              </form>
            ) : (
              <Button ref={saveRef} size="sm" variant="ghost" icon={<Svg d={I.plus} />} onClick={() => setNaming(true)}>
                {activeView ? "Save as new view" : "Save view"}
              </Button>
            )}
          </div>
        )}
        <div className="asc-dt__tools">
          {groups && groups.length > 0 && (
            <Select
              size="sm"
              label="Group rows by"
              hideLabel
              prefix="Group"
              value={L.group}
              onChange={(e) => setLayout({ view: "", group: e.target.value })}
              options={[{ value: "", label: "None" }, ...groups.map((g) => ({ value: g.key, label: g.label }))]}
            />
          )}
          <div className="asc-dt__cols" ref={menuWrap}>
            <Button
              ref={menuBtn}
              size="sm"
              variant="secondary"
              icon={<Svg d={I.columns} />}
              aria-expanded={menu}
              aria-controls={`${uid}-cols`}
              onClick={() => setMenu((m) => !m)}
            >
              Columns
            </Button>
            <div
              id={`${uid}-cols`}
              className="asc-dt__menu"
              role="group"
              aria-label="Choose and order columns"
              hidden={!menu}
              onKeyDown={(e) => {
                if (e.key !== "Escape") return;
                e.stopPropagation();
                setMenu(false);
                menuBtn.current?.focus();
              }}
            >
              <p className="asc-dt__menu-title">Show and order columns</p>
              {orderedKeys.map((k, i) => {
                const c = colByKey.get(k)!;
                return (
                  <div key={k} className="asc-dt__menu-row">
                    <Checkbox label={c.label} checked={shown(k)} disabled={!c.optional} onChange={() => toggleCol(k)} />
                    <IconButton size="sm" tooltip={false} icon={<Svg d={I.up} />} label={`Move ${c.label} earlier`} disabled={i === 0} onClick={() => moveCol(k, -1)} />
                    <IconButton size="sm" tooltip={false} icon={<Svg d={I.down} />} label={`Move ${c.label} later`} disabled={i === orderedKeys.length - 1} onClick={() => moveCol(k, 1)} />
                  </div>
                );
              })}
              <div className="asc-dt__menu-foot">
                <Button size="sm" variant="ghost" onClick={() => setLayout({ view: "", hidden: defaultHidden, order: defaultOrder })}>Reset columns</Button>
                {Object.keys(L.widths).length > 0 && <Button size="sm" variant="ghost" onClick={() => setLayout({ widths: {} })}>Reset widths</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>}

      {selection && bulkActions && selectedKeys.length > 0 && (
        <div className="asc-dt__bulk" role="region" aria-label="Selected rows">
          <span className="asc-dt__bulk-n">{nf.format(selectedKeys.length)} selected</span>
          {bulkActions(selectedKeys, clearSelection)}
          <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <div className="asc-dt__empty">
          {typeof empty === "string" || typeof empty === "number" ? <EmptyState size="sm" title={empty} /> : empty}
        </div>
      ) : (
        <div className="asc-dt__scroll" ref={scroller} style={{ maxHeight }} tabIndex={0} role="region" aria-label={`${label}, scrollable`}>
          <table className="asc-dt__table" role="table" aria-label={label} aria-busy={loading || undefined} aria-rowcount={loading ? undefined : orderedRows.length + 1}>
            <thead role="rowgroup" className="asc-dt__head">{head}</thead>
            <tbody role="rowgroup" className="asc-dt__body">{body}</tbody>
          </table>
          {loading && <span className="asc-dt__vh" role="status">Loading {label.toLowerCase()}</span>}
        </div>
      )}

      {!loading && pageCount > 1 && (
        <div className="asc-dt__foot">
          <span aria-live="polite">
            {nf.format((current - 1) * pageSize + 1)}–{nf.format(Math.min(current * pageSize, orderedRows.length))} of {nf.format(orderedRows.length)}
          </span>
          <nav className="asc-dt__pages" aria-label={`${label} pages`}>
            <IconButton size="sm" icon={<Svg d={I.first} />} label="First page" disabled={current === 1} onClick={() => goTo(1)} />
            <IconButton size="sm" icon={<Svg d={I.left} />} label="Previous page" disabled={current === 1} onClick={() => goTo(current - 1)} />
            <span className="asc-dt__page">Page {nf.format(current)} of {nf.format(pageCount)}</span>
            <IconButton size="sm" icon={<Svg d={I.right} />} label="Next page" disabled={current === pageCount} onClick={() => goTo(current + 1)} />
            <IconButton size="sm" icon={<Svg d={I.last} />} label="Last page" disabled={current === pageCount} onClick={() => goTo(pageCount)} />
          </nav>
        </div>
      )}
    </div>
  );
}
