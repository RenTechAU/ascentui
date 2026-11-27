"use client";
/**
 * NumberInput: a number, with steppers, limits and the right keyboard on phones. The value is a
 * number, or null when empty. It is a text input underneath, not type="number", which changes
 * value when someone scrolls the page over it and mishandles commas in many countries.
 * Built on the form kit (./field).
 */
import { useEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { affixIds, Field, ids, InputBox, type FieldParts } from "./field";

const css = `@layer asc {
.asc-num__el{font-variant-numeric:tabular-nums}
.asc-num__steps{display:flex;align-self:stretch;flex:none}
.asc-num__step{display:inline-grid;place-items:center;box-sizing:border-box;width:var(--h);height:100%;margin:0;padding:0;border:0;border-left:1px solid var(--asc-border);background:transparent;color:var(--asc-muted);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:background-color var(--asc-duration),color var(--asc-duration)}
.asc-num__step:last-child{border-radius:0 var(--asc-radius) var(--asc-radius) 0}
.asc-input[data-size="sm"] .asc-num__step:last-child{border-radius:0 var(--asc-radius-sm) var(--asc-radius-sm) 0}
.asc-num__step:hover:not(:disabled){background:var(--asc-subtle-strong);color:var(--asc-ink)}
.asc-num__step:disabled{color:var(--asc-placeholder);cursor:not-allowed}
.asc-num__step svg{width:14px;height:14px}
}`;

export type NumberInputProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "size" | "prefix" | "min" | "max" | "step"> & FieldParts & {
  value?: number | null;
  defaultValue?: number | null;
  /** Called with the number as it is typed, and with null when the field is cleared */
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** How much the arrows and steppers add. PageUp and PageDown add ten times this */
  step?: number;
  /** How the number shows when the field is not being edited, e.g. { minimumFractionDigits: 2 } */
  format?: Intl.NumberFormatOptions;
  /** Text or an icon before the number, e.g. "$" */
  prefix?: ReactNode;
  /** Text after the number, e.g. "kg" or "%" */
  suffix?: ReactNode;
  /** Show the − and + buttons. On by default */
  steppers?: boolean;
  size?: "sm" | "md" | "lg";
};

const decimalsOf = (n: number) => (String(n).split(".")[1] ?? "").length;

function separators() {
  const parts = new Intl.NumberFormat().formatToParts(10000.5);
  return { group: parts.find((p) => p.type === "group")?.value ?? ",", decimal: parts.find((p) => p.type === "decimal")?.value ?? "." };
}

/** Reads what someone typed in their own country's style: "1,250.5" or "1.250,5". NaN if it is not a number */
function parse(text: string, sep: { group: string; decimal: string }) {
  let t = text.replace(/[\s  ]/g, "").split(sep.group).join("");
  if (sep.decimal !== ".") t = t.replace(sep.decimal, ".");
  t = t.replace(/[^0-9.\-]/g, "");
  if (t === "") return text.trim() === "" ? null : NaN;
  return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
    <path d={d} />
  </svg>
);

export function NumberInput({
  label, description, error, hideLabel, required, value, defaultValue = null, onChange, min, max, step = 1,
  format, prefix, suffix, steppers = true, size = "md", id, className, style, disabled, readOnly,
  onFocus, onBlur, onKeyDown, "aria-describedby": describedBy, ...rest
}: NumberInputProps) {
  const sep = useMemo(separators, []);
  const [inner, setInner] = useState<number | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const [editing, setEditing] = useState(false);
  const shown = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 10, ...format }), [format]);
  const raw = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 10, ...format, useGrouping: false, style: "decimal" }), [format]);
  const textOf = (n: number | null, edit = editing) => (n == null ? "" : (edit ? raw : shown).format(n));
  const [text, setText] = useState(() => textOf(current, false));

  // Follow a value set from outside, unless it is what is being typed right now
  const last = useRef(current);
  useEffect(() => {
    if (current === last.current) return;
    last.current = current;
    const typed = parse(text, sep);
    if (!editing || typed !== current) setText(textOf(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const commit = (n: number | null) => {
    last.current = n;
    if (value === undefined) setInner(n);
    if (n !== current) onChange?.(n);
  };
  const stepBy = (times: number) => {
    if (disabled || readOnly) return;
    const base = current ?? (min != null && min > 0 ? min - step * Math.sign(times) : 0);
    const places = Math.max(decimalsOf(step), decimalsOf(base));
    const next = clamp(Number((base + step * times).toFixed(places)));
    commit(next);
    setText(textOf(next));
  };

  // Press and hold a stepper to keep counting. stepBy is read through a ref so each tick sees the latest value
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stepRef = useRef(stepBy);
  stepRef.current = stepBy;
  const pressed = useRef(false);
  const stop = () => clearTimeout(hold.current);
  useEffect(() => stop, []);

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const move: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (move[e.key]) {
      e.preventDefault();
      stepBy(move[e.key]!);
    } else if (e.key === "Home" && min != null) {
      e.preventDefault();
      commit(min);
      setText(textOf(min));
    } else if (e.key === "End" && max != null) {
      e.preventDefault();
      commit(max);
      setText(textOf(max));
    } else if (e.key === "Enter") {
      finish(true);
    }
  };
  /** Tidies what was typed: keeps it inside the limits, or puts back the last number if it was not one */
  const finish = (edit: boolean) => {
    const n = parse(text, sep);
    const next = n == null ? null : Number.isNaN(n) ? current : clamp(n);
    commit(next);
    setText(textOf(next, edit));
  };

  const atMin = current != null && min != null && current <= min;
  const atMax = current != null && max != null && current >= max;
  const steps = steppers && !readOnly && (
    <span className="asc-num__steps">
      {([[-1, "Decrease", "M4 8h8", atMin], [1, "Increase", "M4 8h8M8 4v8", atMax]] as const).map(([dir, name, d, off]) => (
        <button
          key={name}
          type="button"
          tabIndex={-1}
          className="asc-num__step"
          aria-label={name}
          disabled={disabled || off}
          // Keeps the focus where it is, so a phone does not open its keyboard for a tap on + or −
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            pressed.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            stop();
            stepBy(dir);
            hold.current = setTimeout(function tick() {
              stepRef.current(dir);
              hold.current = setTimeout(tick, 60);
            }, 400);
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          // Screen readers click without a pointer
          onClick={() => (pressed.current ? (pressed.current = false) : stepBy(dir))}
        >
          <Icon d={d} />
        </button>
      ))}
    </span>
  );

  return (
    <Field label={label} description={description} error={error} hideLabel={hideLabel} required={required} id={id} className={className} style={style}>
      {(c) => (
        <>
          <style href="asc-number-input" precedence="asc">{css}</style>
          <InputBox controlId={c.id} size={size} invalid={!!c["aria-invalid"]} disabled={disabled} readOnly={readOnly} prefix={prefix} suffix={suffix} end={steps}>
            <input
              autoComplete="off"
              {...rest}
              {...c}
              type="text"
              // decimal brings up a number pad on phones. iPhone number pads have no minus key, so fields that allow negatives get the full keyboard
              inputMode={min != null && min < 0 ? "text" : "decimal"}
              role="spinbutton"
              aria-valuenow={current ?? undefined}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuetext={current == null ? undefined : `${shown.format(current)}${typeof suffix === "string" ? ` ${suffix}` : ""}`}
              className="asc-input__el asc-num__el"
              disabled={disabled}
              readOnly={readOnly}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                const n = parse(e.target.value, sep);
                if (!Number.isNaN(n)) commit(n);
              }}
              onFocus={(e) => {
                setEditing(true);
                setText(textOf(current, true));
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setEditing(false);
                finish(false);
                onBlur?.(e);
              }}
              onKeyDown={keys}
              aria-describedby={ids(c["aria-describedby"], affixIds(c.id, prefix, suffix), describedBy)}
            />
          </InputBox>
        </>
      )}
    </Field>
  );
}
