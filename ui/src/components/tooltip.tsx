"use client";
/**
 * Tooltip: a short hint on hover and keyboard focus. Wraps one element, such as an icon button.
 * Reads the shared theme (@ascentui/tokens).
 */
import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

const css = `@layer asc {
.asc-tip{position:relative;display:inline-flex}
.asc-tip__bubble{--y:2px;position:absolute;left:50%;z-index:50;display:none;width:max-content;max-width:min(240px,calc(100vw - var(--asc-space-16)));padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-sm);background:var(--asc-primary);color:var(--asc-on-primary);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);pointer-events:none;opacity:0;transform:translate(calc(-50% + var(--asc-tip-shift,0px)),var(--y));transition:opacity var(--asc-duration),transform var(--asc-duration) var(--asc-ease),display var(--asc-duration) allow-discrete}
.asc-tip__bubble[data-side="top"]{bottom:calc(100% + 6px)}
.asc-tip__bubble[data-side="bottom"]{--y:-2px;top:calc(100% + 6px)}
.asc-tip__bubble[data-open]{--y:0px;display:block;opacity:1}
@starting-style{.asc-tip__bubble[data-open]{--y:2px;opacity:0}.asc-tip__bubble[data-side="bottom"][data-open]{--y:-2px}}
}`;

export type TooltipProps = {
  /** The hint. Keep it to a few words; anything longer belongs on the page */
  content: ReactNode;
  /** One focusable element, such as a button */
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
  /** Wait before showing on hover, so tooltips don't flicker as the pointer passes over */
  delay?: number;
};

export function Tooltip({ content, children, side = "top", delay = 400 }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Keep the bubble on screen: near an edge it slides sideways instead of running off the page.
  // Closed, it takes no room at all, so it can never make the page scroll sideways
  const bubble = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = bubble.current;
    if (!open || !el) return;
    el.style.setProperty("--asc-tip-shift", "0px");
    const r = el.getBoundingClientRect();
    const edge = 8;
    const width = document.documentElement.clientWidth;
    const shift = r.right > width - edge ? width - edge - r.right : r.left < edge ? edge - r.left : 0;
    el.style.setProperty("--asc-tip-shift", `${Math.round(shift)}px`);
  }, [open]);

  const trigger = isValidElement(children) ? cloneElement(children, { "aria-describedby": id }) : children;
  return (
    <>
      <style href="asc-tooltip" precedence="asc">{css}</style>
      <span
        className="asc-tip"
        onPointerEnter={(e) => e.pointerType === "mouse" && show(delay)}
        onPointerLeave={hide}
        onFocus={(e) => e.target.matches(":focus-visible") && show(0)}
        onBlur={hide}
      >
        {trigger}
        <span ref={bubble} role="tooltip" id={id} className="asc-tip__bubble" data-side={side} data-open={open || undefined}>
          {content}
        </span>
      </span>
    </>
  );
}
