"use client";
/**
 * ListRow and List: the rows of a phone list. Each row is a comfortable thumb target (at least
 * 56px) with an avatar or icon, a one-line title, a second line, and a badge, figure or chevron
 * at the end. A row can be a link or a button.
 * Swipe actions, such as Archive, slide out from the right on touch screens. The same actions are
 * always in the row's More menu too, so keyboard, mouse and screen reader users have them as well.
 * List groups rows, with optional section headings that stay in view while their rows scroll.
 * Built from MenuButton. Reads the shared theme (@ascentui/tokens).
 */
import {
  useEffect, useId, useRef, useState, type CSSProperties, type ElementType, type HTMLAttributes,
  type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode,
} from "react";
import { MenuButton } from "./menu-button";

const css = `@layer asc {
.asc-list{margin:0;padding:0;list-style:none;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-list ul{margin:0;padding:0;list-style:none}
.asc-list[data-variant="card"]{border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);overflow:clip}
.asc-list__head{position:sticky;top:0;z-index:2;margin:0;padding:var(--asc-space-8) var(--asc-space-16) var(--asc-space-4);background:var(--asc-page);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-list[data-variant="card"] .asc-list__head{background:var(--asc-surface);border-bottom:1px solid var(--asc-border)}
.asc-row{position:relative;overflow:hidden;background:var(--asc-surface)}
.asc-row__under{position:absolute;inset:0 0 0 auto;display:flex}
.asc-row__act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--asc-space-2);box-sizing:border-box;min-width:calc(var(--asc-control-lg) + var(--asc-space-24) + var(--asc-space-16));padding:0 var(--asc-space-12);margin:0;border:0;background:var(--asc-primary);color:var(--asc-on-primary);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);cursor:pointer}
.asc-row__act svg{width:18px;height:18px}
.asc-row__act[data-tone="danger"]{background:var(--asc-danger);color:var(--asc-on-primary)}
.asc-row__act:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-3px}
.asc-row__front{position:relative;z-index:1;display:flex;align-items:center;background:var(--asc-surface);translate:var(--asc-row-x,0) 0;touch-action:pan-y;transition:translate var(--asc-duration-slow) var(--asc-ease)}
.asc-row[data-swiping] .asc-row__front{transition:none}
.asc-row:not(:last-child) .asc-row__front::after{content:"";position:absolute;left:var(--asc-space-16);right:0;bottom:0;height:1px;background:var(--asc-border);pointer-events:none}
.asc-row__main{display:flex;align-items:center;gap:var(--asc-space-12);flex:1;min-width:0;box-sizing:border-box;min-height:calc(var(--asc-control-lg) + var(--asc-space-24));margin:0;padding:var(--asc-space-8) var(--asc-space-16);border:0;background:none;color:inherit;font:inherit;text-align:left;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:background-color var(--asc-duration)}
.asc-row__main:is(a,button){cursor:pointer}
.asc-row__main:is(a,button):hover{background:var(--asc-subtle)}
.asc-row__main:is(a,button):active{background:var(--asc-subtle-strong)}
.asc-row__main:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-row[data-selected] .asc-row__main{background:var(--asc-subtle-strong)}
.asc-row[data-disabled] .asc-row__main{opacity:.45;cursor:not-allowed}
.asc-row__lead{display:inline-grid;place-items:center;flex:none;color:var(--asc-muted)}
.asc-row__lead>svg{width:20px;height:20px}
.asc-row__text{display:flex;flex-direction:column;flex:1;min-width:0}
.asc-row__title,.asc-row__desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-row__title{font-weight:500}
.asc-row__desc{color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-row__end{display:flex;align-items:center;gap:var(--asc-space-8);flex:none;color:var(--asc-muted);font-variant-numeric:tabular-nums}
.asc-row__chev{width:16px;height:16px;color:var(--asc-faint);flex:none}
.asc-row__more{flex:none;margin-right:var(--asc-space-8)}
}`;

export type RowAction = {
  /** One or two words: "Archive", "Call", "Delete" */
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  /** danger for delete. Others use the neutral primary colour */
  tone?: "neutral" | "danger";
};

export type ListRowProps = {
  /** One line; it is cut short with … when it does not fit */
  title: ReactNode;
  /** A second, muted line, such as an address or a time */
  description?: ReactNode;
  /** An Avatar or a 20px icon at the start */
  leading?: ReactNode;
  /** A Badge, an amount or a time at the end */
  trailing?: ReactNode;
  /** Makes the row a link */
  href?: string;
  /** Makes the row a button, or runs as well as following href */
  onClick?: () => void;
  /** The element links render as, such as Next's Link */
  linkComponent?: ElementType;
  /** A › at the end. On by default for links and buttons */
  chevron?: boolean;
  /** Actions revealed by swiping left on touch screens, and always in the row's More menu. First is nearest the row */
  actions?: RowAction[];
  /** The More button's name for screen readers. The row's title is read with it */
  moreLabel?: string;
  /** Shows the row as chosen, e.g. the open record beside a list */
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

const Chevron = () => (
  <svg className="asc-row__chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
    <path d="M3.5 8h.01M8 8h.01M12.5 8h.01" />
  </svg>
);

export function ListRow({
  title, description, leading, trailing, href, onClick, linkComponent = "a", chevron, actions, moreLabel = "More actions",
  selected, disabled, className, style,
}: ListRowProps) {
  const id = useId();
  const row = useRef<HTMLLIElement>(null);
  const under = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const drag = useRef<{ id: number; x0: number; y0: number; base: number; x: number; on: boolean; width: number; t: number } | null>(null);
  const swiped = useRef(false);
  const has = !!actions?.length;

  const setX = (x: number) => row.current?.style.setProperty("--asc-row-x", `${x}px`);
  const width = () => under.current?.offsetWidth ?? 0;
  const close = () => {
    setOpen(false);
    setX(0);
  };
  /** Runs an action. If it takes the row away (archive, delete), the keyboard moves on to the next row */
  const act = (a: RowAction) => {
    const li = row.current;
    const next = (li?.nextElementSibling ?? li?.previousElementSibling) as HTMLElement | null;
    close();
    a.onSelect();
    setTimeout(() => {
      if (li?.isConnected || !next?.isConnected) return;
      if (li && document.activeElement && document.activeElement !== document.body && document.activeElement.isConnected) return;
      next.querySelector<HTMLElement>(".asc-row__main")?.focus();
    }, 0);
  };

  // An open row closes when something else is touched
  useEffect(() => {
    if (!open) return;
    const away = (e: globalThis.PointerEvent) => !row.current?.contains(e.target as Node) && close();
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!has || disabled || e.pointerType === "mouse") return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, base: open ? -width() : 0, x: 0, on: false, width: width(), t: e.timeStamp };
    swiped.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dx) < 8) return;
      // Mostly up or down: it is a scroll, not a swipe
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      d.on = true;
      swiped.current = true;
      row.current?.setAttribute("data-swiping", "");
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    let x = d.base + dx;
    if (x > 0) x = x * 0.2;
    if (x < -d.width) x = -d.width + (x + d.width) * 0.3;
    d.x = x;
    d.t = e.timeStamp;
    setX(x);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.on) return;
    row.current?.removeAttribute("data-swiping");
    const reveal = d.x < -d.width / 2;
    setOpen(reveal);
    setX(reveal ? -d.width : 0);
  };

  const main = (
    <>
      {leading != null && <span className="asc-row__lead" aria-hidden={typeof leading === "string" ? undefined : true}>{leading}</span>}
      <span className="asc-row__text">
        <span className="asc-row__title" id={`${id}-title`}>{title}</span>
        {description != null && <span className="asc-row__desc">{description}</span>}
      </span>
      {(trailing != null || chevron || ((href || onClick) && chevron !== false)) && (
        <span className="asc-row__end">
          {trailing}
          {(chevron ?? !!(href || onClick)) && <Chevron />}
        </span>
      )}
    </>
  );

  const clickMain = (e: MouseEvent) => {
    // The tap that ends a swipe, or closes an open row, does not open the record
    if (swiped.current || open) {
      e.preventDefault();
      swiped.current = false;
      if (open) close();
      return;
    }
    if (disabled) return e.preventDefault();
    onClick?.();
  };

  const Link = linkComponent;
  const body = href ? (
    <Link className="asc-row__main" href={disabled ? undefined : href} aria-disabled={disabled || undefined} onClick={clickMain}>{main}</Link>
  ) : onClick ? (
    <button type="button" className="asc-row__main" disabled={disabled} onClick={clickMain}>{main}</button>
  ) : (
    <div className="asc-row__main">{main}</div>
  );

  const onKey = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
      row.current?.querySelector<HTMLElement>(".asc-row__main")?.focus();
    }
  };

  return (
    <li
      ref={row}
      className={["asc-row", className].filter(Boolean).join(" ")}
      style={style}
      data-open={open || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      onKeyDown={onKey}
    >
      <style href="asc-list-row" precedence="asc">{css}</style>
      {has && (
        // Only reachable once swiped open; the More menu is the way in otherwise
        <div className="asc-row__under" ref={under} inert={!open}>
          {actions!.map((a) => (
            <button
              key={a.label}
              type="button"
              className="asc-row__act"
              data-tone={a.tone ?? "neutral"}
              aria-describedby={`${id}-title`}
              onClick={() => act(a)}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="asc-row__front" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {body}
        {has && (
          <MenuButton
            className="asc-row__more"
            size="sm"
            icon={<MoreIcon />}
            aria-label={moreLabel}
            aria-describedby={`${id}-title`}
            disabled={disabled}
            items={actions!.map((a) => ({ label: a.label, icon: a.icon, tone: a.tone, onSelect: () => act(a) }))}
          />
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- List and ListSection

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  /** plain runs edge to edge, as on a phone; card sits in a rounded box */
  variant?: "plain" | "card";
};

/** Holds ListRows, or ListSections of them */
export function List({ variant = "plain", className, children, ...rest }: ListProps) {
  return (
    <>
      <style href="asc-list-row" precedence="asc">{css}</style>
      <ul className={["asc-list", className].filter(Boolean).join(" ")} data-variant={variant} {...rest}>{children}</ul>
    </>
  );
}

export type ListSectionProps = {
  /** The heading, e.g. "Today". It stays at the top while its rows scroll past */
  title: ReactNode;
  children: ReactNode;
  /** Heading level, so the page outline stays in order */
  level?: 2 | 3 | 4;
};

/** A titled group of rows inside a List */
export function ListSection({ title, children, level = 3 }: ListSectionProps) {
  const id = useId();
  const H = `h${level}` as const;
  return (
    <li>
      <H className="asc-list__head" id={id}>{title}</H>
      <ul aria-labelledby={id}>{children}</ul>
    </li>
  );
}
