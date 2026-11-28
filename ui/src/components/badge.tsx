"use client";
/**
 * Badge: a short status label. The words carry the meaning; colour only reinforces it.
 * Reads the shared theme (@ascentui/tokens).
 */
import type { HTMLAttributes } from "react";

const css = `@layer asc {
.asc-badge{display:inline-flex;align-items:center;gap:var(--asc-space-4);height:20px;padding:0 var(--asc-space-6);border-radius:var(--asc-radius-sm);background:var(--asc-subtle-strong);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);white-space:nowrap;vertical-align:middle;font-variant-numeric:tabular-nums}
.asc-badge[data-size="sm"]{height:18px;padding:0 var(--asc-space-4);font-size:11px}
.asc-badge__dot{width:6px;height:6px;border-radius:var(--asc-radius-full);background:currentColor;flex:none}
.asc-badge[data-tone="info"]{background:var(--asc-info-soft);color:var(--asc-info)}
.asc-badge[data-tone="success"]{background:var(--asc-success-soft);color:var(--asc-success)}
.asc-badge[data-tone="warning"]{background:var(--asc-warning-soft);color:var(--asc-warning)}
.asc-badge[data-tone="danger"]{background:var(--asc-danger-soft);color:var(--asc-danger)}
}`;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** neutral: no urgency. info: in progress. success: done or paid. warning: needs attention soon. danger: overdue or failed */
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  /** A leading dot, for live statuses that change */
  dot?: boolean;
  size?: "sm" | "md";
};

export function Badge({ tone = "neutral", dot = false, size = "md", className, children, ...rest }: BadgeProps) {
  return (
    <>
      <style href="asc-badge" precedence="asc">{css}</style>
      <span className={["asc-badge", className].filter(Boolean).join(" ")} data-tone={tone} data-size={size} {...rest}>
        {dot && <span className="asc-badge__dot" aria-hidden />}
        {children}
      </span>
    </>
  );
}
