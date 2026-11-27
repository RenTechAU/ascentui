import type { ReactNode } from 'react';
import './Form.css';

/** A form field's label — and the ONE place the required marker is drawn.
 *
 *  Every label takes `req` or `opt`, and neither is defaultable: the prop is a
 *  union, so `<FieldLabel>Name</FieldLabel>` does not compile. That is the whole
 *  point. Which fields a form insists on lives in its submit guard, several
 *  hundred lines from the label, and the two drifted apart silently the moment
 *  one moved — the New case form asked for a product with "· tick every unit
 *  this visit covers" beside it and refused to submit without one, while the
 *  New admin form's password read "· at least 8 characters" and was the reason
 *  the button stayed grey. Nothing threw in either case; the form just sat
 *  there. Making the answer a required prop turns "somebody added a field and
 *  never said whether it was necessary" from an invisible omission into a build
 *  failure — the lint-search argument, paid for by the type checker instead of
 *  a script.
 *
 *  `req` is a boolean rather than a flag because a field can be conditionally
 *  necessary — a parts movement needs a reason only when it is an adjustment —
 *  and an asterisk that is right four times out of five teaches people to stop
 *  reading it.
 *
 *  Marked required, NOT marked optional: the asterisk is the signal, and a form
 *  that also tags fifteen fields "· optional" has buried it. The `· …` hints
 *  that survive say something a reader could not otherwise know ("auto if
 *  blank", "blank = undecided, which is not the same as zero") — those are
 *  written as children and are nothing to do with this. */
type FieldLabelProps = {
  children: ReactNode;
  /** Render as a sub-label (.ncsub) — a field inside a section that already
   *  carries its own heading. */
  sub?: boolean;
} & ({ req: boolean; opt?: never } | { opt: true; req?: never });

export function FieldLabel(props: FieldLabelProps) {
  const required = 'req' in props && props.req === true;
  return (
    <div className={props.sub ? 'ncsub' : 'ncl'}>
      {props.children}
      {required && <Req />}
    </div>
  );
}

/** The marker itself, for the handful of labels that aren't a `FieldLabel` —
 *  the deal drawer's inline email composer and quote-line row, which are a
 *  `.fld > small` and not a form field block. Exported so there stays exactly
 *  one asterisk in the console rather than a `*` here and a `(required)` there;
 *  reach for `FieldLabel` wherever a form field block will do, because that is
 *  the one the type checker can hold you to. */
export function Req() {
  return (
    <span className="ncreq" title="Required" aria-label="required">
      *
    </span>
  );
}

/** A heading over a GROUP of fields inside a form — "Billing address", "Contact
 *  to keep", "Results". Its own class rather than a label with a margin on it
 *  (which is what these were), so a heading can't be mistaken for a field that
 *  somebody forgot to mark: `FieldLabel` is for things you fill in. */
export function FormHeading({ children }: { children: ReactNode }) {
  return <div className="nchead">{children}</div>;
}
