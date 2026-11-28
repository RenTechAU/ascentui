"use client";
/**
 * StepperForm: a long form split into steps, with a step indicator, Back and Next, and a final
 * review of everything entered before it is sent.
 * Each step is checked before moving on: by your validate function (which sets your fields'
 * errors), or by the browser's own rules (required, type="email", min…) when you give none.
 * Every step stays in the page while hidden, so going back never loses what was typed, even in
 * fields that keep their own state. Moving to a step puts focus on its heading, which reads out
 * "Step 2 of 4", so screen reader and keyboard users always know where they are.
 * Put Field-based inputs (TextField, Select, ComboBox…) in each step. You own the values.
 * Built from Button. Reads the shared theme (@ascentui/tokens).
 */
import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Button } from "./button";

const css = `@layer asc {
.asc-stepper{container-type:inline-size;display:flex;flex-direction:column;gap:var(--asc-space-24);min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-stepper__steps{display:flex;gap:var(--asc-space-8);margin:0;padding:0;list-style:none;counter-reset:asc-step}
.asc-stepper__step{display:flex;align-items:center;gap:var(--asc-space-8);flex:1 1 0;min-width:0}
.asc-stepper__step:not(:last-child)::after{content:"";flex:1;min-width:var(--asc-space-8);height:1px;background:var(--asc-border-strong)}
.asc-stepper__step[data-state="done"]:not(:last-child)::after{background:var(--asc-primary)}
.asc-stepper__step:last-child{flex:0 1 auto}
.asc-stepper__btn{display:inline-flex;align-items:center;gap:var(--asc-space-8);min-width:0;min-height:var(--asc-control-md);margin:0;padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius);background:none;color:var(--asc-muted);font:500 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.asc-stepper__btn:disabled{cursor:default}
.asc-stepper__btn:not(:disabled):hover .asc-stepper__name{color:var(--asc-ink)}
.asc-stepper__btn:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-stepper__dot{display:inline-grid;place-items:center;flex:none;box-sizing:border-box;width:var(--asc-control-sm);height:var(--asc-control-sm);border-radius:var(--asc-radius-full);background:var(--asc-subtle-strong);color:var(--asc-muted);font:500 var(--asc-text-xs)/1 var(--asc-font);font-variant-numeric:tabular-nums;transition:background-color var(--asc-duration),color var(--asc-duration),box-shadow var(--asc-duration)}
.asc-stepper__dot svg{width:12px;height:12px}
.asc-stepper__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color var(--asc-duration)}
.asc-stepper__step[data-state="current"] .asc-stepper__btn{color:var(--asc-ink)}
.asc-stepper__step[data-state="current"] .asc-stepper__dot{background:var(--asc-surface);color:var(--asc-ink);box-shadow:inset 0 0 0 1.5px var(--asc-primary)}
.asc-stepper__step[data-state="done"] .asc-stepper__dot{background:var(--asc-primary);color:var(--asc-on-primary)}
.asc-stepper__step[data-state="done"] .asc-stepper__btn{color:var(--asc-ink)}
.asc-stepper__panel{display:flex;flex-direction:column;gap:var(--asc-space-16);min-width:0}
.asc-stepper__panel[hidden]{display:none}
.asc-stepper__head{display:flex;flex-direction:column;gap:var(--asc-space-2)}
.asc-stepper__title{margin:0;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font)}
.asc-stepper__title:focus{outline:none}
.asc-stepper__title:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px;border-radius:var(--asc-radius-sm)}
.asc-stepper__of{display:block;margin-bottom:var(--asc-space-2);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font)}
.asc-stepper__desc{margin:0;color:var(--asc-muted)}
.asc-stepper__fields{display:grid;gap:var(--asc-space-16);min-width:0}
.asc-stepper__foot{display:flex;flex-wrap:wrap-reverse;align-items:center;gap:var(--asc-space-8);padding-top:var(--asc-space-16);border-top:1px solid var(--asc-border)}
.asc-stepper__foot-end{display:flex;gap:var(--asc-space-8);margin-left:auto}
.asc-stepper__review{display:flex;flex-direction:column;gap:var(--asc-space-12)}
.asc-stepper__group{border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-stepper__group-head{display:flex;align-items:center;justify-content:space-between;gap:var(--asc-space-8);padding:var(--asc-space-8) var(--asc-space-8) var(--asc-space-8) var(--asc-space-12);border-bottom:1px solid var(--asc-border)}
.asc-stepper__group-title{margin:0;font:500 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-stepper__list{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);margin:0;padding:var(--asc-space-4) var(--asc-space-12)}
.asc-stepper__list dt,.asc-stepper__list dd{margin:0;padding:var(--asc-space-6) 0;border-bottom:1px solid var(--asc-border)}
.asc-stepper__list dt{padding-right:var(--asc-space-12);color:var(--asc-muted)}
.asc-stepper__list dd{overflow-wrap:anywhere}
.asc-stepper__list>:nth-last-child(-n+2){border-bottom:0}
.asc-stepper__none{color:var(--asc-faint)}
.asc-stepper__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@container (max-width:520px){
  .asc-stepper__step:not([data-state="current"]) .asc-stepper__name{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .asc-stepper__step{flex:1 1 auto;min-width:auto}
  .asc-stepper__step:last-child{flex:0 0 auto}
  .asc-stepper__step:not(:last-child)::after{min-width:var(--asc-space-4)}
  .asc-stepper__steps{gap:var(--asc-space-4)}
  .asc-stepper__list{grid-template-columns:minmax(0,1fr)}
  .asc-stepper__list dt{padding-bottom:0;border-bottom:0}
  .asc-stepper__foot-end{flex:1}
  .asc-stepper__foot-end>*{flex:1}
}
}`;

export type FormStep = {
  /** Unique and stable: review items point at steps by id */
  id: string;
  /** A few words: "Customer", "Address", "Visit" */
  title: string;
  /** One line under the title */
  description?: ReactNode;
  /** The fields */
  children: ReactNode;
  /** Check this step before moving on. Set your fields' errors, then return true to go on or false to stay.
   *  Can be async, e.g. to check an address. Without it, the browser's own rules on the fields are used */
  validate?: () => boolean | Promise<boolean>;
};

export type ReviewItem = {
  label: string;
  /** What was entered. Empty values show as "Not given" */
  value: ReactNode;
  /** The step it was entered on, for the Edit button */
  step: string;
};

export type StepperFormLabels = {
  back: string;
  next: string;
  submit: string;
  edit: string;
  review: string;
  notGiven: string;
  steps: string;
  /** "Step 2 of 4" */
  stepOf: (n: number, total: number) => string;
  /** Read out when a step does not pass */
  fix: string;
};

const LABELS: StepperFormLabels = {
  back: "Back",
  next: "Next",
  submit: "Submit",
  edit: "Edit",
  review: "Review",
  notGiven: "Not given",
  steps: "Steps",
  stepOf: (n, total) => `Step ${n} of ${total}`,
  fix: "Check the highlighted fields to continue.",
};

export type StepperFormProps = {
  steps: FormStep[];
  /** Adds a last step that lists what was entered, with Edit buttons back to each step */
  review?: { title?: string; description?: ReactNode; items: ReviewItem[] };
  /** Runs on the last step. Return a promise to show a spinner until it settles; if it rejects, the form stays put */
  onSubmit: () => void | Promise<unknown>;
  /** The step showing, from 0. Leave out to let the form keep it */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Heading level of each step's title, so the page outline stays in order */
  headingLevel?: 2 | 3 | 4;
  /** The words on the buttons, for other languages or to say what Submit does ("Book visit") */
  labels?: Partial<StepperFormLabels>;
  /** The form's name for screen readers, e.g. "New case" */
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
};

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 6.25 5 8.75l4.5-5" />
  </svg>
);

const empty = (v: ReactNode) => v == null || v === false || v === "" || (Array.isArray(v) && v.length === 0);

const FIELDS = "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])";

export function StepperForm({
  steps, review, onSubmit, step, defaultStep = 0, onStepChange, headingLevel = 2, labels: labelsIn,
  "aria-label": ariaLabel, className, style,
}: StepperFormProps) {
  const labels = { ...LABELS, ...labelsIn };
  const id = useId();
  const total = steps.length + (review ? 1 : 0);
  const [inner, setInner] = useState(defaultStep);
  const current = Math.min(Math.max(step ?? inner, 0), total - 1);
  const [furthest, setFurthest] = useState(current);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const panels = useRef<(HTMLElement | null)[]>([]);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const moved = useRef(false);
  const H = `h${headingLevel}` as const;
  const isReview = !!review && current === steps.length;
  const isLast = current === total - 1;

  useEffect(() => setFurthest((f) => Math.max(f, current)), [current]);

  // After a move, focus the new step's heading: it reads out "Step 2 of 4, Address"
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    headings.current[current]?.focus();
  }, [current]);

  const go = (to: number) => {
    if (to === current) return;
    moved.current = true;
    setMessage("");
    if (step === undefined) setInner(to);
    onStepChange?.(to);
  };

  /** Checks the step showing. On failure focus goes to the first field that needs fixing */
  const check = async (): Promise<boolean> => {
    const s = steps[current];
    if (!s) return true;
    const panel = panels.current[current];
    if (s.validate) {
      setBusy(true);
      let ok = false;
      try {
        ok = await s.validate();
      } catch {
        ok = false;
      } finally {
        setBusy(false);
      }
      if (!ok) {
        setMessage(labels.fix);
        // After your errors have rendered
        setTimeout(() => panel?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 0);
      }
      return ok;
    }
    const bad = [...(panel?.querySelectorAll<HTMLInputElement>(FIELDS) ?? [])].find((f) => !f.checkValidity());
    if (bad) {
      setMessage(labels.fix);
      bad.focus();
      bad.reportValidity();
      return false;
    }
    return true;
  };

  const next = async () => {
    if (busy) return;
    if (!(await check())) return;
    if (!isLast) return go(current + 1);
    const result = onSubmit();
    if (!(result instanceof Promise)) return;
    setBusy(true);
    try {
      await result;
    } catch {
      /* stays put: say what went wrong, e.g. with a toast */
    } finally {
      setBusy(false);
    }
  };

  const jump = async (to: number) => {
    if (busy || to === current) return;
    if (to > current && !(await check())) return;
    go(to);
  };

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void next();
  };

  const stepTitle = (i: number) => (i < steps.length ? steps[i]!.title : review?.title ?? labels.review);

  return (
    <>
      <style href="asc-stepper-form" precedence="asc">{css}</style>
      <form
        className={["asc-stepper", className].filter(Boolean).join(" ")}
        style={style}
        noValidate
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        onSubmit={onFormSubmit}
      >
        <ol className="asc-stepper__steps" aria-label={labels.steps}>
          {Array.from({ length: total }, (_, i) => {
            const state = i < current ? "done" : i === current ? "current" : "todo";
            const reachable = i <= furthest && i !== current;
            return (
              <li key={i < steps.length ? steps[i]!.id : "review"} className="asc-stepper__step" data-state={state}>
                <button
                  type="button"
                  className="asc-stepper__btn"
                  aria-current={i === current ? "step" : undefined}
                  disabled={!reachable}
                  onClick={() => void jump(i)}
                >
                  <span className="asc-stepper__dot" aria-hidden>{state === "done" ? <CheckIcon /> : i + 1}</span>
                  <span className="asc-stepper__name">
                    <span className="asc-stepper__vh">{labels.stepOf(i + 1, total)}: </span>
                    {stepTitle(i)}
                    {state === "done" && <span className="asc-stepper__vh"> (done)</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {steps.map((s, i) => (
          <section
            key={s.id}
            ref={(n) => {
              panels.current[i] = n;
            }}
            className="asc-stepper__panel"
            hidden={i !== current}
            aria-labelledby={`${id}-h${i}`}
          >
            <div className="asc-stepper__head">
              <H
                className="asc-stepper__title"
                id={`${id}-h${i}`}
                tabIndex={-1}
                ref={(n: HTMLHeadingElement | null) => {
                  headings.current[i] = n;
                }}
              >
                <span className="asc-stepper__of">{labels.stepOf(i + 1, total)}</span>
                {s.title}
              </H>
              {s.description != null && <p className="asc-stepper__desc">{s.description}</p>}
            </div>
            <div className="asc-stepper__fields">{s.children}</div>
          </section>
        ))}

        {review && (
          <section
            ref={(n) => {
              panels.current[steps.length] = n;
            }}
            className="asc-stepper__panel"
            hidden={!isReview}
            aria-labelledby={`${id}-h${steps.length}`}
          >
            <div className="asc-stepper__head">
              <H
                className="asc-stepper__title"
                id={`${id}-h${steps.length}`}
                tabIndex={-1}
                ref={(n: HTMLHeadingElement | null) => {
                  headings.current[steps.length] = n;
                }}
              >
                <span className="asc-stepper__of">{labels.stepOf(total, total)}</span>
                {review.title ?? labels.review}
              </H>
              {review.description != null && <p className="asc-stepper__desc">{review.description}</p>}
            </div>
            <div className="asc-stepper__review">
              {steps.map((s, i) => {
                const items = review.items.filter((r) => r.step === s.id);
                if (!items.length) return null;
                return (
                  <div key={s.id} className="asc-stepper__group">
                    <div className="asc-stepper__group-head">
                      <p className="asc-stepper__group-title" id={`${id}-r${i}`}>{s.title}</p>
                      <Button variant="ghost" size="sm" aria-describedby={`${id}-r${i}`} onClick={() => go(i)}>{labels.edit}</Button>
                    </div>
                    <dl className="asc-stepper__list">
                      {items.map((r) => (
                        <Fragment key={r.label}>
                          <dt>{r.label}</dt>
                          <dd>{empty(r.value) ? <span className="asc-stepper__none">{labels.notGiven}</span> : r.value}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="asc-stepper__foot">
          <div className="asc-stepper__foot-end">
            {current > 0 && (
              <Button variant="secondary" onClick={() => go(current - 1)} disabled={busy}>{labels.back}</Button>
            )}
            <Button type="submit" loading={busy}>{isLast ? labels.submit : labels.next}</Button>
          </div>
        </div>
        <div className="asc-stepper__vh" role="status" aria-live="polite">{message}</div>
      </form>
    </>
  );
}
