import type { ReactNode } from 'react';
import './MonthGrid.css';

/** A local date as YYYY-MM-DD (no timezone shift). */
function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── The month grid, once ─────────────────────────────────────────────────────
//
// Two screens lay records out on a month: Reminders (what am I due to do) and
// Cases (what does next Tuesday already look like). Everything from the ‹ › bar
// down to the six rows of day cells is the same on both — Monday-first, the
// trailing week dropped when the month doesn't need it, today's date in a
// filled circle, the 1st of the month labelled with its name so a cell that
// spills in from either side still says which month it belongs to.
//
// That is a lot of correct-but-fiddly date arithmetic (`(getDay() + 6) % 7` is
// the Monday-first lead; a `new Date(y, m, 1 - lead)` walk rather than
// millisecond addition, so it survives daylight saving), and the second copy of
// it was written by hand before this component existed. This file is the reason
// there is no third: a screen that wants a month says what goes IN a day, and
// nothing about how a month is shaped.
//
// What is deliberately NOT here: the chips, the "off this month" strip and the
// empty states. Those are what each screen is actually about, and a component
// that tried to own them would need a prop for every difference.
//
// The classes are `cal-*` and live in MonthGrid.css beside this file.

/** The 42 days a month grid walks, and how many rows of them to draw.
 *
 *  Six rows only when the month needs them — a trailing empty week is a row of
 *  dead grid that pushes whatever follows below the fold. */
export function monthDays(month: Date): { days: Date[]; weeks: number } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // Monday-first: the console's week is a working week, and a grid that starts
  // on Sunday puts the weekend either side of the days anybody works.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  const weeks = days[35] && days[35].getMonth() !== month.getMonth() ? 5 : 6;
  return { days, weeks };
}

/** ‹ September 2026 › Today — and whatever the screen wants on the right. */
export function MonthBar({
  month,
  onMonth,
  now,
  children,
}: {
  month: Date;
  onMonth: (d: Date) => void;
  now: Date;
  /** Trailing content — Cases puts its chip legend here. */
  children?: ReactNode;
}) {
  return (
    <div className="cal-bar">
      <button
        className="btn cal-nav"
        aria-label="Previous month"
        onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
      >
        ‹
      </button>
      <span className="cal-month">{month.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</span>
      <button
        className="btn cal-nav"
        aria-label="Next month"
        onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
      >
        ›
      </button>
      <button className="btn" onClick={() => onMonth(new Date(now.getFullYear(), now.getMonth(), 1))}>
        Today
      </button>
      {children}
    </div>
  );
}

/** The weekday header and the day cells. `children` renders what sits in a day,
 *  under its date — the caller gets the day and its `YYYY-MM-DD` key, which is
 *  what both screens index their records by. */
export function MonthGrid({
  month,
  now,
  children,
}: {
  month: Date;
  now: Date;
  children: (day: Date, key: string) => ReactNode;
}) {
  const { days, weeks } = monthDays(month);
  const todayKey = isoDay(now);

  return (
    <div className="cal">
      <div className="cal-head">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {days.slice(0, weeks * 7).map((d) => {
          const key = isoDay(d);
          const isToday = key === todayKey;
          const out = d.getMonth() !== month.getMonth();
          return (
            <div key={key} className={`cal-day${out ? ' out' : ''}${isToday ? ' today' : ''}`}>
              <div className="cal-n">
                {isToday ? (
                  <>
                    <span className="cal-dot">{d.getDate()}</span>
                    <span className="cal-todaylbl">Today</span>
                  </>
                ) : d.getDate() === 1 ? (
                  `${d.getDate()} ${d.toLocaleDateString('en-AU', { month: 'short' })}`
                ) : (
                  d.getDate()
                )}
              </div>
              {children(d, key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
