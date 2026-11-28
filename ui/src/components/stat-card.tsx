"use client";
/**
 * StatCard: one number that matters, its label, and how it changed. The number counts up when it
 * first appears or changes (instantly if the device asks for less motion). Built on Card.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card } from "./card";

const css = `@layer asc {
.asc-stat__label{margin:0;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-stat__value{margin:var(--asc-space-4) 0 0;font:500 var(--asc-text-xl)/var(--asc-leading-xl) var(--asc-font);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.asc-stat__delta{margin:var(--asc-space-2) 0 0;font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);color:var(--asc-muted)}
.asc-stat__delta[data-trend="good"]{color:var(--asc-success)}
.asc-stat__delta[data-trend="bad"]{color:var(--asc-danger)}
.asc-stat .asc-card{gap:0}
}`;

export type StatCardProps = {
  label: ReactNode;
  /** A number counts up and is formatted for the reader's locale. A string shows as it is */
  value: number | string;
  /** How to format a number, e.g. { style: "currency", currency: "USD" } */
  format?: Intl.NumberFormatOptions;
  /** The change, in words: "6 fewer than last week" */
  delta?: ReactNode;
  /** good is green and bad is red, whichever way the number moved: fewer overdue invoices is good */
  trend?: "good" | "bad" | "neutral";
  className?: string;
};

function useCountUp(target: number, ms = 600) {
  const [shown, setShown] = useState(target);
  const from = useRef(0);
  useEffect(() => {
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return setShown(target);
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(begin + (target - begin) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

export function StatCard({ label, value, format, delta, trend = "neutral", className }: StatCardProps) {
  const numeric = typeof value === "number";
  const counted = useCountUp(numeric ? value : 0);
  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, ...format });
  return (
    <>
      <style href="asc-stat-card" precedence="asc">{css}</style>
      <div className={["asc-stat", className].filter(Boolean).join(" ")}>
        <Card>
          <p className="asc-stat__label">{label}</p>
          {/* Screen readers get the final value straight away, not every step of the count */}
          <p className="asc-stat__value" aria-label={numeric ? fmt.format(value) : undefined}>
            {numeric ? fmt.format(counted) : value}
          </p>
          {delta != null && (
            <p className="asc-stat__delta" data-trend={trend}>
              {delta}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
