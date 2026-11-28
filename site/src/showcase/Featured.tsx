// "See it work": six components, each playing a short scripted loop of what it does, as affectUI's
// landing page does. Scenes are drawn in the kit's look with fictional data; the name links to the component.
import { Badge } from '@/components/ui/badge';
import { CATALOG } from '../catalog';
import { previewBySlug } from '../previews';
import { useLoop } from './useLoop';

const ms = (...d: number[]) => d;

/* ---- Data Grid: flat → grouped by status → view saved → two rows picked for a bulk action ---- */
const GRID_D = ms(1400, 1600, 1500, 1800, 1200);
const ROWS = [
  { t: 'Pool pump not priming', s: 'Scheduled', tone: 'success' as const },
  { t: 'Filter leaking at seal', s: 'Unassigned', tone: 'warning' as const },
  { t: 'Heat pump service', s: 'Scheduled', tone: 'success' as const },
  { t: 'Spa controller install', s: 'Unassigned', tone: 'warning' as const },
];
function GridScene() {
  const { ref, step } = useLoop<HTMLDivElement>(GRID_D);
  const grouped = step >= 1;
  const order = grouped ? [0, 2, 1, 3] : [0, 1, 2, 3];
  return (
    <div ref={ref} className="fs fs-grid">
      <div className="fs-toolbar">
        <span className="fs-chip" data-on={grouped || undefined}>Group: {grouped ? 'Status' : 'None'}</span>
        <span className="fs-chip" data-on={step >= 2 || undefined}>{step >= 2 ? '★ My open cases' : 'Save view'}</span>
      </div>
      <div className="fs-table">
        {order.map((i, n) => (
          <div key={i}>
            {grouped && (n === 0 || n === 2) && <div className="fs-group">{ROWS[i].s} · 2</div>}
            <div className="fs-tr" data-picked={(step >= 3 && (i === 1 || i === 3)) || undefined}>
              <span className="fs-box" />
              <span className="fs-tt">{ROWS[i].t}</span>
              <Badge tone={ROWS[i].tone} dot size="sm">{ROWS[i].s}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="fs-bulk" data-show={step >= 3 || undefined}>2 selected <b>Assign</b></div>
    </div>
  );
}

/* ---- Month Grid: jobs land on days, then one is moved ---- */
const CAL_D = ms(700, 700, 700, 700, 1200, 1600, 1200);
const JOBS = [{ d: 3, t: 'Service' }, { d: 9, t: 'Install' }, { d: 11, t: 'Repair' }, { d: 17, t: 'Service' }];
function CalendarScene() {
  const { ref, step } = useLoop<HTMLDivElement>(CAL_D);
  const placed = Math.min(step, JOBS.length);
  const moved = step >= 5;
  return (
    <div ref={ref} className="fs fs-cal">
      <div className="fs-cal-head"><b>March</b><span>4 jobs</span></div>
      <div className="fs-cal-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <small key={i}>{d}</small>)}
        {Array.from({ length: 21 }, (_, i) => {
          const day = i + 1;
          const jobs = JOBS.slice(0, placed).filter((j, n) => (moved && n === 2 ? 12 : j.d) === day);
          return (
            <div key={day} className="fs-day" data-drop={(moved && day === 12) || undefined}>
              <span>{day}</span>
              {jobs.map((j) => <i key={j.t + j.d} className="fs-job">{j.t}</i>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Chart: revenue bars grow, the total counts up, then the range switches ---- */
const CHART_D = ms(400, 1800, 1400, 1800, 600);
const BARS = [[38, 52, 44, 61, 70, 82], [55, 63, 58, 74, 81, 90]];
function ChartScene() {
  const { ref, step } = useLoop<HTMLDivElement>(CHART_D);
  const set = step >= 3 ? 1 : 0;
  const up = step >= 1 && step < 4;
  return (
    <div ref={ref} className="fs fs-chart">
      <div className="fs-chart-head">
        <div><small>Revenue</small><b>{up ? (set ? '$48,210' : '$36,940') : '$0'}</b></div>
        <span className="fs-seg"><i data-on={!set || undefined}>Month</i><i data-on={set || undefined}>Quarter</i></span>
      </div>
      <div className="fs-bars">
        {BARS[set].map((h, i) => <span key={i} style={{ height: up ? `${h}%` : '4%', transitionDelay: `${i * 60}ms` }} />)}
      </div>
    </div>
  );
}

/* ---- Combo Box: types "pool", the list narrows, one is picked ---- */
const COMBO_D = ms(900, 260, 260, 260, 900, 700, 1600);
const OPTIONS = ['Pool pump', 'Pool heater', 'Spa jets', 'Heat pump', 'Filter cartridge', 'Sauna heater'];
function ComboScene() {
  const { ref, step } = useLoop<HTMLDivElement>(COMBO_D);
  const typed = 'pool'.slice(0, Math.min(Math.max(step, 0), 4));
  const list = OPTIONS.filter((o) => o.toLowerCase().includes(typed));
  const picked = step >= 6;
  return (
    <div ref={ref} className="fs fs-combo">
      <small>Product</small>
      <div className="fs-input" data-focus={!picked || undefined}>
        {picked ? 'Pool heater' : typed || <span className="fs-ph">Search products</span>}
        {!picked && <i className="fs-caret" />}
      </div>
      {!picked && (
        <ul className="fs-list">
          {list.map((o) => (
            <li key={o} data-hi={(step >= 5 && o === 'Pool heater') || undefined}>
              {typed ? <><b>{o.slice(0, typed.length)}</b>{o.slice(typed.length)}</> : o}
            </li>
          ))}
        </ul>
      )}
      {picked && <p className="fs-done">✓ Added to the quote</p>}
    </div>
  );
}

/* ---- Toaster: a case closes, a toast offers Undo, Undo brings it back ---- */
const TOAST_D = ms(1200, 500, 1600, 500, 1600);
function ToastScene() {
  const { ref, step } = useLoop<HTMLDivElement>(TOAST_D);
  const closed = step >= 1 && step < 4;
  return (
    <div ref={ref} className="fs fs-toast">
      <div className="fs-case" data-closed={closed || undefined}>
        <div><b>CASE-1042</b><span>Pool pump not priming</span></div>
        <span className="fs-btn" data-press={step === 1 || undefined}>{closed ? 'Closed' : 'Close case'}</span>
      </div>
      <div className="fs-toasts">
        <div className="fs-t" data-show={(step >= 2 && step < 4) || undefined}>
          Case closed <b data-press={step === 3 || undefined}>Undo</b>
        </div>
        <div className="fs-t" data-show={step === 4 || undefined}>Case reopened</div>
      </div>
    </div>
  );
}

/* ---- Stepper Form: fields fill, each step ticks, the bar moves on ---- */
const STEP_D = ms(900, 900, 900, 900, 900, 1600);
const STEPS = ['Customer', 'Job', 'Confirm'];
function StepperScene() {
  const { ref, step } = useLoop<HTMLDivElement>(STEP_D);
  const at = Math.min(Math.floor(step / 2), 2);
  const fields = [['Name', 'Harbour Flats'], ['Job', 'Pool pump not priming'], ['When', 'Tue 9:30 am']];
  return (
    <div ref={ref} className="fs fs-step">
      <div className="fs-dots">
        {STEPS.map((s, i) => (
          <span key={s} data-state={i < at || step >= 5 ? 'done' : i === at ? 'now' : undefined}>
            <i>{i < at || step >= 5 ? '✓' : i + 1}</i>{s}
          </span>
        ))}
      </div>
      <div className="fs-progress"><span style={{ width: `${step >= 5 ? 100 : ((at + (step % 2) * 0.5) / 3) * 100}%` }} /></div>
      <div className="fs-field">
        <small>{fields[at][0]}</small>
        <div className="fs-input">{step % 2 === 1 || step >= 5 ? fields[at][1] : <span className="fs-ph">…</span>}</div>
      </div>
      <span className="fs-next">{step >= 5 ? 'Booked' : at === 2 ? 'Book job' : 'Next'}</span>
    </div>
  );
}

const CARDS = [
  { slug: 'data-grid', Scene: GridScene, blurb: 'Group, save a view, act on many rows at once.' },
  { slug: 'month-grid', Scene: CalendarScene, blurb: 'Jobs on the days they happen; drag to move one.' },
  { slug: 'chart', Scene: ChartScene, blurb: 'Bars, lines and totals from one component.' },
  { slug: 'select-and-combo-box', Scene: ComboScene, blurb: 'Type to narrow a long list, pick with keys or touch.' },
  { slug: 'toaster', Scene: ToastScene, blurb: 'Say what just happened, and let people undo it.' },
  { slug: 'stepper-form', Scene: StepperScene, blurb: 'A long form in short steps, checked as you go.' },
];

export function Featured() {
  return (
    <section className="wrap sec ft" aria-labelledby="ft-h">
      <div className="sec-head">
        <h2 id="ft-h">See it work</h2>
        <p>Every piece is built for the jobs a service business runs on. Each one plays what it does.</p>
      </div>
      <nav className="ft-tabs" aria-label="Library sections">
        <a href="#library-components" aria-current="true">Components</a>
        <a href="#library-screens">Screens</a>
        <a href="#library-blocks">Blocks</a>
        <a href="#library-illustrations">Illustrations</a>
        <a href="#library-motion">Motion</a>
      </nav>
      <div className="ft-grid">
        {CARDS.map(({ slug, Scene, blurb }) => {
          const item = CATALOG.find((i) => i.slug === slug);
          const href = previewBySlug(slug) ? `#c-${slug}` : '#library-components';
          return (
            <article className="ft-card" key={slug}>
              <div className="ft-stage" aria-hidden="true" inert>
                {item && <Badge className="ft-tier" tone={item.tier === 'free' ? 'success' : 'purple'} size="sm">{item.tier === 'free' ? 'Free' : 'Pro'}</Badge>}
                <Scene />
              </div>
              <a className="ft-foot" href={href}>
                <h3>{item?.name ?? slug}</h3>
                <p>{blurb}</p>
              </a>
            </article>
          );
        })}
      </div>
      <div className="ft-more"><a className="ft-all" href="#library-components">Explore all components</a></div>
    </section>
  );
}
