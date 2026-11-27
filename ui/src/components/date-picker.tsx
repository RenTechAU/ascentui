"use client";
/**
 * DatePicker: a day, a time, or both. It is the browser's own date and time input, styled to
 * match the other fields: phones show their native wheel or calendar, the format follows the
 * person's country, and screen readers already know it. Values are ISO strings.
 * Built on the form kit (./field).
 */
import { useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { affixIds, Field, ids, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-date{min-width:0;font-variant-numeric:tabular-nums;cursor:text}
.asc-date::-webkit-date-and-time-value{text-align:left;margin:0}
.asc-date::-webkit-datetime-edit{padding:0}
.asc-date::-webkit-datetime-edit-fields-wrapper{padding:0}
.asc-date[data-empty]:not(:focus)::-webkit-datetime-edit{color:var(--asc-placeholder)}
.asc-date::-webkit-calendar-picker-indicator{margin:0 0 0 var(--asc-space-4);padding:0;opacity:.5;cursor:pointer}
.asc-date::-webkit-calendar-picker-indicator:hover{opacity:.85}
.asc-input[data-disabled] .asc-date::-webkit-calendar-picker-indicator{cursor:not-allowed}
}`;

const TYPE = { date: "date", time: "time", datetime: "datetime-local" } as const;

export type DatePickerProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "size" | "prefix"> & FieldParts & {
  /** date: 2026-12-04. time: 09:30. datetime: 2026-12-04T09:30, in the person's own time zone */
  kind?: "date" | "time" | "datetime";
  /** An ISO string in the same shape as kind, or "" for empty */
  value?: string;
  defaultValue?: string;
  /** Called with the new ISO string, or "" when cleared */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** Earliest allowed, in the same shape as value */
  min?: string;
  /** Latest allowed, in the same shape as value */
  max?: string;
  /** For times: seconds between choices, e.g. 900 for every 15 minutes. For dates: days */
  step?: number;
  prefix?: ReactNode;
  size?: "sm" | "md" | "lg";
};

export function DatePicker({
  label, description, error, hideLabel, required, kind = "date", value, defaultValue, onChange, prefix, size = "md",
  id, className, style, disabled, readOnly, "aria-describedby": describedBy, ...rest
}: DatePickerProps) {
  const [typed, setTyped] = useState(defaultValue ?? "");
  const empty = (value !== undefined ? value : typed) === "";
  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-date-picker" precedence="asc">{css}</style>
          <InputBox controlId={c.id} size={size} invalid={!!c["aria-invalid"]} disabled={disabled} readOnly={readOnly} prefix={prefix}>
            <input
              {...rest}
              {...c}
              type={TYPE[kind]}
              value={value}
              defaultValue={defaultValue}
              onChange={(e) => {
                setTyped(e.target.value);
                onChange?.(e.target.value, e);
              }}
              disabled={disabled}
              readOnly={readOnly}
              className="asc-input__el asc-date"
              data-empty={empty || undefined}
              aria-describedby={ids(c["aria-describedby"], affixIds(c.id, prefix), describedBy)}
            />
          </InputBox>
        </>
      )}
    </Field>
  );
}
