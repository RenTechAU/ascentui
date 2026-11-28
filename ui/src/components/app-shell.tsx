"use client";
/**
 * AppShell: the frame every screen sits in. On a desk: a sidebar (brand, groups of links with
 * icons and counts, collapsible to an icon rail) and a top bar (title or breadcrumb, search,
 * actions, account menu). On a phone: the same top bar, a tab bar along the bottom for up to five
 * places, and the full sidebar as a drawer behind a menu button.
 * It switches by its own width, not the window's, so it also works inside a preview or a panel.
 * Router-agnostic: links take an href (and any link component, such as Next's), or an onSelect.
 * You say which item is current; the shell marks it for sight and for screen readers.
 * AccountMenu is the usual account slot: an avatar that opens a menu.
 * Built from IconButton, Drawer, Avatar and MenuButton. Reads the shared theme (@ascentui/tokens).
 */
import {
  useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type FocusEvent,
  type MouseEvent, type PointerEvent, type ReactNode,
} from "react";
import { Avatar } from "./avatar";
import { Drawer } from "./dialog";
import { IconButton } from "./icon-button";
import { MenuButton, type MenuEntry } from "./menu-button";

/** Below this width (of the shell, not the window) it uses the phone layout */
const PHONE = 640;

// The phone rules are written once and used twice: when the shell is narrow, and when layout="phone"
const phone = (s: string) => `
${s} .asc-shell__side{display:none}
${s} .asc-shell__toggle{display:none}
${s} .asc-shell__menu{display:inline-flex}
${s} .asc-shell__tabs{display:grid}
${s} .asc-shell__top{padding-left:var(--asc-space-8)}
${s} .asc-shell__main{padding:var(--asc-space-16) var(--asc-space-12)}
`;

const css = `@layer asc {
.asc-shell{container:asc-shell / inline-size;position:relative;box-sizing:border-box;height:100dvh;min-height:0;overflow:hidden;background:var(--asc-page);color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-shell__frame{display:flex;height:100%;min-height:0}
.asc-shell__skip{position:absolute;top:var(--asc-space-8);left:var(--asc-space-8);z-index:70;padding:var(--asc-space-6) var(--asc-space-12);border-radius:var(--asc-radius);background:var(--asc-primary);color:var(--asc-on-primary);font-weight:500;text-decoration:none;transform:translateY(calc(-100% - var(--asc-space-16)));transition:transform var(--asc-duration) var(--asc-ease)}
.asc-shell__skip:focus{transform:none;outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-shell__side{--w:240px;display:flex;flex-direction:column;flex:none;box-sizing:border-box;width:var(--w);min-height:0;border-right:1px solid var(--asc-border);transition:width var(--asc-duration-slow) var(--asc-ease)}
.asc-shell__side[data-collapsed]{--w:calc(var(--asc-control-md) + var(--asc-space-12) * 2 + 1px)}
.asc-shell__brand{display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;height:calc(var(--asc-control-lg) + var(--asc-space-16));padding:0 var(--asc-space-16);font-weight:600;white-space:nowrap;overflow:hidden;flex:none}
.asc-shell__side[data-collapsed] .asc-shell__brand{justify-content:center;padding:0}
.asc-shell__nav{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:var(--asc-space-4) var(--asc-space-12) var(--asc-space-12);scrollbar-width:thin}
.asc-shell__group+.asc-shell__group{margin-top:var(--asc-space-16)}
.asc-shell__group-label{margin:0 0 var(--asc-space-4);padding:0 var(--asc-space-8);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asc-shell__side[data-collapsed] .asc-shell__group-label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.asc-shell__side[data-collapsed] .asc-shell__group+.asc-shell__group{margin-top:var(--asc-space-8);padding-top:var(--asc-space-8);border-top:1px solid var(--asc-border)}
.asc-shell__list{display:flex;flex-direction:column;gap:var(--asc-space-2);margin:0;padding:0;list-style:none}
.asc-shell__item{position:relative;display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;width:100%;min-height:var(--asc-control-md);padding:0 var(--asc-space-8);border:0;border-radius:var(--asc-radius);background:none;color:var(--asc-muted);font:500 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);text-align:left;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color var(--asc-duration),color var(--asc-duration)}
.asc-shell__item:hover{background:var(--asc-subtle-strong);color:var(--asc-ink)}
.asc-shell__item:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-shell__item[aria-current="page"]{background:var(--asc-subtle-strong);color:var(--asc-ink)}
.asc-shell__item svg{width:16px;height:16px;flex:none}
.asc-shell__icon{display:inline-grid;place-items:center;flex:none;width:16px;height:16px}
.asc-shell__label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-shell__count{flex:none;min-width:18px;height:18px;padding:0 var(--asc-space-4);box-sizing:border-box;border-radius:var(--asc-radius-full);background:var(--asc-subtle-strong);color:var(--asc-muted);font:500 11px/18px var(--asc-font);text-align:center;font-variant-numeric:tabular-nums}
.asc-shell__item[aria-current="page"] .asc-shell__count{background:var(--asc-primary);color:var(--asc-on-primary)}
.asc-shell__side[data-collapsed] .asc-shell__item{justify-content:center;padding:0;width:var(--asc-control-md)}
.asc-shell__side[data-collapsed] .asc-shell__label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.asc-shell__side[data-collapsed] .asc-shell__count{position:absolute;top:var(--asc-space-2);right:var(--asc-space-2);min-width:8px;width:8px;height:8px;padding:0;font-size:0;background:var(--asc-primary)}
.asc-shell__foot{flex:none;padding:var(--asc-space-12);border-top:1px solid var(--asc-border)}
.asc-shell__foot:empty{display:none}
.asc-shell__side[data-collapsed] .asc-shell__foot{display:none}
.asc-shell__tip{position:fixed;z-index:60;padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-sm);background:var(--asc-primary);color:var(--asc-on-primary);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);white-space:nowrap;pointer-events:none;transform:translateY(-50%)}
.asc-shell__body{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
.asc-shell__top{display:flex;align-items:center;gap:var(--asc-space-8);box-sizing:border-box;flex:none;height:calc(var(--asc-control-lg) + var(--asc-space-16));padding:0 var(--asc-space-16) 0 var(--asc-space-12);border-bottom:1px solid var(--asc-border)}
.asc-shell__menu{display:none}
.asc-shell__title{display:flex;align-items:center;gap:var(--asc-space-8);flex:1;min-width:0;overflow:hidden;font-weight:500;white-space:nowrap;text-overflow:ellipsis}
.asc-shell__search{display:flex;flex:0 1 auto;min-width:0}
.asc-shell__actions{display:flex;align-items:center;gap:var(--asc-space-4);flex:none}
.asc-shell__actions:empty,.asc-shell__search:empty{display:none}
.asc-shell__main{flex:1;min-height:0;overflow-y:auto;overscroll-behavior-y:contain;box-sizing:border-box;padding:var(--asc-space-24)}
.asc-shell__main:focus{outline:none}
.asc-shell__tabs{display:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);flex:none;margin:0;padding:0 var(--asc-space-4) env(safe-area-inset-bottom);list-style:none;border-top:1px solid var(--asc-border);background:var(--asc-surface)}
.asc-shell__tab{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--asc-space-2);box-sizing:border-box;width:100%;min-height:calc(var(--asc-control-md) + var(--asc-space-16));padding:var(--asc-space-6) var(--asc-space-2);border:0;background:none;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color var(--asc-duration)}
.asc-shell__tab svg{width:20px;height:20px}
.asc-shell__tab .asc-shell__icon{position:relative;width:20px;height:20px}
.asc-shell__tab .asc-shell__label{flex:none;max-width:100%;text-align:center}
.asc-shell__tab[aria-current="page"],.asc-shell__tab[data-current]{color:var(--asc-ink)}
.asc-shell__tab:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px;border-radius:var(--asc-radius)}
.asc-shell__tab .asc-shell__count{position:absolute;top:calc(var(--asc-space-4) * -1);left:calc(100% - var(--asc-space-6));min-width:16px;height:16px;line-height:16px;font-size:10px;background:var(--asc-primary);color:var(--asc-on-primary)}
.asc-shell__who{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-shell__who-detail{color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-shell__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.asc-shell-drawer.asc-dlg[data-kind="drawer"]{--w:300px;inset:0 auto 0 0;border-radius:0 var(--asc-radius-lg) var(--asc-radius-lg) 0}
.asc-shell-drawer.asc-dlg[data-kind="drawer"][open]{animation-name:asc-shell-drawer-in}
.asc-shell-drawer.asc-dlg[data-kind="drawer"][data-closing]{animation-name:asc-shell-drawer-out}
.asc-shell-drawer .asc-dlg__body{padding:0 var(--asc-space-12) var(--asc-space-16)}
.asc-shell-drawer .asc-dlg__head{margin-bottom:var(--asc-space-8)}
.asc-shell-drawer .asc-shell__item{min-height:var(--asc-control-lg)}
.asc-shell-drawer .asc-shell__foot{margin:var(--asc-space-16) calc(var(--asc-space-12) * -1) 0;padding-bottom:max(var(--asc-space-12),env(safe-area-inset-bottom))}
@keyframes asc-shell-drawer-in{from{transform:translateX(-100%)}}
@keyframes asc-shell-drawer-out{to{transform:translateX(-100%)}}
@media (max-width:640px){.asc-shell-drawer.asc-dlg[data-kind="drawer"]{width:min(var(--w),calc(100% - var(--asc-space-24)));border-radius:0 var(--asc-radius-lg) var(--asc-radius-lg) 0}}
@container asc-shell (max-width:${PHONE - 1}px){${phone('.asc-shell:not([data-layout="desk"])')}}
${phone('.asc-shell[data-layout="phone"]')}
}`;

// ---------------------------------------------------------------- types

export type ShellItem = {
  /** Unique and stable. Used for current and for tabs */
  id: string;
  label: string;
  /** A 16px stroke icon. The rail and the tab bar show only this, so give every item one */
  icon?: ReactNode;
  /** Where it goes. Rendered with linkComponent, or a plain <a> */
  href?: string;
  /** Runs when it is chosen. With no href the item is a button */
  onSelect?: () => void;
  /** A small count after the label, e.g. unassigned cases. Over 99 shows 99+ */
  count?: number;
  /** What the count means, read out with the label: "3 unassigned". Defaults to the number */
  countLabel?: string;
};

export type ShellGroup = {
  /** A small heading over the group. Leave it out for the first group */
  label?: string;
  items: ShellItem[];
};

export type AppShellLabels = {
  skip: string;
  nav: string;
  tabs: string;
  menu: string;
  more: string;
  collapse: string;
  expand: string;
  content: string;
};

const LABELS: AppShellLabels = {
  skip: "Skip to content",
  nav: "Main",
  tabs: "Tabs",
  menu: "Open menu",
  more: "More",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  content: "Content",
};

export type AppShellProps = {
  /** Your logo and name, at the top of the sidebar and the phone menu */
  brand?: ReactNode;
  /** A small mark for the collapsed rail. Defaults to nothing */
  brandMark?: ReactNode;
  /** The places in the app, in groups */
  nav: ShellGroup[];
  /** The id of the item for the screen being shown */
  current?: string;
  /** Instead of current: decide per item, e.g. (item) => pathname.startsWith(item.href) */
  isActive?: (item: ShellItem) => boolean;
  /** Ids for the phone tab bar, at most five. Defaults to the first items. When some items are left out, the last tab is More, which opens the full menu */
  tabs?: string[];
  /** The top bar's title, or a breadcrumb */
  title?: ReactNode;
  /** A search box or button, such as CommandMenuTrigger */
  search?: ReactNode;
  /** Buttons at the end of the top bar */
  actions?: ReactNode;
  /** The account slot at the far end of the top bar, usually AccountMenu */
  account?: ReactNode;
  /** At the bottom of the sidebar, e.g. a plan or help link. Hidden in the rail */
  sidebarFooter?: ReactNode;
  /** The screen */
  children?: ReactNode;
  /** Whether the desk sidebar is an icon rail. Leave out to let the shell keep it */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Opt in to remembering the rail choice in this browser, under this key */
  storageKey?: string;
  /** auto picks by the shell's own width (phone under 640px). desk or phone forces one */
  layout?: "auto" | "desk" | "phone";
  /** The element links render as, such as Next's Link. Gets href, className, aria-current and children */
  linkComponent?: ElementType;
  /** Use header, nav and main landmarks. Turn off only when the shell sits inside another page's main, as in a preview */
  landmarks?: boolean;
  /** Words on the controls, for other languages */
  labels?: Partial<AppShellLabels>;
  className?: string;
  style?: CSSProperties;
};

// ---------------------------------------------------------------- icons

const Svg = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const MENU = "M2.5 4.5h11M2.5 8h11M2.5 11.5h11";
const PANEL = "M2.5 3h11v10h-11zM6 3v10";
const MORE = "M3.5 8h.01M8 8h.01M12.5 8h.01";

const nf = new Intl.NumberFormat();
const countText = (n: number) => (n > 99 ? `${nf.format(99)}+` : nf.format(n));

function readStored(key: string): boolean | undefined {
  try {
    const v = localStorage.getItem(key);
    return v === "1" ? true : v === "0" ? false : undefined;
  } catch {
    return undefined;
  }
}
function writeStored(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? "1" : "0");
  } catch {
    /* private mode or full: it works for this visit only */
  }
}

// ---------------------------------------------------------------- one link

type LinkProps = {
  item: ShellItem;
  active: boolean;
  kind: "item" | "tab";
  Link: ElementType;
  onChosen?: () => void;
  tip?: (e: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>, label: string | null) => void;
};

function NavLink({ item, active, kind, Link, onChosen, tip }: LinkProps) {
  const cls = kind === "tab" ? "asc-shell__tab" : "asc-shell__item";
  const label = item.count ? `${item.label}, ${item.countLabel ?? nf.format(item.count)}` : item.label;
  const inner = (
    <>
      <span className="asc-shell__icon" aria-hidden>
        {item.icon}
        {kind === "tab" && item.count ? <span className="asc-shell__count">{countText(item.count)}</span> : null}
      </span>
      <span className="asc-shell__label">{item.label}</span>
      {item.count ? (
        <>
          {kind === "item" && <span className="asc-shell__count" aria-hidden>{countText(item.count)}</span>}
          <span className="asc-shell__vh">, {item.countLabel ?? nf.format(item.count)}</span>
        </>
      ) : null}
    </>
  );
  const events = {
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (!item.href) e.preventDefault();
      item.onSelect?.();
      onChosen?.();
    },
    onPointerEnter: tip && ((e: PointerEvent<HTMLElement>) => e.pointerType === "mouse" && tip(e, label)),
    onPointerLeave: tip && ((e: PointerEvent<HTMLElement>) => tip(e, null)),
    onFocus: tip && ((e: FocusEvent<HTMLElement>) => e.currentTarget.matches(":focus-visible") && tip(e, label)),
    onBlur: tip && ((e: FocusEvent<HTMLElement>) => tip(e, null)),
  };
  return item.href ? (
    <Link href={item.href} className={cls} aria-current={active ? "page" : undefined} {...events}>{inner}</Link>
  ) : (
    <button type="button" className={cls} aria-current={active ? "page" : undefined} {...events}>{inner}</button>
  );
}

// ---------------------------------------------------------------- the shell

export function AppShell({
  brand, brandMark, nav, current, isActive, tabs, title, search, actions, account, sidebarFooter, children,
  collapsed, defaultCollapsed = false, onCollapsedChange, storageKey, layout = "auto", linkComponent = "a",
  landmarks = true, labels: labelsIn, className, style,
}: AppShellProps) {
  const labels = { ...LABELS, ...labelsIn };
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const [drawer, setDrawer] = useState(false);
  const [inner, setInner] = useState(defaultCollapsed);
  const rail = collapsed ?? inner;
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);

  // The remembered rail choice is read after the first paint, so server and browser agree
  useLayoutEffect(() => {
    if (!storageKey || collapsed !== undefined) return;
    const v = readStored(storageKey);
    if (v !== undefined) setInner(v);
  }, [storageKey, collapsed]);

  const setRail = (v: boolean) => {
    if (collapsed === undefined) setInner(v);
    if (storageKey) writeStored(storageKey, v);
    onCollapsedChange?.(v);
  };

  // Growing past phone width closes the phone menu
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => {
      if (layout !== "phone" && el.clientWidth >= PHONE) setDrawer(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);
  useEffect(() => {
    if (!rail) setTip(null);
  }, [rail]);

  const all = nav.flatMap((g) => g.items);
  const activeOf = (item: ShellItem) => (isActive ? isActive(item) : item.id === current);

  // The tab bar: the chosen ids, or the first items. Room is kept for More when some are left out
  let tabItems = (tabs ? tabs.map((t) => all.find((i) => i.id === t)).filter((i): i is ShellItem => !!i) : all).slice(0, 5);
  const leftOut = all.length > tabItems.length;
  if (leftOut && tabItems.length === 5) tabItems = tabItems.slice(0, 4);
  const more = leftOut;
  const currentInTabs = tabItems.some(activeOf);
  const anyActive = all.some(activeOf);

  const showTip = (e: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>, label: string | null) => {
    if (!rail || label == null) return setTip(null);
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, x: r.right + 8, y: r.top + r.height / 2 });
  };

  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    mainRef.current?.focus();
  };

  const groups = (where: "side" | "drawer") =>
    nav.map((g, gi) => (
      <div key={g.label ?? gi} className="asc-shell__group" role={g.label ? "group" : undefined} aria-labelledby={g.label ? `${id}-${where}-g${gi}` : undefined}>
        {g.label && <p className="asc-shell__group-label" id={`${id}-${where}-g${gi}`}>{g.label}</p>}
        <ul className="asc-shell__list">
          {g.items.map((item) => (
            <li key={item.id}>
              <NavLink
                item={item}
                active={activeOf(item)}
                kind="item"
                Link={linkComponent}
                tip={where === "side" ? showTip : undefined}
                onChosen={where === "drawer" ? () => setDrawer(false) : undefined}
              />
            </li>
          ))}
        </ul>
      </div>
    ));

  const Nav = landmarks ? "nav" : "div";
  const Header = landmarks ? "header" : "div";
  const Main = landmarks ? "main" : "div";

  return (
    <>
      <style href="asc-app-shell" precedence="asc">{css}</style>
      <div
        ref={root}
        className={["asc-shell", className].filter(Boolean).join(" ")}
        style={style}
        data-layout={layout}
      >
        <a className="asc-shell__skip" href={`#${id}-main`} onClick={skip}>{labels.skip}</a>
        <div className="asc-shell__frame">
          <div className="asc-shell__side" id={`${id}-side`} data-collapsed={rail || undefined}>
            <div className="asc-shell__brand">{rail ? brandMark : brand}</div>
            <Nav className="asc-shell__nav" aria-label={labels.nav} role={landmarks ? undefined : "navigation"}>{groups("side")}</Nav>
            {sidebarFooter != null && <div className="asc-shell__foot">{sidebarFooter}</div>}
          </div>
          <div className="asc-shell__body">
            <Header className="asc-shell__top">
              <IconButton
                className="asc-shell__toggle"
                icon={<Svg d={PANEL} />}
                label={rail ? labels.expand : labels.collapse}
                aria-expanded={!rail}
                aria-controls={`${id}-side`}
                onClick={() => setRail(!rail)}
              />
              <IconButton
                ref={menuBtn}
                className="asc-shell__menu"
                icon={<Svg d={MENU} />}
                label={labels.menu}
                tooltip={false}
                aria-haspopup="dialog"
                aria-expanded={drawer}
                onClick={() => setDrawer(true)}
              />
              <div className="asc-shell__title">{title}</div>
              <div className="asc-shell__search">{search}</div>
              <div className="asc-shell__actions">{actions}</div>
              {account}
            </Header>
            <Main
              ref={(n: HTMLElement | null) => {
                mainRef.current = n;
              }}
              id={`${id}-main`}
              className="asc-shell__main"
              tabIndex={-1}
              role={landmarks ? undefined : "region"}
              aria-label={landmarks ? undefined : labels.content}
            >
              {children}
            </Main>
            <Nav className="asc-shell__tabs" aria-label={labels.tabs} role={landmarks ? undefined : "navigation"}>
              {tabItems.map((item) => (
                <NavLink key={item.id} item={item} active={activeOf(item)} kind="tab" Link={linkComponent} />
              ))}
              {more && (
                <button
                  type="button"
                  className="asc-shell__tab"
                  data-current={(anyActive && !currentInTabs) || undefined}
                  aria-haspopup="dialog"
                  aria-expanded={drawer}
                  onClick={() => setDrawer(true)}
                >
                  <span className="asc-shell__icon" aria-hidden><Svg d={MORE} /></span>
                  <span className="asc-shell__label">{labels.more}</span>
                </button>
              )}
            </Nav>
          </div>
        </div>
        {tip && rail && (
          <span className="asc-shell__tip" aria-hidden style={{ left: tip.x, top: tip.y }}>{tip.label}</span>
        )}
        <Drawer
          open={drawer}
          onOpenChange={setDrawer}
          title={brand ?? labels.menu}
          className="asc-shell-drawer"
          closeLabel="Close menu"
        >
          <Nav aria-label={labels.nav} role={landmarks ? undefined : "navigation"}>{groups("drawer")}</Nav>
          {sidebarFooter != null && <div className="asc-shell__foot">{sidebarFooter}</div>}
        </Drawer>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- account menu

export type AccountMenuProps = {
  /** The signed-in person's full name */
  name: string;
  /** A second line, usually their email or company */
  detail?: ReactNode;
  /** Their photo. Initials show if it is missing or fails */
  src?: string;
  /** Profile, settings, sign out… "separator" draws a line */
  items: MenuEntry[];
  /** The button's name for screen readers */
  label?: string;
};

/** An avatar button that opens the account menu, with the person's name at the top */
export function AccountMenu({ name, detail, src, items, label = "Account" }: AccountMenuProps) {
  return (
    <MenuButton
      items={items}
      aria-label={`${label}: ${name}`}
      menuLabel={label}
      className="asc-shell__account"
      header={
        <>
          <style href="asc-app-shell" precedence="asc">{css}</style>
          <div className="asc-shell__who">{name}</div>
          {detail != null && <div className="asc-shell__who-detail">{detail}</div>}
        </>
      }
      icon={<Avatar name={name} src={src} size="sm" aria-hidden />}
    />
  );
}
