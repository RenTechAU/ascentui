"use client";
/**
 * Switch: turns one setting on or off straight away, such as "Send reminder". A real checkbox
 * with the switch role, so screen readers say "on" and "off". Label beside it, optional help.
 * Built on the form kit (./field).
 */
import type { ComponentProps, ReactNode } from "react";
import { ChoiceField, ids } from "./field";

const css = `@layer asc {
.asc-choice:has(.asc-sw){--asc-choice-w:calc(var(--asc-control-sm) * 1.17)}
.asc-sw{--th:calc(var(--asc-control-sm) * .67);--tw:calc(var(--th) * 1.75);--gap:calc(var(--th) * .125);position:relative;display:inline-grid;width:var(--tw);height:var(--th);flex:none}
.asc-sw__input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit}
.asc-sw__track{position:relative;box-sizing:border-box;width:100%;height:100%;border-radius:var(--asc-radius-full);background:var(--asc-placeholder);transition:background-color var(--asc-duration)}
.asc-sw__thumb{position:absolute;top:var(--gap);left:var(--gap);width:calc(var(--th) - var(--gap) * 2);height:calc(var(--th) - var(--gap) * 2);border-radius:var(--asc-radius-full);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);transition:transform var(--asc-duration-slow) var(--asc-ease),background-color var(--asc-duration)}
.asc-choice__row:hover .asc-sw__input:not(:disabled):not(:checked)+.asc-sw__track{background:var(--asc-faint)}
.asc-sw__input:checked+.asc-sw__track{background:var(--asc-primary)}
.asc-sw__input:checked+.asc-sw__track .asc-sw__thumb{transform:translateX(calc(var(--tw) - var(--th)));background:var(--asc-on-primary)}
.asc-sw__input:focus-visible+.asc-sw__track{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-sw__input[aria-invalid="true"]+.asc-sw__track{box-shadow:0 0 0 1px var(--asc-danger)}
}`;

export type SwitchProps = Omit<ComponentProps<"input">, "type" | "size" | "role"> & {
  label?: ReactNode;
  /** A muted line under the label: what turning it on does */
  description?: ReactNode;
  error?: ReactNode;
  /** start puts the switch before the label; end puts it at the far end of the row, as in settings lists */
  placement?: "start" | "end";
};

export function Switch({ label, description, error, placement, required, disabled, id, className, style, "aria-describedby": describedBy, ...rest }: SwitchProps) {
  return (
    <ChoiceField label={label} description={description} error={error} id={id} required={required} disabled={disabled} placement={placement} className={className} style={style}>
      {(c) => (
        <span className="asc-sw">
          <style href="asc-switch" precedence="asc">{css}</style>
          <input
            {...rest}
            {...c}
            type="checkbox"
            role="switch"
            disabled={disabled}
            className="asc-sw__input"
            aria-describedby={ids(c["aria-describedby"], describedBy)}
          />
          <span className="asc-sw__track" aria-hidden>
            <span className="asc-sw__thumb" />
          </span>
        </span>
      )}
    </ChoiceField>
  );
}
