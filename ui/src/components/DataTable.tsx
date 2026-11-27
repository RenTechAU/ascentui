import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import './DataTable.css';

// Shared directory-table shell (UI track U-A). One component carrying the
// prototype's table chrome — saved views, column chooser, group-by — over a
// dynamic CSS-grid table. Products / Customers / Partners all render through it,
// so the chrome is written once. Filters + search + the Add button stay on each
// screen's own toolbar; this owns only the columns/views/grouping of the table.
//
// Views & column visibility persist per-table in localStorage (client-side for
// now — server persistence is a later enhancement, see plan.md S9).

// Column resizing. MIN_COL is as narrow as a drag can take a column; FR_FLOOR
// is what an undragged (fr) column is kept above once any column has been
// dragged. ROW_GAP / ROW_PAD mirror `.dthead,.drow` in DataTable.css (gap 14px,
// padding 0 16px) — change one, change the other.
const MIN_COL = 48;
const FR_FLOOR = 80;
const ROW_GAP = 14;
const ROW_PAD = 16;

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string; // CSS grid track; default '1fr'
  align?: 'left' | 'right';
  optional?: boolean; // hideable via the column chooser (others are always shown)
  defaultHidden?: boolean; // optional column that starts hidden
  sortValue?: (row: T) => string | number; // makes the header click-to-sort
}

type Sort = { key: string; dir: 'asc' | 'desc' };

export interface GroupOption<T> {
  key: string;
  label: string;
  groupOf: (row: T) => string;
}

interface SavedView {
  id: string;
  name: string;
  cols: string[];
  group: string;
  sort?: Sort | null;
  order?: string[];
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

/** Opt-in multi-select. Off everywhere by default: most of these tables are
 *  directories you read, and a checkbox column on all of them would be chrome
 *  nobody asked for. The Interests list turns it on because clearing a working
 *  queue is a bulk job. */
export interface Selection {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function DataTable<T>({
  tableId,
  rows,
  columns,
  groups,
  getRowKey,
  onRowClick,
  selection,
  rowActions,
  rowActionsWidth = '160px',
  empty = 'Nothing to show.',
  pageSize = 100,
}: {
  tableId: string;
  rows: T[];
  columns: Column<T>[];
  groups?: GroupOption<T>[];
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selection?: Selection;
  /** Buttons revealed on row hover, in a trailing cell. They act on the row
   *  without opening it — the point of a queue is that the common moves cost
   *  one click, not a drawer. */
  rowActions?: (row: T) => ReactNode;
  /** How much room the trailing actions cell gets. A FIXED track on purpose —
   *  see the `template` comment below: sizing it off the buttons is what pulled
   *  every column out of line with its heading. Widen it here if a table's
   *  buttons need more than the default; the default fits one pair
   *  (Archive + Trash ≈ 140px). */
  rowActionsWidth?: string;
  empty?: string;
  /** Rows rendered per page. The HubSpot import took Contacts from a few hundred
   *  to 5,595, and a table that renders every row builds 5,595 × ~10 cells on
   *  every filter keystroke — the screen stops being usable long before the data
   *  stops being useful.
   *
   *  Deliberately paginating the RENDER, not the fetch: search, filters, sorting
   *  and grouping all run over the whole set before this windows it (each screen
   *  filters into `rows`, then sortedRows sorts). Paging at the API instead would
   *  mean sorting a column re-ordered only the 100 rows you happen to be looking
   *  at, which is the kind of wrong that looks like it works. The payload is
   *  still whole (~2.8MB for Contacts) — that is the next thing to fix, and it
   *  needs search and sort to move server-side with it.
   *
   *  The control hides itself at one page, so tables under the limit (Partners,
   *  Staff) look exactly as they did. */
  pageSize?: number;
}) {
  // What the chooser starts with TURNED OFF. Stored, and read, as the hidden
  // set rather than the visible one — see `hidden` below for why that is the
  // only shape that survives a column being added.
  const defaultHidden = useMemo(() => columns.filter((c) => c.defaultHidden).map((c) => c.key), [columns]);

  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);

  // ⚠️ The columns the reader has switched OFF, not the ones they left on, and
  // the reason is what happens on the day a column is added.
  //
  // This was stored as the visible list, written the first time anybody opened
  // the chooser and read back verbatim ever since. A new optional column is in
  // nobody's stored list, so it rendered for exactly one kind of person: one
  // whose browser had never stored one. Everybody who had ever touched the
  // chooser — which on a screen people live in is everybody — got the table
  // they had before, with no sign that anything had been added, and the change
  // read as not shipped. The mandatory columns were already carved out of this
  // for that reason (`shown` below); an optional one has the same problem and
  // the carve-out could not reach it, because "not in the list" is genuinely
  // ambiguous there: it means both "I hid this" and "this did not exist yet".
  //
  // Storing the negative removes the ambiguity. A key nobody has turned off is
  // absent from the hidden set, so a column added tomorrow is shown to
  // everybody, and a column somebody hid stays hidden until they say otherwise.
  // The old `cb_cols_*` entries are deliberately NOT migrated: reading one
  // would mean guessing which absences were choices, which is the ambiguity
  // this is here to end. Column choices reset once, to the defaults; saved
  // views, which are explicit snapshots, are untouched.
  const [hidden, setHidden] = useState<string[]>(() => lsGet(`cb_hidden_${tableId}`, defaultHidden));
  const [group, setGroup] = useState<string>(() => lsGet(`cb_group_${tableId}`, ''));
  const [views, setViews] = useState<SavedView[]>(() => lsGet(`cb_views_${tableId}`, []));
  const [sort, setSort] = useState<Sort | null>(() => lsGet<Sort | null>(`cb_sort_${tableId}`, null));
  const [order, setOrder] = useState<string[]>(() => lsGet(`cb_order_${tableId}`, defaultOrder));
  const [activeView, setActiveView] = useState<string>('');
  // Groups the reader has folded away. Not persisted: every visit opens fully
  // expanded, and picking a different grouping starts over.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => setCollapsed(new Set()), [group]);
  const [colMenu, setColMenu] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  // Column widths the reader has dragged, in px, by column key. A column absent
  // from here keeps its declared track. Per table and per browser, like the
  // order — a width is how YOUR screen reads the table, not a shared setting —
  // and deliberately not part of a saved view or reset by "All", so switching
  // views doesn't throw away the widening you did to read a long model name.
  const [widths, setWidths] = useState<Record<string, number>>(() => lsGet(`cb_widths_${tableId}`, {}));
  const setWidthsP = (w: Record<string, number>) => {
    setWidths(w);
    lsSet(`cb_widths_${tableId}`, w);
  };
  // Set while a resize handle is held, so the header cell's own drag-to-reorder
  // and click-to-sort stand down for the gesture.
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const setHiddenP = (v: string[]) => {
    setHidden(v);
    lsSet(`cb_hidden_${tableId}`, v);
  };
  const setGroupP = (g: string) => {
    setGroup(g);
    lsSet(`cb_group_${tableId}`, g);
  };
  const setSortP = (s: Sort | null) => {
    setSort(s);
    lsSet(`cb_sort_${tableId}`, s);
  };
  const setOrderP = (o: string[]) => {
    setOrder(o);
    lsSet(`cb_order_${tableId}`, o);
  };
  const setViewsP = (v: SavedView[]) => {
    setViews(v);
    lsSet(`cb_views_${tableId}`, v);
  };

  // Visible columns, laid out in the user's drag-set order. Any column key not
  // yet in `order` (e.g. a newly added column) falls back to declared order.
  const colByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const orderedKeys = useMemo(() => {
    const known = order.filter((k) => colByKey.has(k));
    const rest = columns.filter((c) => !order.includes(c.key)).map((c) => c.key);
    return [...known, ...rest];
  }, [order, columns, colByKey]);
  // A non-optional column is always shown: the chooser can't hide one (`locked`
  // below), so nothing should be able to put its key in the hidden set.
  const shown = (k: string) => !colByKey.get(k)!.optional || !hidden.includes(k);
  // The visible list, for the one thing that still wants it: a saved view is a
  // snapshot of what was on screen, and it has to keep meaning that even after
  // the table grows a column the view was never asked about.
  const visibleKeys = () => columns.filter((c) => shown(c.key)).map((c) => c.key);
  const cols = orderedKeys.filter(shown).map((k) => colByKey.get(k)!);
  // ⚠️ Every track has to be sized by the TEMPLATE alone, never by what happens
  // to be in it, because the header and each row are separate grid containers.
  // A track whose size depends on its contents is therefore computed once per
  // row, and any row whose contents differ gets a different set of columns —
  // which is exactly what the Interests list was doing:
  //
  //   • `auto` on the actions track measured the buttons, so the header (whose
  //     actions cell is empty) reserved nothing while a row reserved ~140px.
  //     The remaining fr tracks shared a smaller leftover in the rows than in
  //     the header, so every column drifted left of its heading — a little at
  //     Source, 139px by the last column. Rows disagreed with each other too:
  //     an archived row shows one "Restore" (75px), a live one shows
  //     "Archive"+"Trash" (139px), so the two rows didn't line up either.
  //   • a bare `1fr` is `minmax(auto, 1fr)`, so a track never shrinks below its
  //     contents' min-content width. `.dcell` sets `min-width:0` and so
  //     contributes nothing, but a header label does, so a long heading widened
  //     its column in the header row only.
  //
  // So: fr tracks are floored at 0, and the actions track is a fixed width.
  // Content that outgrows it overflows leftwards (the cell is right-aligned and
  // only visible on hover), which is a far cheaper failure than moving every
  // column on the screen.
  //
  // A dragged width is a fixed px track, which obeys the same rule. Once any
  // column has one, the fr columns get a floor (FR_FLOOR) instead of 0, or
  // widening one column would squeeze its neighbours to nothing; the row is
  // then given a min-width that adds the tracks up, and the table scrolls
  // sideways past that — which is how a spreadsheet behaves, and what was asked.
  const custom = cols.some((c) => widths[c.key] != null);
  const track = (w: string) =>
    /^\s*[\d.]*fr\s*$/.test(w) ? `minmax(${custom ? FR_FLOOR : 0}px, ${w.trim()})` : w;
  const template = [
    selection ? '28px' : null,
    ...cols.map((c) => (widths[c.key] != null ? `${widths[c.key]}px` : track(c.width ?? '1fr'))),
    rowActions ? rowActionsWidth : null,
  ]
    .filter(Boolean)
    .join(' ');
  // The narrowest a row can be before its tracks overlap — only worked out once
  // a width has been dragged, so an untouched table lays out exactly as before.
  // Non-fr declared tracks ('110px') are counted at face value; anything else
  // (auto, minmax) at the fr floor, which is only ever an under-estimate and so
  // at worst leaves the old squeeze in place rather than inventing a scrollbar.
  const minRowWidth = useMemo(() => {
    if (!custom) return undefined;
    const px = (w: string | undefined) => {
      const m = w ? /^\s*(\d+(?:\.\d+)?)px\s*$/.exec(w) : null;
      return m ? Number(m[1]) : FR_FLOOR;
    };
    const tracks = [
      ...(selection ? [28] : []),
      ...cols.map((c) => widths[c.key] ?? px(c.width)),
      ...(rowActions ? [px(rowActionsWidth)] : []),
    ];
    return tracks.reduce((a, b) => a + b, 0) + ROW_GAP * (tracks.length - 1) + ROW_PAD * 2;
  }, [custom, cols, widths, selection, rowActions, rowActionsWidth]);
  const rowStyle = { gridTemplateColumns: template, ...(minRowWidth ? { minWidth: minRowWidth } : {}) };

  // ── column resize ──────────────────────────────────────────────────────────
  // Pointer events with capture, so the drag keeps tracking when the pointer
  // leaves the 8px handle — and so it works the same with a mouse or a pen.
  const startResize = (e: ReactPointerEvent<HTMLSpanElement>, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = e.currentTarget.parentElement;
    if (!cell) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    resizing.current = { key, startX: e.clientX, startW: cell.getBoundingClientRect().width };
  };
  const moveResize = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const r = resizing.current;
    if (!r) return;
    const w = Math.round(Math.max(MIN_COL, r.startW + e.clientX - r.startX));
    setWidths((prev) => (prev[r.key] === w ? prev : { ...prev, [r.key]: w }));
  };
  const endResize = () => {
    if (!resizing.current) return;
    resizing.current = null;
    // Persist once, at the end of the drag, rather than on every pointer move.
    // `widths` is current here: each move re-rendered, re-binding this handler.
    lsSet(`cb_widths_${tableId}`, widths);
  };
  // Double-click the handle: that column goes back to its own width.
  const resetWidth = (key: string) => {
    const { [key]: _gone, ...rest } = widths;
    setWidthsP(rest);
  };

  const keyOf = (r: T) => String(getRowKey(r));
  const toggleRow = (r: T) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    const k = keyOf(r);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    selection.onChange(next);
  };
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = colByKey.get(sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sv(a);
      const bv = sv(b);
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return 0;
    });
  }, [rows, sort, colByKey]);

  // ── grouping order ─────────────────────────────────────────────────────────
  // Grouped, the WHOLE set is ordered group by group (the column sort kept
  // within each, since Array.sort is stable) before it is paged. Paging first
  // and grouping each page is what put every group on every page — 20 CB units,
  // then the other groups, then page 2 opening on CB again (helpdesk #123). Now
  // a group is one continuous run that may simply carry on to the next page.
  const groupOpt = groups?.find((g) => g.key === group) ?? null;
  const groupKeyOf = useMemo(
    () => (groupOpt ? (r: T) => groupOpt.groupOf(r) || '—' : null),
    [groupOpt],
  );
  const orderedRows = useMemo(() => {
    if (!groupKeyOf) return sortedRows;
    const keyed = sortedRows.map((r) => ({ r, k: groupKeyOf(r) }));
    keyed.sort((a, b) => a.k.localeCompare(b.k));
    return keyed.map((x) => x.r);
  }, [sortedRows, groupKeyOf]);
  // Each group's size across the whole set, for its heading — a group split
  // over two pages still says how big it really is.
  const groupTotals = useMemo(() => {
    if (!groupKeyOf) return null;
    const m = new Map<string, number>();
    for (const r of orderedRows) {
      const k = groupKeyOf(r);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [orderedRows, groupKeyOf]);

  // ── paging ─────────────────────────────────────────────────────────────────
  // Applied AFTER sorting (and grouping), so a page is a window onto the
  // fully-ordered set rather than a sorted window onto an arbitrary one.
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / pageSize));
  // Clamped for the render that happens BEFORE the reset effect below runs:
  // effects fire after paint, so narrowing a filter while on page 40 would slice
  // past the end and flash an empty table for a frame. The effect is what
  // actually returns you to page 1; this only stops the gap being visible.
  const current = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => (orderedRows.length <= pageSize ? orderedRows : orderedRows.slice((current - 1) * pageSize, current * pageSize)),
    [orderedRows, current, pageSize],
  );
  // A new filter or search term is a new question — answer it from the top.
  //
  // ⚠️ But `rows` also changes identity every time the data is REFETCHED, and
  // every write refetches (useAction invalidates everything). Resetting on
  // identity alone sent you back to page 1 each time you trashed a row on page
  // 3 (helpdesk #131). So a change that moves at most one row in or out — a
  // refresh (0), a trash or archive (−1), a create (+1) — is an edit to the
  // list you were reading, and keeps your page; `current` above clamps it if
  // the last row of the last page went. Anything bigger is a new question.
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
    // keyOf closes over getRowKey, which screens pass inline — deliberately
    // not a dependency, or every render would count as a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  useEffect(() => setPage(1), [sort, group]);

  // Header checkbox acts on the rows you can SEE — this page of what is filtered
  // in, not every row that exists. It used to mean the whole filtered set, which
  // was already the narrower reading of "all"; once a page shows 100 of 5,595
  // that reading tips over into the exact surprise the rule exists to prevent —
  // ticking a box while looking at 100 rows must not arm a bulk archive over
  // 5,595. Selection itself is NOT cleared when the page turns, so acting on more
  // than a page is still possible: page, tick, page, tick.
  const allSelected =
    selection != null && pageRows.length > 0 && pageRows.every((r) => selection.selected.has(keyOf(r)));
  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    for (const r of pageRows) {
      if (allSelected) next.delete(keyOf(r));
      else next.add(keyOf(r));
    }
    selection.onChange(next);
  };

  const toggleCol = (key: string) => {
    setActiveView('');
    setHiddenP(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
  };

  // Header click cycles asc → desc → unsorted.
  const toggleSort = (c: Column<T>) => {
    if (!c.sortValue) return;
    setActiveView('');
    setSortP(
      sort?.key !== c.key ? { key: c.key, dir: 'asc' } : sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null,
    );
  };

  const dropCol = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return setDragKey(null);
    const next = orderedKeys.filter((k) => k !== dragKey);
    next.splice(next.indexOf(targetKey), 0, dragKey);
    setOrderP(next);
    setActiveView('');
    setDragKey(null);
  };

  const clearView = () => {
    setActiveView('');
    setHiddenP(defaultHidden);
    setGroupP('');
    setSortP(null);
    setOrderP(defaultOrder);
  };
  const applyView = (v: SavedView) => {
    setActiveView(v.id);
    // A view names what it shows, so anything optional it doesn't name is off —
    // including a column added since the view was saved, which the view has no
    // opinion about and should not silently acquire.
    setHiddenP(columns.filter((c) => c.optional && !v.cols.includes(c.key)).map((c) => c.key));
    setGroupP(v.group);
    setSortP(v.sort ?? null);
    setOrderP(v.order ?? defaultOrder);
  };
  const saveView = () => {
    const name = window.prompt('Name this view')?.trim();
    if (!name) return;
    const v: SavedView = { id: `v${Date.now()}`, name, cols: visibleKeys(), group, sort, order };
    setViewsP([...views, v]);
    setActiveView(v.id);
  };
  const deleteView = (id: string) => {
    setViewsP(views.filter((v) => v.id !== id));
    if (activeView === id) clearView();
  };

  const toggleGroup = (label: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  // This page's slice of the group runs, in order. The rows arrive already
  // ordered by group, so the Map's insertion order IS the group order. Only the
  // first run on a page can have started on an earlier one — that heading says
  // "continued" so it doesn't read as a second group of the same name.
  const grouped = useMemo(() => {
    if (!groupKeyOf) return null;
    const m = new Map<string, T[]>();
    for (const r of pageRows) {
      const k = groupKeyOf(r);
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
    }
    const start = (current - 1) * pageSize;
    const prev = start > 0 ? orderedRows[start - 1] : undefined;
    const continuedKey = prev !== undefined ? groupKeyOf(prev) : null;
    return [...m.entries()].map(([label, gr]) => ({ label, rows: gr, continued: label === continuedKey }));
  }, [pageRows, groupKeyOf, orderedRows, current, pageSize]);

  const headRow = (
    <div className="dthead" style={rowStyle}>
      {selection && (
        <span className="dth dth-sel">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all on this page"
            title="Select every row on this page"
          />
        </span>
      )}
      {cols.map((c) => {
        const sortable = !!c.sortValue;
        const active = sort?.key === c.key;
        return (
          <span
            key={c.key}
            // `.r` mirrors the cell's own right-alignment class. It used to be
            // `textAlign: 'right'`, which a flex container ignores — so the
            // heading of a right-aligned column sat hard left of the figures it
            // named.
            className={`dth${c.align === 'right' ? ' r' : ''}${sortable ? ' sortable' : ''}${active ? ' sorted' : ''}`}
            onClick={sortable ? () => toggleSort(c) : undefined}
            draggable
            onDragStart={(e) => {
              if (resizing.current) return e.preventDefault();
              setDragKey(c.key);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropCol(c.key)}
            onDragEnd={() => setDragKey(null)}
            title={sortable ? 'Click to sort · drag to reorder' : 'Drag to reorder'}
          >
            {c.label}
            {/* A sortable column says so before it is clicked. Click-to-sort has
                worked on every one of these tables since they shipped and was
                asked for anyway, because the only thing that ever said it
                existed was a hover title and an arrow that appeared after you
                had already guessed. The idle glyph is dim enough to read as
                chrome and sits in the same place the live arrow takes, so the
                header does not shift when you sort it. */}
            {active ? (
              <span className="dth-arr">{sort!.dir === 'asc' ? '▲' : '▼'}</span>
            ) : sortable ? (
              <span className="dth-arr idle" aria-hidden="true">
                ⇅
              </span>
            ) : null}
            <span
              className="dth-rs"
              role="separator"
              aria-orientation="vertical"
              aria-label={`Resize ${c.label}`}
              title="Drag to resize · double-click to reset"
              draggable={false}
              onPointerDown={(e) => startResize(e, c.key)}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                resetWidth(c.key);
              }}
            />
          </span>
        );
      })}
      {rowActions && <span className="dth" />}
    </div>
  );

  const renderRow = (r: T) => (
    <div
      key={getRowKey(r)}
      className={`drow${selection?.selected.has(keyOf(r)) ? ' sel' : ''}`}
      style={rowStyle}
      onClick={onRowClick ? () => onRowClick(r) : undefined}
    >
      {selection && (
        <div className="dcell dcell-sel" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selection.selected.has(keyOf(r))}
            onChange={() => toggleRow(r)}
            aria-label="Select row"
          />
        </div>
      )}
      {cols.map((c) => (
        <div key={c.key} className={`dcell ${c.align === 'right' ? 'r' : ''}`}>
          {c.render(r)}
        </div>
      ))}
      {rowActions && (
        <div className="dcell dcell-acts" onClick={(e) => e.stopPropagation()}>
          {rowActions(r)}
        </div>
      )}
    </div>
  );

  return (
    <div className="tshell">
      <div className="tbar">
        <div className="viewtabs">
          <button className={`vtab ${activeView ? '' : 'on'}`} onClick={clearView}>
            All
          </button>
          {views.map((v) => (
            <button
              key={v.id}
              className={`vtab ${activeView === v.id ? 'on' : ''}`}
              onClick={() => applyView(v)}
            >
              {v.name}
              <span
                className="vtab-x"
                title="Delete view"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteView(v.id);
                }}
              >
                ×
              </span>
            </button>
          ))}
          <button className="vtab add" onClick={saveView}>
            + Save view
          </button>
        </div>
        <div className="tbar-r">
          {groups && groups.length > 0 && (
            <label className="grpby">
              <span className="fl-lbl">Group</span>
              <select
                className="owner"
                style={{ width: 'auto' }}
                value={group}
                onChange={(e) => {
                  setActiveView('');
                  setGroupP(e.target.value);
                }}
              >
                <option value="">None</option>
                {groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="colmenu-wrap">
            <button className="btn" onClick={() => setColMenu((m) => !m)}>
              ▦ Edit columns
            </button>
            {colMenu && (
              <>
                <div className="colmenu-scrim" onClick={() => setColMenu(false)} />
                <div className="colmenu">
                  {columns.map((c) => {
                    const locked = !c.optional;
                    return (
                      <label key={c.key} className={locked ? 'locked' : ''}>
                        <input
                          type="checkbox"
                          checked={shown(c.key)}
                          disabled={locked}
                          onChange={() => toggleCol(c.key)}
                        />
                        {c.label}
                      </label>
                    );
                  })}
                  {Object.keys(widths).length > 0 && (
                    <button
                      className="colmenu-reset"
                      onClick={() => {
                        setWidthsP({});
                        setColMenu(false);
                      }}
                    >
                      Reset column widths
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <div className="dtable">
          {headRow}
          {grouped
            ? grouped.map(({ label, rows: gr, continued }) => (
                <div key={label}>
                  <div
                    className="dgroup dgroup-toggle"
                    role="button"
                    tabIndex={0}
                    aria-expanded={!collapsed.has(label)}
                    onClick={() => toggleGroup(label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGroup(label);
                      }
                    }}
                  >
                    <span className="dgroup-chev" aria-hidden="true">{collapsed.has(label) ? '▸' : '▾'}</span>
                    {label}
                    {continued && <span className="dim"> · continued</span>}{' '}
                    <span className="dgroup-n">{groupTotals?.get(label) ?? gr.length}</span>
                  </div>
                  {!collapsed.has(label) && gr.map(renderRow)}
                </div>
              ))
            : pageRows.map(renderRow)}
        </div>
      )}

      {/* Hidden at one page, so every table under the limit looks untouched. */}
      {pageCount > 1 && (
        <div className="tpage">
          <span className="tpage-n">
            {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length.toLocaleString()}
          </span>
          <div className="tpage-btns">
            <button className="btn" onClick={() => setPage(1)} disabled={current === 1} title="First page">
              «
            </button>
            <button className="btn" onClick={() => setPage(current - 1)} disabled={current === 1}>
              Previous
            </button>
            <span className="tpage-cur">
              Page {current} of {pageCount}
            </span>
            <button className="btn" onClick={() => setPage(current + 1)} disabled={current === pageCount}>
              Next
            </button>
            <button
              className="btn"
              onClick={() => setPage(pageCount)}
              disabled={current === pageCount}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
