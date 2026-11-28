"use client";
/**
 * PinInput: a short code, one box per digit, such as a sign-in code sent by text. Phones offer
 * the code from the message, pasting fills every box, typing moves on and Backspace moves back.
 * onComplete fires when the last digit is in. Built on the form kit (./field).
 */
import { useRef, useState, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from "react";
import { Field, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-pin{display:flex;gap:var(--asc-space-8)}
.asc-pin .asc-input{width:calc(var(--asc-control-lg) + var(--asc-space-4));height:calc(var(--asc-control-lg) * 1.25);flex:none}
.asc-pin__box{padding:0;text-align:center;font:500 var(--asc-text-xl)/1 var(--asc-font);font-variant-numeric:tabular-nums;caret-color:var(--asc-focus)}
}`;

export type PinInputProps = FieldParts & {
  /** How many digits. Usually 4 or 6 */
  length?: 4 | 5 | 6;
  value?: string;
  defaultValue?: string;
  /** Called on every change with the digits so far */
  onChange?: (code: string) => void;
  /** Called once all the boxes are filled */
  onComplete?: (code: string) => void;
  /** Show dots instead of digits, for a PIN someone chose */
  mask?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  /** Sends the code with a form, in a hidden input */
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

export function PinInput({
  label, description, error, hideLabel, required, length = 6, value, defaultValue = "", onChange, onComplete,
  mask = false, disabled, autoFocus, name, id, className, style, "aria-label": ariaLabel,
}: PinInputProps) {
  const [inner, setInner] = useState(defaultValue.replace(/\D/g, "").slice(0, length));
  const code = value !== undefined ? value : inner;
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  // The newest code, for focus moves that happen before React re-renders
  const latest = useRef(code);
  latest.current = code;

  const focus = (i: number) => {
    const el = boxes.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };
  const set = (next: string) => {
    next = next.replace(/\D/g, "").slice(0, length);
    if (next === code) return;
    latest.current = next;
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };
  /** Puts digits in from box i onward: one typed digit, or a whole pasted or autofilled code */
  const fill = (i: number, digits: string) => {
    if (!digits) return;
    const start = digits.length >= length ? 0 : Math.min(i, code.length);
    const next = (code.slice(0, start) + digits + code.slice(start + digits.length)).slice(0, length);
    set(next);
    focus(Math.min(start + digits.length, length - 1));
  };
  const keys = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (code[i]) set(code.slice(0, i) + code.slice(i + 1));
      else if (i > 0) {
        set(code.slice(0, i - 1) + code.slice(i));
        focus(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      set(code.slice(0, i) + code.slice(i + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (i < code.length) focus(i + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focus(code.length);
    }
  };
  const paste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text").replace(/\D/g, ""));
  };

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} group className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-pin-input" precedence="asc">{css}</style>
          <div className="asc-pin" role="group" aria-label={ariaLabel} aria-labelledby={c["aria-labelledby"]}>
            {Array.from({ length }, (_, i) => (
              <InputBox key={i} controlId={`${c.id}-${i}`} size="lg" invalid={!!c["aria-invalid"]} disabled={disabled}>
                <input
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  id={i === 0 ? c.id : `${c.id}-${i}`}
                  className="asc-input__el asc-pin__box"
                  type={mask ? "password" : "text"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  // Phones offer the code from a text message. Only the first box asks; the code is spread from there
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  autoFocus={autoFocus && i === 0}
                  disabled={disabled}
                  value={code[i] ?? ""}
                  aria-label={`Digit ${i + 1} of ${length}`}
                  aria-invalid={c["aria-invalid"]}
                  aria-required={c["aria-required"]}
                  aria-describedby={c["aria-describedby"]}
                  onFocus={() => (i > latest.current.length ? focus(latest.current.length) : boxes.current[i]?.select())}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    // Two digits means the box still held its old one: keep the new one
                    const old = code[i];
                    if (digits) fill(i, old && digits.length === 2 ? digits.replace(old, "") : digits);
                    else if (e.target.value === "") set(code.slice(0, i) + code.slice(i + 1));
                  }}
                  onKeyDown={(e) => keys(i, e)}
                  onPaste={(e) => paste(i, e)}
                />
              </InputBox>
            ))}
          </div>
          {name && <input type="hidden" name={name} value={code} />}
        </>
      )}
    </Field>
  );
}
