// The hero's product picture: the desk admin console on the left and the field app (a phone web app)
// on the right. Static markup in the kit's look; the company, people and jobs are fictional demo data.
import { Badge } from '@/components/ui/badge';

type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';
const CASES: { id: string; title: string; who: string; tech: string; tone: Tone; status: string }[] = [
  { id: 'CASE-1042', title: 'Pool pump not priming', who: 'Harbour Flats', tech: 'RO', tone: 'success', status: 'Scheduled' },
  { id: 'CASE-1041', title: 'Heat pump annual service', who: 'M. Lindqvist', tech: 'JP', tone: 'info', status: 'On the way' },
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

function Desk() {
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
            {CASES.map((c) => (
              <div className="sc-row" key={c.id}>
                <code>{c.id}</code>
                <span className="sc-t">{c.title}</span>
                <span className="sc-who">{c.who}</span>
                <span className="sc-av" data-empty={!c.tech || undefined}>{c.tech || '–'}</span>
                <Badge tone={c.tone} dot size="sm">{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone() {
  return (
    <div className="sc-phone">
      <div className="sc-notch" />
      <div className="sc-status"><span>9:41</span><span>●●●</span></div>
      <div className="sc-ph-head">
        <small>Tue 12 March</small>
        <strong>Today</strong>
      </div>
      <div className="sc-next">
        <div className="sc-next-top"><Badge tone="info" dot size="sm">On the way</Badge><code>9:30</code></div>
        <b>Pool pump not priming</b>
        <span>Harbour Flats · 2.4 km</span>
        <span className="sc-cta">Arrived</span>
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
  return (
    <div className="showcase" role="img" aria-label="An admin console on a desktop and the matching field app on a phone, for a fictional service company">
      <Desk />
      <Phone />
    </div>
  );
}
