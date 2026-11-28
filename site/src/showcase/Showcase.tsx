// The hero's product picture: the desk admin console on the left and the field app (a phone web app)
// on the right, playing the main loop. A cursor opens an unassigned case, the record panel slides in
// beside the list, a technician is picked and the job is sent; then it lands on the phone.
// Static markup in the kit's look; the company, people and jobs are fictional demo data.
import { useLayoutEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLoop } from './useLoop';

// 0 idle · 1 cursor to the case · 2 click: panel opens · 3 cursor to Technician · 4 Rafael picked
// 5 cursor to Send · 6 sent: toast, row Scheduled, job on the phone · 7 hold
const FLOW = [1600, 900, 450, 900, 800, 800, 350, 2600];

type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';
type Case = { id: string; title: string; who: string; tech: string; tone: Tone; status: string };
const CASES: Case[] = [
  { id: 'CASE-1042', title: 'Pool pump not priming', who: 'Harbour Flats', tech: 'RO', tone: 'info', status: 'On the way' },
  { id: 'CASE-1041', title: 'Heat pump annual service', who: 'M. Lindqvist', tech: 'JP', tone: 'success', status: 'Scheduled' },
  { id: 'CASE-1039', title: 'Filter leaking at seal', who: 'Cove Gym', tech: '', tone: 'warning', status: 'Unassigned' },
  { id: 'CASE-1038', title: 'Install, spa controller', who: 'A. Mensah', tech: 'RO', tone: 'neutral', status: 'Quoted' },
  { id: 'CASE-1036', title: 'Warranty claim, motor', who: 'Bayview Hotel', tech: 'SK', tone: 'danger', status: 'Overdue' },
];
const TARGET = 'CASE-1039';
const NAV = ['Dashboard', 'Dispatch', 'Cases', 'Customers', 'Quotes', 'Invoices', 'Staff'];
const JOBS = [
  { time: '11:30', title: 'Heat pump annual service', where: '14 Ridge St' },
  { time: '1:15', title: 'Warranty claim, motor', where: 'Bayview Hotel' },
];

const Pointer = ({ x, y, press, show }: { x: number; y: number; press: boolean; show: boolean }) => (
  <svg
    className="sc-cursor"
    style={{ left: x, top: y, opacity: show ? 1 : 0 }}
    data-press={press || undefined}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

function Desk({ step }: { step: number }) {
  const box = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 600, y: 330 });
  const open = step >= 2;
  const sent = step >= 6;

  // The cursor travels to whatever this step acts on
  useLayoutEffect(() => {
    const target = step === 1 || step === 2 ? rowRef.current : step === 3 || step === 4 ? techRef.current : step === 5 || step === 6 ? sendRef.current : null;
    const b = box.current?.getBoundingClientRect();
    if (!target || !b) return setPos({ x: 600, y: 330 });
    const t = target.getBoundingClientRect();
    // getBoundingClientRect includes the hero's tilt; close enough for a pointer, and it re-measures each step
    setPos({ x: t.left - b.left + Math.min(t.width * 0.55, 90), y: t.top - b.top + t.height * 0.45 });
  }, [step, open]);

  return (
    <div className="sc-desk" ref={box}>
      <div className="sc-bar">
        <i /><i /><i />
        <span>app.northwind-services.com/cases{open ? `/${TARGET}` : ''}</span>
      </div>
      <div className="sc-app" data-panel={open || undefined}>
        <aside className="sc-side">
          <b className="sc-logo">Northwind</b>
          {NAV.map((n) => <span key={n} data-on={n === 'Cases' || undefined}>{n}</span>)}
        </aside>
        <div className="sc-main">
          <div className="sc-head">
            <strong>{open ? <>Cases <em>/ {TARGET}</em></> : 'Cases'}</strong>
            <span className="sc-btn">New case</span>
          </div>
          <div className="sc-stats">
            <div><small>Today</small><b>14</b></div>
            <div><small>Unassigned</small><b>{sent ? 2 : 3}</b></div>
            <div><small>Overdue</small><b>1</b></div>
          </div>
          <div className="sc-table">
            {CASES.map((c) => {
              const target = c.id === TARGET;
              const done = target && sent;
              return (
                <div className="sc-row" key={c.id} ref={target ? rowRef : undefined} data-open={(target && open) || undefined} data-press={(target && step === 2) || undefined}>
                  <code>{c.id}</code>
                  <span className="sc-t">{c.title}</span>
                  <span className="sc-who">{c.who}</span>
                  <span className="sc-av" data-empty={(!c.tech && !done) || undefined}>{done ? 'RO' : c.tech || '–'}</span>
                  <Badge tone={done ? 'success' : c.tone} dot size="sm">{done ? 'Scheduled' : c.status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
        <section className="sc-panel" aria-hidden={!open || undefined}>
          <div className="sc-panel-head"><b>{TARGET} · Cove Gym</b><span aria-hidden>×</span></div>
          <div className="sc-panel-body">
            <div className="sc-tags">
              <Badge tone={sent ? 'success' : 'warning'} dot size="sm">{sent ? 'Scheduled' : 'Unassigned'}</Badge>
              <Badge size="sm">Repair</Badge>
            </div>
            <dl className="sc-dl">
              <dt>Customer</dt><dd>Cove Gym</dd>
              <dt>Job</dt><dd>Filter leaking at seal</dd>
              <dt>Visit</dt><dd>Tue 1:15 pm</dd>
            </dl>
            <div className="sc-field" ref={techRef} data-focus={step === 3 || step === 4 || undefined}>
              <small>Technician</small>
              <div>{step >= 4 ? 'Rafael Okafor' : <span className="sc-ph">Who is going?</span>}</div>
            </div>
            <span className="sc-send" ref={sendRef} data-ready={step >= 4 || undefined} data-press={step === 6 || undefined}>
              {sent ? 'Sent ✓' : step >= 4 ? 'Send to Rafael' : 'Pick a technician first'}
            </span>
          </div>
        </section>
      </div>
      <div className="sc-toast" data-show={sent || undefined}>{TARGET} sent to Rafael · <u>Undo</u></div>
      <Pointer x={pos.x} y={pos.y} press={step === 2 || step === 6} show={step >= 1 && step <= 6} />
    </div>
  );
}

function Phone({ step }: { step: number }) {
  const landed = step >= 6;
  return (
    <div className="sc-phone">
      <div className="sc-notch" />
      <div className="sc-status"><span>9:41</span><span>●●●</span></div>
      <div className="sc-ph-head">
        <small>Tue 12 March · Rafael</small>
        <strong>Today</strong>
      </div>
      <div className="sc-next">
        <div className="sc-next-top"><Badge tone="info" dot size="sm">On the way</Badge><code>9:30</code></div>
        <b>Pool pump not priming</b>
        <span>Harbour Flats · 2.4 km</span>
        <span className="sc-cta">Arrived</span>
      </div>
      <div className="sc-list">
        {landed && (
          <div className="sc-li sc-new" key="new">
            <code>1:15</code>
            <div><b>Filter leaking at seal</b><span>Cove Gym · new job</span></div>
            <Badge tone="success" size="sm">New</Badge>
          </div>
        )}
        {JOBS.map((j) => (
          <div className="sc-li" key={j.title}>
            <code>{j.time}</code>
            <div><b>{j.title}</b><span>{j.where}</span></div>
            <span className="sc-chev">›</span>
          </div>
        ))}
      </div>
      <div className="sc-push" data-show={landed || undefined}>
        <b>New job · 1:15 pm</b>
        <span>Filter leaking at seal, Cove Gym</span>
      </div>
      <nav className="sc-tabs">
        {['Today', 'Jobs', 'Map', 'Me'].map((t) => <span key={t} data-on={t === 'Today' || undefined}>{t}</span>)}
      </nav>
    </div>
  );
}

export function Showcase() {
  const { ref, step } = useLoop<HTMLDivElement>(FLOW);
  return (
    <div
      ref={ref}
      className="showcase"
      role="img"
      aria-label="A fictional service company's admin console on a desktop and its field app on a phone. An unassigned case is opened in a panel beside the list, a technician is picked and the job is sent; it appears on the technician's phone."
    >
      <Desk step={step} />
      <Phone step={step} />
    </div>
  );
}
