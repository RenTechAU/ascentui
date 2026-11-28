"use client";
/**
 * MenuButton: a button that opens a short list of actions, such as an account menu or a row's
 * "More" menu. Follows the WAI-ARIA menu button pattern: Enter, Space or the arrow keys open it,
 * arrows move, Home and End jump, a letter jumps to the next item starting with it, Escape closes
 * and puts focus back on the button. The list sits in the browser's top layer, so a scrolling
 * list or a dialog around it never cuts it off.
 * Used by App Shell (account menu) and List Row (the keyboard way to reach swipe actions).
 * Built from Button. Reads the shared theme (@ascentui/tokens).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";

const css = `@layer asc {
.asc-menu{position:fixed;inset:auto;z-index:60;box-sizing:border-box;min-width:180px;max-width:min(320px,calc(100vw - var(--asc-space-16)));max-height:min(420px,calc(100dvh - var(--asc-space-24)));margin:0;padding:var(--asc-space-4);overflow-y:auto;overscroll-behavior:contain;border:0;border-radius:var(--asc-radius-lg);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-pop);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);text-align:start;opacity:0;transform:translateY(var(--asc-menu-from,-4px)) scale(.98);transition:opacity var(--asc-duration) var(--asc-ease),transform var(--asc-duration) var(--asc-ease)}
.asc-menu[hidden]{display:none}
.asc-menu[data-open]{opacity:1;transform:none}
@starting-style{.asc-menu[data-open]{opacity:0;transform:translateY(var(--asc-menu-from,-4px)) scale(.98)}}
.asc-menu[data-side="top"]{--asc-menu-from:4px}
.asc-menu__head{padding:var(--asc-space-6) var(--asc-space-8) var(--asc-space-8);margin-bottom:var(--asc-space-4);border-bottom:1px solid var(--asc-border)}
.asc-menu__item{display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;width:100%;min-height:var(--asc-control-md);padding:0 var(--asc-space-8);border:0;border-radius:var(--asc-radius-sm);background:none;color:inherit;font:inherit;text-align:left;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.asc-menu__item svg{width:16px;height:16px;flex:none;color:var(--asc-muted)}
.asc-menu__item:hover,.asc-menu__item:focus-visible{background:var(--asc-subtle-strong);outline:none}
.asc-menu__item[data-tone="danger"],.asc-menu__item[data-tone="danger"] svg{color:var(--asc-danger)}
.asc-menu__item[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
.asc-menu__item[aria-disabled="true"]:hover{background:none}
.asc-menu__label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-menu__hint{color:var(--asc-muted);font-size:var(--asc-text-xs)}
.asc-menu__sep{height:1px;margin:var(--asc-space-4) calc(var(--asc-space-4) * -1);background:var(--asc-border)}
}`;

export type MenuAction = {
  /** What it does, e.g. "Archive" or "Sign out" */
  label: string;
  /** Runs when it is chosen. The menu closes first and focus goes back to the button */
  onSelect?: () => void;
  /** Makes it a link instead. onSelect still runs, before the browser follows it */
  href?: string;
  icon?: ReactNode;
  /** Muted text at the end, e.g. a shortcut */
  hint?: ReactNode;
  /** danger for delete and sign out */
  tone?: "neutral" | "danger";
  disabled?: boolean;
};

/** An action, or a dividing line between groups of actions */
export type MenuEntry = MenuAction | "separator";

export type MenuButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  /** The actions, top to bottom. "separator" draws a line */
  items: MenuEntry[];
  /** What is on the button. Leave it out for an icon-only button, and give an aria-label */
  children?: ReactNode;
  /** Shown above the actions, e.g. the signed-in person's name and email */
  header?: ReactNode;
  /** Which edge of the button the menu lines up with */
  align?: "start" | "end";
  /** Called when it opens and closes */
  onOpenChange?: (open: boolean) => void;
  /** The menu's name for screen readers. Defaults to the button's label */
  menuLabel?: string;
};

const isAction = (e: MenuEntry): e is MenuAction => e !== "separator";

export function MenuButton({
  items, children, header, align = "end", onOpenChange, menuLabel, variant = "ghost", className, ...rest
}: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const firstFocus = useRef<"first" | "last">("first");
  const id = useId();
  const changed = useRef(onOpenChange);
  changed.current = onOpenChange;

  const show = (at: "first" | "last") => {
    firstFocus.current = at;
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  useEffect(() => changed.current?.(open), [open]);

  // Place it under (or above) the button, kept on screen. Again on scroll and resize while open
  useLayoutEffect(() => {
    const el = menu.current;
    const btn = button.current;
    if (!open || !el || !btn) return;
    try {
      if (typeof el.showPopover === "function" && !el.matches(":popover-open")) el.showPopover();
    } catch {
      /* popovers unsupported: it still shows, as a fixed layer */
    }
    const place = () => {
      const r = btn.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 4;
      const edge = 8;
      const width = document.documentElement.clientWidth;
      const below = innerHeight - r.bottom;
      const up = below < h + gap + edge && r.top > below;
      setSide(up ? "top" : "bottom");
      let left = align === "end" ? r.right - w : r.left;
      left = Math.min(Math.max(edge, left), width - w - edge);
      const top = up ? Math.max(edge, r.top - h - gap) : Math.min(r.bottom + gap, innerHeight - h - edge);
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(Math.max(edge, top))}px`;
    };
    place();
    const items = [...el.querySelectorAll<HTMLElement>("[role='menuitem']:not([aria-disabled='true'])")];
    (firstFocus.current === "last" ? items[items.length - 1] : items[0])?.focus();
    addEventListener("resize", place);
    addEventListener("scroll", place, true);
    return () => {
      removeEventListener("resize", place);
      removeEventListener("scroll", place, true);
      try {
        if (el.matches(":popover-open")) el.hidePopover();
      } catch {
        /* nothing to undo */
      }
    };
  }, [open, align]);

  // A press outside closes it, without stealing the press
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !button.current?.contains(t)) hide(false);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [open]);

  const choose = (a: MenuAction) => {
    if (a.disabled) return;
    hide(true);
    a.onSelect?.();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = [...e.currentTarget.querySelectorAll<HTMLElement>("[role='menuitem']:not([aria-disabled='true'])")];
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => list[(i + list.length) % list.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      // Handled here, so a dialog around the menu stays open
      e.stopPropagation();
      hide(true);
    } else if (e.key === "Tab") {
      hide(false);
      button.current?.focus();
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // Type-ahead: the next item starting with that letter
      const k = e.key.toLowerCase();
      const order = [...list.slice(at + 1), ...list.slice(0, at + 1)];
      order.find((n) => n.textContent?.trim().toLowerCase().startsWith(k))?.focus();
    } else return;
    e.preventDefault();
  };

  return (
    <>
      <style href="asc-menu-button" precedence="asc">{css}</style>
      <Button
        ref={button}
        variant={variant}
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        id={`${id}-button`}
        {...rest}
        onClick={() => (open ? hide(false) : show("first"))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show(e.key === "ArrowUp" ? "last" : "first");
          }
        }}
      >
        {children}
      </Button>
      <div
        ref={menu}
        id={`${id}-menu`}
        className="asc-menu"
        role="menu"
        popover="manual"
        aria-label={menuLabel}
        aria-labelledby={menuLabel ? undefined : `${id}-button`}
        hidden={!open}
        data-open={open || undefined}
        data-side={side}
        onKeyDown={onMenuKey}
      >
        {header != null && <div className="asc-menu__head">{header}</div>}
        {items.map((entry, i) => {
          if (!isAction(entry)) return <div key={`sep-${i}`} className="asc-menu__sep" role="separator" />;
          const inner = (
            <>
              {entry.icon}
              <span className="asc-menu__label">{entry.label}</span>
              {entry.hint != null && <span className="asc-menu__hint">{entry.hint}</span>}
            </>
          );
          const common = {
            role: "menuitem",
            tabIndex: -1,
            className: "asc-menu__item",
            "data-tone": entry.tone ?? "neutral",
            "aria-disabled": entry.disabled || undefined,
          } as const;
          return entry.href && !entry.disabled ? (
            <a key={entry.label} {...common} href={entry.href} onClick={() => choose(entry)}>{inner}</a>
          ) : (
            <button key={entry.label} type="button" {...common} onClick={() => choose(entry)}>{inner}</button>
          );
        })}
      </div>
    </>
  );
}
