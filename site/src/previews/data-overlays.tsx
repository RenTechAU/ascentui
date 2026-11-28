// Batch 3: data and overlays. The demos use a fictional service company's data.
import { Badge } from '@kit/badge';
import { Button } from '@kit/button';
import { Card } from '@kit/card';
import { Chart, type ChartDatum, type ChartKind } from '@kit/chart';
import chartSrc from '@kit/chart.tsx?raw';
import { DataTable, type Column, type SavedView } from '@kit/data-table';
import dataTableSrc from '@kit/data-table.tsx?raw';
import { Dialog, Drawer, useConfirm } from '@kit/dialog';
import dialogSrc from '@kit/dialog.tsx?raw';
import { EmptyState } from '@kit/empty-state';
import { IconButton } from '@kit/icon-button';
import { MonthGrid, isoDay } from '@kit/month-grid';
import monthGridSrc from '@kit/month-grid.tsx?raw';
import { SegmentedControl } from '@kit/segmented-control';
import { Select } from '@kit/select';
import { TextArea } from '@kit/text-area';
import { TextField } from '@kit/text-field';
import { Toaster, toast } from '@kit/toaster';
import toasterSrc from '@kit/toaster.tsx?raw';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Archive, Check, Pencil, Plus, Search, Trash } from './icons';
import type { Preview } from './types';

const G = 'Data and overlays';
const col = (width: number) => ({ display: 'flex', flexDirection: 'column', gap: 16, width: `min(100%, ${width}px)`, minWidth: 0 }) as const;
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 } as const;
const label = { fontSize: 12, color: 'var(--asc-muted)', fontWeight: 500, margin: 0 } as const;
const note = { margin: 0, fontSize: 12, color: 'var(--asc-muted)' } as const;
const theme = 'Light and dark come from the theme. Nothing in this file mentions a colour.';
const motion = 'It moves in and out with a short motion, which stops for people who ask their device for less.';

// ---------------------------------------------------------------- data

type Status = 'Open' | 'Scheduled' | 'In progress' | 'Waiting on parts' | 'Done';
const TONE: Record<Status, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Open: 'neutral', Scheduled: 'info', 'In progress': 'info', 'Waiting on parts': 'warning', Done: 'success',
};
type Case = { id: string; customer: string; job: string; status: Status; tech: string; due: string; amount: number; priority: 'Low' | 'Normal' | 'High' };

const CUSTOMERS = ['Harbour Pools', 'Northside Dental', 'Greenleaf Café', 'Coastal Fitness', 'Bayview Apartments', 'Riverside Childcare', 'Lakeside Motel', 'Oakridge School', 'Maple Street Gym', 'José Martín'];
const JOBS = ['Pool pump not priming', 'Annual heat pump service', 'Filter replacement', 'Leak detection', 'Salt cell clean', 'Chlorinator fault', 'Spa heater not firing', 'Water test and balance'];
const TECHS = ['Dana Whitfield', 'Rafael Okafor', 'Mei Lindqvist', 'Sam Kaur'];
const STATUSES: Status[] = ['Open', 'Scheduled', 'In progress', 'Waiting on parts', 'Done'];
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoDay(d);
};
const CASES: Case[] = Array.from({ length: 42 }, (_, i) => ({
  id: `CASE-${1060 - i}`,
  customer: CUSTOMERS[(i * 7) % CUSTOMERS.length]!,
  job: JOBS[(i * 5) % JOBS.length]!,
  status: STATUSES[(i * 3 + (i >> 2)) % STATUSES.length]!,
  tech: TECHS[(i * 3) % TECHS.length]!,
  due: day(((i * 11) % 30) - 8),
  amount: 120 + ((i * 397) % 2400) + ((i * 13) % 100) / 100,
  priority: (['Normal', 'High', 'Normal', 'Low'] as const)[i % 4]!,
}));
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const fmtDay = (iso: string) => dateFmt.format(new Date(`${iso}T00:00`));

// ---------------------------------------------------------------- Toaster

function ToasterDemo() {
  const [cases, setCases] = useState(CASES.slice(0, 3));
  const archive = (c: Case) => {
    const at = cases.indexOf(c);
    setCases((list) => list.filter((x) => x !== c));
    toast.success(`${c.id} archived`, {
      description: c.customer,
      undo: () => {
        setCases((list) => [...list.slice(0, at), c, ...list.slice(at)]);
        toast(`${c.id} restored`);
      },
    });
  };
  const save = () =>
    toast.promise(new Promise((ok) => setTimeout(ok, 1400)), { loading: 'Saving changes', success: 'Changes saved', error: 'Could not save' });
  const fail = () =>
    toast.error('Quote not sent', {
      description: 'The customer’s email address bounced. Check it and try again.',
      action: { label: 'Retry', onClick: () => toast.success('Quote sent') },
    });
  return (
    <div style={col(460)}>
      <Toaster />
      <Card title="Open cases" description="Archive one: the toast offers Undo." padding="none" style={{ gap: 0 }}>
        <div style={{ padding: '0 12px 4px' }}>
          {cases.length === 0 && <p style={{ ...note, padding: '12px 0' }}>All archived. Undo brings them back.</p>}
          {cases.map((c) => (
            <div key={c.id} style={{ ...row, flexWrap: 'nowrap', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--asc-border)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.job}</p>
                <p style={note}>{c.id} · {c.customer}</p>
              </div>
              <Button size="sm" variant="secondary" icon={<Archive />} onClick={() => archive(c)}>Archive</Button>
            </div>
          ))}
        </div>
      </Card>
      <p style={label}>Other kinds</p>
      <div style={row}>
        <Button variant="secondary" onClick={save}>Save, with a promise</Button>
        <Button variant="secondary" onClick={fail}>Fail, with Retry</Button>
        <Button variant="secondary" onClick={() => toast.info('Calendar synced', { description: '3 new visits for this week.' })}>Info</Button>
      </div>
      <p style={note}>Hover or focus a toast to pause it. Alt+T jumps to the newest; Escape closes it.</p>
    </div>
  );
}

const MockToast = ({ title, sub, undo }: { title: string; sub: string; undo?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-pop)', width: 240 }}>
    <span style={{ color: 'var(--asc-success)', display: 'inline-flex', width: 16 }}><Check /></span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>{title}</p>
      <p style={{ ...note, fontSize: 11 }}>{sub}</p>
    </div>
    {undo && <Button size="sm" variant="secondary" tabIndex={-1}>Undo</Button>}
  </div>
);
function ToasterThumb() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-hidden>
      <MockToast title="Changes saved" sub="Harbour Pools" />
      <MockToast title="CASE-1042 archived" sub="Pool pump not priming" undo />
    </div>
  );
}

// ---------------------------------------------------------------- Dialog + Drawer

function DialogDemo() {
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const c = CASES[2]!;
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEdit(false);
      toast.success('Customer updated');
    }, 900);
  };
  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${c.id}?`,
      description: 'Its visits and notes are deleted with it. You can undo for a few seconds afterwards.',
      confirmLabel: 'Delete case',
    });
    if (!ok) return;
    setDeleted(true);
    toast.success(`${c.id} deleted`, { undo: () => setDeleted(false) });
  };
  return (
    <div style={{ ...col(460), alignItems: 'center' }}>
      <Toaster />
      <div style={{ ...row, justifyContent: 'center' }}>
        <Button variant="secondary" icon={<Pencil />} onClick={() => setEdit(true)}>Edit customer</Button>
        <Button variant="secondary" onClick={() => setDrawer(true)}>Open case</Button>
        <Button variant="danger" icon={<Trash />} onClick={remove} disabled={deleted}>Delete case</Button>
      </div>
      <p style={note}>{deleted ? `${c.id} is deleted. Use Undo in the toast to bring it back.` : 'Escape closes each one, and focus returns to the button.'}</p>

      <Dialog
        open={edit}
        onOpenChange={(o) => !saving && setEdit(o)}
        dismissible={!saving}
        title="Edit customer"
        description="Changes apply to every open case for this customer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save customer</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <TextField label="Name" defaultValue="Harbour Pools" required />
          <TextField label="Billing email" type="email" defaultValue="accounts@harbourpools.com" />
          <Select label="Payment terms" defaultValue="14" options={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '30', label: '30 days' }]} />
        </div>
      </Dialog>

      <Drawer
        open={drawer}
        onOpenChange={setDrawer}
        title={c.job}
        description={`${c.id} · ${c.customer}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawer(false)}>Close</Button>
            <Button onClick={() => { setDrawer(false); toast.success(`${c.id} marked done`, { undo: () => toast('Back to in progress') }); }}>Mark done</Button>
          </>
        }
      >
        <CaseDetail c={c} />
      </Drawer>
      {confirmDialog}
    </div>
  );
}

function CaseDetail({ c }: { c: Case }) {
  const line = (k: string, v: ReactNode, num?: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--asc-border)' }}>
      <span style={{ color: 'var(--asc-muted)' }}>{k}</span>
      <span style={{ textAlign: 'right', fontVariantNumeric: num ? 'tabular-nums' : undefined }}>{v}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={row}>
        <Badge tone={TONE[c.status]} dot>{c.status}</Badge>
        <Badge>{c.priority} priority</Badge>
      </div>
      <div>
        {line('Technician', c.tech)}
        {line('Due', fmtDay(c.due))}
        {line('Amount', money.format(c.amount), true)}
      </div>
      <TextArea label="Notes for the technician" minRows={3} defaultValue="Gate code 4410. Pump is behind the shed, left side." />
    </div>
  );
}

function DialogThumb() {
  return (
    <div aria-hidden style={{ width: 230, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-pop)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 12px 8px' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>Delete CASE-1042?</p>
        <p style={{ ...note, fontSize: 11 }}>Its visits and notes are deleted with it.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: 8, borderTop: '1px solid var(--asc-border)', background: 'var(--asc-subtle)' }}>
        <Button size="sm" variant="secondary" tabIndex={-1}>Cancel</Button>
        <Button size="sm" variant="danger" tabIndex={-1}>Delete case</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Chart

const WEEKS: ChartDatum[] = ['Oct 26', 'Nov 2', 'Nov 9', 'Nov 16', 'Nov 23', 'Nov 30'].map((label, i) => ({
  label, opened: [18, 22, 19, 25, 21, 24][i], closed: [15, 20, 22, 21, 26, 25][i],
}));
const MONTHS: ChartDatum[] = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((label, i) => ({
  label, service: [12400, 11800, 13900, 15200, 16800, 18400][i], parts: [4200, 3900, 5100, 4800, 6100, 6900][i],
}));
const BY_STATUS: ChartDatum[] = [
  { label: 'Open', value: 12 }, { label: 'Scheduled', value: 9 }, { label: 'In progress', value: 7 }, { label: 'Waiting on parts', value: 4 },
];
const BY_TECH: ChartDatum[] = TECHS.map((label, i) => ({ label, jobs: [34, 28, 41, 22][i] }));
const usd0 = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const;

function ChartDemo() {
  const [kind, setKind] = useState<ChartKind>('bar');
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, width: 'min(100%, 760px)', minWidth: 0 } as const;
  return (
    <div style={grid}>
      <Card title="Cases per week" description="Opened and closed" action={
        <SegmentedControl size="sm" aria-label="Chart type" value={kind} onChange={(v) => setKind(v as ChartKind)} options={[{ value: 'bar', label: 'Bar' }, { value: 'line', label: 'Line' }, { value: 'area', label: 'Area' }]} />
      }>
        <Chart kind={kind} label="Cases opened and closed per week" xLabel="Week" data={WEEKS} series={[{ key: 'opened', label: 'Opened' }, { key: 'closed', label: 'Closed' }]} height={200} summary="Closed cases caught up with new ones from mid November." />
      </Card>
      <Card title="Billed by month" description="Service and parts, stacked">
        <Chart kind="area" stacked label="Billed by month" xLabel="Month" data={MONTHS} series={[{ key: 'service', label: 'Service' }, { key: 'parts', label: 'Parts', color: 'purple' }]} format={usd0} height={200} references={[{ value: 20000, label: 'Target' }]} />
      </Card>
      <Card title="Open cases by status">
        <Chart kind="donut" label="Open cases by status" xLabel="Status" data={BY_STATUS} series={[{ key: 'value', label: 'Cases' }]} centerValue={32} centerLabel="open" height={180} />
      </Card>
      <Card title="Jobs this quarter" description="By technician">
        <Chart kind="bar" horizontal label="Jobs this quarter by technician" xLabel="Technician" data={BY_TECH} series={[{ key: 'jobs', label: 'Jobs', color: 'green' }]} height={180} />
      </Card>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={label}>Billed this month</p>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--asc-text-xl)', lineHeight: 'var(--asc-leading-xl)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{money.format(25300)}</p>
          </div>
          <div style={{ width: 120 }}>
            <Chart kind="spark" label="Billed per month, last six months" xLabel="Month" data={MONTHS} series={[{ key: 'service', label: 'Service' }]} format={usd0} />
          </div>
        </div>
      </Card>
      <Card title="Parts budget" description="Used this month">
        <div style={{ display: 'grid', gap: 12 }}>
          {[{ n: 'Pumps and motors', v: 62 }, { n: 'Filters', v: 88, tone: 'warning' as const }, { n: 'Chemicals', v: 34 }].map((m) => (
            <div key={m.n} style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{m.n}</span>
                <span style={{ color: 'var(--asc-muted)', fontVariantNumeric: 'tabular-nums' }}>{m.v}%</span>
              </div>
              <Chart kind="meter" label={`${m.n} budget used`} value={m.v} format={{ maximumFractionDigits: 0 }} tone={m.tone} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function ChartThumb() {
  return (
    <div style={{ width: 240 }}>
      <Chart kind="bar" label="Cases per week" data={WEEKS} series={[{ key: 'opened', label: 'Opened' }, { key: 'closed', label: 'Closed' }]} height={140} legend={false} />
    </div>
  );
}

// ---------------------------------------------------------------- Data Table

const caseColumns = (open: (c: Case) => void): Column<Case>[] => [
  {
    key: 'id', label: 'Case', width: '104px', sortValue: (c) => c.id,
    // The case number is a real button too, so the row can be opened without a mouse
    render: (c) => <button type="button" style={linkBtn} onClick={(e) => { e.stopPropagation(); open(c); }}>{c.id}</button>,
  },
  { key: 'customer', label: 'Customer', width: '1.2fr', minWidth: 140, render: (c) => <Ellipsis>{c.customer}</Ellipsis>, sortValue: (c) => c.customer },
  { key: 'job', label: 'Job', width: '1.6fr', minWidth: 160, render: (c) => <Ellipsis>{c.job}</Ellipsis>, sortValue: (c) => c.job },
  { key: 'status', label: 'Status', width: '140px', render: (c) => <Badge tone={TONE[c.status]} dot>{c.status}</Badge>, sortValue: (c) => STATUSES.indexOf(c.status) },
  { key: 'tech', label: 'Technician', width: '1fr', minWidth: 120, optional: true, render: (c) => <Ellipsis>{c.tech}</Ellipsis>, sortValue: (c) => c.tech },
  { key: 'due', label: 'Due', width: '84px', render: (c) => fmtDay(c.due), sortValue: (c) => c.due },
  { key: 'priority', label: 'Priority', width: '88px', optional: true, defaultHidden: true, render: (c) => c.priority, sortValue: (c) => ['Low', 'Normal', 'High'].indexOf(c.priority) },
  { key: 'amount', label: 'Amount', width: '104px', align: 'right', optional: true, render: (c) => money.format(c.amount), sortValue: (c) => c.amount },
];
const linkBtn: CSSProperties = { padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--asc-border-strong)', textUnderlineOffset: 3 };
const Ellipsis = ({ children }: { children: ReactNode }) => (
  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
);
const SEED_VIEWS: SavedView[] = [
  { id: 'by-tech', name: 'By technician', cols: ['id', 'customer', 'job', 'status', 'tech', 'due'], group: 'tech', sort: { key: 'due', dir: 'asc' } },
];

function DataTableDemo() {
  const [all, setAll] = useState(CASES);
  const [q, setQ] = useState('');
  const [state, setState] = useState<'ready' | 'loading' | 'empty'>('ready');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [views, setViews] = useState(SEED_VIEWS);
  const [open, setOpen] = useState<Case | null>(null);
  const [drawer, setDrawer] = useState(false);
  const show = (c: Case) => {
    setOpen(c);
    setDrawer(true);
  };
  const columns = useMemo(() => caseColumns(show), []);
  const text = q.trim().toLowerCase();
  const rows = state === 'empty' ? [] : all.filter((c) => !text || `${c.id} ${c.customer} ${c.job} ${c.tech}`.toLowerCase().includes(text));

  const archive = (keys: string[], clear: () => void) => {
    const gone = all.filter((c) => keys.includes(c.id));
    const before = all;
    setAll(all.filter((c) => !keys.includes(c.id)));
    clear();
    toast.success(`${gone.length} ${gone.length === 1 ? 'case' : 'cases'} archived`, { undo: () => setAll(before) });
  };
  const markDone = (keys: string[], clear: () => void) => {
    const before = all;
    setAll(all.map((c) => (keys.includes(c.id) ? { ...c, status: 'Done' as const } : c)));
    clear();
    toast.success(`${keys.length} marked done`, { undo: () => setAll(before) });
  };

  return (
    <div style={{ ...col(880), width: '100%' }}>
      <Toaster />
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <div style={{ width: 'min(100%, 260px)' }}>
          <TextField label="Search cases" hideLabel type="search" size="sm" prefix={<Search />} placeholder="Search cases" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SegmentedControl size="sm" aria-label="Show the table" value={state} onChange={(v) => setState(v as typeof state)} options={[{ value: 'ready', label: 'Loaded' }, { value: 'loading', label: 'Loading' }, { value: 'empty', label: 'Empty' }]} />
      </div>
      <DataTable
        label="Cases"
        rows={rows}
        columns={columns}
        getRowKey={(c) => c.id}
        rowLabel={(c) => `${c.id}, ${c.customer}`}
        onRowClick={show}
        loading={state === 'loading'}
        pageSize={10}
        maxHeight="min(70vh, 520px)"
        groups={[{ key: 'status', label: 'Status', groupOf: (c) => c.status }, { key: 'tech', label: 'Technician', groupOf: (c) => c.tech }]}
        selection={{ selected, onChange: setSelected }}
        bulkActions={(keys, clear) => (
          <>
            <Button size="sm" variant="secondary" icon={<Check />} onClick={() => markDone(keys, clear)}>Mark done</Button>
            <Button size="sm" variant="secondary" icon={<Archive />} onClick={() => archive(keys, clear)}>Archive</Button>
          </>
        )}
        rowActions={(c) => (
          <>
            <IconButton size="sm" icon={<Pencil />} label={`Open ${c.id}`} onClick={() => show(c)} />
            <IconButton size="sm" icon={<Archive />} label={`Archive ${c.id}`} onClick={() => archive([c.id], () => setSelected((s) => { const n = new Set(s); n.delete(c.id); return n; }))} />
          </>
        )}
        rowActionsWidth="64px"
        views={views}
        onViewsChange={setViews}
        empty={
          q ? (
            <EmptyMessage title={`No cases match “${q}”`} action={<Button size="sm" variant="secondary" onClick={() => setQ('')}>Clear search</Button>} />
          ) : (
            <EmptyMessage title="No cases yet" text="New cases appear here when a customer books a visit." action={<Button size="sm" icon={<Plus />} onClick={() => setState('ready')}>New case</Button>} />
          )
        }
      />
      <Drawer open={drawer} onOpenChange={setDrawer} title={open?.job ?? ''} description={open ? `${open.id} · ${open.customer}` : undefined} footer={<Button variant="secondary" onClick={() => setDrawer(false)}>Close</Button>}>
        {open && <CaseDetail c={open} />}
      </Drawer>
    </div>
  );
}
const EmptyMessage = ({ title, text, action }: { title: string; text?: string; action?: ReactNode }) => (
  <EmptyState size="sm" title={title} description={text} action={action} />
);

function DataTableThumb() {
  const cols = caseColumns(() => {}).filter((c) => ['customer', 'status', 'amount'].includes(c.key));
  return (
    <div style={{ width: 260 }}>
      <DataTable label="Cases" showViews={false} rows={CASES.slice(0, 3)} columns={cols.map((c) => ({ ...c, minWidth: 60, optional: false }))} getRowKey={(c) => c.id} maxHeight="none" />
    </div>
  );
}

// ---------------------------------------------------------------- Month Grid

type Visit = { day: string; time: string; customer: string; status: Status };
const VISITS: Visit[] = Array.from({ length: 26 }, (_, i) => ({
  day: day(((i * 5) % 34) - 12),
  time: ['08:30', '10:00', '13:15', '15:30'][i % 4]!,
  customer: CUSTOMERS[(i * 3) % CUSTOMERS.length]!,
  status: (['Scheduled', 'Done', 'Waiting on parts', 'Scheduled'] as Status[])[i % 4]!,
}));
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const fmtTime = (t: string) => timeFmt.format(new Date(`2026-01-01T${t}`));

function MonthDemo() {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(isoDay(new Date()));
  const byDay = useMemo(() => {
    const m = new Map<string, Visit[]>();
    for (const v of VISITS) (m.get(v.day) ?? m.set(v.day, []).get(v.day)!).push(v);
    for (const list of m.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return m;
  }, []);
  const chosen = selected ? byDay.get(selected) ?? [] : [];
  const chip: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, padding: '1px 4px', borderRadius: 'var(--asc-radius-sm)', background: 'var(--asc-subtle-strong)', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap', overflow: 'hidden' };
  const dot = (s: Status): CSSProperties => ({ width: 6, height: 6, flex: 'none', borderRadius: 999, background: `var(--asc-${TONE[s] === 'neutral' ? 'faint' : TONE[s]})` });
  return (
    <div style={{ ...col(820), width: '100%' }}>
      <MonthGrid
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={(k) => setSelected(k)}
        actions={<span style={note}>{VISITS.length} visits</span>}
      >
        {(_, key) => {
          const list = byDay.get(key) ?? [];
          return (
            <>
              {list.slice(0, 2).map((v, i) => (
                <span key={i} style={chip} title={`${fmtTime(v.time)} ${v.customer}, ${v.status}`}>
                  <span style={dot(v.status)} aria-hidden />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtTime(v.time)} {v.customer}</span>
                </span>
              ))}
              {list.length > 2 && <span style={{ ...note, fontSize: 11 }}>+{list.length - 2} more</span>}
            </>
          );
        }}
      </MonthGrid>
      <Card title={selected ? new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${selected}T00:00`)) : 'Pick a day'} description={`${chosen.length} ${chosen.length === 1 ? 'visit' : 'visits'}`}>
        {chosen.length === 0 ? (
          <p style={note}>Nothing booked. Pick another day, or use the arrow keys to move through the month.</p>
        ) : (
          chosen.map((v, i) => (
            <div key={i} style={{ ...row, justifyContent: 'space-between' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(v.time)} · {v.customer}</span>
              <Badge tone={TONE[v.status]}>{v.status}</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
function MonthThumb() {
  return (
    <div style={{ width: 420, transform: 'scale(.56)', transformOrigin: 'center', pointerEvents: 'none' }} aria-hidden>
      <MonthGrid month={new Date()} />
    </div>
  );
}

// ---------------------------------------------------------------- the pages

export const DATA_OVERLAYS: Preview[] = [
  {
    slug: 'toaster',
    name: 'Toaster',
    group: G,
    description: 'Brief messages that say what just happened, with Undo for anything reversible. Mount it once; call toast() from anywhere.',
    install: ['toaster'],
    sources: [{ file: 'toaster.tsx', code: toasterSrc }],
    Demo: ToasterDemo,
    Thumb: ToasterThumb,
    usage: `import { Toaster, toast } from "@/components/ui/toaster";

// Once, near the root of the app
<Toaster />

// Anywhere
toast.success("Case archived", { undo: () => restoreCase(id) });`,
    examples: [
      { title: 'Saving, then saved or failed, in one toast', code: `toast.promise(api.saveCase(draft), {
  loading: "Saving case",
  success: (c) => \`\${c.id} saved\`,
  error: "Could not save. Check your connection and try again.",
});` },
      { title: 'An error with a way forward', code: `toast.error("Quote not sent", {
  description: "The customer's email bounced.",
  action: { label: "Retry", onClick: resend },
});` },
      { title: 'Archive with Undo: do it now, take it back if asked', code: `function archive(c: Case) {
  setCases((list) => list.filter((x) => x.id !== c.id));   // the page updates at once
  const timer = setTimeout(() => api.archive(c.id), 8000);  // or archive now and un-archive on Undo
  toast.success(\`\${c.id} archived\`, {
    undo: () => { clearTimeout(timer); setCases((list) => [c, ...list]); },
  });
}` },
    ],
    props: [
      {
        component: 'toast(title, options)',
        rows: [
          { name: 'toast / .success / .error / .info / .loading', type: '(title, options?) => id', desc: 'Show a toast of that kind. Returns its id' },
          { name: 'toast.promise', type: '(promise, { loading, success, error }) => promise', desc: 'Loading while the promise runs, then success or error in the same toast. success and error can be functions of the result' },
          { name: 'toast.dismiss', type: '(id?) => void', desc: 'Close one toast, or all of them' },
          { name: 'description', type: 'ReactNode', desc: 'A second line: more detail, or what to do next' },
          { name: 'undo', type: '() => void', desc: 'Adds an Undo button and keeps the toast up for 8 seconds' },
          { name: 'action', type: '{ label, onClick }', desc: 'One other action instead of Undo, such as Retry or View' },
          { name: 'duration', type: 'number', def: '5000', desc: '8000 with an action. Errors stay until dismissed. Infinity keeps any toast up' },
          { name: 'id', type: 'string', desc: 'Reuse an id to replace a toast in place' },
          { name: 'onDismiss', type: '() => void', desc: 'Called when it closes, however it closes' },
        ],
      },
      {
        component: 'Toaster',
        rows: [
          { name: 'position', type: '"bottom-right" | "bottom-center" | "top-right" | "top-center"', def: '"bottom-right"', desc: 'Where toasts appear on a desk. On phones they span the bottom of the screen' },
          { name: 'max', type: 'number', def: '3', desc: 'How many show at once. When another arrives, the oldest closes' },
          { name: 'label', type: 'string', def: '"Notifications"', desc: 'The region’s name for screen readers' },
        ],
      },
    ],
    when: ['Confirming that something worked: saved, sent, archived', 'Offering Undo after an action, instead of asking "Are you sure?" first', 'An error that does not belong to one field, such as a failed send'],
    whenNot: ['Something wrong with a field: show it under the field', 'Anything people must read or decide: use a Dialog', 'Information that should stay on the page, such as "This invoice is overdue": put it on the page'],
    keyboard: [
      ['Alt + T', 'Moves focus to the newest toast, so its Undo is one key away'],
      ['Tab', 'Moves between the toast’s buttons'],
      ['Escape', 'Closes the focused toast, or the newest one'],
      ['Enter or Space', 'Presses Undo or Dismiss'],
    ],
    builtIn: [
      'Undo is built in, because doing the thing at once and offering to take it back is faster and kinder than "Are you sure?" for anything reversible. A toast with Undo stays up for 8 seconds, not 5.',
      'Errors stay until they are dismissed, so nobody misses that something failed while looking away.',
      'Screen readers hear every toast. Errors are read out straight away; the rest wait until the reader has finished what it was saying.',
      'Toasts with an action tell screen reader users how to reach it: Alt+T.',
      'The timer pauses while the pointer is over a toast or the keyboard is inside it, so it never vanishes while being read.',
      'Saving, then saved or failed, is one toast that changes, not three stacked ones.',
      'Toasts sit above open dialogs too, so a "Saved" from inside a dialog is not hidden behind it.',
      'At most three show at once. On phones they span the bottom of the screen, clear of the home bar.',
      motion,
      theme,
    ],
  },
  {
    slug: 'dialog-and-drawer',
    name: 'Dialog + Drawer',
    group: G,
    description: 'A focused task on top of the page: a dialog in the middle, or a drawer from the right that is full screen on phones. useConfirm asks before something destructive.',
    install: ['dialog'],
    sources: [{ file: 'dialog.tsx', code: dialogSrc }],
    Demo: DialogDemo,
    Thumb: DialogThumb,
    usage: `import { Dialog, Drawer, useConfirm } from "@/components/ui/dialog";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Edit customer</Button>
<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Edit customer"
  footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}
>
  <CustomerForm />
</Dialog>`,
    examples: [
      { title: 'A record in a side panel', code: `<Drawer open={!!caseId} onOpenChange={(o) => !o && setCaseId(null)} title={c.job} description={c.id} size="lg">
  <CaseDetail id={caseId} />
</Drawer>` },
      { title: 'Ask before deleting, in one line', code: `const [confirm, confirmDialog] = useConfirm();

async function remove() {
  if (!(await confirm({ title: "Delete 3 cases?", description: "Their visits are deleted too.", confirmLabel: "Delete cases" }))) return;
  await api.deleteCases(ids);
}

return <>{/* … */}{confirmDialog}</>;` },
      { title: 'Keep it open while saving', code: `<Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)} dismissible={!saving} … />` },
    ],
    props: [
      {
        component: 'Dialog and Drawer',
        rows: [
          { name: 'open', type: 'boolean', desc: 'Whether it is open. You own this state' },
          { name: 'onOpenChange', type: '(open) => void', desc: 'Called with false on Escape, the × button or a click outside' },
          { name: 'title', type: 'ReactNode', desc: 'What it is about. Read out when it opens' },
          { name: 'description', type: 'ReactNode', desc: 'One line under the title, read out with it' },
          { name: 'children', type: 'ReactNode', desc: 'The body. It scrolls on its own; title and footer stay put' },
          { name: 'footer', type: 'ReactNode', desc: 'Buttons, right-aligned. Main action last. Full width on phones' },
          { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: 'Dialog 400, 520 or 720px; Drawer 380, 480 or 640px' },
          { name: 'dismissible', type: 'boolean', def: 'true', desc: 'Escape and a click outside close it. Turn off while saving' },
          { name: 'initialFocus', type: 'RefObject', desc: 'What gets focus on open. By default the first field or button' },
          { name: 'hideClose', type: 'boolean', def: 'false', desc: 'Hide the × button' },
          { name: 'onClosed', type: '() => void', desc: 'After the exit motion, e.g. to clear the record it showed' },
        ],
      },
      {
        component: 'useConfirm / ConfirmDialog',
        rows: [
          { name: 'title', type: 'ReactNode', desc: 'The question: "Delete 3 cases?"' },
          { name: 'description', type: 'ReactNode', desc: 'What happens, in plain words' },
          { name: 'confirmLabel', type: 'string', def: '"Confirm"', desc: 'Say what it does: "Delete cases", not "OK"' },
          { name: 'cancelLabel', type: 'string', def: '"Cancel"', desc: 'The safe way out' },
          { name: 'tone', type: '"danger" | "neutral"', def: '"danger"', desc: 'danger: red button, and focus starts on Cancel' },
          { name: 'onConfirm', type: '() => void | Promise', desc: 'ConfirmDialog only. A promise keeps it open with a spinner until it settles' },
        ],
      },
    ],
    when: ['Dialog: a short task that needs full attention, such as editing a few fields or a confirm', 'Drawer: one record while keeping the list in view, or a long form', 'useConfirm: before something that cannot be undone'],
    whenNot: ['Telling people something worked: use a toast', 'A reversible action: do it, and offer Undo in a toast instead of asking first', 'A long multi-step process: give it its own page or a Stepper Form'],
    keyboard: [
      ['Escape', 'Closes it, unless it is saving'],
      ['Tab / Shift + Tab', 'Move through what is inside; focus goes round and never reaches the page behind'],
      ['Enter', 'Presses the focused button'],
    ],
    builtIn: [
      'It is the browser’s own dialog, so the page behind is truly out of reach: it can’t be clicked, tabbed to or read by a screen reader while the dialog is open. Hand-made dialogs often get this wrong.',
      'When it closes, focus goes back to the button that opened it, so keyboard users keep their place.',
      'The page behind stops scrolling, without jumping sideways when its scrollbar goes away.',
      'The title and description are read out as it opens, so screen reader users know where they are.',
      'A confirm for something destructive puts focus on Cancel, so a stray Enter can’t delete anything. Its button says what it does, like "Delete case".',
      'Dragging to select text inside and letting go outside does not close it. Only a real click outside does.',
      'Long content scrolls inside; the title and buttons stay in view.',
      'On phones the drawer fills the screen and the footer buttons grow to full width, clear of the home bar.',
      'Escape inside an open list, such as a combo box, closes the list first, not the dialog.',
      motion,
    ],
  },
  {
    slug: 'chart',
    name: 'Chart',
    group: G,
    description: 'Bars, lines, areas, pie and donut, sparklines and meters from one component, in the theme’s colours, with the numbers as a table for screen readers.',
    install: ['chart'],
    sources: [{ file: 'chart.tsx', code: chartSrc }],
    Demo: ChartDemo,
    Thumb: ChartThumb,
    usage: `import { Chart } from "@/components/ui/chart";

<Chart
  kind="bar"
  label="Cases opened and closed per week"
  xLabel="Week"
  data={[{ label: "Nov 2", opened: 22, closed: 20 }, { label: "Nov 9", opened: 19, closed: 22 }]}
  series={[{ key: "opened", label: "Opened" }, { key: "closed", label: "Closed" }]}
/>`,
    examples: [
      { title: 'Money, stacked, with a target', code: `<Chart kind="area" stacked label="Billed by month" data={months}
  series={[{ key: "service", label: "Service" }, { key: "parts", label: "Parts", color: "purple" }]}
  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
  references={[{ value: 20000, label: "Target" }]} />` },
      { title: 'A donut with the total in the middle', code: `<Chart kind="donut" label="Open cases by status" data={[{ label: "Open", value: 12 }, { label: "Scheduled", value: 9 }]} centerValue={21} centerLabel="open" />` },
      { title: 'Long names: bars sideways', code: `<Chart kind="bar" horizontal label="Jobs by technician" data={byTech} series={[{ key: "jobs", label: "Jobs" }]} />` },
      { title: 'In a table cell or a stat', code: `<Chart kind="meter" label="Filters budget used" value={88} tone="warning" />
<Chart kind="spark" label="Billed per month" data={months} series={[{ key: "total", label: "Billed" }]} />` },
    ],
    props: [{
      component: 'Chart',
      rows: [
        { name: 'kind', type: '"bar" | "line" | "area" | "pie" | "donut" | "spark" | "meter"', desc: 'What to draw' },
        { name: 'label', type: 'string', desc: 'What it shows. Required: screen readers hear it, and it heads their data table' },
        { name: 'data', type: '{ label, [series]: number }[]', desc: 'One row per category. Pie and donut: one row per slice with value' },
        { name: 'series', type: '{ key, label, color? }[]', desc: 'The numbers to draw. color is a theme hue (blue, green, amber, purple, red) or any CSS colour' },
        { name: 'xKey / xLabel', type: 'string', def: '"label" / "Category"', desc: 'The field that names each row, and what the rows are, e.g. "Week"' },
        { name: 'format', type: 'Intl.NumberFormatOptions | (n) => string', desc: 'How numbers read, in the reader’s locale. Axes shorten big numbers' },
        { name: 'stacked / percent', type: 'boolean', def: 'false', desc: 'Stack the series, or stack to 100% to compare shares' },
        { name: 'horizontal', type: 'boolean', def: 'false', desc: 'Bars run sideways, for long category names' },
        { name: 'references', type: '{ value, label }[]', desc: 'Dashed lines across the plot, such as a target' },
        { name: 'legend / hideable', type: 'boolean', def: 'auto / true', desc: 'The legend shows with two or more series, and its entries show and hide them' },
        { name: 'height', type: 'number', def: '240', desc: 'Plot height in px; 40 for spark' },
        { name: 'centerValue / centerLabel', type: 'ReactNode', desc: 'Donut: the number in the middle' },
        { name: 'value / max / tone', type: 'number / number / tone', def: '0 / 100 / "neutral"', desc: 'Meter: how full, and a status colour only when it means something' },
        { name: 'summary', type: 'string', desc: 'One sentence that sums it up for screen readers' },
        { name: 'emptyText', type: 'ReactNode', def: '"No data yet"', desc: 'Shown instead of empty axes' },
      ],
    }],
    when: ['A trend over time: bars for counts, lines or areas for continuous values', 'Shares of a whole with up to five parts: a donut', 'A number with its recent trend in a stat: a sparkline', 'How full something is, in a row or a card: a meter'],
    whenNot: ['One number that matters: use a Stat Card', 'Exact values people compare or copy: use a Data Table', 'More than five slices: use horizontal bars'],
    keyboard: [['Tab', 'Moves to the legend buttons'], ['Enter or Space', 'Shows or hides that series']],
    builtIn: [
      'Every chart carries its numbers as a table that screen readers read, with the label as its caption. A chart is never only a picture.',
      'Numbers, money and percentages are written the reader’s way: 18,400 in New York, 18.400 in Berlin. Axes shorten big numbers to 18K.',
      'Colours come from the theme’s chart hues, the same order on every chart, and change with light and dark.',
      'The legend doubles as a filter: click an entry to hide that series. It is a real button, so the keyboard and screen readers can use it too.',
      'An empty chart says "No data yet" instead of drawing empty axes, which look broken.',
      'The tooltip uses equal-width digits, so values line up between rows.',
      'Bars grow in once and then stay still. For people who ask for less motion they simply appear.',
      'A meter is announced as a meter with its value, such as "88 of 100".',
    ],
  },
  {
    slug: 'data-table',
    name: 'Data Table',
    group: G,
    description: 'A list of records with sorting, column choices, saved views, grouping, selection with bulk actions and paging. Loading and empty states included.',
    install: ['data-table'],
    sources: [{ file: 'data-table.tsx', code: dataTableSrc }],
    Demo: DataTableDemo,
    Thumb: DataTableThumb,
    usage: `import { DataTable, type Column } from "@/components/ui/data-table";

const columns: Column<Case>[] = [
  { key: "id", label: "Case", width: "104px", render: (c) => c.id, sortValue: (c) => c.id },
  { key: "customer", label: "Customer", render: (c) => c.customer, sortValue: (c) => c.customer },
  { key: "status", label: "Status", render: (c) => <Badge tone={tone[c.status]}>{c.status}</Badge> },
  { key: "amount", label: "Amount", align: "right", optional: true, render: (c) => money.format(c.amount), sortValue: (c) => c.amount },
];

<DataTable label="Cases" rows={cases} columns={columns} getRowKey={(c) => c.id} onRowClick={openCase} />`,
    examples: [
      { title: 'Selection with a bulk action and Undo', code: `const [selected, setSelected] = useState(new Set<string>());

<DataTable
  …
  selection={{ selected, onChange: setSelected }}
  bulkActions={(keys, clear) => (
    <Button size="sm" variant="secondary" onClick={() => { archive(keys); clear(); toast.success(\`\${keys.length} archived\`, { undo: () => restore(keys) }); }}>
      Archive
    </Button>
  )}
/>` },
      { title: 'Keep views and column choices', code: `// In this browser only
<DataTable {...useTableStorage("cases")} … />

// Or on your server, per person
<DataTable views={views} onViewsChange={saveViews} defaultLayout={layout} onLayoutChange={saveLayout} … />` },
      { title: 'Loading and empty', code: `<DataTable loading={isLoading} empty={<EmptyState title="No cases yet" action={<Button>New case</Button>} />} … />` },
    ],
    props: [
      {
        component: 'DataTable',
        rows: [
          { name: 'label', type: 'string', desc: 'What it lists, e.g. "Cases". Names the table for screen readers' },
          { name: 'rows', type: 'T[]', desc: 'The rows to show, already searched and filtered by your screen' },
          { name: 'columns', type: 'Column<T>[]', desc: 'See Column below' },
          { name: 'getRowKey', type: '(row) => string | number', desc: 'A stable id per row' },
          { name: 'rowLabel', type: '(row) => string', desc: 'Names a row for screen readers, e.g. on its checkbox' },
          { name: 'onRowClick', type: '(row) => void', desc: 'Opens a row. Rows become focusable and Enter opens them' },
          { name: 'selection', type: '{ selected: Set<string>, onChange }', desc: 'Adds a checkbox column. You own the set' },
          { name: 'bulkActions', type: '(keys, clear) => ReactNode', desc: 'Shown in a bar while rows are selected' },
          { name: 'rowActions / rowActionsWidth', type: '(row) => ReactNode / string', def: '– / "96px"', desc: 'Buttons at the end of each row, shown on hover and focus, always on touch' },
          { name: 'groups', type: '{ key, label, groupOf }[]', desc: 'Ways to group rows, offered in a Group menu. Groups fold' },
          { name: 'loading / loadingRows', type: 'boolean / number', def: 'false / 5', desc: 'Placeholder rows while loading' },
          { name: 'empty', type: 'ReactNode', def: '"Nothing to show yet"', desc: 'Text, or your own EmptyState' },
          { name: 'pageSize', type: 'number', def: '25', desc: 'Rows per page. Paging hides when it all fits' },
          { name: 'maxHeight', type: 'CSS length', def: '"70vh"', desc: 'The box scrolls past this, header in view. "none" lets the page scroll' },
          { name: 'views / onViewsChange', type: 'SavedView[] / (views) => void', desc: 'Saved views. Left out, they last for this visit' },
          { name: 'layout / defaultLayout / onLayoutChange', type: 'TableLayout', desc: 'Hidden columns, order, widths, sort, group and view' },
          { name: 'showViews', type: 'boolean', def: 'true', desc: 'Hide the views bar' },
        ],
      },
      {
        component: 'Column',
        rows: [
          { name: 'key / label', type: 'string', desc: 'A stable key (views refer to it) and the heading' },
          { name: 'render', type: '(row) => ReactNode', desc: 'What the cell shows' },
          { name: 'width', type: 'string', def: '"1fr"', desc: '"1fr", "2fr" or "120px". fr columns share the room left' },
          { name: 'minWidth', type: 'number', def: '96', desc: 'An fr column’s floor before the table scrolls sideways' },
          { name: 'align', type: '"left" | "right"', def: '"left"', desc: 'right for numbers and money' },
          { name: 'sortValue', type: '(row) => string | number', desc: 'Makes the heading sort. Empty values go last' },
          { name: 'optional / defaultHidden', type: 'boolean', desc: 'Can be hidden from the Columns menu / starts hidden' },
        ],
      },
    ],
    when: ['A list of records people scan, sort and act on: cases, customers, invoices', 'Acting on many rows at once'],
    whenNot: ['A list on a phone: use List Row, with the same data', 'A handful of facts about one record: use a Card', 'Comparing a trend: use a Chart'],
    keyboard: [
      ['Tab', 'Moves through the toolbar, the headings, the checkboxes and the rows'],
      ['Enter or Space on a heading', 'Sorts up, then down, then back'],
      ['Arrow Left / Right on a column edge', 'Narrows or widens the column (Shift for bigger steps); Enter resets it'],
      ['Enter on a row', 'Opens it'],
      ['Space on a checkbox', 'Selects the row'],
      ['Columns menu', 'Tick to show or hide; the arrow buttons move a column earlier or later'],
    ],
    builtIn: [
      'Nothing is saved behind your back. Views and column choices come in and go out through props, so you decide whether they live in the browser or on your server.',
      'Hidden columns are stored as the ones switched off, so a column you add next month shows up for everyone instead of staying invisible.',
      '"Select all" means the rows on this page. Ticking one box while looking at 10 rows never selects 5,000.',
      'Sorting, grouping and paging work on the whole list, not just the page in view, so page 2 really is what comes after page 1.',
      'Deleting or archiving a row keeps you on the page you were on; a new search starts again from page 1.',
      'Numbers use equal-width digits and right alignment, so amounts line up down the column.',
      'On a narrow screen the table scrolls sideways inside its own box; the page never does. The header stays in view as you scroll down.',
      'Everything you can do with a mouse has a keyboard way: columns are resized with the arrow keys and reordered from the Columns menu.',
      'Headings tell screen readers how the table is sorted, and sorting is announced.',
      'Loading shows placeholder rows in the shape of the table; no rows shows a clear empty state with the one action that fills it.',
      'Row buttons appear on hover and keyboard focus, and are always visible on touch screens, where there is no hover.',
    ],
  },
  {
    slug: 'month-grid',
    name: 'Month Grid',
    group: G,
    description: 'A month calendar that shows your items on each day. Weeks start on the reader’s own first day, and the arrow keys move between days.',
    install: ['month-grid'],
    sources: [{ file: 'month-grid.tsx', code: monthGridSrc }],
    Demo: MonthDemo,
    Thumb: MonthThumb,
    usage: `import { MonthGrid } from "@/components/ui/month-grid";

const [month, setMonth] = useState(new Date());

<MonthGrid month={month} onMonthChange={setMonth} selected={day} onSelect={setDay}>
  {(date, key) => visitsByDay[key]?.map((v) => <VisitChip key={v.id} visit={v} />)}
</MonthGrid>`,
    examples: [
      { title: 'Always start on Monday', code: `<MonthGrid month={month} onMonthChange={setMonth} weekStartsOn={1} />` },
      { title: 'A legend or filter in the bar', code: `<MonthGrid month={month} onMonthChange={setMonth} actions={<Select size="sm" label="Technician" hideLabel options={techs} />} />` },
      { title: 'Today in the business’s time zone', code: `<MonthGrid month={month} now={todayIn("America/Chicago")} />` },
    ],
    props: [{
      component: 'MonthGrid',
      rows: [
        { name: 'month', type: 'Date', desc: 'Any date in the month to show' },
        { name: 'onMonthChange', type: '(month: Date) => void', desc: 'Shows previous, next and Today, and lets the arrow keys cross months' },
        { name: 'children', type: '(date, key) => ReactNode', desc: 'What goes in a day. key is YYYY-MM-DD, local time' },
        { name: 'selected', type: 'string | null', desc: 'The chosen day, YYYY-MM-DD' },
        { name: 'onSelect', type: '(key, date) => void', desc: 'Called when a day is clicked, or chosen with Enter or Space' },
        { name: 'weekStartsOn', type: '0–6', def: 'the reader’s locale', desc: '0 is Sunday, 1 Monday … 6 Saturday' },
        { name: 'now', type: 'Date', def: 'today', desc: 'Today, if not the device’s today' },
        { name: 'actions', type: 'ReactNode', desc: 'Extra controls at the right of the bar' },
      ],
    }],
    when: ['Seeing what is booked across a month: visits, reminders, due dates', 'Picking a day while seeing what is already on it'],
    whenNot: ['Just picking a date in a form: use the Date Picker', 'Who is where hour by hour: use a schedule view', 'A list of upcoming items: a Data Table sorted by date reads faster'],
    keyboard: [
      ['Arrow keys', 'Move a day, or a week up and down'],
      ['Home / End', 'First or last day of the week'],
      ['Page Up / Page Down', 'Same day in the previous or next month (Shift: year)'],
      ['Enter or Space', 'Choose the day'],
      ['Tab', 'Leaves the grid, or moves into items in a day'],
    ],
    builtIn: [
      'Weeks start where the reader expects: Sunday in the United States, Monday in most of Europe, Saturday in much of the Middle East. You can still fix it.',
      'Month and weekday names are in the reader’s language.',
      'The grid is one stop for the Tab key; the arrow keys move between days, following the official accessibility pattern for date grids.',
      'Each day is read out in full, such as "Tuesday, 8 December 2026", not just "8".',
      'A month only takes the rows it needs. There is never an empty week at the bottom pushing things down.',
      'The 1st of each month shows the month’s name, so days spilling in from either side are not confused.',
      'Dates are worked out by calendar day, not by adding hours, so the clocks changing never skips or repeats a day.',
      'On a phone the days shrink and the labels tidy up; it never runs off the side of the screen.',
      theme,
    ],
  },
];
