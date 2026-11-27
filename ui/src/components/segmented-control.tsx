"use client";
/**
 * SegmentedControl: pick one of two to five options in a single row, such as Open / Scheduled /
 * Done. Real radio buttons underneath: arrow keys move between options, Tab leaves the group, and
 * the value goes with a form. A pill slides to the chosen option. Built on the form kit (./field).
 */
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Field, type FieldParts } from "./field";

const css = `@layer asc {
.asc-seg{--h:var(--asc-control-md);position:relative;display:inline-flex;box-sizing:border-box;max-width:100%;height:var(--h);padding:var(--asc-space-2);border-radius:var(--asc-radius);background:var(--asc-subtle-strong);overflow-x:auto;scrollbar-width:none;font:500 var(--asc-control-text)/1 var(--asc-font);-webkit-tap-highlight-color:transparent}
.asc-seg::-webkit-scrollbar{display:none}
.asc-seg[data-size="sm"]{--h:var(--asc-control-sm);border-radius:var(--asc-radius-sm)}
.asc-seg[data-full]{display:flex;width:100%}
.asc-seg__pill{position:absolute;top:var(--asc-space-2);bottom:var(--asc-space-2);left:0;border-radius:calc(var(--asc-radius) - 2px);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);pointer-events:none}
.asc-seg[data-size="sm"] .asc-seg__pill{border-radius:calc(var(--asc-radius-sm) - 2px)}
.asc-seg__pill[data-ready]{transition:transform var(--asc-duration-slow) var(--asc-ease),width var(--asc-duration-slow) var(--asc-ease)}
.asc-seg__opt{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:var(--asc-space-6);flex:none;box-sizing:border-box;padding:0 calc(var(--h) * .36);border-radius:calc(var(--asc-radius) - 2px);color:var(--asc-muted);white-space:nowrap;cursor:pointer;user-select:none;transition:color var(--asc-duration)}
.asc-seg[data-full] .asc-seg__opt{flex:1 1 0;min-width:max-content}
.asc-seg__opt:hover{color:var(--asc-ink)}
.asc-seg__opt[data-checked]{color:var(--asc-ink)}
.asc-seg__opt[data-disabled]{opacity:.45;cursor:not-allowed}
.asc-seg__opt:has(:focus-visible){outline:2px solid var(--asc-focus);outline-offset:0}
.asc-seg__input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit}
.asc-seg__count{display:inline-grid;place-items:center;min-width:16px;height:16px;padding:0 var(--asc-space-4);box-sizing:border-box;border-radius:var(--asc-radius-full);background:var(--asc-subtle-strong);color:var(--asc-muted);font-size:11px;font-weight:500;font-variant-numeric:tabular-nums}
.asc-seg[aria-invalid="true"]{box-shadow:0 0 0 1px var(--asc-danger)}
}`;

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  /** A small number after the label, e.g. how many cases are in that state */
  count?: number;
  disabled?: boolean;
  /** Needed when the label is only an icon */
  "aria-label"?: string;
};

export type SegmentedControlProps<T extends string = string> = FieldParts & {
  options: SegmentedOption<T>[];
  value?: T;
  /** Starting choice when uncontrolled. Defaults to the first option that is not disabled */
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** 24 or 28px high on a desk; 36 or 44px on touch screens */
  size?: "sm" | "md";
  /** Stretch to the container's width, with equal options */
  fullWidth?: boolean;
  /** Sends the value with a form */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Name the group when there is no visible label */
  "aria-label"?: string;
};

export function SegmentedControl<T extends string = string>({
  label, description, error, hideLabel, required, options, value, defaultValue, onChange, size = "md",
  fullWidth = false, name, disabled = false, id, className, style, "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  const auto = useId();
  const first = options.find((o) => !o.disabled)?.value;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? first);
  const current = value !== undefined ? value : inner;
  const track = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number; ready: boolean } | null>(null);

  // Measure the chosen option and move the pill there. Again whenever the row changes size
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const opt = el.querySelector<HTMLElement>("[data-checked]");
      if (!opt) return setPill(null);
      setPill((p) => ({ x: opt.offsetLeft, w: opt.offsetWidth, ready: p != null }));
    };
    measure();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [current, options.length, size, fullWidth]);

  const pick = (v: T) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} group className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-segmented-control" precedence="asc">{css}</style>
          <div
            ref={track}
            id={c.id}
            role="radiogroup"
            className="asc-seg"
            data-size={size}
            data-full={fullWidth || undefined}
            aria-label={ariaLabel}
            aria-labelledby={c["aria-labelledby"]}
            aria-describedby={c["aria-describedby"]}
            aria-invalid={c["aria-invalid"]}
            aria-required={c["aria-required"]}
            aria-disabled={disabled || undefined}
          >
            {pill && <span className="asc-seg__pill" aria-hidden data-ready={pill.ready || undefined} style={{ width: pill.w, transform: `translateX(${pill.x}px)` }} />}
            {options.map((o) => {
              const checked = o.value === current;
              const off = disabled || o.disabled;
              return (
                <label key={o.value} className="asc-seg__opt" data-checked={checked || undefined} data-disabled={off || undefined}>
                  <input
                    type="radio"
                    className="asc-seg__input"
                    name={name ?? auto}
                    value={o.value}
                    checked={checked}
                    disabled={off}
                    aria-label={o["aria-label"]}
                    onChange={() => pick(o.value)}
                  />
                  <span>{o.label}</span>
                  {o.count != null && <span className="asc-seg__count">{o.count}</span>}
                </label>
              );
            })}
          </div>
        </>
      )}
    </Field>
  );
}
