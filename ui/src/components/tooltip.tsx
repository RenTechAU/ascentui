"use client";
/**
 * Tooltip: a short hint on hover and keyboard focus. Wraps one element, such as an icon button.
 * Reads the shared theme (@ascentui/tokens).
 */
import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";

const css = `@layer asc {
.asc-tip{position:relative;display:inline-flex}
.asc-tip__bubble{position:absolute;left:50%;z-index:50;width:max-content;max-width:240px;padding:var(--asc-space-4) var(--asc-space-8);border-radius:var(--asc-radius-sm);background:var(--asc-primary);color:var(--asc-on-primary);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);pointer-events:none;opacity:0;transform:translate(-50%,2px);transition:opacity var(--asc-duration),transform var(--asc-duration) var(--asc-ease)}
.asc-tip__bubble[data-side="top"]{bottom:calc(100% + 6px)}
.asc-tip__bubble[data-side="bottom"]{top:calc(100% + 6px);transform:translate(-50%,-2px)}
.asc-tip__bubble[data-open]{opacity:1;transform:translate(-50%,0)}
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
        <span role="tooltip" id={id} className="asc-tip__bubble" data-side={side} data-open={open || undefined}>
          {content}
        </span>
      </span>
    </>
  );
}
