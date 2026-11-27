"use client";
/**
 * Spinner: a small ring that turns while something loads.
 * Reads the shared theme (@ascentui/tokens); colour follows the text around it.
 */
import type { HTMLAttributes } from "react";

const css = `@layer asc {
.asc-spin{display:inline-block;flex:none;width:var(--s,16px);height:var(--s,16px);border-radius:50%;border:1.5px solid currentColor;border-right-color:transparent;opacity:.75;animation:asc-spin .7s linear infinite}
.asc-spin[data-size="sm"]{--s:12px}.asc-spin[data-size="lg"]{--s:20px;border-width:2px}
@keyframes asc-spin{to{transform:rotate(1turn)}}
@media (prefers-reduced-motion:reduce){.asc-spin{animation-duration:1.6s}}
.asc-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
}`;

export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** 12, 16 or 20px */
  size?: "sm" | "md" | "lg";
  /** Read out by screen readers, e.g. "Loading cases". Leave out when the spinner sits inside a labelled button */
  label?: string;
};

export function Spinner({ size = "md", label, className, ...rest }: SpinnerProps) {
  return (
    <>
      <style href="asc-spinner" precedence="asc">{css}</style>
      <span role={label ? "status" : undefined} aria-hidden={label ? undefined : true} {...rest}>
        <span className={["asc-spin", className].filter(Boolean).join(" ")} data-size={size} />
        {label && <span className="asc-sr">{label}</span>}
      </span>
    </>
  );
}
