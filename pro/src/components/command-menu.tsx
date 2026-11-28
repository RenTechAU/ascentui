"use client";
/**
 * CommandMenu: search and jump to anything from the keyboard, the ⌘K palette. Grouped commands
 * and places, forgiving matching (letters in order are enough: "nwcs" finds "New case"), recent
 * picks first, and the keys shown beside what they do.
 * On the kit's Dialog, so the page behind is out of reach, Escape closes it and focus goes back to
 * where it was. The list follows the WAI-ARIA combobox pattern: arrows move, Enter runs.
 * The ⌘K / Ctrl+K shortcut is opt-in (shortcut prop) and never fires while someone types in a field.
 * CommandMenuTrigger is a search-style button for the top bar; Kbd draws a key.
 * Built from Dialog. Reads the shared theme (@ascentui/tokens).
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Dialog } from "@ascentui/ui/components/dialog";

const css = `@layer asc {
.asc-kbd{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:18px;height:18px;padding:0 var(--asc-space-4);border-radius:var(--asc-radius-sm);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);color:var(--asc-muted);font:500 11px/1 var(--asc-font);white-space:nowrap;font-variant-numeric:tabular-nums}
.asc-kbds{display:inline-flex;gap:var(--asc-space-2)}
.asc-cmd.asc-dlg{--w:560px;margin-top:min(12dvh,96px);max-height:min(520px,calc(100dvh - min(12dvh,96px) - var(--asc-space-24)))}
.asc-cmd .asc-dlg__head{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}
.asc-cmd .asc-dlg__body{display:flex;flex-direction:column;padding:0;overflow:hidden}
.asc-cmd .asc-dlg__foot{justify-content:space-between;padding:var(--asc-space-8) var(--asc-space-12);color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-cmd__search{display:flex;align-items:center;gap:var(--asc-space-8);flex:none;padding:0 var(--asc-space-16);border-bottom:1px solid var(--asc-border)}
.asc-cmd__search svg{width:16px;height:16px;flex:none;color:var(--asc-faint)}
.asc-cmd__input{flex:1;min-width:0;height:calc(var(--asc-control-lg) + var(--asc-space-16));margin:0;padding:0;border:0;background:none;color:var(--asc-ink);font:400 var(--asc-input-text)/var(--asc-leading-sm) var(--asc-font);outline:none}
.asc-cmd__input::placeholder{color:var(--asc-placeholder);opacity:1}
.asc-cmd__input::-webkit-search-cancel-button{display:none}
.asc-cmd__list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;margin:0;padding:var(--asc-space-4) var(--asc-space-8) var(--asc-space-8);list-style:none;scroll-padding:var(--asc-space-24) 0 var(--asc-space-8)}
.asc-cmd__list ul{margin:0;padding:0;list-style:none}
.asc-cmd__group{position:sticky;top:calc(var(--asc-space-4) * -1);z-index:1;margin:0;padding:var(--asc-space-8) var(--asc-space-8) var(--asc-space-4);background:var(--asc-surface);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-cmd__opt{display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;min-height:var(--asc-control-lg);padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-sm);cursor:pointer;-webkit-tap-highlight-color:transparent}
.asc-cmd__opt[aria-selected="true"]{background:var(--asc-subtle-strong)}
.asc-cmd__opt[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
.asc-cmd__icon{display:inline-grid;place-items:center;flex:none;width:16px;height:16px;color:var(--asc-muted)}
.asc-cmd__icon svg{width:16px;height:16px}
.asc-cmd__text{display:flex;flex-direction:column;flex:1;min-width:0}
.asc-cmd__label,.asc-cmd__desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-cmd__label mark{background:none;color:inherit;font-weight:600}
.asc-cmd__desc{color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-cmd__hint{flex:none;color:var(--asc-muted);font-size:var(--asc-text-xs)}
.asc-cmd__note{margin:0;padding:var(--asc-space-24) var(--asc-space-16);color:var(--asc-muted);text-align:center}
.asc-cmd__vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.asc-cmd__keys{display:flex;flex-wrap:wrap;gap:var(--asc-space-12)}
.asc-cmd__keys span{display:inline-flex;align-items:center;gap:var(--asc-space-4)}
@media (pointer:coarse){.asc-cmd .asc-dlg__foot,.asc-cmd-trigger .asc-kbds{display:none}}
.asc-cmd-trigger{display:inline-flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;width:240px;max-width:100%;min-width:0;height:var(--asc-control-md);padding:0 var(--asc-space-6) 0 var(--asc-space-8);border:0;border-radius:var(--asc-radius);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);color:var(--asc-muted);font:400 var(--asc-control-text)/1 var(--asc-font);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:box-shadow var(--asc-duration)}
.asc-cmd-trigger:hover{box-shadow:var(--asc-shadow-control-hover)}
.asc-cmd-trigger:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-cmd-trigger svg{width:14px;height:14px;flex:none}
.asc-cmd-trigger__label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.asc-cmd-trigger[data-compact]{width:var(--asc-control-md);padding:0;justify-content:center}
.asc-cmd-trigger[data-compact] .asc-cmd-trigger__label,.asc-cmd-trigger[data-compact] .asc-kbds{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
@container asc-shell (max-width:639px){
  .asc-cmd-trigger{width:var(--asc-control-md);padding:0;justify-content:center}
  .asc-cmd-trigger .asc-cmd-trigger__label,.asc-cmd-trigger .asc-kbds{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
}
}`;

// ---------------------------------------------------------------- types

export type Command = {
  /** Unique and stable: recent picks are remembered by id */
  id: string;
  label: string;
  /** The heading it sits under, e.g. "Go to", "Create", "Customers" */
  group?: string;
  /** A second muted line, e.g. a customer's suburb. It is searched too */
  description?: string;
  /** Other words that should find it: "add" for "New case", a phone number */
  keywords?: string;
  icon?: ReactNode;
  /** Keys that do the same thing elsewhere in your app, shown at the end, e.g. ["G", "C"] */
  shortcut?: string[];
  /** Muted text at the end, instead of a shortcut, e.g. "Customer" */
  hint?: ReactNode;
  /** Runs once the menu has closed and focus is back where it was */
  onSelect: () => void;
  disabled?: boolean;
};

export type CommandMenuProps = {
  /** Whether it is open. You own this state, or use the shortcut prop to let ⌘K open it */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Everything it can do or open */
  commands: Command[];
  /** Ids of recent picks, newest first, shown before anything is typed. Leave out to let it keep its own */
  recent?: string[];
  /** Called with the new recent list after each pick */
  onRecentChange?: (ids: string[]) => void;
  /** Opt in to remembering recent picks in this browser, under this key */
  storageKey?: string;
  /** How many recent picks to keep */
  recentLimit?: number;
  /** Opt in to a keyboard shortcut that opens and closes it: true for ⌘K / Ctrl+K, or e.g. "mod+p", "/" */
  shortcut?: boolean | string;
  /** Called as people type, e.g. to search customers on your server and pass them in as commands */
  onQueryChange?: (query: string) => void;
  /** Shows "Searching…" while your search runs */
  loading?: boolean;
  placeholder?: string;
  /** Shown when nothing matches. Gets what was typed */
  emptyText?: (query: string) => ReactNode;
  /** The dialog's name for screen readers */
  label?: string;
  /** Show the key hints along the bottom. Hidden on touch screens either way */
  hints?: boolean;
};

// ---------------------------------------------------------------- matching

/** Lower case, accents removed, so "jose" finds "José" */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** How well a command matches: 0 is no match. Start of the label beats start of a word beats
 *  anywhere beats letters in order. Description and keywords count for a little less */
export function scoreCommand(c: Pick<Command, "label" | "description" | "keywords" | "group">, query: string): number {
  const q = fold(query.trim());
  if (!q) return 1;
  const label = fold(c.label);
  const rest = fold(`${c.description ?? ""} ${c.keywords ?? ""} ${c.group ?? ""}`);
  if (label.startsWith(q)) return 100 - label.length / 100;
  if (new RegExp(`(^|[\\s\\-_/.(])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) return 80;
  if (label.includes(q)) return 60;
  if (rest.includes(q)) return 40;
  // Every word of the query starts a word of the label: "new inv" finds "New invoice"
  const words = q.split(/\s+/);
  if (words.length > 1 && words.every((w) => label.includes(w) || rest.includes(w))) return 30;
  // Letters in order: "nwcs" finds "New case"
  let i = 0;
  for (const ch of label) if (ch === q[i]) i++;
  if (i === q.length) return 10;
  return 0;
}

/** Where the plain text match is in the label, to show it in bold */
function highlight(label: string, query: string): ReactNode {
  const q = fold(query.trim());
  if (!q) return label;
  const at = fold(label).indexOf(q);
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark>{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  );
}

// ---------------------------------------------------------------- shortcut

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']");

/** Does the key event match a shortcut like "mod+k", "ctrl+shift+p" or "/"? mod is ⌘ on a Mac, Ctrl elsewhere */
export function matchesShortcut(e: globalThis.KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts.pop() ?? "";
  const want = new Set(parts.map((p) => (p === "mod" ? (isMac() ? "meta" : "ctrl") : p === "cmd" ? "meta" : p)));
  const has = { meta: e.metaKey, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey };
  for (const [m, on] of Object.entries(has)) {
    // Shift is allowed through for keys typed with it, such as "?"
    if (m === "shift" && !want.has("shift") && key.length === 1 && !/[a-z0-9]/.test(key)) continue;
    if (want.has(m) !== on) return false;
  }
  return e.key.toLowerCase() === key;
}

/** The shortcut written for people: "⌘K" on a Mac, "Ctrl K" elsewhere */
export function shortcutKeys(shortcut: string): string[] {
  return shortcut.split("+").map((p) => {
    const k = p.toLowerCase();
    if (k === "mod") return isMac() ? "⌘" : "Ctrl";
    if (k === "cmd" || k === "meta") return "⌘";
    if (k === "ctrl") return "Ctrl";
    if (k === "alt") return isMac() ? "⌥" : "Alt";
    if (k === "shift") return isMac() ? "⇧" : "Shift";
    return p.length === 1 ? p.toUpperCase() : p;
  });
}

const DEFAULT_SHORTCUT = "mod+k";

// ---------------------------------------------------------------- recent picks

function readRecent(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeRecent(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* private mode or full: they are kept for this visit only */
  }
}

// ---------------------------------------------------------------- small parts

/** One key, or a row of keys, drawn as keycaps */
export function Kbd({ keys, label }: { keys: string | string[]; label?: string }) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <>
      <style href="asc-command-menu" precedence="asc">{css}</style>
      <span className="asc-kbds" aria-label={label}>
        {list.map((k, i) => <kbd key={i} className="asc-kbd">{k}</kbd>)}
      </span>
    </>
  );
}

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <path d="M7.25 12.5a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5zM14 14l-3-3" />
  </svg>
);

export type CommandMenuTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** The words on it. Defaults to "Search" */
  label?: string;
  /** The shortcut to show, matching the menu's shortcut prop */
  shortcut?: string;
  /** Only the search icon. Its label is still read out. Inside a narrow App Shell this happens on its own */
  compact?: boolean;
};

/** A search-style button for the top bar that opens the menu. Shows its shortcut on a desk */
export function CommandMenuTrigger({ label = "Search", shortcut = DEFAULT_SHORTCUT, compact, className, ...rest }: CommandMenuTriggerProps) {
  const [keys, setKeys] = useState<string[] | null>(null);
  // Mac or not is only known in the browser, so the keys appear after the first paint
  useEffect(() => setKeys(shortcutKeys(shortcut)), [shortcut]);
  return (
    <>
      <style href="asc-command-menu" precedence="asc">{css}</style>
      <button
        type="button"
        className={["asc-cmd-trigger", className].filter(Boolean).join(" ")}
        aria-haspopup="dialog"
        aria-keyshortcuts={keys ? shortcut.replace(/mod/i, isMac() ? "Meta" : "Control") : undefined}
        data-compact={compact || undefined}
        {...rest}
      >
        <SearchIcon />
        <span className="asc-cmd-trigger__label">{label}</span>
        {keys && <Kbd keys={keys} />}
      </button>
    </>
  );
}

// ---------------------------------------------------------------- the menu

type Row = { c: Command; key: string };

export function CommandMenu({
  open, onOpenChange, commands, recent, onRecentChange, storageKey, recentLimit = 5, shortcut, onQueryChange, loading,
  placeholder = "Type a command or search", emptyText = (q) => `Nothing matches "${q}".`, label = "Command menu", hints = true,
}: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [ownRecent, setOwnRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const chosen = useRef<Command | null>(null);
  const id = useId();
  const recentIds = recent ?? ownRecent;

  useLayoutEffect(() => {
    if (storageKey && recent === undefined) setOwnRecent(readRecent(storageKey));
  }, [storageKey, recent]);

  // The shortcut: opens and closes it from anywhere, except while typing in a field elsewhere.
  // Captured early, so a page-wide shortcut on the same keys (such as a site search) gives way
  const openRef = useRef(open);
  openRef.current = open;
  const askRef = useRef(onOpenChange);
  askRef.current = onOpenChange;
  useEffect(() => {
    if (!shortcut) return;
    const keys = shortcut === true ? DEFAULT_SHORTCUT : shortcut;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.repeat || !matchesShortcut(e, keys)) return;
      const insideMenu = e.target instanceof Node && !!(e.target as HTMLElement).closest?.(".asc-cmd");
      if (!insideMenu && isTyping(e.target)) return;
      if (!insideMenu && document.querySelector("dialog:modal")) return;
      e.preventDefault();
      e.stopPropagation();
      askRef.current(!openRef.current);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [shortcut]);

  // Start fresh each time it opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    chosen.current = null;
  }, [open]);

  // Grouped rows. With nothing typed: recent picks, then everything in your order.
  // With a search: best matches first, groups in the order their best match comes
  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    const add = (g: string, c: Command) => map.set(g, [...(map.get(g) ?? []), { c, key: `${g}:${c.id}` }]);
    if (!query.trim()) {
      const byId = new Map(commands.map((c) => [c.id, c]));
      const rec = recentIds.map((r) => byId.get(r)).filter((c): c is Command => !!c);
      rec.forEach((c) => add("Recent", c));
      for (const c of commands) if (!rec.includes(c)) add(c.group ?? "", c);
    } else {
      commands
        .map((c, i) => ({ c, s: scoreCommand(c, query), i }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .forEach(({ c }) => add(c.group ?? "", c));
    }
    return [...map];
  }, [commands, query, recentIds]);
  const rows = useMemo(() => groups.flatMap(([, r]) => r), [groups]);
  const enabled = (i: number) => !!rows[i] && !rows[i]!.c.disabled;
  const first = () => Math.max(0, rows.findIndex((_, i) => enabled(i)));

  useEffect(() => setActive(first()), [query]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (active >= rows.length) setActive(first());
  }, [rows.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (row: Row | undefined) => {
    if (!row || row.c.disabled) return;
    chosen.current = row.c;
    const next = [row.c.id, ...recentIds.filter((r) => r !== row.c.id)].slice(0, recentLimit);
    if (recent === undefined) setOwnRecent(next);
    if (storageKey) writeRecent(storageKey, next);
    onRecentChange?.(next);
    onOpenChange(false);
  };

  const move = (by: number) => {
    if (!rows.length) return;
    let i = active;
    for (let n = 0; n < rows.length; n++) {
      i = (i + by + rows.length) % rows.length;
      if (enabled(i)) return setActive(i);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) move(1);
    else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) move(-1);
    else if (e.key === "PageDown") move(5);
    else if (e.key === "PageUp") move(-5);
    else if ((e.key === "Home" || e.key === "End") && e.ctrlKey) setActive(e.key === "Home" ? first() : rows.length - 1);
    else if (e.key === "Enter" && !e.nativeEvent.isComposing) choose(rows[active]);
    else return;
    e.preventDefault();
  };

  // The command runs once the dialog has closed and focus is back, so it can move focus itself
  const onClosed = () => {
    const c = chosen.current;
    chosen.current = null;
    c?.onSelect();
  };

  const count = rows.length;
  let index = 0;
  return (
    <>
      <style href="asc-command-menu" precedence="asc">{css}</style>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={label}
        initialFocus={input}
        onClosed={onClosed}
        className="asc-cmd"
        hideClose
        footer={
          hints ? (
            <>
              <span className="asc-cmd__keys" aria-hidden>
                <span><Kbd keys={["↑", "↓"]} /> to move</span>
                <span><Kbd keys="↵" /> to open</span>
                <span><Kbd keys="Esc" /> to close</span>
              </span>
              <span aria-hidden>{count ? `${count} ${count === 1 ? "result" : "results"}` : ""}</span>
            </>
          ) : undefined
        }
      >
        <div className="asc-cmd__search">
          <SearchIcon />
          <input
            ref={input}
            className="asc-cmd__input"
            type="search"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={count ? `${id}-${active}` : undefined}
            enterKeyHint="go"
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onQueryChange?.(e.target.value);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <ul ref={list} className="asc-cmd__list" id={`${id}-list`} role="listbox" aria-label={label} hidden={!count}>
          {groups.map(([group, items], gi) => (
            <li key={group || `g${gi}`} role="presentation">
              {group && <p className="asc-cmd__group" id={`${id}-g${gi}`} aria-hidden>{group}</p>}
              <ul role="group" aria-labelledby={group ? `${id}-g${gi}` : undefined}>
                {items.map(({ c, key }) => {
                  const i = index++;
                  return (
                    <li
                      key={key}
                      id={`${id}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      aria-disabled={c.disabled || undefined}
                      className="asc-cmd__opt"
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerMove={() => i !== active && enabled(i) && setActive(i)}
                      onClick={() => choose({ c, key })}
                    >
                      {c.icon && <span className="asc-cmd__icon" aria-hidden>{c.icon}</span>}
                      <span className="asc-cmd__text">
                        <span className="asc-cmd__label">{highlight(c.label, query)}</span>
                        {c.description && <span className="asc-cmd__desc">{c.description}</span>}
                      </span>
                      {c.shortcut ? <Kbd keys={c.shortcut} /> : c.hint != null ? <span className="asc-cmd__hint">{c.hint}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        {!count && <p className="asc-cmd__note">{loading ? "Searching…" : query.trim() ? emptyText(query.trim()) : "Nothing here yet."}</p>}
        <span className="asc-cmd__vh" role="status">
          {open && query.trim() ? (loading && !count ? "Searching" : `${count} ${count === 1 ? "result" : "results"}`) : ""}
        </span>
      </Dialog>
    </>
  );
}
