// The hero's product picture: the desk admin console on the left and the field app (a phone web app)
// on the right. Static markup in the kit's look; the company, people and jobs are fictional demo data.
import { Badge } from '@/components/ui/badge';
import { useLoop } from './useLoop';

// The loop: idle, the cursor moves to Arrived, presses it, both screens show On site, then it resets.
const SYNC = [1800, 900, 350, 2600, 900];

type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';
const CASES: { id: string; title: string; who: string; tech: string; tone: Tone; status: string }[] = [
  { id: 'CASE-1042', title: 'Pool pump not priming', who: 'Harbour Flats', tech: 'RO', tone: 'info', status: 'On the way' },
  { id: 'CASE-1041', title: 'Heat pump annual service', who: 'M. Lindqvist', tech: 'JP', tone: 'success', status: 'Scheduled' },
  { id: 'CASE-1039', title: 'Filter leaking at seal', who: 'Cove Gym', tech: '', tone: 'warning', status: 'Unassigned' },
  { id: 'CASE-1038', title: 'Install, spa controller', who: 'A. Mensah', tech: 'RO', tone: 'neutral', status: 'Quoted' },
  { id: 'CASE-1036', title: 'Warranty claim, motor', who: 'Bayview Hotel', tech: 'SK', tone: 'danger', status: 'Overdue' },
];
const NAV = ['Dashboard', 'Dispatch', 'Cases', 'Customers', 'Quotes', 'Invoices', 'Staff'];
const JOBS = [
  { time: '11:30', title: 'Heat pump annual service', where: '14 Ridge St', tone: 'neutral' as Tone, status: 'Next' },
  { time: '1:15', title: 'Filter leaking at seal', where: 'Cove Gym', tone: 'neutral' as Tone, status: 'Later' },
  { time: '3:00', title: 'Warranty claim, motor', where: 'Bayview Hotel', tone: 'neutral' as Tone, status: 'Later' },
];

function Desk({ onSite }: { onSite: boolean }) {
  return (
    <div className="sc-desk">
      <div className="sc-bar">
        <i /><i /><i />
        <span>app.northwind-services.com/dispatch</span>
      </div>
      <div className="sc-app">
        <aside className="sc-side">
          <b className="sc-logo">Northwind</b>
          {NAV.map((n) => <span key={n} data-on={n === 'Dispatch' || undefined}>{n}</span>)}
        </aside>
        <div className="sc-main">
          <div className="sc-head">
            <strong>Dispatch</strong>
            <span className="sc-btn">New case</span>
          </div>
          <div className="sc-stats">
            <div><small>Today</small><b>14</b></div>
            <div><small>Unassigned</small><b>3</b></div>
            <div><small>Overdue</small><b>1</b></div>
          </div>
          <div className="sc-table">
            {CASES.map((c) => {
              const live = c.id === 'CASE-1042' && onSite;
              return (
              <div className="sc-row" key={c.id} data-flash={live || undefined}>
                <code>{c.id}</code>
                <span className="sc-t">{c.title}</span>
                <span className="sc-who">{c.who}</span>
                <span className="sc-av" data-empty={!c.tech || undefined}>{c.tech || '–'}</span>
                <Badge tone={live ? 'success' : c.tone} dot size="sm">{live ? 'On site' : c.status}</Badge>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone({ step }: { step: number }) {
  const onSite = step >= 3;
  return (
    <div className="sc-phone">
      <div className="sc-notch" />
      <div className="sc-status"><span>9:41</span><span>●●●</span></div>
      <div className="sc-ph-head">
        <small>Tue 12 March</small>
        <strong>Today</strong>
      </div>
      <div className="sc-next">
        <div className="sc-next-top"><Badge tone={onSite ? 'success' : 'info'} dot size="sm">{onSite ? 'On site' : 'On the way'}</Badge><code>9:30</code></div>
        <b>Pool pump not priming</b>
        <span>Harbour Flats · 2.4 km</span>
        <span className="sc-cta" data-press={step === 2 || undefined}>{onSite ? 'Finish job' : 'Arrived'}</span>
        <svg className="sc-cursor" data-at={step === 1 || step === 2 ? 'cta' : undefined} data-press={step === 2 || undefined} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      </div>
      <div className="sc-list">
        {JOBS.map((j) => (
          <div className="sc-li" key={j.title}>
            <code>{j.time}</code>
            <div><b>{j.title}</b><span>{j.where}</span></div>
            <span className="sc-chev">›</span>
          </div>
        ))}
      </div>
      <nav className="sc-tabs">
        {['Today', 'Jobs', 'Map', 'Me'].map((t) => <span key={t} data-on={t === 'Today' || undefined}>{t}</span>)}
      </nav>
    </div>
  );
}

export function Showcase() {
  const { ref, step } = useLoop<HTMLDivElement>(SYNC);
  return (
    <div ref={ref} className="showcase" role="img" aria-label="An admin console on a desktop and the matching field app on a phone, for a fictional service company. When the technician taps Arrived on the phone, the case on the desk changes to On site.">
      <Desk onSite={step >= 3} />
      <Phone step={step} />
    </div>
  );
}
