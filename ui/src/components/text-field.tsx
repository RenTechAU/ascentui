"use client";
/**
 * TextField: a single line of text, with its label, help and error. Optional prefix or suffix
 * such as "$", "kg" or an icon. Takes every native input attribute. Built on the form kit (./field).
 */
import type { ComponentProps, ReactNode } from "react";
import { affixIds, Field, ids, InputBox, type FieldParts } from "./field";

export type TextFieldProps = Omit<ComponentProps<"input">, "size" | "prefix"> & FieldParts & {
  /** Text or an icon before the value, e.g. "$" or a search icon */
  prefix?: ReactNode;
  /** Text or an icon after the value, e.g. "kg" or "%" */
  suffix?: ReactNode;
  /** 24, 28 or 32px high on a desk; 36 or 44px on touch screens. Matches Button */
  size?: "sm" | "md" | "lg";
};

export function TextField({
  label, description, error, hideLabel, required, prefix, suffix, size = "md",
  id, className, style, type = "text", disabled, readOnly, "aria-describedby": describedBy, ...rest
}: TextFieldProps) {
  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <InputBox controlId={c.id} size={size} invalid={!!c["aria-invalid"]} disabled={disabled} readOnly={readOnly} prefix={prefix} suffix={suffix}>
          <input
            {...rest}
            {...c}
            type={type}
            disabled={disabled}
            readOnly={readOnly}
            className="asc-input__el"
            aria-describedby={ids(c["aria-describedby"], affixIds(c.id, prefix, suffix), describedBy)}
          />
        </InputBox>
      )}
    </Field>
  );
}
