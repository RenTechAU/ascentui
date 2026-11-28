"use client";
/**
 * MonthGrid: a month calendar that shows your items on each day, such as visits or reminders.
 * You say what goes in a day; it handles the shape of the month: weeks that start on the reader's
 * own first day of the week, today marked, the 1st of each month labelled, no empty trailing week,
 * and arrow-key movement between days. Built from Button and IconButton. Reads the shared theme.
 */
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "./button";
import { IconButton } from "./icon-button";

const css = `@layer asc {
.asc-mg{container-type:inline-size;display:flex;flex-direction:column;gap:var(--asc-space-8);min-width:0;color:var(--asc-ink);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-mg__bar{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-4)}
.asc-mg__title{margin:0 var(--asc-space-4);min-width:9em;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font);text-align:center;white-space:nowrap}
.asc-mg__actions{display:flex;flex-wrap:wrap;align-items:center;gap:var(--asc-space-8);margin-left:auto}
.asc-mg__grid{display:flex;flex-direction:column;border-radius:var(--asc-radius-lg);background:var(--asc-surface);box-shadow:var(--asc-shadow-control);overflow:hidden}
.asc-mg__row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.asc-mg__wd{padding:var(--asc-space-6) var(--asc-space-8);border-bottom:1px solid var(--asc-border-strong);color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);text-align:left}
.asc-mg__wd abbr{text-decoration:none}
.asc-mg__day{display:flex;flex-direction:column;gap:var(--asc-space-2);box-sizing:border-box;min-width:0;min-height:96px;padding:var(--asc-space-4);border-right:1px solid var(--asc-border);border-bottom:1px solid var(--asc-border);transition:background-color var(--asc-duration)}
.asc-mg__row>.asc-mg__day:last-child{border-right:0}
.asc-mg__row:last-child>.asc-mg__day{border-bottom:0}
.asc-mg__day[data-outside]{background:var(--asc-subtle)}
.asc-mg__day[data-outside] .asc-mg__date{color:var(--asc-faint)}
.asc-mg__day[aria-selected="true"]{background:var(--asc-subtle-strong)}
.asc-mg__head{display:flex;align-items:center;gap:var(--asc-space-4);min-width:0}
.asc-mg__date{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:var(--asc-control-sm);height:var(--asc-control-sm);padding:0 var(--asc-space-6);border:0;border-radius:var(--asc-radius-full);background:none;color:var(--asc-ink);font:500 var(--asc-text-xs)/1 var(--asc-font);font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color var(--asc-duration)}
.asc-mg__date:hover{background:var(--asc-subtle-strong)}
.asc-mg__date:focus-visible{outline:2px solid var(--asc-focus);outline-offset:1px}
.asc-mg__date[aria-current="date"]{background:var(--asc-primary);color:var(--asc-on-primary)}
.asc-mg__today{overflow:hidden;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);text-overflow:ellipsis;white-space:nowrap}
.asc-mg__items{display:flex;flex-direction:column;gap:var(--asc-space-2);min-width:0}
@container (max-width:560px){
  .asc-mg__day{min-height:64px;padding:var(--asc-space-2)}
  .asc-mg__wd{padding:var(--asc-space-6) var(--asc-space-4);text-align:center}
  .asc-mg__head{justify-content:center}
  .asc-mg__today{display:none}
}
}`;

// ---------------------------------------------------------------- dates

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A local date as YYYY-MM-DD, with no time-zone shift */
export function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** YYYY-MM-DD back to a local date */
export const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
};

// Where Intl can't say, regions whose week does not start on Monday (from CLDR)
const SUNDAY = "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(" ");
const SATURDAY = "AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" ");

/** The first day of the week where the reader is: 0 Sunday, 1 Monday … 6 Saturday */
export function localeWeekStart(locale?: string): Weekday {
  try {
    const tag = locale ?? (typeof navigator !== "undefined" ? navigator.language : undefined) ?? "en";
    const loc = new Intl.Locale(tag) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay) return (info.firstDay % 7) as Weekday;
    const region = loc.maximize().region ?? "";
    return SUNDAY.includes(region) ? 0 : SATURDAY.includes(region) ? 6 : region === "MV" ? 5 : 1;
  } catch {
    return 1;
  }
}

/** The days a month grid shows, whole weeks from weekStartsOn, and how many weeks that is */
export function monthDays(month: Date, weekStartsOn: Weekday = 1): { days: Date[]; weeks: number } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const inMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((lead + inMonth) / 7);
  // Walk by calendar date, not milliseconds, so daylight saving can't skip or repeat a day
  const days = Array.from({ length: weeks * 7 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - lead + i));
  return { days, weeks };
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const Svg = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

// ---------------------------------------------------------------- component

export type MonthGridProps = {
  /** Any date in the month to show */
  month: Date;
  /** Shows the bar with previous, next and Today, and lets the arrow keys cross into other months */
  onMonthChange?: (month: Date) => void;
  /** What goes in a day, under its date. You get the day and its YYYY-MM-DD key */
  children?: (day: Date, key: string) => ReactNode;
  /** The chosen day, as YYYY-MM-DD */
  selected?: string | null;
  /** Called when a date is clicked or chosen with Enter or Space */
  onSelect?: (key: string, day: Date) => void;
  /** First day of the week, 0 Sunday to 6 Saturday. Defaults to the reader's locale */
  weekStartsOn?: Weekday;
  /** Today, if not the device's today (e.g. in the business's time zone) */
  now?: Date;
  /** Extra controls at the right of the bar, such as a legend or a filter */
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function MonthGrid({ month, onMonthChange, children, selected, onSelect, weekStartsOn, now, actions, className, style }: MonthGridProps) {
  const id = useId();
  const [start, setStart] = useState<Weekday>(weekStartsOn ?? 1);
  // The locale is read after the first render, so the server and the browser draw the same thing first
  useEffect(() => setStart(weekStartsOn ?? localeWeekStart()), [weekStartsOn]);
  const today = isoDay(now ?? new Date());
  const { days, weeks } = useMemo(() => monthDays(month, start), [month, start]);

  const fmt = useMemo(() => ({
    title: new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }),
    full: new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    short: new Intl.DateTimeFormat(undefined, { weekday: "short" }),
    long: new Intl.DateTimeFormat(undefined, { weekday: "long" }),
    first: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }),
    num: new Intl.NumberFormat(),
  }), []);
  // 4 January 2026 was a Sunday: a week of names from there, in the reader's language
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + ((start + i) % 7)));

  // Roving focus: one date is the tab stop; arrow keys move it
  const inMonth = (key: string) => days.some((d) => isoDay(d) === key);
  const fallback = selected && inMonth(selected) ? selected : inMonth(today) && sameMonth(parseDay(today), month) ? today : isoDay(new Date(month.getFullYear(), month.getMonth(), 1));
  const [focusKey, setFocusKey] = useState(fallback);
  const current = inMonth(focusKey) ? focusKey : fallback;
  const grid = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);
  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-key="${current}"]`)?.focus();
  }, [current, month]);

  const moveTo = (d: Date) => {
    const key = isoDay(d);
    wantFocus.current = true;
    setFocusKey(key);
    if (!sameMonth(d, month)) {
      if (onMonthChange) onMonthChange(new Date(d.getFullYear(), d.getMonth(), 1));
      else if (!inMonth(key)) return setFocusKey(current);
    }
  };
  const keys = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    const col = (d.getDay() - start + 7) % 7;
    const to: Record<string, () => Date> = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -col),
      End: () => addDays(d, 6 - col),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
    };
    const go = to[e.key];
    if (!go) return;
    e.preventDefault();
    if ((e.key === "PageUp" || e.key === "PageDown") && !onMonthChange) return;
    moveTo(go());
  };

  const nav = (n: number) => onMonthChange?.(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const title = fmt.title.format(month);

  return (
    <div className={["asc-mg", className].filter(Boolean).join(" ")} style={style}>
      <style href="asc-month-grid" precedence="asc">{css}</style>
      {(onMonthChange || actions) && (
        <div className="asc-mg__bar">
          {onMonthChange && (
            <>
              <IconButton size="sm" icon={<Svg d="M10 3.5 5.5 8l4.5 4.5" />} label="Previous month" onClick={() => nav(-1)} />
              <p className="asc-mg__title" id={`${id}-title`} aria-live="polite">{title}</p>
              <IconButton size="sm" icon={<Svg d="M6 3.5 10.5 8 6 12.5" />} label="Next month" onClick={() => nav(1)} />
              <Button
                size="sm"
                variant="secondary"
                disabled={sameMonth(parseDay(today), month)}
                onClick={() => {
                  onMonthChange(new Date(parseDay(today).getFullYear(), parseDay(today).getMonth(), 1));
                  setFocusKey(today);
                }}
              >
                Today
              </Button>
            </>
          )}
          {actions && <div className="asc-mg__actions">{actions}</div>}
        </div>
      )}
      <div
        ref={grid}
        className="asc-mg__grid"
        role="grid"
        aria-label={onMonthChange ? undefined : title}
        aria-labelledby={onMonthChange ? `${id}-title` : undefined}
      >
        <div role="row" className="asc-mg__row">
          {weekdays.map((d) => (
            <div key={d.getDay()} role="columnheader" className="asc-mg__wd">
              <abbr title={fmt.long.format(d)} aria-label={fmt.long.format(d)}>{fmt.short.format(d)}</abbr>
            </div>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} role="row" className="asc-mg__row">
            {days.slice(w * 7, w * 7 + 7).map((d) => {
              const key = isoDay(d);
              const outside = !sameMonth(d, month);
              const isToday = key === today;
              const isFirst = d.getDate() === 1;
              return (
                <div
                  key={key}
                  role="gridcell"
                  className="asc-mg__day"
                  data-outside={outside || undefined}
                  aria-selected={onSelect ? selected === key : undefined}
                >
                  <div className="asc-mg__head">
                    <button
                      type="button"
                      className="asc-mg__date"
                      data-key={key}
                      tabIndex={key === current ? 0 : -1}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={fmt.full.format(d)}
                      onClick={() => {
                        setFocusKey(key);
                        onSelect?.(key, d);
                      }}
                      onFocus={() => key !== focusKey && setFocusKey(key)}
                      onKeyDown={(e) => keys(e, d)}
                    >
                      {isFirst ? fmt.first.format(d) : fmt.num.format(d.getDate())}
                    </button>
                    {isToday && <span className="asc-mg__today" aria-hidden>Today</span>}
                  </div>
                  {children && <div className="asc-mg__items">{children(d, key)}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
