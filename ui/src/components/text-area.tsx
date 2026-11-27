"use client";
/**
 * TextArea: several lines of text. It grows with what is typed, between a minimum and a maximum
 * number of rows, then scrolls. An optional count warns as the limit gets close.
 * Built on the form kit (./field).
 */
import { useCallback, useLayoutEffect, useRef, useState, type ChangeEvent, type ComponentProps, type CSSProperties } from "react";
import { Field, ids, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-ta{--py:calc((var(--asc-control-md) - var(--asc-leading-sm)) / 2);display:block;padding-block:var(--py);line-height:var(--asc-leading-sm);resize:none;overflow-y:auto;field-sizing:content;min-height:calc(var(--min) * var(--asc-leading-sm) + var(--py) * 2);max-height:calc(var(--max) * var(--asc-leading-sm) + var(--py) * 2)}
.asc-ta-count{align-self:flex-end;margin-top:calc(var(--asc-space-2) * -1);color:var(--asc-faint);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);font-variant-numeric:tabular-nums}
.asc-ta-count[data-tone="warning"]{color:var(--asc-warning)}
.asc-ta-count[data-tone="danger"]{color:var(--asc-danger);font-weight:500}
}`;

export type TextAreaProps = Omit<ComponentProps<"textarea">, "rows"> & FieldParts & {
  /** Height when empty, in rows */
  minRows?: number;
  /** It grows up to this many rows, then scrolls */
  maxRows?: number;
  /** Show "120 / 500" under the box. Needs maxLength */
  showCount?: boolean;
};

const fieldSizing = () => typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

export function TextArea({
  label, description, error, hideLabel, required, minRows = 3, maxRows = 10, showCount = false,
  id, className, style, disabled, readOnly, maxLength, value, defaultValue, onChange, ref, "aria-describedby": describedBy, ...rest
}: TextAreaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const [typed, setTyped] = useState(() => String(defaultValue ?? "").length);
  const length = value !== undefined ? String(value).length : typed;

  // Browsers without CSS field-sizing grow the box here instead
  const fit = useCallback(() => {
    const el = inner.current;
    if (!el || fieldSizing()) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useLayoutEffect(fit, [fit, value]);

  const setRef = (el: HTMLTextAreaElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTyped(e.target.value.length);
    fit();
    onChange?.(e);
  };

  const counting = showCount && maxLength != null;
  const left = counting ? maxLength - length : 0;
  const near = counting && left <= Math.max(10, Math.round(maxLength * 0.1));
  const tone = !counting ? undefined : left <= 0 ? "danger" : near ? "warning" : undefined;
  const vars = { "--min": minRows, "--max": Math.max(minRows, maxRows) } as CSSProperties;

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-text-area" precedence="asc">{css}</style>
          <InputBox controlId={c.id} multiline invalid={!!c["aria-invalid"]} disabled={disabled} readOnly={readOnly}>
            <textarea
              {...rest}
              {...c}
              ref={setRef}
              rows={minRows}
              value={value}
              defaultValue={defaultValue}
              onChange={change}
              maxLength={maxLength}
              disabled={disabled}
              readOnly={readOnly}
              className="asc-input__el asc-ta"
              style={vars}
              aria-describedby={ids(c["aria-describedby"], counting && `${c.id}-limit`, describedBy)}
            />
          </InputBox>
          {counting && (
            <>
              <span className="asc-ta-count" data-tone={tone} aria-hidden>{length} / {maxLength}</span>
              <span className="asc-vh" id={`${c.id}-limit`}>Up to {maxLength} characters.</span>
              {/* Screen readers hear how many are left only once it matters, not on every key */}
              <span className="asc-vh" aria-live="polite">{near ? `${Math.max(0, left)} characters left` : ""}</span>
            </>
          )}
        </>
      )}
    </Field>
  );
}
