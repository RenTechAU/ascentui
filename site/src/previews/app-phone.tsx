// Batch 4: app frame and phone. The demos use a fictional service company's data.
import { AccountMenu, AppShell, type ShellGroup } from '@kit/app-shell';
import appShellSrc from '@kit/app-shell.tsx?raw';
import { Avatar } from '@kit/avatar';
import { Badge } from '@kit/badge';
import { BottomSheet } from '@pro/bottom-sheet';
import { Button } from '@kit/button';
import { CommandMenu, CommandMenuTrigger, Kbd, type Command } from '@pro/command-menu';
import { DatePicker } from '@kit/date-picker';
import { EmptyState } from '@kit/empty-state';
import { IconButton } from '@kit/icon-button';
import { List, ListRow, ListSection } from '@kit/list-row';
import listRowSrc from '@kit/list-row.tsx?raw';
import { PullToRefresh } from '@pro/pull-to-refresh';
import { SegmentedControl } from '@kit/segmented-control';
import { Select } from '@kit/select';
import { StepperForm } from '@pro/stepper-form';
import { TextArea } from '@kit/text-area';
import { TextField } from '@kit/text-field';
import { Toaster, toast } from '@kit/toaster';
import { mockUpload, Upload } from '@pro/upload';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Archive, Check, Inbox } from './icons';
import type { Preview } from './types';

const FRAME = 'App frame';
const PHONE = 'Phone';
const col = (width: number) => ({ display: 'flex', flexDirection: 'column', gap: 16, width: `min(100%, ${width}px)`, minWidth: 0 }) as const;
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 } as const;
const note = { margin: 0, fontSize: 12, color: 'var(--asc-muted)' } as const;
const theme = 'Light and dark come from the theme. Nothing in this file mentions a colour.';

// ---------------------------------------------------------------- icons (16px grid, for the kit's 16px slots)

const S = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flex: 'none' }}>
    <path d={d} />
  </svg>
);
const IC = {
  cases: 'M2.5 4.5h11v8.5h-11zM5.5 4.5V3h5v1.5M2.5 8h11',
  schedule: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3',
  customers: 'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.75 13.5c.5-2.3 2.2-3.5 4.25-3.5s3.75 1.2 4.25 3.5M11 3a2.25 2.25 0 0 1 0 4.5M12.5 10.25c1 .5 1.6 1.6 1.75 3.25',
  invoices: 'M3.5 1.75h9v12.5l-2-1.25-2.5 1.25-2.5-1.25-2 1.25zM6 5.5h4M6 8.5h4',
  reports: 'M2.5 13.5h11M4.5 11V7.5M8 11V4M11.5 11V9',
  team: 'M8 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 14c.5-2.5 2.2-4 4.5-4s4 1.5 4.5 4',
  settings: 'M8 10.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5zM8 1.75v1.5M8 12.75v1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M1.75 8h1.5M12.75 8h1.5M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05',
  plus: 'M8 3.5v9M3.5 8h9',
  phone: 'M4.5 2h2l1 3-1.5 1a8 8 0 0 0 4 4l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A11 11 0 0 1 3 3.5 1.5 1.5 0 0 1 4.5 2z',
  pin: 'M8 14.5s4.5-4 4.5-7.75a4.5 4.5 0 0 0-9 0C3.5 10.5 8 14.5 8 14.5zM8 8.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  archive: 'M2 3h12v3H2zM3.5 6v7.5h9V6M6.5 9h3',
  done: 'M3 8.5l3 3 7-7',
  clock: 'M8 14.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5zM8 4.5V8l2.25 1.5',
  user: 'M8 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5',
  out: 'M6 2.5H3v11h3M10.5 5l3 3-3 3M13.5 8H6.5',
  help: 'M8 14.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5zM6.25 6.25a1.75 1.75 0 1 1 2.5 1.6c-.5.25-.75.65-.75 1.15v.25M8 11.25v.01',
  mark: 'M2 13 8 2.5 14 13M5.5 13 8 8.5l2.5 4.5',
};

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden style={{ flex: 'none' }}>
    <path d={IC.mark} />
  </svg>
);

// ---------------------------------------------------------------- data

type Status = 'Open' | 'Scheduled' | 'In progress' | 'Waiting on parts' | 'Done';
const TONE: Record<Status, 'neutral' | 'info' | 'warning' | 'success'> = {
  Open: 'neutral', Scheduled: 'info', 'In progress': 'info', 'Waiting on parts': 'warning', Done: 'success',
};
type Visit = { id: string; customer: string; job: string; tech: string; status: Status; start: number; address: string };

const CUSTOMERS = [
  ['Harbour Pools', 'Bayside'], ['Northside Dental', 'North Hill'], ['Greenleaf Café', 'Old Town'], ['Coastal Fitness', 'Bayside'],
  ['Bayview Apartments', 'Seaview'], ['Riverside Childcare', 'Riverside'], ['Lakeside Motel', 'Lakeside'], ['Oakridge School', 'Oakridge'],
  ['Maple Street Gym', 'Maple Park'], ['José Martín', 'Old Town'],
] as const;
const JOBS = ['Pool pump not priming', 'Annual heat pump service', 'Filter replacement', 'Leak detection', 'Salt cell clean', 'Chlorinator fault', 'Spa heater not firing', 'Water test and balance'];
const TECHS = ['Dana Whitfield', 'Rafael Okafor', 'Mei Lindqvist', 'Sam Kaur'];
const STREETS = ['14 Wharf Road', '2/88 Hill Street', '5 Market Lane', '120 Esplanade', '31 Ocean View Drive', '9 River Walk', '77 Shore Road', '3 College Avenue'];
const STATUSES: Status[] = ['Scheduled', 'In progress', 'Open', 'Waiting on parts', 'Scheduled', 'Done'];

const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
};
const VISITS: Visit[] = Array.from({ length: 14 }, (_, i) => ({
  id: `CASE-${1048 - i}`,
  customer: CUSTOMERS[(i * 3) % CUSTOMERS.length]![0],
  job: JOBS[(i * 5) % JOBS.length]!,
  tech: TECHS[i % TECHS.length]!,
  status: STATUSES[i % STATUSES.length]!,
  start: at(i < 7 ? 0 : 1, 7 + ((i * 2) % 10), i % 2 ? 30 : 0),
  address: STREETS[i % STREETS.length]!,
}));
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const isToday = (t: number) => new Date(t).toDateString() === new Date().toDateString();

/** A phone-width frame on the stage, for the phone demos */
function PhoneFrame({ children, height = 600, label }: { children: ReactNode; height?: number; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        position: 'relative', width: 'min(100%, 390px)', height, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box',
        borderRadius: 28, background: 'var(--asc-page)', boxShadow: '0 0 0 1px var(--asc-border-strong), var(--asc-shadow-pop)',
      }}
    >
      {children}
    </div>
  );
}
function PhoneBar({ title, end }: { title: string; end?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 16px 10px', borderBottom: '1px solid var(--asc-border)', flex: 'none' }}>
      <h3 style={{ margin: 0, flex: 1, font: '600 var(--asc-text-lg)/var(--asc-leading-md) var(--asc-font)' }}>{title}</h3>
      {end}
    </div>
  );
}

// ---------------------------------------------------------------- App Shell

type Page = 'cases' | 'schedule' | 'customers' | 'invoices' | 'reports' | 'team' | 'settings';
const PAGES: Record<Page, string> = {
  cases: 'Cases', schedule: 'Schedule', customers: 'Customers', invoices: 'Invoices', reports: 'Reports', team: 'Team', settings: 'Settings',
};

function shellNav(go: (p: Page) => void): ShellGroup[] {
  const item = (id: Page, icon: string, extra: { count?: number; countLabel?: string } = {}) => ({ id, label: PAGES[id], icon: <S d={icon} />, onSelect: () => go(id), ...extra });
  return [
    { items: [item('cases', IC.cases, { count: 3, countLabel: '3 unassigned' }), item('schedule', IC.schedule), item('customers', IC.customers), item('invoices', IC.invoices, { count: 2, countLabel: '2 overdue' })] },
    { label: 'Manage', items: [item('reports', IC.reports), item('team', IC.team), item('settings', IC.settings)] },
  ];
}

/** The record panel's content: what a case needs on one screen, with the next step for its stage */
function CaseRecord({ v, onChange, onArchive }: { v: Visit; onChange: (v: Visit) => void; onArchive: () => void }) {
  const [tech, setTech] = useState(v.status === 'Open' ? '' : v.tech);
  const dl = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', margin: 0 } as const;
  const dt = { color: 'var(--asc-muted)' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={row}>
        <Badge tone={TONE[v.status]} dot>{v.status}</Badge>
        <Badge>{v.job.includes('service') ? 'Service' : 'Repair'}</Badge>
      </div>
      <dl style={dl}>
        <dt style={dt}>Customer</dt><dd style={{ margin: 0 }}>{v.customer}</dd>
        <dt style={dt}>Address</dt><dd style={{ margin: 0 }}>{v.address}</dd>
        <dt style={dt}>Job</dt><dd style={{ margin: 0 }}>{v.job}</dd>
        <dt style={dt}>Visit</dt><dd style={{ margin: 0 }}>{v.status === 'Open' ? 'Not booked' : timeFmt.format(v.start)}</dd>
      </dl>
      <Select
        size="sm"
        label="Stage"
        value={v.status}
        onChange={(e) => {
          onChange({ ...v, status: e.target.value as Status });
          toast(`Moved to ${e.target.value}`);
        }}
        options={(Object.keys(TONE) as Status[]).map((x) => ({ value: x, label: x }))}
      />
      {v.status === 'Open' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--asc-border)' }}>
          <Select size="sm" label="Technician" placeholder="Who is going?" value={tech} onChange={(e) => setTech(e.target.value)} options={TECHS.map((t) => ({ value: t, label: t }))} />
          <Button
            disabled={!tech}
            onClick={() => {
              onChange({ ...v, tech, status: 'Scheduled' });
              toast.success(`${v.id} sent to ${tech.split(' ')[0]}`, { description: 'It is on their phone now.' });
            }}
          >
            {tech ? `Send to ${tech.split(' ')[0]}` : 'Pick a technician first'}
          </Button>
        </div>
      )}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--asc-border)' }}>
        <Button variant="ghost" size="sm" icon={<S d={IC.archive} />} onClick={onArchive}>Archive case</Button>
      </div>
    </div>
  );
}

function ShellPage({ page, cases, openId, onOpen }: { page: Page; cases: Visit[]; openId: string | null; onOpen: (id: string) => void }) {
  const h = { margin: '0 0 4px', font: '600 var(--asc-text-xl)/var(--asc-leading-xl) var(--asc-font)' } as const;
  if (page === 'cases' || page === 'schedule') {
    const list = page === 'cases' ? cases : VISITS.filter((v) => isToday(v.start)).sort((a, b) => a.start - b.start);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        <div>
          <h2 style={h}>{PAGES[page]}</h2>
          <p style={{ ...note, fontSize: 'var(--asc-text-sm)' }}>{page === 'cases' ? 'Open a case to see it beside the list.' : dayFmt.format(new Date())}</p>
        </div>
        <List variant="card" aria-label={PAGES[page]}>
          {list.map((v) => (
            <ListRow
              key={v.id}
              leading={<Avatar name={v.tech} size="sm" />}
              title={page === 'cases' ? v.job : v.customer}
              description={page === 'cases' ? `${v.id} · ${v.customer}` : `${timeFmt.format(v.start)} · ${v.job}`}
              trailing={<Badge tone={TONE[v.status]}>{v.status}</Badge>}
              selected={page === 'cases' && v.id === openId}
              onClick={() => (page === 'cases' ? onOpen(v.id) : toast(`${v.id} opened`, { description: v.customer }))}
            />
          ))}
        </List>
      </div>
    );
  }
  if (page === 'invoices') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        <h2 style={h}>Invoices</h2>
        <List variant="card" aria-label="Invoices">
          {CUSTOMERS.slice(0, 5).map(([c], i) => (
            <ListRow key={c} title={c} description={`INV-${2210 + i}`} trailing={<><span>{money.format(180 + i * 245.5)}</span>{i < 2 && <Badge tone="warning">Overdue</Badge>}</>} chevron={false} />
          ))}
        </List>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <h2 style={h}>{PAGES[page]}</h2>
      {page === 'customers' ? (
        <List variant="card" aria-label="Customers">
          {CUSTOMERS.slice(0, 6).map(([c, area]) => (
            <ListRow key={c} leading={<Avatar name={c} size="sm" />} title={c} description={area} onClick={() => toast(`${c} opened`)} />
          ))}
        </List>
      ) : (
        <div style={{ borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }}>
          <EmptyState icon={<S d={IC[page]} />} title={`Nothing in ${PAGES[page].toLowerCase()} yet`} description="This page is part of the demo frame only." />
        </div>
      )}
    </div>
  );
}

function AppShellDemo() {
  const [page, setPage] = useState<Page>('cases');
  const [size, setSize] = useState<'desk' | 'phone'>('desk');
  const [search, setSearch] = useState(false);
  const [cases, setCases] = useState<Visit[]>(() => VISITS.slice(0, 6));
  const [openId, setOpenId] = useState<string | null>(null);
  const nav = useMemo(() => shellNav((p) => (setPage(p), setOpenId(null))), []);
  const opened = page === 'cases' ? cases.find((c) => c.id === openId) : undefined;
  const update = (v: Visit) => setCases((all) => all.map((c) => (c.id === v.id ? v : c)));
  const archive = (v: Visit) => {
    const before = cases;
    setOpenId(null);
    setCases((all) => all.filter((c) => c.id !== v.id));
    toast(`${v.id} archived`, { action: { label: 'Undo', onClick: () => setCases(before) } });
  };
  const commands: Command[] = useMemo(
    () => [
      ...(Object.keys(PAGES) as Page[]).map((p) => ({ id: `go-${p}`, label: PAGES[p], group: 'Go to', icon: <S d={IC[p]} />, onSelect: () => setPage(p) })),
      { id: 'new-case', label: 'New case', group: 'Create', icon: <S d={IC.plus} />, keywords: 'add job', onSelect: () => toast('New case started') },
      ...CUSTOMERS.slice(0, 6).map(([c, area]) => ({ id: `cust-${c}`, label: c, description: area, group: 'Customers', hint: 'Customer', onSelect: () => { setPage('customers'); toast(`${c} opened`); } })),
    ],
    [],
  );
  return (
    <div style={{ ...col(1100), alignItems: 'center' }}>
      <Toaster />
      <SegmentedControl
        aria-label="Stage width"
        size="sm"
        value={size}
        onChange={setSize}
        options={[{ value: 'desk', label: 'Desk' }, { value: 'phone', label: 'Phone, 390px' }]}
      />
      <div style={{ width: size === 'phone' ? 'min(100%, 390px)' : '100%', borderRadius: size === 'phone' ? 28 : 'var(--asc-radius-lg)', overflow: 'hidden', boxShadow: '0 0 0 1px var(--asc-border-strong), var(--asc-shadow-pop)' }}>
        <AppShell
          landmarks={false}
          style={{ height: 600 }}
          brand={<><Logo /> Brightwater Services</>}
          brandMark={<Logo />}
          nav={nav}
          current={page}
          title={<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opened ? `${PAGES[page]} / ${opened.id}` : PAGES[page]}</span>}
          panel={opened && <CaseRecord key={opened.id} v={opened} onChange={update} onArchive={() => archive(opened)} />}
          panelTitle={opened && `${opened.id} · ${opened.customer}`}
          panelId={opened?.id}
          onPanelClose={() => setOpenId(null)}
          search={<CommandMenuTrigger onClick={() => setSearch(true)} />}
          actions={<IconButton variant="secondary" icon={<S d={IC.plus} />} label="New case" onClick={() => toast('New case started')} />}
          account={
            <AccountMenu
              name="Dana Whitfield"
              detail="dana@brightwater.example"
              items={[
                { label: 'Profile', icon: <S d={IC.user} />, onSelect: () => toast('Profile') },
                { label: 'Settings', icon: <S d={IC.settings} />, onSelect: () => setPage('settings') },
                { label: 'Help', icon: <S d={IC.help} />, onSelect: () => toast('Help') },
                'separator',
                { label: 'Sign out', icon: <S d={IC.out} />, tone: 'danger', onSelect: () => toast('Signed out (demo)') },
              ]}
            />
          }
          sidebarFooter={<p style={{ ...note, margin: 0 }}>Brightwater Services · Free plan</p>}
        >
          <ShellPage page={page} cases={cases} openId={openId} onOpen={setOpenId} />
        </AppShell>
      </div>
      <CommandMenu open={search} onOpenChange={setSearch} commands={commands} />
      <p style={note}>Open a case: on a desk it docks beside the list (drag its edge to resize); on the Phone stage it opens full screen with Back. The shell picks its layout from its own width.</p>
    </div>
  );
}

function AppShellThumb() {
  const bar = (w: number | string, o = 1) => <span style={{ display: 'block', height: 6, width: w, borderRadius: 3, background: 'var(--asc-subtle-strong)', opacity: o }} />;
  return (
    <div aria-hidden style={{ display: 'flex', width: 250, height: 150, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-page)', boxShadow: '0 0 0 1px var(--asc-border-strong)', overflow: 'hidden' }}>
      <div style={{ width: 64, padding: 8, borderRight: '1px solid var(--asc-border)', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 600 }}>Brightwater</span>
        <span style={{ display: 'block', height: 12, borderRadius: 4, background: 'var(--asc-subtle-strong)' }} />
        {bar('80%')}{bar('70%')}{bar('85%')}{bar('60%', 0.6)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 22, borderBottom: '1px solid var(--asc-border)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
          <span style={{ fontSize: 9, fontWeight: 500, flex: 1 }}>Cases</span>
          <span style={{ width: 50, height: 10, borderRadius: 4, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }} />
          <Avatar name="Dana Whitfield" size="sm" style={{ ['--s' as string]: '14px' } as CSSProperties} />
        </div>
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 5, borderRadius: 5, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }}>
              {bar(60)}<span style={{ flex: 1 }} />{bar(24, 0.7)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Command Menu

function CommandMenuDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const commands: Command[] = useMemo(() => {
    const go = (p: Page, keys: string[]) => ({ id: `go-${p}`, label: PAGES[p], group: 'Go to', icon: <S d={IC[p]} />, shortcut: keys, onSelect: () => setLast(`Went to ${PAGES[p]}`) });
    return [
      go('cases', ['G', 'C']), go('schedule', ['G', 'S']), go('customers', ['G', 'U']), go('invoices', ['G', 'I']),
      { id: 'new-case', label: 'New case', group: 'Create', icon: <S d={IC.plus} />, keywords: 'add job work order', onSelect: () => setLast('Started a new case') },
      { id: 'new-customer', label: 'New customer', group: 'Create', icon: <S d={IC.plus} />, keywords: 'add client', onSelect: () => setLast('Started a new customer') },
      { id: 'new-invoice', label: 'New invoice', group: 'Create', icon: <S d={IC.plus} />, keywords: 'bill', onSelect: () => setLast('Started a new invoice') },
      ...CUSTOMERS.map(([c, area]) => ({ id: `cust-${c}`, label: c, description: area, group: 'Customers', hint: 'Customer', onSelect: () => setLast(`Opened ${c}`) })),
      ...VISITS.slice(0, 6).map((v) => ({ id: v.id, label: `${v.id} · ${v.job}`, description: v.customer, group: 'Cases', keywords: v.tech, onSelect: () => setLast(`Opened ${v.id}`) })),
    ];
  }, []);
  return (
    <div style={{ ...col(420), alignItems: 'center', textAlign: 'center' }}>
      <CommandMenuTrigger onClick={() => setOpen(true)} label="Search or run a command" style={{ width: '100%' }} />
      <p style={note}>
        Or press <Kbd keys={typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? ['⌘', 'K'] : ['Ctrl', 'K']} /> anywhere on this page. Try “nwcs” or “bayside”.
      </p>
      <p style={{ ...note, minHeight: 18, color: 'var(--asc-ink)' }} aria-live="polite">{last ?? ''}</p>
      <CommandMenu open={open} onOpenChange={setOpen} commands={commands} shortcut />
    </div>
  );
}

function CommandMenuThumb() {
  return (
    <div aria-hidden style={{ width: 240, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-pop)', overflow: 'hidden', fontSize: 11 }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--asc-border)', color: 'var(--asc-muted)' }}>new</div>
      <div style={{ padding: 4 }}>
        <p style={{ margin: '2px 6px', fontSize: 10, color: 'var(--asc-muted)' }}>Create</p>
        {['New case', 'New customer', 'New invoice'].map((l, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, background: i === 0 ? 'var(--asc-subtle-strong)' : undefined }}>
            <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>New</b>{l.slice(3)}</span>
            {i === 0 && <Kbd keys="↵" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Stepper Form

type VisitForm = { name: string; phone: string; email: string; street: string; city: string; postcode: string; date: string; window: string; notes: string };
const EMPTY: VisitForm = { name: '', phone: '', email: '', street: '', city: '', postcode: '', date: '', window: '', notes: '' };
const WINDOWS = [{ value: 'morning', label: 'Morning, 8 to 12' }, { value: 'afternoon', label: 'Afternoon, 12 to 4' }, { value: 'any', label: 'Any time' }];

function StepperDemo() {
  const [v, setV] = useState<VisitForm>(EMPTY);
  const [err, setErr] = useState<Partial<Record<keyof VisitForm, string>>>({});
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const set = (k: keyof VisitForm) => (value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    if (err[k]) setErr((e) => ({ ...e, [k]: undefined }));
  };
  const need = (checks: [keyof VisitForm, string | false][]) => {
    const next: Partial<Record<keyof VisitForm, string>> = {};
    for (const [k, msg] of checks) if (msg) next[k] = msg;
    setErr((e) => ({ ...e, ...Object.fromEntries(checks.map(([k]) => [k, next[k]])) }));
    return Object.keys(next).length === 0;
  };
  if (done) {
    return (
      <div style={col(520)}>
        <EmptyState
          icon={<Check />}
          title="Visit booked"
          description={`${v.name} at ${v.street}, ${v.city}${v.date ? `, on ${dayFmt.format(new Date(`${v.date}T00:00`))}` : ''}.`}
          action={<Button variant="secondary" onClick={() => { setV(EMPTY); setErr({}); setDone(false); setRun((n) => n + 1); }}>Book another</Button>}
        />
      </div>
    );
  }
  const windowLabel = WINDOWS.find((w) => w.value === v.window)?.label;
  return (
    <div style={col(560)}>
      <StepperForm
        key={run}
        aria-label="Book a visit"
        labels={{ submit: 'Book visit' }}
        onSubmit={() => new Promise<void>((ok) => setTimeout(() => { setDone(true); ok(); }, 900))}
        steps={[
          {
            id: 'customer',
            title: 'Customer',
            description: 'Who the visit is for.',
            validate: () => need([
              ['name', !v.name.trim() && 'Enter the customer’s name.'],
              ['phone', !v.phone.trim() && !v.email.trim() && 'Give a phone number or an email, so the technician can reach them.'],
              ['email', !!v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email) && 'Check the email address, e.g. name@example.com.'],
            ]),
            children: (
              <>
                <TextField label="Name" required autoComplete="name" value={v.name} onChange={(e) => set('name')(e.target.value)} error={err.name} />
                <TextField label="Phone" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone')(e.target.value)} error={err.phone} />
                <TextField label="Email" type="email" autoComplete="email" value={v.email} onChange={(e) => set('email')(e.target.value)} error={err.email} />
              </>
            ),
          },
          {
            id: 'address',
            title: 'Address',
            description: 'Where the technician goes.',
            validate: () => need([['street', !v.street.trim() && 'Enter the street address.'], ['city', !v.city.trim() && 'Enter the town or city.']]),
            children: (
              <>
                <TextField label="Street address" required autoComplete="street-address" value={v.street} onChange={(e) => set('street')(e.target.value)} error={err.street} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <TextField label="Town or city" required autoComplete="address-level2" value={v.city} onChange={(e) => set('city')(e.target.value)} error={err.city} />
                  <TextField label="Postcode" autoComplete="postal-code" value={v.postcode} onChange={(e) => set('postcode')(e.target.value)} />
                </div>
              </>
            ),
          },
          {
            id: 'visit',
            title: 'Visit',
            description: 'When suits the customer.',
            validate: () => need([['date', !v.date && 'Choose a day.'], ['window', !v.window && 'Choose a time of day.']]),
            children: (
              <>
                <DatePicker label="Day" required value={v.date} onChange={set('date')} error={err.date} />
                <Select label="Time of day" required placeholder="Choose" options={WINDOWS} value={v.window} onChange={(e) => set('window')(e.target.value)} error={err.window} />
                <TextArea label="Notes for the technician" value={v.notes} onChange={(e) => set('notes')(e.target.value)} description="Gate codes, parking, pets." />
              </>
            ),
          },
        ]}
        review={{
          description: 'Check the details, then book the visit.',
          items: [
            { step: 'customer', label: 'Name', value: v.name },
            { step: 'customer', label: 'Phone', value: v.phone },
            { step: 'customer', label: 'Email', value: v.email },
            { step: 'address', label: 'Street address', value: v.street },
            { step: 'address', label: 'Town or city', value: v.city },
            { step: 'address', label: 'Postcode', value: v.postcode },
            { step: 'visit', label: 'Day', value: v.date ? dayFmt.format(new Date(`${v.date}T00:00`)) : '' },
            { step: 'visit', label: 'Time of day', value: windowLabel },
            { step: 'visit', label: 'Notes', value: v.notes },
          ],
        }}
      />
    </div>
  );
}

function StepperThumb() {
  const dot = (s: 'done' | 'current' | 'todo', n: number) => (
    <span style={{
      display: 'inline-grid', placeItems: 'center', width: 18, height: 18, borderRadius: 9, fontSize: 9, fontWeight: 500,
      background: s === 'done' ? 'var(--asc-primary)' : s === 'current' ? 'var(--asc-surface)' : 'var(--asc-subtle-strong)',
      color: s === 'done' ? 'var(--asc-on-primary)' : s === 'current' ? 'var(--asc-ink)' : 'var(--asc-muted)',
      boxShadow: s === 'current' ? 'inset 0 0 0 1.5px var(--asc-primary)' : undefined,
    }}>{s === 'done' ? '✓' : n}</span>
  );
  const line = (on: boolean) => <span style={{ flex: 1, height: 1, background: on ? 'var(--asc-primary)' : 'var(--asc-border-strong)' }} />;
  return (
    <div aria-hidden style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{dot('done', 1)}{line(true)}{dot('current', 2)}<span style={{ fontWeight: 500 }}>Address</span>{line(false)}{dot('todo', 3)}{line(false)}{dot('todo', 4)}</div>
      <span style={{ display: 'block', height: 22, borderRadius: 6, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }} />
      <span style={{ display: 'block', height: 22, borderRadius: 6, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <Button size="sm" variant="secondary" tabIndex={-1}>Back</Button>
        <Button size="sm" tabIndex={-1}>Next</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Upload

/** Made-up job photos, drawn as SVG so the demo needs no network */
function photo(seed: number) {
  const sky = ['#bfe3f7', '#f6d6b8', '#cfe8d5', '#e2d9f3'][seed % 4];
  const ground = ['#3b8fb0', '#6f8f5a', '#4a7fa3', '#8a6f5a'][seed % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${sky}"/><circle cx="${560 + seed * 30}" cy="150" r="60" fill="#fff6" /><path d="M0 380 Q200 ${300 + seed * 20} 400 370 T800 360 V600 H0z" fill="${ground}"/><rect x="${180 + seed * 40}" y="300" width="220" height="140" rx="12" fill="#ffffffcc"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const PHOTOS = [
  { id: 'p1', name: 'pump-before.jpg', size: 2_480_000, type: 'image/jpeg', url: photo(0) },
  { id: 'p2', name: 'filter-housing.jpg', size: 1_920_000, type: 'image/jpeg', url: photo(1) },
  { id: 'p3', name: 'pump-after.jpg', size: 2_150_000, type: 'image/jpeg', url: photo(2) },
];

function UploadDemo() {
  const photosUpload = useMemo(() => mockUpload(), []);
  const docsUpload = useMemo(() => mockUpload({ failEvery: 2, duration: 2200 }), []);
  return (
    <div style={{ ...col(560), gap: 28 }}>
      <Upload
        label="Job photos"
        view="gallery"
        accept="image/*"
        capture="environment"
        maxSize={8_000_000}
        maxFiles={6}
        defaultFiles={PHOTOS}
        upload={photosUpload}
      />
      <Upload
        label="Documents"
        description="PDFs or images, up to 5 MB each. In this demo every second file fails, so you can try Retry."
        accept=".pdf,image/*"
        maxSize={5_000_000}
        upload={docsUpload}
      />
    </div>
  );
}

function UploadThumb() {
  return (
    <div aria-hidden style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ display: 'grid', placeItems: 'center', gap: 4, padding: 12, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-subtle)', boxShadow: 'inset 0 0 0 1px var(--asc-border-strong)', color: 'var(--asc-muted)' }}>
        Drop files here or
        <Button size="sm" variant="secondary" tabIndex={-1}>Choose files</Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 'var(--asc-radius)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }}>
        <img src={PHOTOS[0]!.url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontWeight: 500 }}>pump-before.jpg</span>
          <span style={{ display: 'block', height: 3, borderRadius: 2, background: 'var(--asc-subtle-strong)' }}><span style={{ display: 'block', height: 3, width: '64%', borderRadius: 2, background: 'var(--asc-primary)' }} /></span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Bottom Sheet

function BottomSheetDemo() {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [shown, setShown] = useState<Visit | null>(null);
  const [notes, setNotes] = useState(false);
  const [mode, setMode] = useState<'sheet' | 'auto'>('sheet');
  const today = VISITS.filter((v) => isToday(v.start)).sort((a, b) => a.start - b.start);
  const open = (v: Visit) => {
    setShown(v);
    setVisit(v);
  };
  return (
    <div style={{ ...col(420), alignItems: 'center' }}>
      <Toaster />
      <SegmentedControl
        aria-label="On a desk"
        size="sm"
        value={mode}
        onChange={setMode}
        options={[{ value: 'sheet', label: 'Always a sheet' }, { value: 'auto', label: 'Dialog on desks' }]}
      />
      <PhoneFrame label="Phone preview" height={560}>
        <PhoneBar title="Today" end={<Button size="sm" variant="secondary" onClick={() => setNotes(true)}>Add note</Button>} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <List aria-label="Today's visits">
            {today.map((v) => (
              <ListRow key={v.id} leading={<Avatar name={v.customer} size="sm" />} title={v.customer} description={`${timeFmt.format(v.start)} · ${v.job}`} onClick={() => open(v)} />
            ))}
          </List>
        </div>
      </PhoneFrame>
      <p style={note}>Tap a visit for its sheet. Drag the handle down, or flick, to close it. Add note opens one with two heights.</p>

      <BottomSheet
        mode={mode}
        open={!!visit}
        onOpenChange={(o) => !o && setVisit(null)}
        onClosed={() => setShown(null)}
        title={shown?.customer ?? ''}
        description={shown ? `${shown.id} · ${timeFmt.format(shown.start)}` : undefined}
        footer={
          <>
            <Button variant="secondary" icon={<S d={IC.phone} />} onClick={() => toast('Calling (demo)')}>Call</Button>
            <Button icon={<S d={IC.done} />} onClick={() => { toast.success(`${shown?.id} marked done`); setVisit(null); }}>Mark done</Button>
          </>
        }
      >
        {shown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0 }}>{shown.job}</p>
            <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--asc-muted)' }}><S d={IC.pin} /> {shown.address}, {CUSTOMERS.find(([c]) => c === shown.customer)?.[1]}</p>
            <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--asc-muted)' }}><S d={IC.user} /> {shown.tech}</p>
            <div><Badge tone={TONE[shown.status]}>{shown.status}</Badge></div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        mode={mode}
        open={notes}
        onOpenChange={setNotes}
        snapPoints={[0.5, 0.92]}
        title="Add a note"
        description="Pull the handle up for more room."
        footer={<><Button variant="secondary" onClick={() => setNotes(false)}>Cancel</Button><Button onClick={() => { toast.success('Note saved'); setNotes(false); }}>Save note</Button></>}
      >
        <TextArea label="Note" minRows={4} description="Seen by everyone on the case." />
      </BottomSheet>
    </div>
  );
}

function BottomSheetThumb() {
  return (
    <div aria-hidden style={{ position: 'relative', width: 130, height: 156, borderRadius: 18, background: 'var(--asc-backdrop)', boxShadow: '0 0 0 1px var(--asc-border-strong)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, borderRadius: '12px 12px 0 0', background: 'var(--asc-surface)', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10 }}>
        <span style={{ alignSelf: 'center', width: 26, height: 3, borderRadius: 2, background: 'var(--asc-border-strong)' }} />
        <b style={{ fontWeight: 600 }}>Harbour Pools</b>
        <span style={{ color: 'var(--asc-muted)' }}>Pool pump not priming</span>
        <span style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
          <span style={{ flex: 1, height: 16, borderRadius: 5, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }} />
          <span style={{ flex: 1, height: 16, borderRadius: 5, background: 'var(--asc-primary)' }} />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- List Row

function ListRowDemo() {
  const [visits, setVisits] = useState(VISITS);
  const archive = (v: Visit) => {
    const atIndex = visits.findIndex((x) => x.id === v.id);
    setVisits((list) => list.filter((x) => x.id !== v.id));
    toast.success(`${v.id} archived`, {
      description: v.customer,
      undo: () => setVisits((list) => [...list.slice(0, atIndex), v, ...list.slice(atIndex)]),
    });
  };
  const days = [
    { title: 'Today', items: visits.filter((v) => isToday(v.start)) },
    { title: 'Tomorrow', items: visits.filter((v) => !isToday(v.start)) },
  ];
  return (
    <div style={{ ...col(420), alignItems: 'center' }}>
      <Toaster />
      <PhoneFrame label="Phone preview">
        <PhoneBar title="Visits" end={<Badge>{visits.length}</Badge>} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visits.length === 0 ? (
            <EmptyState icon={<Inbox />} title="No visits" description="Archived visits come back with Undo." />
          ) : (
            <List aria-label="Visits">
              {days.map((d) =>
                d.items.length ? (
                  <ListSection key={d.title} title={d.title}>
                    {d.items.map((v) => (
                      <ListRow
                        key={v.id}
                        leading={<Avatar name={v.customer} size="sm" />}
                        title={v.customer}
                        description={`${timeFmt.format(v.start)} · ${v.job}`}
                        trailing={<Badge tone={TONE[v.status]} size="sm">{v.status}</Badge>}
                        onClick={() => toast(`${v.id} opened`, { description: v.job })}
                        actions={[
                          { label: 'Archive', icon: <Archive />, onSelect: () => archive(v) },
                          { label: 'Call', icon: <S d={IC.phone} />, onSelect: () => toast(`Calling ${v.customer} (demo)`) },
                        ]}
                      />
                    ))}
                  </ListSection>
                ) : null,
              )}
            </List>
          )}
        </div>
      </PhoneFrame>
      <p style={note}>Swipe a row left on a touch screen, or use its ⋯ menu, to archive it. Section headings stay in view as you scroll.</p>
    </div>
  );
}

function ListRowThumb() {
  return (
    <div aria-hidden style={{ width: 240, borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)', overflow: 'hidden', fontSize: 11 }}>
      {VISITS.slice(0, 3).map((v, i) => (
        <div key={v.id} style={{ position: 'relative', overflow: 'hidden', borderBottom: i < 2 ? '1px solid var(--asc-border)' : undefined }}>
          {i === 1 && <span style={{ position: 'absolute', inset: '0 0 0 auto', width: 56, display: 'grid', placeItems: 'center', background: 'var(--asc-primary)', color: 'var(--asc-on-primary)', fontSize: 10 }}>Archive</span>}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--asc-surface)', translate: i === 1 ? '-56px 0' : undefined }}>
            <Avatar name={v.customer} size="sm" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.customer}</span>
              <span style={{ display: 'block', color: 'var(--asc-muted)', fontSize: 10 }}>{timeFmt.format(v.start)}</span>
            </span>
            <span style={{ color: 'var(--asc-faint)' }}>›</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Pull to Refresh

function PullDemo() {
  const [visits, setVisits] = useState(() => VISITS.filter((v) => isToday(v.start)).slice(0, 5));
  const [updated, setUpdated] = useState(() => Date.now());
  const [pool, setPool] = useState(() => VISITS.filter((v) => !isToday(v.start)));
  const refresh = () =>
    new Promise<void>((ok) =>
      setTimeout(() => {
        const [next, ...rest] = pool;
        if (next) {
          setVisits((list) => [{ ...next, start: Date.now() }, ...list]);
          setPool(rest);
        }
        setUpdated(Date.now());
        ok();
      }, 1200),
    );
  return (
    <div style={{ ...col(420), alignItems: 'center' }}>
      <PhoneFrame label="Phone preview">
        <PhoneBar title="Today" />
        <div style={{ flex: 1, minHeight: 0 }}>
          <PullToRefresh onRefresh={refresh} aria-label="Today's visits" status={`Updated ${timeFmt.format(updated)}`}>
            <List aria-label="Visits">
              {visits.map((v) => (
                <ListRow key={v.id} leading={<Avatar name={v.customer} size="sm" />} title={v.customer} description={`${timeFmt.format(v.start)} · ${v.job}`} trailing={<Badge tone={TONE[v.status]} size="sm">{v.status}</Badge>} />
              ))}
            </List>
          </PullToRefresh>
        </div>
      </PhoneFrame>
      <p style={note}>On a touch screen, pull the list down and let go. With a mouse or keyboard, use Refresh. Each refresh brings in a new visit.</p>
    </div>
  );
}

function PullThumb() {
  return (
    <div aria-hidden style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 13, background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)' }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, border: '1.5px solid var(--asc-ink)', borderRightColor: 'transparent' }} />
      </span>
      <div style={{ width: '100%', borderRadius: 'var(--asc-radius-lg)', background: 'var(--asc-surface)', boxShadow: 'var(--asc-shadow-control)', overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', borderBottom: i < 2 ? '1px solid var(--asc-border)' : undefined }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--asc-subtle-strong)' }} />
            <span style={{ height: 6, width: 90 - i * 14, borderRadius: 3, background: 'var(--asc-subtle-strong)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the pages

const menuNote = 'It uses the kit’s Menu Button (menu-button.tsx), which the CLI installs with it.';

export const APP_PHONE: Preview[] = [
  {
    slug: 'app-shell',
    name: 'App Shell',
    group: FRAME,
    description: 'The frame every screen sits in: a sidebar and top bar on a desk, a tab bar and a menu drawer on a phone. It switches by its own width.',
    install: ['app-shell'],
    sources: [{ file: 'app-shell.tsx', code: appShellSrc }],
    Demo: AppShellDemo,
    Thumb: AppShellThumb,
    usage: `import { AccountMenu, AppShell } from "@/components/ui/app-shell";

<AppShell
  brand={<><Logo /> Brightwater</>}
  nav={[
    { items: [
      { id: "cases", label: "Cases", icon: <CasesIcon />, href: "/cases", count: 3, countLabel: "3 unassigned" },
      { id: "schedule", label: "Schedule", icon: <CalendarIcon />, href: "/schedule" },
    ] },
    { label: "Manage", items: [{ id: "settings", label: "Settings", icon: <GearIcon />, href: "/settings" }] },
  ]}
  current="cases"
  title="Cases"
  account={<AccountMenu name={user.name} detail={user.email} items={[{ label: "Sign out", onSelect: signOut, tone: "danger" }]} />}
>
  <CasesPage />
</AppShell>`,
    examples: [
      {
        title: 'With Next.js links, active by path',
        code: `import Link from "next/link";
import { usePathname } from "next/navigation";

const pathname = usePathname();
<AppShell linkComponent={Link} isActive={(item) => !!item.href && pathname.startsWith(item.href)} nav={nav}>…</AppShell>`,
      },
      {
        title: 'Remember the rail in this browser, and choose the phone tabs',
        code: `<AppShell storageKey="brightwater-sidebar" tabs={["cases", "schedule", "customers", "invoices"]} nav={nav}>…</AppShell>`,
      },
      {
        title: 'Search in the top bar',
        code: `const [open, setOpen] = useState(false);
<AppShell search={<CommandMenuTrigger onClick={() => setOpen(true)} />} nav={nav}>…</AppShell>
<CommandMenu open={open} onOpenChange={setOpen} commands={commands} shortcut />`,
      },
    ],
    props: [
      {
        component: 'AppShell',
        rows: [
          { name: 'nav', type: 'ShellGroup[]', desc: 'Groups of { label?, items }. Each item: id, label, icon, href or onSelect, and an optional count with countLabel' },
          { name: 'current', type: 'string', desc: 'The id of the item for the screen being shown' },
          { name: 'isActive', type: '(item) => boolean', desc: 'Instead of current: decide per item, e.g. from the path' },
          { name: 'brand / brandMark', type: 'ReactNode', desc: 'Logo and name at the top of the sidebar; a small mark for the collapsed rail' },
          { name: 'title', type: 'ReactNode', desc: 'The top bar’s title, or a breadcrumb' },
          { name: 'search / actions / account', type: 'ReactNode', desc: 'Slots in the top bar, in that order. account is usually AccountMenu' },
          { name: 'sidebarFooter', type: 'ReactNode', desc: 'At the bottom of the sidebar and the phone menu. Hidden in the rail' },
          { name: 'tabs', type: 'string[]', desc: 'Ids for the phone tab bar, at most five. Defaults to the first items; when some are left out, the last tab is More' },
          { name: 'collapsed / defaultCollapsed / onCollapsedChange', type: 'boolean', def: 'false', desc: 'The desk sidebar as an icon rail. Leave collapsed out to let the shell keep it' },
          { name: 'storageKey', type: 'string', desc: 'Opt in to remembering the rail in this browser’s localStorage' },
          { name: 'layout', type: '"auto" | "desk" | "phone"', def: '"auto"', desc: 'auto picks by the shell’s own width: the phone layout under 640px' },
          { name: 'linkComponent', type: 'ElementType', def: '"a"', desc: 'What links render as, such as Next’s Link. Items without href are buttons' },
          { name: 'landmarks', type: 'boolean', def: 'true', desc: 'header, nav and main landmarks. Turn off only when the shell sits inside another page’s main' },
          { name: 'panel', type: 'ReactNode', desc: 'A record, docked on the right beside the screen; full screen with Back on a phone. Leave out to close it' },
          { name: 'panelTitle / panelId', type: 'ReactNode / string', desc: 'The panel’s heading, and what it shows. When panelId changes, focus moves to the heading' },
          { name: 'onPanelClose', type: '() => void', desc: 'Runs on ×, Back or Escape. Close the panel here, e.g. by leaving the record’s address' },
          { name: 'panelWidth', type: '{ default, min, max }', def: '440 / 360 / 640', desc: 'The desk width in px. Drag the edge or use the arrow keys on it; remembered with storageKey' },
          { name: 'labels', type: 'Partial<AppShellLabels>', desc: 'The words on its controls: skip link, menu, More, collapse and expand, close, back and resize' },
        ],
      },
      {
        component: 'AccountMenu',
        rows: [
          { name: 'name', type: 'string', desc: 'The signed-in person. Gives the avatar’s initials and the menu’s heading' },
          { name: 'detail', type: 'ReactNode', desc: 'A second line, usually their email' },
          { name: 'src', type: 'string', desc: 'Their photo' },
          { name: 'items', type: 'MenuEntry[]', desc: 'Actions: { label, onSelect or href, icon, tone, hint, disabled }, or "separator"' },
        ],
      },
    ],
    when: ['Every signed-in screen of an app: put the shell in your root layout once', 'Apps used on both desks and phones, which need the tab bar and the drawer without a second layout'],
    whenNot: ['Marketing pages and sign-in: they have their own simpler layout', 'More than five top places on a phone: the rest go under More, so keep the tab bar to what people use daily'],
    keyboard: [
      ['Tab', 'The first Tab reaches Skip to content, which jumps past the sidebar to the screen'],
      ['Tab / Shift + Tab', 'Moves through the sidebar links, the top bar and the screen, in that order'],
      ['Enter', 'Opens the focused link, or the phone menu from its button'],
      ['Escape', 'Closes the phone menu or the account menu, and puts focus back on its button. Inside the record panel, closes the panel'],
      ['Arrow Left / Right', 'On the panel’s edge: makes the panel wider or narrower (Shift for bigger steps, Home and End for the limits)'],
      ['Arrow keys', 'Move through the account menu once it is open'],
    ],
    builtIn: [
      'A Skip to content link is the first thing the keyboard reaches, so keyboard and screen reader users do not tab through every link on every screen.',
      'The current place is marked with aria-current="page", so screen readers say "current page", not only a grey background.',
      'Counts are read out with their meaning, such as "Cases, 3 unassigned", instead of a bare number.',
      'In the icon rail each icon shows its name on hover and on keyboard focus, and screen readers still hear the full label.',
      'On phones the tab bar keeps clear of the home bar (the safe area at the bottom of the screen), and every tab is a 44px or taller tap target.',
      'It picks its layout from its own width, not the screen’s, so it works in a preview, a split view or an embedded panel.',
      'The phone menu is the kit’s Drawer from the left: the page behind is out of reach while it is open, and widening the window past phone size closes it.',
      'The screen scrolls on its own, so the sidebar, top bar and tab bar stay put. Scrolling to the end does not drag the page behind.',
      'The rail choice is only remembered if you pass storageKey, and it is read after the first paint, so a server-rendered page never mismatches.',
      'The rail slides open and closed, and the drawer slides in, over the theme’s durations. Both stop for people who ask for less motion.',
      'Router-agnostic: links take href with any link component, or onSelect for apps that switch screens in state.',
      menuNote,
      theme,
    ],
  },
  {
    slug: 'command-menu',
    name: 'Command Menu',
    group: FRAME,
    description: 'Search and jump to anything from the keyboard: grouped commands, forgiving matching, recent picks first and keys shown beside what they do.',
    install: ['command-menu'],
    sources: [],
    Demo: CommandMenuDemo,
    Thumb: CommandMenuThumb,
    usage: `import { CommandMenu, CommandMenuTrigger, type Command } from "@/components/ui/command-menu";

const [open, setOpen] = useState(false);
const commands: Command[] = [
  { id: "go-cases", label: "Cases", group: "Go to", icon: <CasesIcon />, onSelect: () => router.push("/cases") },
  { id: "new-case", label: "New case", group: "Create", keywords: "add job", onSelect: startCase },
];

<CommandMenuTrigger onClick={() => setOpen(true)} />
<CommandMenu open={open} onOpenChange={setOpen} commands={commands} shortcut storageKey="brightwater-recent" />`,
    examples: [
      {
        title: 'Search your server as people type',
        code: `const [found, setFound] = useState<Command[]>([]);
const [loading, setLoading] = useState(false);

<CommandMenu
  open={open}
  onOpenChange={setOpen}
  commands={[...staticCommands, ...found]}
  loading={loading}
  onQueryChange={async (q) => {
    setLoading(true);
    const customers = await api.searchCustomers(q);  // your client, not a fetch inside the menu
    setFound(customers.map((c) => ({ id: c.id, label: c.name, group: "Customers", onSelect: () => openCustomer(c.id) })));
    setLoading(false);
  }}
/>`,
      },
      { title: 'A different shortcut', code: `<CommandMenu shortcut="mod+p" … />   // ⌘P on a Mac, Ctrl+P elsewhere. "/" works too` },
    ],
    props: [
      {
        component: 'CommandMenu',
        rows: [
          { name: 'open / onOpenChange', type: 'boolean / (open) => void', desc: 'Whether it is open. You own this state' },
          { name: 'commands', type: 'Command[]', desc: 'Each: id, label, onSelect, and optional group, description, keywords, icon, shortcut, hint, disabled' },
          { name: 'shortcut', type: 'boolean | string', def: 'false', desc: 'Opt in to a key that opens and closes it: true for ⌘K / Ctrl+K, or e.g. "mod+p" or "/". Never fires while typing in a field' },
          { name: 'recent / onRecentChange', type: 'string[] / (ids) => void', desc: 'Recent picks, newest first, shown before anything is typed. Leave out to let it keep its own' },
          { name: 'storageKey', type: 'string', desc: 'Opt in to remembering recent picks in this browser’s localStorage' },
          { name: 'recentLimit', type: 'number', def: '5', desc: 'How many recent picks to keep' },
          { name: 'onQueryChange', type: '(query) => void', desc: 'Called as people type, e.g. to search your server and pass results in as commands' },
          { name: 'loading', type: 'boolean', desc: 'Shows "Searching…" while your search runs' },
          { name: 'placeholder / emptyText / label', type: 'string / (query) => ReactNode / string', desc: 'The words in the box, when nothing matches, and the dialog’s name' },
          { name: 'hints', type: 'boolean', def: 'true', desc: 'The key hints along the bottom. Hidden on touch screens either way' },
        ],
      },
      {
        component: 'CommandMenuTrigger and Kbd',
        rows: [
          { name: 'label', type: 'string', def: '"Search"', desc: 'The words on the trigger' },
          { name: 'shortcut', type: 'string', def: '"mod+k"', desc: 'The key it shows, written for the reader’s computer: ⌘K or Ctrl K' },
          { name: 'compact', type: 'boolean', desc: 'Only the search icon, for a phone’s top bar. The label is still read out' },
          { name: 'Kbd keys', type: 'string | string[]', desc: 'Draws keys as keycaps, e.g. <Kbd keys={["G", "C"]} />' },
        ],
      },
    ],
    when: ['Apps with more than a handful of screens or records, where people know what they want and would rather type it', 'A home for actions that have no button on the current screen'],
    whenNot: ['As the only way to reach something: everything in it should also be reachable without it', 'Filtering a single list on the page: use a search field above the list'],
    keyboard: [
      ['⌘K / Ctrl + K', 'Opens and closes it, when the shortcut prop is on. Not while typing in another field'],
      ['↑ / ↓', 'Moves through the results. Ctrl + N and Ctrl + P do the same'],
      ['Page Up / Page Down', 'Moves five at a time'],
      ['Enter', 'Runs the highlighted command'],
      ['Escape', 'Closes it and puts focus back where it was'],
    ],
    builtIn: [
      'Forgiving matching: the start of a name ranks first, then the start of a word, then anywhere, then letters in order, so "nwcs" still finds "New case". Accents do not matter, so "jose" finds "José".',
      'With nothing typed it shows recent picks first, because people mostly go back to the same few places.',
      'The command runs after the menu has closed and focus is back, so a command that moves focus or changes the page does not fight the dialog.',
      'The shortcut is opt-in and never fires while someone is typing in a field elsewhere, so ⌘K in a note does not throw away their typing.',
      'Screen readers hear how many results there are as people type, and which one is highlighted, on the WAI-ARIA combobox pattern.',
      'The key hints are hidden on touch screens, where they mean nothing. The trigger shows ⌘K on a Mac and Ctrl K elsewhere.',
      'It sits a little above the middle of the screen, so the box does not jump as the list grows and shrinks.',
      'It opens and closes with the Dialog’s short motion, which stops for people who ask their device for less.',
      theme,
    ],
  },
  {
    slug: 'stepper-form',
    name: 'Stepper Form',
    group: FRAME,
    description: 'A long form split into steps, each checked before moving on, with a review of everything entered before it is sent.',
    install: ['stepper-form'],
    sources: [],
    Demo: StepperDemo,
    Thumb: StepperThumb,
    usage: `import { StepperForm } from "@/components/ui/stepper-form";

<StepperForm
  aria-label="Book a visit"
  labels={{ submit: "Book visit" }}
  steps={[
    { id: "customer", title: "Customer", validate: checkCustomer, children: <CustomerFields /> },
    { id: "address", title: "Address", children: <AddressFields /> },   // no validate: the browser's own rules (required…) are used
  ]}
  review={{ items: [{ step: "customer", label: "Name", value: form.name }, { step: "address", label: "Street", value: form.street }] }}
  onSubmit={() => api.bookVisit(form)}
/>`,
    examples: [
      {
        title: 'A step that checks its fields',
        code: `validate: () => {
  const e = { name: !form.name.trim() && "Enter the customer's name." };
  setErrors(e);                // your fields show these through their error prop
  return !e.name;              // false stays on the step and focuses the first field to fix
}`,
      },
      { title: 'Check something on your server first', code: `validate: async () => (await api.checkAddress(form.street)).ok` },
      { title: 'Control the step, e.g. from the URL', code: `<StepperForm step={Number(params.step ?? 0)} onStepChange={(s) => setParams({ step: String(s) })} … />` },
    ],
    props: [
      {
        component: 'StepperForm',
        rows: [
          { name: 'steps', type: 'FormStep[]', desc: 'Each: id, title, children, and optional description and validate' },
          { name: 'validate (on a step)', type: '() => boolean | Promise<boolean>', desc: 'Set your fields’ errors, then return true to move on. Without it, the browser’s own rules on the fields are checked' },
          { name: 'review', type: '{ title?, description?, items }', desc: 'Adds a last step listing what was entered. Each item: label, value, and the step id for its Edit button' },
          { name: 'onSubmit', type: '() => void | Promise', desc: 'Runs from the last step. A promise shows a spinner; if it rejects, the form stays put' },
          { name: 'step / defaultStep / onStepChange', type: 'number', def: '0', desc: 'The step showing, from 0. Leave step out to let the form keep it' },
          { name: 'headingLevel', type: '2 | 3 | 4', def: '2', desc: 'The level of each step’s title, so the page outline stays in order' },
          { name: 'labels', type: 'Partial<StepperFormLabels>', desc: 'Back, Next, Submit, Edit, "Step 2 of 4" and the rest, for other languages or to say what Submit does' },
          { name: 'aria-label', type: 'string', desc: 'The form’s name for screen readers' },
        ],
      },
    ],
    when: ['A long form that is easier in parts: booking a visit, onboarding a customer, a quote with many sections', 'When what comes later depends on what was chosen earlier'],
    whenNot: ['A short form: one page with sections is quicker to fill and to check', 'Settings people change one at a time: use a page with Form Sections'],
    keyboard: [
      ['Enter', 'In a text field, goes to the next step, as Next does'],
      ['Tab', 'Moves through the fields, then Back and Next'],
      ['Enter or Space', 'On a finished step in the indicator, goes back to it'],
    ],
    builtIn: [
      'Every step stays in the page while hidden, so going back never loses what was typed, even in fields that keep their own state.',
      'Each step is checked before moving on. When it does not pass, focus goes to the first field to fix and screen readers hear "Check the highlighted fields to continue".',
      'Moving to a step puts focus on its heading, which says "Step 2 of 4", so screen reader and keyboard users always know where they are.',
      'The indicator marks the current step for screen readers with aria-current="step", and finished steps say "done". Finished steps can be revisited; steps not reached yet cannot be skipped to.',
      'The review lists every answer, shows "Not given" for blanks instead of an empty gap, and has an Edit button back to each step.',
      'Submit shows a spinner while your promise runs and cannot be pressed twice. If it fails, nothing entered is lost.',
      'On narrow screens the indicator shows only the current step’s name, and the buttons grow to full width. It goes by the form’s own width, so it also fits a side panel.',
      'Step dots ease their colour as steps finish, over the theme’s short duration; nothing slides. With less motion asked for, they change at once.',
      theme,
    ],
  },
  {
    slug: 'upload',
    name: 'Upload',
    group: FRAME,
    description: 'Choose or drop files, with clear reasons for anything turned away, progress for each file, retry, remove, image previews and a photo lightbox.',
    install: ['upload'],
    sources: [],
    Demo: UploadDemo,
    Thumb: UploadThumb,
    usage: `import { Upload } from "@/components/ui/upload";

<Upload
  label="Job photos"
  view="gallery"
  accept="image/*"
  capture="environment"
  maxSize={8_000_000}
  upload={(file, { onProgress, signal }) => api.uploadPhoto(caseId, file, { onProgress, signal })}
  onChange={(items) => setPhotos(items.filter((i) => i.status === "done").map((i) => i.result))}
/>`,
    examples: [
      {
        title: 'An upload function with progress, using XMLHttpRequest',
        code: `const upload: UploadFn = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("The server turned it away.")));
    xhr.onerror = () => reject(new Error("The connection dropped. Try again."));
    signal.addEventListener("abort", () => xhr.abort());
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });`,
      },
      { title: 'Files already on the record', code: `<Upload defaultFiles={job.photos.map((p) => ({ id: p.id, name: p.name, url: p.url }))} onRemove={(i) => api.deletePhoto(i.id)} … />` },
      { title: 'A demo with no server', code: `import { mockUpload } from "@/components/ui/upload";
<Upload upload={mockUpload({ failEvery: 3 })} … />` },
    ],
    props: [
      {
        component: 'Upload',
        rows: [
          { name: 'upload', type: '(file, { onProgress, signal }) => Promise', desc: 'Sends one file your app’s way. Report 0 to 1 through onProgress; stop when signal aborts. Reject with an Error to show its message' },
          { name: 'accept', type: 'string', desc: 'As for a file input: "image/*,.pdf". Other files are turned away with a reason' },
          { name: 'maxSize', type: 'number', desc: 'The largest file, in bytes. Shown under the field as "Up to 8 MB each"' },
          { name: 'maxFiles', type: 'number', desc: 'The most files in total, counting ones already there' },
          { name: 'multiple', type: 'boolean', def: 'true', desc: 'Off: one file, and a new one replaces it' },
          { name: 'capture', type: '"environment" | "user"', desc: 'On phones, adds Take photo, which opens that camera' },
          { name: 'view', type: '"list" | "gallery"', def: '"list"', desc: 'gallery shows tiles that open in a lightbox' },
          { name: 'defaultFiles', type: '{ id, name, size?, type?, url? }[]', desc: 'Files already uploaded, e.g. when editing a record' },
          { name: 'onChange', type: '(items) => void', desc: 'The whole list after every change. Done items carry what upload resolved with in result' },
          { name: 'onRemove', type: '(item) => void', desc: 'When someone removes a file, e.g. to delete it on your server' },
          { name: 'concurrency', type: 'number', def: '3', desc: 'How many files upload at once; the rest wait their turn' },
          { name: 'label, description, error, required, disabled', type: 'Field parts', desc: 'As on every field in the kit' },
          { name: 'labels', type: 'Partial<UploadLabels>', desc: 'Every word it shows, including the error messages, for other languages' },
        ],
      },
    ],
    when: ['Photos from a job site, receipts, signed documents: anything people attach to a record', 'Phones in the field: capture opens the camera straight away'],
    whenNot: ['Importing a spreadsheet of records: that needs a mapping step after the file is chosen', 'Huge files such as video: use resumable uploads from your storage provider'],
    keyboard: [
      ['Tab', 'Reaches Choose files, then each file’s Retry and Remove'],
      ['Enter or Space', 'Opens the file picker, or a photo in the lightbox'],
      ['← / →', 'In the lightbox, the previous and next photo'],
      ['Escape', 'Closes the lightbox and puts focus back on the photo'],
    ],
    builtIn: [
      'Files are checked before anything is sent: a wrong type, a file over the limit or one too many is turned away with a reason that names the file, such as "invoice.zip is not a type of file this takes."',
      'Screen readers hear each file as it finishes or fails, and why.',
      'Removing a file mid-way stops its upload through the signal, and focus moves on to the next file’s Remove, so keyboard users do not lose their place.',
      'A few files upload at a time and the rest wait their turn, so a phone on a weak connection is not swamped by twenty at once.',
      'Previews of new photos are made in the browser and let go when the file is removed or the page closes, so memory does not leak.',
      'Sizes and percentages are written in the reader’s own number format, such as 2.4 MB.',
      'On phones, Take photo opens the camera and the drop hint is hidden, since there is nothing to drop from. Buttons are 44px tap targets.',
      'In the lightbox the arrow keys and a sideways swipe move between photos; a short swipe springs back.',
      'Progress bars ease forward over the theme’s duration, and the lightbox opens with the Dialog’s motion. Both stop for people who ask for less motion.',
      'No fetch inside: your upload function sends the file your app’s way, and mockUpload stands in for demos.',
      theme,
    ],
  },
  {
    slug: 'bottom-sheet',
    name: 'Bottom Sheet',
    group: PHONE,
    description: 'A panel that slides up from the bottom of a phone screen. Drag or flick it down to close; snap points let it rest half open. A centred dialog on desks.',
    install: ['bottom-sheet'],
    sources: [],
    Demo: BottomSheetDemo,
    Thumb: BottomSheetThumb,
    usage: `import { BottomSheet } from "@/components/ui/bottom-sheet";

<BottomSheet
  open={!!visit}
  onOpenChange={(o) => !o && setVisit(null)}
  title={visit?.customer}
  description={visit?.job}
  footer={<><Button variant="secondary" onClick={call}>Call</Button><Button onClick={markDone}>Mark done</Button></>}
>
  <VisitDetail visit={visit} />
</BottomSheet>`,
    examples: [
      { title: 'Half open, pull up for more', code: `<BottomSheet snapPoints={[0.5, 0.92]} title="Add a note" … />` },
      { title: 'A sheet on desks too', code: `<BottomSheet mode="sheet" … />` },
      { title: 'Keep it open while saving', code: `<BottomSheet dismissible={!saving} … />` },
    ],
    props: [
      {
        component: 'BottomSheet',
        rows: [
          { name: 'open / onOpenChange', type: 'boolean / (open) => void', desc: 'Whether it is open. Dragging it down, Escape and the × button ask to close it' },
          { name: 'title / description', type: 'ReactNode', desc: 'Read out as it opens. The title bar is also a place to drag it' },
          { name: 'children / footer', type: 'ReactNode', desc: 'The body scrolls on its own; footer buttons go full width and keep clear of the home bar' },
          { name: 'snapPoints', type: 'number[]', desc: 'Heights it can rest at, as fractions of the screen, e.g. [0.5, 0.92]. Leave out to fit its content' },
          { name: 'defaultSnap', type: 'number', def: '0', desc: 'Which snap point it opens at, by index' },
          { name: 'mode', type: '"auto" | "sheet"', def: '"auto"', desc: 'auto: a sheet when the space it sits in is 640px or less, a centred dialog when wider. sheet: always a sheet' },
          { name: 'dismissible', type: 'boolean', def: 'true', desc: 'Dragging down, Escape and a tap outside close it. Turn off while saving' },
          { name: 'size, hideClose, initialFocus, onClosed', type: 'as Dialog', desc: 'The rest of Dialog’s props. size sets the desk dialog’s width' },
        ],
      },
    ],
    when: ['A quick action or short form on a phone, such as a visit’s details with Call and Mark done', 'Choices that belong to the screen behind, so people keep their place'],
    whenNot: ['Long forms or anything with many steps: give it its own screen', 'Messages that need no answer: use a toast'],
    keyboard: [
      ['Escape', 'Closes it and puts focus back on what opened it'],
      ['Tab / Shift + Tab', 'Moves through what is inside; focus never reaches the page behind'],
      ['Enter or Space', 'On the handle, when it has snap points, expands or collapses it'],
    ],
    builtIn: [
      'It is the kit’s Dialog underneath, so the page behind is out of reach, Escape closes it, and focus goes back to what opened it.',
      'It starts with focus on its title, not a field, so a phone does not throw up its keyboard over the sheet.',
      'Drag the handle or the title bar down to close it. A quick flick is enough; a short drag springs back. The finger’s speed decides, not only the distance.',
      'With snap points, the handle is a real button that expands and collapses it, so people who cannot drag can still resize it, and screen readers hear whether it is expanded.',
      'It keeps clear of the notch at the top and the home bar at the bottom (the screen’s safe areas).',
      'The tap that ends a drag does not press the × button or anything else under the finger.',
      'On desks it falls back to a centred dialog by default, since a sheet from the bottom of a wide screen is a long way from everything else.',
      'It slides up and down over the theme’s durations, and follows the finger while dragged. With less motion asked for, it simply appears and goes.',
      theme,
    ],
  },
  {
    slug: 'list-row',
    name: 'List Row',
    group: PHONE,
    description: 'A touch-sized row for phone lists, with swipe actions that are also in a menu, and a List with section headings that stay in view.',
    install: ['list-row'],
    sources: [{ file: 'list-row.tsx', code: listRowSrc }],
    Demo: ListRowDemo,
    Thumb: ListRowThumb,
    usage: `import { List, ListRow, ListSection } from "@/components/ui/list-row";

<List aria-label="Visits">
  <ListSection title="Today">
    {visits.map((v) => (
      <ListRow
        key={v.id}
        leading={<Avatar name={v.customer} size="sm" />}
        title={v.customer}
        description={\`\${time(v.start)} · \${v.job}\`}
        trailing={<Badge tone="info">{v.status}</Badge>}
        href={\`/visits/\${v.id}\`}
        actions={[{ label: "Archive", icon: <ArchiveIcon />, onSelect: () => archive(v) }]}
      />
    ))}
  </ListSection>
</List>`,
    examples: [
      { title: 'A row that is a button', code: `<ListRow title="Harbour Pools" description="Bayside" onClick={() => openCustomer(id)} />` },
      { title: 'Delete with Undo, not "Are you sure?"', code: `actions={[{ label: "Delete", tone: "danger", onSelect: () => { remove(v); toast("Visit deleted", { undo: () => restore(v) }); } }]}` },
      { title: 'In a rounded box on a desk', code: `<List variant="card">…</List>` },
    ],
    props: [
      {
        component: 'ListRow',
        rows: [
          { name: 'title', type: 'ReactNode', desc: 'One line, cut short with … when it does not fit' },
          { name: 'description', type: 'ReactNode', desc: 'A second, muted line' },
          { name: 'leading / trailing', type: 'ReactNode', desc: 'An Avatar or 20px icon at the start; a Badge, amount or time at the end' },
          { name: 'href / onClick', type: 'string / () => void', desc: 'Makes the row a link or a button. Leave both out for a row that only shows' },
          { name: 'linkComponent', type: 'ElementType', def: '"a"', desc: 'What links render as, such as Next’s Link' },
          { name: 'chevron', type: 'boolean', desc: 'The › at the end. On by default for links and buttons' },
          { name: 'actions', type: 'RowAction[]', desc: 'Each: label, onSelect, icon, tone. Revealed by swiping left on touch screens, and always in the row’s More menu' },
          { name: 'moreLabel', type: 'string', def: '"More actions"', desc: 'The More button’s name; the row’s title is read with it' },
          { name: 'selected / disabled', type: 'boolean', desc: 'Shows the row as chosen, or not usable' },
        ],
      },
      {
        component: 'List and ListSection',
        rows: [
          { name: 'variant', type: '"plain" | "card"', def: '"plain"', desc: 'plain runs edge to edge, as on a phone; card sits in a rounded box' },
          { name: 'ListSection title', type: 'ReactNode', desc: 'A heading that stays at the top while its rows scroll past' },
          { name: 'ListSection level', type: '2 | 3 | 4', def: '3', desc: 'Heading level, so the page outline stays in order' },
        ],
      },
    ],
    when: ['Lists on a phone: visits, customers, messages, invoices', 'Short lists on a desk, in a card, where a table would be too much'],
    whenNot: ['Many columns to compare or sort: use Data Table', 'Anything people need to select many of at once: use Data Table’s selection'],
    keyboard: [
      ['Tab', 'Moves from a row to its More button, then to the next row'],
      ['Enter', 'Opens the row'],
      ['Enter, Space or ↓', 'On More, opens the row’s actions; arrows move, Enter runs one'],
      ['Escape', 'Closes the actions, or a row swiped open'],
    ],
    builtIn: [
      'Every swipe action is also in the row’s More menu, so keyboard, mouse and screen reader users have the same actions as people who swipe. Phone screen readers cannot swipe a row open.',
      'The More button is read with the row’s title, as in "More actions, Harbour Pools", so a list of them is not twenty identical buttons.',
      'Swipe buttons are out of reach of the keyboard until the row is swiped open, so Tab does not land on hidden buttons.',
      'When an action takes the row away, such as Archive, focus moves on to the next row instead of falling to the top of the page.',
      'Rows are at least 56px tall on a desk and grow on touch screens, a comfortable thumb target. Titles stay on one line and are cut short with …, so rows line up.',
      'A swipe only starts when the finger moves sideways, so scrolling the list up and down never drags a row. Lifting part way springs it back, and the tap that ends a swipe does not open the row.',
      'Section headings stay in view at the top while their rows scroll past.',
      'Swiped rows slide open and closed over the theme’s duration. With less motion asked for, they snap.',
      menuNote,
      theme,
    ],
  },
  {
    slug: 'pull-to-refresh',
    name: 'Pull to Refresh',
    group: PHONE,
    description: 'Pull a list down and let go to reload it, without fighting the browser’s own pull-to-refresh. A Refresh button does the same for mouse and keyboard.',
    install: ['pull-to-refresh'],
    sources: [],
    Demo: PullDemo,
    Thumb: PullThumb,
    usage: `import { PullToRefresh } from "@/components/ui/pull-to-refresh";

<div style={{ height: "100%" }}>
  <PullToRefresh onRefresh={() => refetchVisits()} aria-label="Today's visits" status={\`Updated \${time(updatedAt)}\`}>
    <VisitList visits={visits} />
  </PullToRefresh>
</div>`,
    examples: [
      { title: 'Say when it fails', code: `onRefresh={() => refetch().catch(() => toast.error("Could not refresh", { description: "Check your connection." }))}` },
      { title: 'Your own Refresh control elsewhere', code: `<PullToRefresh button="none" onRefresh={refetch}>…</PullToRefresh>` },
    ],
    props: [
      {
        component: 'PullToRefresh',
        rows: [
          { name: 'onRefresh', type: '() => Promise', desc: 'Reloads the list. The spinner shows until it settles. Show errors yourself, e.g. with a toast' },
          { name: 'children', type: 'ReactNode', desc: 'The list. PullToRefresh is the part that scrolls, so give it, or its box, a height' },
          { name: 'threshold', type: 'number', def: '72', desc: 'How far to pull, in px, before letting go refreshes' },
          { name: 'button', type: '"auto" | "always" | "none"', def: '"auto"', desc: 'The Refresh button. auto: shown on desks, and on touch screens when the keyboard reaches it' },
          { name: 'status', type: 'ReactNode', desc: 'Beside the button, e.g. "Updated 9:41"' },
          { name: 'disabled', type: 'boolean', desc: 'No pulling and no button, e.g. while offline' },
          { name: 'labels', type: 'Partial<PullToRefreshLabels>', desc: 'Refresh, Refreshing and Up to date, for other languages' },
          { name: 'aria-label', type: 'string', desc: 'Names the scroll area, and makes it reachable by keyboard for scrolling' },
        ],
      },
    ],
    when: ['Phone lists that change while people look at them: today’s visits, new messages, job status', 'Alongside automatic updates, as the way to check now'],
    whenNot: ['Desk-only screens: a Refresh button, or automatic updates, are enough', 'Lists that update live already: pulling would do nothing'],
    keyboard: [
      ['Tab', 'Reaches the Refresh button. On touch screens it appears when focused'],
      ['Enter or Space', 'Refreshes, with the same spinner'],
      ['↑ / ↓', 'Scroll the list, once the list has focus'],
    ],
    builtIn: [
      'It stops the browser’s own pull-to-refresh and bounce inside the list (overscroll-behavior), so the page does not reload behind your refresh and the screen does not jump.',
      'A pull only starts at the very top of the list and only when the finger moves down, so ordinary scrolling is never mistaken for one.',
      'There is a real Refresh button for mouse, keyboard and switch users: always on desks, and on touch screens it appears when the keyboard reaches it.',
      'Screen readers hear "Refreshing" and then "Up to date", and the list says it is busy while it reloads.',
      'The spinner stays in view until your onRefresh settles, and a second refresh cannot start while one runs.',
      'The list follows the finger directly, with resistance past the threshold. The arrow turns when letting go will refresh, and everything springs back over the theme’s duration; with less motion asked for, it springs back at once.',
      'Touch only: on a desk a mouse drag selects text as usual, and the button does the refreshing.',
      theme,
    ],
  },
];
