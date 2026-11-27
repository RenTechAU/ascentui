"use client";
/**
 * Checkbox: tick to agree or to pick several. A real checkbox, drawn to match the theme, with its
 * label beside it and optional help. Supports the in-between state for "some selected".
 * Built on the form kit (./field).
 */
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { ChoiceField, ids } from "./field";

const css = `@layer asc {
.asc-choice:has(.asc-cb){--asc-choice-w:calc(var(--asc-control-sm) * .67)}
.asc-cb{--s:calc(var(--asc-control-sm) * .67);position:relative;display:inline-grid;width:var(--s);height:var(--s);flex:none}
.asc-cb__input{position:absolute;inset:0;z-index:1;width:100%;height:100%;margin:0;opacity:0;cursor:inherit}
.asc-cb__box{display:grid;place-items:center;box-sizing:border-box;width:100%;height:100%;border-radius:calc(var(--asc-radius-sm) - 1px);background:var(--asc-surface);color:var(--asc-on-primary);box-shadow:inset 0 0 0 1px var(--asc-border-strong),var(--asc-shadow-control);transition:background-color var(--asc-duration),box-shadow var(--asc-duration)}
.asc-cb__box svg{grid-area:1/1;width:75%;height:75%;opacity:0;transform:scale(.6);transition:opacity var(--asc-duration),transform var(--asc-duration) var(--asc-ease)}
.asc-choice__row:hover .asc-cb__input:not(:disabled):not(:checked):not(:indeterminate)+.asc-cb__box{box-shadow:inset 0 0 0 1px var(--asc-faint),var(--asc-shadow-control-hover)}
.asc-cb__input:checked+.asc-cb__box,.asc-cb__input:indeterminate+.asc-cb__box{background:var(--asc-primary);box-shadow:none}
.asc-cb__input:checked:not(:indeterminate)+.asc-cb__box .asc-cb__tick,.asc-cb__input:indeterminate+.asc-cb__box .asc-cb__dash{opacity:1;transform:none}
.asc-cb__input:focus-visible+.asc-cb__box{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-cb__input[aria-invalid="true"]:not(:checked)+.asc-cb__box{box-shadow:inset 0 0 0 1px var(--asc-danger)}
}`;

export type CheckboxProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  label?: ReactNode;
  /** A muted line under the label */
  description?: ReactNode;
  /** What is wrong, e.g. "Accept the terms to continue" */
  error?: ReactNode;
  /** The in-between state, for a "select all" box when only some are selected */
  indeterminate?: boolean;
  /** start puts the box before the label; end puts it at the far end of the row */
  placement?: "start" | "end";
};

export function Checkbox({
  label, description, error, indeterminate = false, placement, required, disabled, id, className, style, ref,
  "aria-describedby": describedBy, ...rest
}: CheckboxProps) {
  const inner = useRef<HTMLInputElement | null>(null);
  // indeterminate is not an HTML attribute; it can only be set on the element
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const setRef = (el: HTMLInputElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  return (
    <ChoiceField label={label} description={description} error={error} id={id} required={required} disabled={disabled} placement={placement} className={className} style={style}>
      {(c) => (
        <span className="asc-cb">
          <style href="asc-checkbox" precedence="asc">{css}</style>
          <input
            {...rest}
            {...c}
            ref={setRef}
            type="checkbox"
            disabled={disabled}
            className="asc-cb__input"
            aria-describedby={ids(c["aria-describedby"], describedBy)}
          />
          <span className="asc-cb__box" aria-hidden>
            <svg className="asc-cb__tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5 6.5 11.5 12.5 5" /></svg>
            <svg className="asc-cb__dash" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><path d="M4 8h8" /></svg>
          </span>
        </span>
      )}
    </ChoiceField>
  );
}
