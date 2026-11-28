"use client";
/**
 * DataGrid: the Data Table plus grouping, saved views, column choices (show and hide, order,
 * widths), selection with a bulk action bar, row buttons, and inline edit.
 * It owns the grid; your screen owns the search and filters above it and passes in the rows that match.
 * Nothing is saved behind your back: column choices and views come in and go out through props.
 * useTableStorage(key) keeps them in this browser if that is all you need.
 * Inline edit: a column with edit can be changed in place. Enter or a double-click starts, Enter
 * saves, Escape puts it back. validate can refuse a value; onCellEdit gets the new one, and you
 * change your rows. Nothing is fetched from inside.
 * Opening a record works as in the Data Table: onOpen on a click, Enter or Space; openId marks it.
 * AscentUI Pro. Licensed to the buyer; do not redistribute.
 * Built on the free Data Table, with Button, IconButton, Checkbox, Select, TextField and Badge.
 */
import {
  useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent,
  type PointerEvent as ReactPointerEvent, type ReactNode,
} from "react";
import { Badge } from "@ascentui/ui/components/badge";
import { Button } from "@ascentui/ui/components/button";
import { Checkbox } from "@ascentui/ui/components/checkbox";
import {
  ariaSort, columnTrack, DataTableStyles, FR_FLOOR, isInnerClick, MIN_COL, nextSort, rowGrid, SortButton, sortRows,
  TableIcon, TablePager, useRowFocus, useTablePaging, type Column, type DataTableProps, type Sort,
} from "@ascentui/ui/components/data-table";
import { EmptyState } from "@ascentui/ui/components/empty-state";
import { IconButton } from "@ascentui/ui/components/icon-button";
import { Select } from "@ascentui/ui/components/select";
import { Skeleton } from "@ascentui/ui/components/skeleton";
import { TextField } from "@ascentui/ui/components/text-field";

const css = `@layer asc {
.asc-dg__bar{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-8)}
.asc-dg__views{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-2);min-width:0}
.asc-dg__view{display:inline-flex;align-items:center}
.asc-dg__save{display:flex;align-items:center;gap:var(--asc-space-4)}
.asc-dg__save .asc-field{width:160px}
.asc-dg__tools{display:flex;align-items:center;gap:var(--asc-space-8);margin-left:auto}
.asc-dg__tools .asc-field{width:auto}
.asc-dg__cols{position:relative}
.asc-dg__menu{position:absolute;right:0;top:calc(100% + var(--asc-space-4));z-index:30;box-sizing:border-box;width:260px;max-width:calc(100vw - var(--asc-space-24));max-height:min(380px,60vh);overflow-y:auto;padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-pop)}
.asc-dg__menu[hidden]{display:none}
.asc-dg__menu-title{margin:var(--asc-space-4) 0;color:var(--asc-muted);font-size:var(--asc-text-xs);font-weight:500}
.asc-dg__menu-row{display:flex;align-items:center;gap:var(--asc-space-2)}
.asc-dg__menu-row .asc-choice{flex:1;min-width:0}
.asc-dg__menu-foot{display:flex;flex-wrap:wrap;gap:var(--asc-space-4);margin-top:var(--asc-space-4);padding-top:var(--asc-space-4);border-top:1px solid var(--asc-border)}
.asc-dg__bulk{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-8);min-height:var(--asc-control-md);padding:var(--asc-space-4) var(--asc-space-4) var(--asc-space-4) var(--asc-space-12);border-radius:var(--asc-radius);background:var(--asc-subtle-strong)}
.asc-dg__bulk-n{font-weight:500;margin-right:auto}
.asc-dg .asc-dt__body .asc-dt__row[data-selected]{background:var(--asc-subtle-strong)}
.asc-dg .asc-dt__body .asc-dt__row[data-selected][aria-current="true"]{background:color-mix(in srgb,var(--asc-primary) 14%,var(--asc-surface))}
.asc-dg__th[data-dragging]{opacity:.5}
.asc-dg__th[data-drop]{box-shadow:inset 2px 0 0 var(--asc-focus)}
.asc-dg__resize{position:absolute;top:0;bottom:0;right:calc(var(--asc-space-6) * -1 - 1px);z-index:1;width:var(--asc-space-12);cursor:col-resize;touch-action:none}
.asc-dg__resize::after{content:"";position:absolute;top:25%;bottom:25%;left:50%;width:2px;margin-left:-1px;border-radius:1px;background:var(--asc-border-strong);opacity:0;transition:opacity var(--asc-duration)}
.asc-dg__th:hover .asc-dg__resize::after{opacity:1}
.asc-dg__resize:hover::after,.asc-dg__resize[data-active]::after,.asc-dg__resize:focus-visible::after{background:var(--asc-focus);opacity:1}
.asc-dg__resize:focus-visible{outline:none}
.asc-dg__sel{display:flex;align-items:center;justify-content:center}
.asc-dg__acts{justify-content:flex-end;gap:var(--asc-space-2);opacity:0;overflow:visible;transition:opacity var(--asc-duration)}
.asc-dt__row:hover .asc-dg__acts,.asc-dt__row:focus-within .asc-dg__acts,.asc-dt__row[data-selected] .asc-dg__acts,.asc-dt__row[aria-current="true"] .asc-dg__acts{opacity:1}
@media (hover:none){.asc-dg__acts{opacity:1}}
.asc-dg__cell[data-editable]{box-sizing:border-box;align-self:stretch;margin:0 calc(var(--asc-space-6) * -1);padding:var(--asc-space-4) var(--asc-space-6);border-radius:var(--asc-radius-sm);cursor:text;transition:box-shadow var(--asc-duration)}
.asc-dg__cell[data-editable]:hover{box-shadow:inset 0 0 0 1px var(--asc-border-strong)}
.asc-dg__cell[data-editable]:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-dg__cell[data-editing]{flex-direction:column;align-items:stretch;justify-content:center;gap:var(--asc-space-2);overflow:visible;cursor:auto}
.asc-dg__cell[data-editing]:hover{box-shadow:none}
.asc-dg__input{box-sizing:border-box;width:100%;min-width:0;height:var(--asc-control-sm);margin:0;padding:0 var(--asc-space-6);border:0;border-radius:var(--asc-radius-sm);background:var(--asc-surface);box-shadow:inset 0 0 0 2px var(--asc-focus);color:var(--asc-ink);font:400 var(--asc-input-text)/1 var(--asc-font);font-variant-numeric:tabular-nums;text-align:inherit;outline:none}
.asc-dg__input[aria-invalid="true"]{box-shadow:inset 0 0 0 2px var(--asc-danger)}
.asc-dg__input[aria-busy="true"]{opacity:.6}
.asc-dg__err{margin:0;color:var(--asc-danger);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);white-space:normal}
.asc-dg__group{display:block;box-sizing:border-box;padding:0 var(--asc-space-8);background:var(--asc-subtle);border-bottom:1px solid var(--asc-border)}
.asc-dg__group-th{display:block;padding:0;text-align:left;font-weight:400}
.asc-dg__group-btn{position:sticky;left:var(--asc-space-8);display:inline-flex;align-items:center;gap:var(--asc-space-6);min-height:var(--asc-control-md);padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius-sm);background:none;color:var(--asc-ink);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);cursor:pointer}
.asc-dg__group-btn:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-dg__group-btn svg{width:12px;height:12px;color:var(--asc-faint);transition:transform var(--asc-duration) var(--asc-ease)}
.asc-dg__group-btn[aria-expanded="false"] svg{transform:rotate(-90deg)}
.asc-dg__muted{color:var(--asc-muted);font-weight:400}
}`;

// ---------------------------------------------------------------- types

/** How a cell is changed in place */
export interface CellEditor<T> {
  /** The text the editor starts from */
  value: (row: T) => string;
  /** A text field (default), a number field, or a choice from options */
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}

export interface GridColumn<T> extends Column<T> {
  /** Can be hidden from the Columns menu. Columns without it always show */
  optional?: boolean;
  /** An optional column that starts hidden */
  defaultHidden?: boolean;
  /** Makes the cell editable in place. Needs onCellEdit on the grid */
  edit?: CellEditor<T>;
}

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

/** Everything a person can change about how the grid looks */
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

export type DataGridProps<T> = Omit<DataTableProps<T>, "columns" | "sort" | "defaultSort" | "onSortChange"> & {
  columns: GridColumn<T>[];
  /** Names a row for screen readers, e.g. on its checkbox: "Select CASE-1042". Default: its key */
  rowLabel?: (row: T) => string;
  /** Ways to group rows, offered in a Group menu */
  groups?: GroupOption<T>[];
  /** Turns on a checkbox column. You own the set of selected keys */
  selection?: Selection;
  /** Shown in a bar when rows are selected, e.g. an Archive button. Gets the keys and a clear function */
  bulkActions?: (keys: string[], clear: () => void) => ReactNode;
  /** Small buttons at the end of each row, shown on hover and focus (always on touch screens) */
  rowActions?: (row: T) => ReactNode;
  /** Room for rowActions: a fixed track, so every row lines up. Default "96px" */
  rowActionsWidth?: string;
  /** Saves a cell changed in place. Change your rows to match. Return a promise to show it saving;
   *  if it rejects, the editor stays open with the error's message */
  onCellEdit?: (row: T, columnKey: string, value: string) => void | Promise<unknown>;
  /** Checks a value before it is saved. Return a short reason to refuse it, e.g. "Enter an amount" */
  validate?: (value: string, row: T, columnKey: string) => string | null | undefined;
  /** Saved views. Leave out to keep them for this visit only */
  views?: SavedView[];
  onViewsChange?: (views: SavedView[]) => void;
  /** Columns, order, widths, sort and grouping. Controlled with layout, or start from defaultLayout */
  layout?: TableLayout;
  defaultLayout?: Partial<TableLayout>;
  onLayoutChange?: (layout: TableLayout) => void;
  /** The bar above the grid: views, Group and Columns. Turn it off for a small, fixed grid */
  toolbar?: boolean;
};

// ---------------------------------------------------------------- helpers

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const nf = new Intl.NumberFormat();
const PX = /^\s*(\d+(?:\.\d+)?)px\s*$/;

/** Keeps a grid's views and layout in this browser's localStorage. Spread the result onto DataGrid.
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

const I = {
  chevron: "M4.5 6.5 8 10l3.5-3.5",
  columns: "M2.5 3.5h11v9h-11zM6.25 3.5v9M9.75 3.5v9",
  plus: "M8 3.5v9M3.5 8h9",
  x: "M4.5 4.5l7 7M11.5 4.5l-7 7",
  up: "M3.5 10 8 5.5l4.5 4.5",
  down: "M3.5 6 8 10.5 12.5 6",
};
const esc = (s: string) => CSS.escape(s);
const coarse = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

type Editing = { row: string; col: string; draft: string; error?: string; saving?: boolean };

// ---------------------------------------------------------------- component

export function DataGrid<T>({
  label, rows, columns, getRowKey, rowLabel, groups, onOpen, openId, selection, bulkActions, rowActions, rowActionsWidth = "96px",
  onCellEdit, validate, loading = false, loadingRows = 5, empty = "Nothing to show yet", pageSize = 25, maxHeight = "70vh",
  views: viewsProp, onViewsChange, layout: layoutProp, defaultLayout, onLayoutChange, toolbar = true, className, style,
}: DataGridProps<T>) {
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
  const editable = (c: GridColumn<T>) => !!(c.edit && onCellEdit);

  const actPx = PX.exec(rowActionsWidth);
  const rowStyle = rowGrid([
    ...(selection ? [{ css: "calc(var(--asc-control-sm) * .67 + var(--asc-space-4))", px: 28 }] : []),
    ...cols.map((c) => columnTrack(c, widths[c.key])),
    ...(rowActions ? [{ css: rowActionsWidth, px: actPx ? Number(actPx[1]) : 96 }] : []),
  ]);
  const minWidth = rowStyle.minWidth;

  // ---- sort, group, page: over the whole set, then a page is a window onto it
  const keyOf = (r: T) => String(getRowKey(r));
  const sortedRows = useMemo(() => sortRows(rows, L.sort ? colByKey.get(L.sort.key) : undefined, L.sort?.dir), [rows, L.sort, colByKey]);
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

  const { current, pageCount, pageRows, setPage } = useTablePaging(rows, orderedRows, keyOf, pageSize, [L.sort?.key, L.sort?.dir, L.group]);
  const scroller = useRef<HTMLDivElement>(null);
  const goTo = (p: number) => {
    setPage(p);
    if (scroller.current) scroller.current.scrollTop = 0;
  };

  const openKey = openId == null ? null : String(openId);
  const pageKeys = pageRows.map(keyOf);
  const { tabKey, setFocusKey, moveKey } = useRowFocus(pageKeys, openKey);
  const rowsFocusable = !!(onOpen || selection || onCellEdit);

  // ---- selection. "Select all" means the rows on this page: ticking a box while looking at 25 rows
  // must never select 5,000. Selection survives paging, so more than a page is still possible
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
  const resetWidth = (key: string) => {
    const { [key]: _gone, ...rest } = L.widths;
    setLayout({ widths: rest });
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

  // ---- inline edit. The grid holds only the draft; the saved value comes back in your rows
  const tableRef = useRef<HTMLTableElement>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const closing = useRef(false);
  const cellEl = (rowKey: string, colKey: string) =>
    tableRef.current?.querySelector<HTMLElement>(`[data-row-id="${esc(rowKey)}"] [data-edit-col="${esc(colKey)}"]`) ?? null;
  const focusCellLater = (rowKey: string, colKey: string) => requestAnimationFrame(() => cellEl(rowKey, colKey)?.focus());
  const rowByKey = useMemo(() => new Map(rows.map((r) => [keyOf(r), r])), [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (r: T, c: GridColumn<T>) => {
    if (!c.edit || !onCellEdit) return;
    closing.current = false;
    setEditing({ row: keyOf(r), col: c.key, draft: c.edit.value(r) });
  };
  const cancelEdit = (refocus: boolean) => {
    if (!editing) return;
    closing.current = true;
    const { row, col } = editing;
    setEditing(null);
    if (refocus) focusCellLater(row, col);
  };
  const commitEdit = async (refocus: boolean) => {
    if (!editing || editing.saving || !onCellEdit) return;
    const r = rowByKey.get(editing.row);
    const c = colByKey.get(editing.col);
    if (!r || !c?.edit) return cancelEdit(false);
    if (editing.draft === c.edit.value(r)) return cancelEdit(refocus);
    const problem = validate?.(editing.draft, r, c.key);
    if (problem) {
      setEditing({ ...editing, error: problem });
      return;
    }
    const done = onCellEdit(r, c.key, editing.draft);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      setEditing({ ...editing, error: undefined, saving: true });
      try {
        await done;
      } catch (err) {
        setEditing({ ...editing, saving: false, error: err instanceof Error && err.message ? err.message : "Couldn’t save. Try again." });
        return;
      }
    }
    closing.current = true;
    setEditing(null);
    if (refocus) focusCellLater(editing.row, editing.col);
  };

  /** Arrow keys between editable cells: left and right along the row, up and down the column */
  const cellKey = (e: KeyboardEvent<HTMLElement>, r: T, c: GridColumn<T>) => {
    if (e.target !== e.currentTarget) return;
    const rowEl = e.currentTarget.closest<HTMLElement>("[data-row-id]");
    if (!rowEl) return;
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      return startEdit(r, c);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      return rowEl.focus();
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const cells = [...rowEl.querySelectorAll<HTMLElement>("[data-edit-col]")];
      const to = cells[cells.indexOf(e.currentTarget) + (e.key === "ArrowRight" ? 1 : -1)];
      return (to ?? (e.key === "ArrowLeft" ? rowEl : null))?.focus();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const all = [...(rowEl.closest("tbody")?.querySelectorAll<HTMLElement>("[data-row-id]") ?? [])];
      const next = all[all.indexOf(rowEl) + (e.key === "ArrowDown" ? 1 : -1)];
      next?.querySelector<HTMLElement>(`[data-edit-col="${esc(c.key)}"]`)?.focus();
    }
  };

  const editor = (r: T, c: GridColumn<T>, ed: Editing) => {
    const name = `${c.label}, ${rowLabel ? rowLabel(r) : ed.row}`;
    const errId = `${uid}-err`;
    const common = {
      className: "asc-dg__input",
      "aria-label": name,
      "aria-invalid": ed.error ? true : undefined,
      "aria-describedby": ed.error ? errId : undefined,
      "aria-busy": ed.saving || undefined,
      autoFocus: true,
      value: ed.draft,
      onBlur: () => {
        if (closing.current) return;
        void commitEdit(false);
      },
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          cancelEdit(true);
        } else if (e.key === "Enter") {
          e.preventDefault();
          void commitEdit(true);
        }
      },
    };
    const change = (v: string) => {
      const problem = ed.error ? validate?.(v, r, c.key) : undefined;
      setEditing({ ...ed, draft: v, error: ed.error ? problem || undefined : undefined });
    };
    return (
      <>
        {c.edit?.type === "select" ? (
          <select {...common} onChange={(e) => change(e.target.value)} disabled={ed.saving}>
            {c.edit.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            {...common}
            type="text"
            inputMode={c.edit?.type === "number" ? "decimal" : undefined}
            readOnly={ed.saving}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => change(e.target.value)}
          />
        )}
        {ed.error && <p id={errId} className="asc-dg__err" role="alert">{ed.error}</p>}
      </>
    );
  };

  const selectedKeys = selection ? [...selection.selected] : [];
  const clearSelection = () => selection?.onChange(new Set());
  const allCols = cols.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

  // ---------------------------------------------------------------- render

  const head = (
    <tr role="row" className="asc-dt__row" style={rowStyle}>
      {selection && (
        <th role="columnheader" className="asc-dt__th asc-dg__sel" scope="col">
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
        const dir = L.sort?.key === c.key ? L.sort.dir : null;
        return (
          <th
            key={c.key}
            role="columnheader"
            scope="col"
            className="asc-dt__th asc-dg__th"
            data-align={c.align}
            aria-sort={ariaSort(dir)}
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
              <SortButton label={c.label} sorted={dir} onClick={() => setLayout({ view: "", sort: nextSort(L.sort, c.key) })} />
            ) : (
              <span className="asc-dt__th-label">{c.label}</span>
            )}
            <span
              className="asc-dg__resize"
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
    const isOpen = openKey === k;
    const editingHere = editing?.row === k;
    return (
      <tr
        key={k}
        role="row"
        className="asc-dt__row"
        style={rowStyle}
        data-row-id={k}
        data-selected={isSel || undefined}
        aria-selected={selection ? isSel : undefined}
        aria-current={isOpen ? "true" : undefined}
        data-clickable={onOpen ? true : undefined}
        tabIndex={rowsFocusable ? (tabKey === k ? 0 : -1) : undefined}
        onFocus={(e) => e.target === e.currentTarget && setFocusKey(k)}
        onClick={onOpen ? (e) => !editingHere && !isInnerClick(e) && onOpen(r) : undefined}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || moveKey(e)) return;
          if (e.key === "ArrowRight") {
            const first = e.currentTarget.querySelector<HTMLElement>("[data-edit-col]");
            if (first) {
              e.preventDefault();
              first.focus();
            }
          } else if (onOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onOpen(r);
          }
        }}
      >
        {selection && (
          <td role="cell" className="asc-dt__td asc-dg__sel" data-no-open>
            <Checkbox aria-label={`Select ${rowLabel ? rowLabel(r) : k}`} checked={isSel} onChange={() => toggleRow(k)} />
          </td>
        )}
        {cols.map((c) => {
          if (!editable(c)) {
            return (
              <td key={c.key} role="cell" className="asc-dt__td" data-align={c.align}>
                {c.render(r)}
              </td>
            );
          }
          const ed = editingHere && editing?.col === c.key ? editing : null;
          return (
            <td
              key={c.key}
              role="cell"
              className="asc-dt__td asc-dg__cell"
              data-align={c.align}
              data-editable
              data-editing={ed ? true : undefined}
              data-edit-col={c.key}
              data-no-open
              tabIndex={ed ? undefined : -1}
              aria-label={ed ? undefined : `${c.label}: ${c.edit!.value(r) || "empty"}. Press Enter to edit`}
              onDoubleClick={() => !ed && startEdit(r, c)}
              onClick={() => !ed && coarse() && startEdit(r, c)}
              onKeyDown={ed ? undefined : (e) => cellKey(e, r, c)}
            >
              {ed ? editor(r, c, ed) : c.render(r)}
            </td>
          );
        })}
        {rowActions && (
          <td role="cell" className="asc-dt__td asc-dg__acts" data-no-open onKeyDown={(e) => e.stopPropagation()}>
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
        <tr key={`g:${name}`} role="row" className="asc-dg__group" style={{ minWidth }}>
          <th role="rowheader" scope="colgroup" colSpan={allCols} className="asc-dg__group-th">
            <button
              type="button"
              className="asc-dg__group-btn"
              aria-expanded={open}
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (!next.delete(name)) next.add(name);
                  return next;
                })
              }
            >
              <TableIcon d={I.chevron} />
              {name}
              {continued && <span className="asc-dg__muted">continued</span>}
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
    <div className={["asc-dt asc-dg", className].filter(Boolean).join(" ")} style={style}>
      <DataTableStyles />
      <style href="asc-data-grid" precedence="asc">{css}</style>
      {toolbar && (
        <div className="asc-dg__bar">
          <div className="asc-dg__views" role="group" aria-label="Views">
            <Button size="sm" variant={L.view ? "ghost" : "secondary"} aria-pressed={!L.view} onClick={clearView}>All</Button>
            {views.map((v) => (
              <span key={v.id} className="asc-dg__view">
                <Button size="sm" variant={L.view === v.id ? "secondary" : "ghost"} aria-pressed={L.view === v.id} onClick={() => applyView(v)}>
                  {v.name}
                </Button>
                {L.view === v.id && <IconButton size="sm" icon={<TableIcon d={I.x} />} label={`Delete view ${v.name}`} onClick={() => deleteView(v.id)} />}
              </span>
            ))}
            {naming ? (
              <form
                className="asc-dg__save"
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
              <Button ref={saveRef} size="sm" variant="ghost" icon={<TableIcon d={I.plus} />} onClick={() => setNaming(true)}>
                {activeView ? "Save as new view" : "Save view"}
              </Button>
            )}
          </div>
          <div className="asc-dg__tools">
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
            <div className="asc-dg__cols" ref={menuWrap}>
              <Button
                ref={menuBtn}
                size="sm"
                variant="secondary"
                icon={<TableIcon d={I.columns} />}
                aria-expanded={menu}
                aria-controls={`${uid}-cols`}
                onClick={() => setMenu((m) => !m)}
              >
                Columns
              </Button>
              <div
                id={`${uid}-cols`}
                className="asc-dg__menu"
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
                <p className="asc-dg__menu-title">Show and order columns</p>
                {orderedKeys.map((k, i) => {
                  const c = colByKey.get(k)!;
                  return (
                    <div key={k} className="asc-dg__menu-row">
                      <Checkbox label={c.label} checked={shown(k)} disabled={!c.optional} onChange={() => toggleCol(k)} />
                      <IconButton size="sm" tooltip={false} icon={<TableIcon d={I.up} />} label={`Move ${c.label} earlier`} disabled={i === 0} onClick={() => moveCol(k, -1)} />
                      <IconButton size="sm" tooltip={false} icon={<TableIcon d={I.down} />} label={`Move ${c.label} later`} disabled={i === orderedKeys.length - 1} onClick={() => moveCol(k, 1)} />
                    </div>
                  );
                })}
                <div className="asc-dg__menu-foot">
                  <Button size="sm" variant="ghost" onClick={() => setLayout({ view: "", hidden: defaultHidden, order: defaultOrder })}>Reset columns</Button>
                  {Object.keys(L.widths).length > 0 && <Button size="sm" variant="ghost" onClick={() => setLayout({ widths: {} })}>Reset widths</Button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selection && bulkActions && selectedKeys.length > 0 && (
        <div className="asc-dg__bulk" role="region" aria-label="Selected rows">
          <span className="asc-dg__bulk-n" aria-live="polite">{nf.format(selectedKeys.length)} selected</span>
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
          <table ref={tableRef} className="asc-dt__table" role="table" aria-label={label} aria-busy={loading || undefined} aria-rowcount={loading ? undefined : orderedRows.length + 1}>
            <thead role="rowgroup" className="asc-dt__head">{head}</thead>
            <tbody role="rowgroup" className="asc-dt__body">{body}</tbody>
          </table>
          {loading && <span className="asc-dt__vh" role="status">Loading {label.toLowerCase()}</span>}
        </div>
      )}

      {!loading && pageCount > 1 && <TablePager label={label} current={current} pageCount={pageCount} total={orderedRows.length} pageSize={pageSize} goTo={goTo} />}
    </div>
  );
}
