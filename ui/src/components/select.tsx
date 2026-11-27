"use client";
/**
 * Select: pick one from a short list. It is the browser's own select, styled to match the other
 * fields, so phones show their native picker and screen readers already know it.
 * Built on the form kit (./field).
 */
import { useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { affixIds, Field, ids, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-select__el{padding-right:calc(var(--px) + 20px);cursor:pointer;text-overflow:ellipsis;white-space:nowrap}
.asc-select__el[data-empty]{color:var(--asc-placeholder)}
.asc-select__el option{color:var(--asc-ink);background:var(--asc-surface)}
.asc-select__caret{position:absolute;right:var(--px);top:50%;width:14px;height:14px;margin-top:-7px;color:var(--asc-faint);pointer-events:none}
.asc-input[data-disabled] .asc-select__el{cursor:not-allowed}
}`;

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectGroup = { group: string; options: SelectOption[] };

export type SelectProps = Omit<ComponentProps<"select">, "size" | "prefix" | "multiple"> & FieldParts & {
  /** The choices. Use groups to put headings in a long list. Or pass <option> children instead */
  options?: (SelectOption | SelectGroup)[];
  /** Shown while nothing is chosen. When the field is required it cannot be picked again */
  placeholder?: string;
  /** An icon or text before the value */
  prefix?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const renderOption = (o: SelectOption) => (
  <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
);

export function Select({
  label, description, error, hideLabel, required, options, placeholder, prefix, size = "md",
  id, className, style, disabled, value, defaultValue, onChange, children, "aria-describedby": describedBy, ...rest
}: SelectProps) {
  // Tracks whether the placeholder is showing, so it can look like a placeholder
  const [picked, setPicked] = useState(String(defaultValue ?? ""));
  const empty = (value !== undefined ? String(value) : picked) === "";
  const change = (e: ChangeEvent<HTMLSelectElement>) => {
    setPicked(e.target.value);
    onChange?.(e);
  };
  const startEmpty = placeholder != null && value === undefined && defaultValue === undefined ? "" : defaultValue;

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-select" precedence="asc">{css}</style>
          <InputBox controlId={c.id} size={size} invalid={!!c["aria-invalid"]} disabled={disabled} prefix={prefix}>
            <select
              {...rest}
              {...c}
              value={value}
              defaultValue={startEmpty}
              onChange={change}
              disabled={disabled}
              className="asc-input__el asc-select__el"
              data-empty={(placeholder != null && empty) || undefined}
              aria-describedby={ids(c["aria-describedby"], affixIds(c.id, prefix), describedBy)}
            >
              {placeholder != null && <option value="" disabled={required}>{placeholder}</option>}
              {options?.map((o) =>
                "group" in o ? <optgroup key={o.group} label={o.group}>{o.options.map(renderOption)}</optgroup> : renderOption(o),
              )}
              {children}
            </select>
            <svg className="asc-select__caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 6.5 8 10l3.5-3.5" />
            </svg>
          </InputBox>
        </>
      )}
    </Field>
  );
}
