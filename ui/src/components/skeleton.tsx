"use client";
/**
 * Skeleton: grey placeholders in the shape of what is loading, so the page doesn't jump when the
 * data arrives. A soft shimmer runs across them, and stops if the device asks for less motion.
 * Reads the shared theme (@ascentui/tokens).
 */
import type { CSSProperties, HTMLAttributes } from "react";

const css = `@layer asc {
.asc-sk{display:block;border-radius:var(--asc-radius-sm);background:linear-gradient(90deg,var(--asc-subtle-strong) 0%,var(--asc-subtle) 50%,var(--asc-subtle-strong) 100%) 0 0/200% 100%;animation:asc-sk 1.4s ease-in-out infinite}
.asc-sk[data-shape="circle"]{border-radius:var(--asc-radius-full)}
.asc-sk-lines{display:flex;flex-direction:column;gap:var(--asc-space-8)}
@keyframes asc-sk{from{background-position:100% 0}to{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.asc-sk{animation:none}}
}`;

export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** CSS width, e.g. 120 or "60%". Defaults to the full width */
  width?: CSSProperties["width"];
  /** CSS height. Defaults to one line of text */
  height?: CSSProperties["height"];
  /** circle for avatars */
  shape?: "rect" | "circle";
  /** Draw a paragraph of this many lines instead of one block; the last line is shorter */
  lines?: number;
};

export function Skeleton({ width = "100%", height = 12, shape = "rect", lines, className, style, ...rest }: SkeletonProps) {
  const block = (key: number | undefined, w: CSSProperties["width"]) => (
    <span key={key} className={["asc-sk", className].filter(Boolean).join(" ")} data-shape={shape} style={{ width: w, height, ...style }} />
  );
  return (
    <>
      <style href="asc-skeleton" precedence="asc">{css}</style>
      {/* One label for the whole placeholder; the grey shapes themselves are hidden from screen readers */}
      <span role="status" aria-label="Loading" {...rest}>
        {lines && lines > 1 ? (
          <span className="asc-sk-lines" aria-hidden>
            {Array.from({ length: lines }, (_, i) => block(i, i === lines - 1 ? "60%" : width))}
          </span>
        ) : (
          <span aria-hidden style={{ display: "contents" }}>{block(undefined, shape === "circle" ? height : width)}</span>
        )}
      </span>
    </>
  );
}
