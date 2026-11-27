"use client";
/**
 * Form kit. Field ties a label, a required mark, help text and an error to one control, so every
 * input in the kit is labelled the same way. FormSection groups fields under a heading.
 * InputBox is the box every text-like input sits in, so they all line up with Button.
 * ChoiceField lays out a checkbox or switch with its label beside it.
 * Reads the shared theme (@ascentui/tokens).
 */
import { useId, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";

const css = `@layer asc {
.asc-field{display:flex;flex-direction:column;gap:var(--asc-space-6);min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-field__label{display:flex;align-items:baseline;gap:var(--asc-space-2);width:fit-content;font-weight:500}
.asc-field__req{color:var(--asc-danger)}
.asc-field__help{margin:0;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-field__error{margin:0;display:flex;align-items:flex-start;gap:var(--asc-space-4);color:var(--asc-danger);font-weight:500;font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-field__error svg{width:14px;height:14px;flex:none;margin-top:1px}
.asc-field__msgs{display:flex;flex-direction:column;gap:var(--asc-space-2)}
.asc-field__msgs:empty{display:none}
.asc-vh,.asc-field__label[data-hidden]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.asc-section{container-type:inline-size;min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-section+.asc-section{border-top:1px solid var(--asc-border);padding-top:var(--asc-space-24)}
.asc-section__grid{display:grid;gap:var(--asc-space-16)}
.asc-section__head{display:flex;flex-direction:column;gap:var(--asc-space-2)}
.asc-section__title{margin:0;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font)}
.asc-section__desc{margin:0;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-section__body{display:grid;gap:var(--asc-space-16);min-width:0}
@container (min-width:640px){.asc-section[data-layout="split"] .asc-section__grid{grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:var(--asc-space-24)}}
.asc-input{--h:var(--asc-control-md);--px:calc(var(--h) * .36);position:relative;display:flex;align-items:center;box-sizing:border-box;width:100%;min-width:0;height:var(--h);border-radius:var(--asc-radius);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-control);font:400 var(--asc-input-text)/var(--asc-leading-sm) var(--asc-font);cursor:text;transition:box-shadow var(--asc-duration)}
.asc-input[data-size="sm"]{--h:var(--asc-control-sm);border-radius:var(--asc-radius-sm)}
.asc-input[data-size="lg"]{--h:var(--asc-control-lg)}
.asc-input:hover{box-shadow:var(--asc-shadow-control-hover)}
.asc-input:focus-within{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-input[data-invalid]{box-shadow:0 0 0 1px var(--asc-danger)}
.asc-input[data-readonly]{background:var(--asc-subtle)}
.asc-input[data-disabled]{opacity:.45;cursor:not-allowed}
.asc-input[data-multiline]{height:auto;align-items:stretch}
.asc-input__el{flex:1;align-self:stretch;box-sizing:border-box;width:100%;min-width:0;margin:0;padding:0 var(--px);border:0;border-radius:inherit;background:transparent;color:inherit;font:inherit;outline:none;appearance:none;-webkit-appearance:none}
.asc-input__el::placeholder{color:var(--asc-placeholder);opacity:1}
.asc-input__el:disabled{cursor:not-allowed}
.asc-input[data-prefix] .asc-input__el{padding-left:var(--asc-space-6)}
.asc-input[data-suffix] .asc-input__el{padding-right:var(--asc-space-6)}
.asc-input__affix{display:inline-flex;align-items:center;flex:none;color:var(--asc-muted);white-space:nowrap;user-select:none}
.asc-input__affix[data-side="prefix"]{padding-left:var(--px)}
.asc-input__affix[data-side="suffix"]{padding-right:var(--px)}
.asc-input__affix svg{width:16px;height:16px;color:var(--asc-faint)}
.asc-choice{display:flex;flex-direction:column;min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-choice__row{display:flex;align-items:center;gap:var(--asc-space-8);min-height:var(--asc-control-md);cursor:pointer;-webkit-tap-highlight-color:transparent}
.asc-choice[data-placement="end"] .asc-choice__row{flex-direction:row-reverse;justify-content:space-between}
.asc-choice__control{display:inline-flex;flex:none}
.asc-choice__label{display:flex;align-items:baseline;gap:var(--asc-space-2);min-width:0}
.asc-choice .asc-field__msgs{padding-left:calc(var(--asc-choice-w, 16px) + var(--asc-space-8))}
.asc-choice[data-placement="end"] .asc-field__msgs{padding-left:0}
.asc-choice[data-disabled] .asc-choice__row{cursor:not-allowed;opacity:.45}
}`;

/** The style tag every part of the kit renders. React writes it to the page once. */
export const FieldStyles = () => <style href="asc-field" precedence="asc">{css}</style>;

/** What Field hands its control: spread it onto the input. */
export type FieldControl = {
  id: string;
  required?: boolean;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  /** Only for group controls, which a <label> cannot point at */
  "aria-labelledby"?: string;
};

/** The label, help and error props every input in the kit takes */
export type FieldParts = {
  /** What the field is. Leave it out only if you give the input an aria-label */
  label?: ReactNode;
  /** Help under the field: a format, an example, or why you ask */
  description?: ReactNode;
  /** What is wrong and how to fix it. Turns the field red and is read out with it. `true` marks it invalid without text */
  error?: ReactNode;
  /** Hide the label visually. Screen readers still read it */
  hideLabel?: boolean;
};

/** Joins id lists for aria-describedby, skipping blanks */
export const ids = (...list: (string | false | null | undefined)[]) => list.filter(Boolean).join(" ") || undefined;

const hasText = (n: ReactNode) => n != null && n !== false && n !== true && n !== "";

/** Ids and aria attributes for a control with help and error text. Field and ChoiceField use it */
export function useFieldControl(opts: { id?: string; description?: ReactNode; error?: ReactNode; required?: boolean }): FieldControl {
  const auto = useId();
  const id = opts.id ?? auto;
  return {
    id,
    required: opts.required || undefined,
    "aria-required": opts.required || undefined,
    "aria-invalid": opts.error != null && opts.error !== false && opts.error !== "" ? true : undefined,
    "aria-describedby": ids(hasText(opts.error) && `${id}-error`, hasText(opts.description) && `${id}-help`),
  };
}

/** Help and error text under a control, with the ids the control points at */
export function FieldMessages({ id, description, error }: { id: string; description?: ReactNode; error?: ReactNode }) {
  return (
    <div className="asc-field__msgs">
      {hasText(description) && <p className="asc-field__help" id={`${id}-help`}>{description}</p>}
      {hasText(error) && (
        <p className="asc-field__error" id={`${id}-error`}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 3a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 4.5zm0 6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const RequiredMark = () => <span className="asc-field__req" aria-hidden>*</span>;

export type FieldProps = FieldParts & Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
  /** Marks the label with an asterisk and tells the control it is required */
  required?: boolean;
  /** The control's id. One is made for you if you leave it out */
  id?: string;
  /** The control is a group, such as radios or code boxes: the label names it with aria-labelledby */
  group?: boolean;
  /** The control. A function gets the ids and aria attributes to spread onto it */
  children: ReactNode | ((control: FieldControl) => ReactNode);
};

export function Field({ label, description, error, hideLabel, required, id, group, children, className, ...rest }: FieldProps) {
  const control = useFieldControl({ id, description, error, required });
  const labelId = `${control.id}-label`;
  if (group && label != null) control["aria-labelledby"] = labelId;
  const Label = group ? "span" : "label";
  return (
    <>
      <FieldStyles />
      <div className={["asc-field", className].filter(Boolean).join(" ")} {...rest}>
        {label != null && (
          <Label id={labelId} htmlFor={group ? undefined : control.id} className="asc-field__label" data-hidden={hideLabel || undefined}>
            {label}
            {required && <RequiredMark />}
          </Label>
        )}
        {typeof children === "function" ? children(control) : children}
        <FieldMessages id={control.id} description={description} error={error} />
      </div>
    </>
  );
}

export type FormSectionProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  /** One line on what this group is for */
  description?: ReactNode;
  /** split puts the heading beside the fields when there is room (settings pages); stacked puts it above */
  layout?: "stacked" | "split";
  /** Heading level, so the page outline stays in order */
  level?: 2 | 3 | 4;
};

export function FormSection({ title, description, layout = "stacked", level = 3, className, children, ...rest }: FormSectionProps) {
  const id = useId();
  const H = `h${level}` as const;
  return (
    <>
      <FieldStyles />
      <div
        role="group"
        aria-labelledby={`${id}-title`}
        aria-describedby={description != null ? `${id}-desc` : undefined}
        className={["asc-section", className].filter(Boolean).join(" ")}
        data-layout={layout}
        {...rest}
      >
        <div className="asc-section__grid">
          <div className="asc-section__head">
            <H id={`${id}-title`} className="asc-section__title">{title}</H>
            {description != null && <p id={`${id}-desc`} className="asc-section__desc">{description}</p>}
          </div>
          <div className="asc-section__body">{children}</div>
        </div>
      </div>
    </>
  );
}

const isText = (n: ReactNode) => typeof n === "string" || typeof n === "number";

/** Ids of text prefixes and suffixes ("$", "kg"), so screen readers hear the unit with the field */
export const affixIds = (id: string, prefix?: ReactNode, suffix?: ReactNode) =>
  ids(isText(prefix) && `${id}-prefix`, isText(suffix) && `${id}-suffix`);

export type InputBoxProps = {
  /** The control's id, for the affix ids */
  controlId: string;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Text or an icon before the value, e.g. "$" or a search icon */
  prefix?: ReactNode;
  /** Text or an icon after the value, e.g. "kg" */
  suffix?: ReactNode;
  /** Controls at the far end, after the suffix, such as steppers */
  end?: ReactNode;
  /** Grows in height, for a text area */
  multiline?: boolean;
  className?: string;
  /** The input itself, with className="asc-input__el" */
  children: ReactNode;
};

/** The box every text-like input sits in. Clicking anywhere in it, a unit included, focuses the input */
export function InputBox({ controlId, size = "md", invalid, disabled, readOnly, prefix, suffix, end, multiline, className, children }: InputBoxProps) {
  const focusInput = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t !== e.currentTarget && !t.closest(".asc-input__affix")) return;
    e.preventDefault();
    e.currentTarget.querySelector<HTMLElement>(".asc-input__el")?.focus();
  };
  const affix = (side: "prefix" | "suffix", node: ReactNode) =>
    node != null && (
      <span className="asc-input__affix" data-side={side} id={isText(node) ? `${controlId}-${side}` : undefined} aria-hidden={isText(node) ? undefined : true}>
        {node}
      </span>
    );
  return (
    <>
      <FieldStyles />
      <div
        className={["asc-input", className].filter(Boolean).join(" ")}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-multiline={multiline || undefined}
        data-prefix={prefix != null || undefined}
        data-suffix={suffix != null || undefined}
        onMouseDown={focusInput}
      >
        {affix("prefix", prefix)}
        {children}
        {affix("suffix", suffix)}
        {end}
      </div>
    </>
  );
}

export type ChoiceFieldProps = Omit<FieldParts, "hideLabel"> & {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  /** start puts the control before the label; end puts it at the far end of the row, as in settings lists */
  placement?: "start" | "end";
  className?: string;
  style?: HTMLAttributes<HTMLDivElement>["style"];
  /** The input and its drawing. Gets the ids and aria attributes to spread onto the input */
  children: (control: FieldControl) => ReactNode;
};

/** A checkbox or switch row: the whole row is the tap target, help and error sit under the label */
export function ChoiceField({ label, description, error, id, required, disabled, placement = "start", className, style, children }: ChoiceFieldProps) {
  const control = useFieldControl({ id, description, error, required });
  return (
    <>
      <FieldStyles />
      <div className={["asc-choice", className].filter(Boolean).join(" ")} style={style} data-placement={placement} data-disabled={disabled || undefined}>
        <label className="asc-choice__row">
          <span className="asc-choice__control">{children(control)}</span>
          {label != null && (
            <span className="asc-choice__label">
              {label}
              {required && <RequiredMark />}
            </span>
          )}
        </label>
        <FieldMessages id={control.id} description={description} error={error} />
      </div>
    </>
  );
}
