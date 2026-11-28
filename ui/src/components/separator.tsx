"use client";
/**
 * Separator: a hairline between groups, across or down, with an optional label in the middle.
 * Reads the shared theme (@ascentui/tokens).
 */
import type { HTMLAttributes, ReactNode } from "react";

const css = `@layer asc {
.asc-sep{flex:none;border:0;margin:0;background:var(--asc-border)}
.asc-sep[data-orientation="horizontal"]{height:1px;width:100%}
.asc-sep[data-orientation="vertical"]{width:1px;align-self:stretch;min-height:1em}
.asc-sep--label{display:flex;align-items:center;gap:var(--asc-space-8);width:100%;background:none;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-sep--label::before,.asc-sep--label::after{content:"";flex:1;height:1px;background:var(--asc-border)}
}`;

export type SeparatorProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  orientation?: "horizontal" | "vertical";
  /** Text in the middle, such as "or" or a date. Horizontal only */
  label?: ReactNode;
  /** Decorative lines are skipped by screen readers. Set false when the line separates real sections */
  decorative?: boolean;
};

export function Separator({ orientation = "horizontal", label, decorative = true, className, ...rest }: SeparatorProps) {
  const semantics = decorative ? { role: "none" } : { role: "separator", "aria-orientation": orientation };
  return (
    <>
      <style href="asc-separator" precedence="asc">{css}</style>
      <div
        className={["asc-sep", label != null && orientation === "horizontal" && "asc-sep--label", className].filter(Boolean).join(" ")}
        data-orientation={orientation}
        {...semantics}
        {...rest}
      >
        {orientation === "horizontal" && label}
      </div>
    </>
  );
}
