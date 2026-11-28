"use client";
/**
 * PullToRefresh: wraps a scrolling list. Pull down from the top on a touch screen and let go to
 * reload it: a spinner shows while your onRefresh runs. It stops the browser's own pull-to-refresh
 * and bounce inside the list, so the two never fight, and the page around it does not move.
 * A Refresh button does the same for mouse and keyboard users: always shown on desks, and on
 * touch screens it appears when the keyboard reaches it.
 * The list follows the finger directly; the spring back stops for people who ask for less motion.
 * Built from Button and Spinner. Reads the shared theme (@ascentui/tokens).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "./button";
import { Spinner } from "./spinner";

const css = `@layer asc {
.asc-ptr{position:relative;box-sizing:border-box;height:100%;min-height:0;overflow-y:auto;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch}
.asc-ptr__bar{display:flex;justify-content:flex-end;align-items:center;gap:var(--asc-space-8);padding:var(--asc-space-4) var(--asc-space-8);color:var(--asc-muted);font:400 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-ptr__bar[data-button="none"]{display:none}
@media (pointer:coarse){
  .asc-ptr__bar[data-button="auto"]:not(:focus-within){position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}
}
.asc-ptr__spot{position:absolute;top:0;left:0;right:0;z-index:0;display:flex;justify-content:center;height:0;pointer-events:none}
.asc-ptr__ring{display:grid;place-items:center;box-sizing:border-box;width:var(--asc-control-lg);height:var(--asc-control-lg);margin-top:calc(var(--asc-ptr-y,0px) - var(--asc-control-lg) - var(--asc-space-4));border-radius:var(--asc-radius-full);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);color:var(--asc-ink);opacity:var(--asc-ptr-o,0);transition:margin-top var(--asc-duration-slow) var(--asc-ease),opacity var(--asc-duration-slow) var(--asc-ease)}
.asc-ptr__ring svg{width:16px;height:16px;transform:rotate(var(--asc-ptr-r,0deg));transition:transform var(--asc-duration) var(--asc-ease)}
.asc-ptr__body{position:relative;z-index:1;translate:0 var(--asc-ptr-y,0px);transition:translate var(--asc-duration-slow) var(--asc-ease)}
.asc-ptr[data-pulling] .asc-ptr__body,.asc-ptr[data-pulling] .asc-ptr__ring{transition:none}
.asc-ptr__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
}`;

export type PullToRefreshLabels = {
  refresh: string;
  refreshing: string;
  done: string;
};

const LABELS: PullToRefreshLabels = { refresh: "Refresh", refreshing: "Refreshing", done: "Up to date" };

export type PullToRefreshProps = {
  /** Reloads the list. The spinner shows until the promise settles; show any error yourself, e.g. with a toast */
  onRefresh: () => Promise<unknown>;
  /** The list */
  children: ReactNode;
  /** How far to pull, in px, before letting go refreshes */
  threshold?: number;
  /** The Refresh button. auto: shown on desks, and on touch screens when the keyboard reaches it.
   *  none: you put a refresh control somewhere else */
  button?: "auto" | "always" | "none";
  /** Something to show beside the Refresh button, e.g. "Updated 2 min ago" */
  status?: ReactNode;
  disabled?: boolean;
  /** Words for other languages */
  labels?: Partial<PullToRefreshLabels>;
  /** The scroll area's name for screen readers, e.g. "Today's visits" */
  "aria-label"?: string;
  className?: string;
  /** Give it a height (or put it in a box that has one): it is the part that scrolls */
  style?: CSSProperties;
};

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13.25 8A5.25 5.25 0 1 1 11.5 4.1M13.25 2.5v3h-3" />
  </svg>
);

export function PullToRefresh({
  onRefresh, children, threshold = 72, button = "auto", status, disabled, labels: labelsIn, "aria-label": ariaLabel, className, style,
}: PullToRefreshProps) {
  const labels = { ...LABELS, ...labelsIn };
  const box = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [say, setSay] = useState("");
  const busyRef = useRef(false);
  const run = useRef(onRefresh);
  run.current = onRefresh;
  const opts = useRef({ threshold, disabled });
  opts.current = { threshold, disabled };

  const show = (y: number, o: number, r = 0) => {
    const el = box.current;
    if (!el) return;
    el.style.setProperty("--asc-ptr-y", `${y}px`);
    el.style.setProperty("--asc-ptr-o", String(o));
    el.style.setProperty("--asc-ptr-r", `${r}deg`);
  };

  const refresh = async () => {
    if (busyRef.current || opts.current.disabled) return;
    busyRef.current = true;
    setBusy(true);
    setSay(labels.refreshing);
    // Holds the spinner in view while it works
    show(opts.current.threshold * 0.75, 1);
    try {
      await run.current();
      setSay(labels.done);
    } catch {
      setSay("");
    } finally {
      busyRef.current = false;
      setBusy(false);
      show(0, 0);
    }
  };
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Touch only: a mouse has the button. Listeners are not passive, so the pull can stop the page bouncing
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let dist = 0;
    const resist = (dy: number) => {
      const t = opts.current.threshold;
      const d = dy * 0.55;
      return d < t ? d : t + (d - t) * 0.25;
    };
    const ts = (e: TouchEvent) => {
      if (e.touches.length !== 1 || busyRef.current || opts.current.disabled || el.scrollTop > 0) return (start = null);
      const t = e.touches[0]!;
      start = { x: t.clientX, y: t.clientY };
      pulling = false;
      dist = 0;
    };
    const tm = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0]!;
      const dy = t.clientY - start.y;
      const dx = t.clientX - start.x;
      if (!pulling) {
        if (dy < 0 || el.scrollTop > 0) return (start = null);
        if (dy < 6) return;
        if (Math.abs(dx) > dy) return (start = null);
        pulling = true;
        el.setAttribute("data-pulling", "");
      }
      if (e.cancelable) e.preventDefault();
      dist = Math.max(0, resist(dy));
      const th = opts.current.threshold;
      show(dist, Math.min(1, dist / th), dist >= th ? 180 : 0);
      el.toggleAttribute("data-armed", dist >= th);
    };
    const te = () => {
      if (!start) return;
      start = null;
      if (!pulling) return;
      pulling = false;
      el.removeAttribute("data-pulling");
      el.removeAttribute("data-armed");
      if (dist >= opts.current.threshold) void refreshRef.current();
      else show(0, 0);
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    el.addEventListener("touchcancel", te);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", te);
    };
  }, []);

  return (
    <>
      <style href="asc-pull-to-refresh" precedence="asc">{css}</style>
      <div
        ref={box}
        className={["asc-ptr", className].filter(Boolean).join(" ")}
        style={style}
        role="region"
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        tabIndex={ariaLabel ? 0 : undefined}
      >
        <div className="asc-ptr__bar" data-button={button}>
          {status != null && <span>{status}</span>}
          <Button variant="ghost" size="sm" icon={<RefreshIcon />} loading={busy} disabled={disabled} onClick={() => void refresh()}>
            {labels.refresh}
          </Button>
        </div>
        <div className="asc-ptr__spot" aria-hidden>
          <span className="asc-ptr__ring">{busy ? <Spinner /> : <Arrow />}</span>
        </div>
        <div className="asc-ptr__body">{children}</div>
        <span className="asc-ptr__vh" role="status">{say}</span>
      </div>
    </>
  );
}
