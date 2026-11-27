// The AscentUI catalog as data, transcribed from docs/CATALOG.md (version 3, 2026-11-28).
// scripts/check-catalog.mjs compares the counts here with the phase table in CATALOG.md §5
// and fails the build if they drift. Change the doc and this file together.
//
// This file must stay plain data with no imports: the build scripts load it directly.
//
// `origin` records where an item stands in CATALOG.md's status key:
//   'repo'      = "Have": already in this repository
//   'prototype' = designed in the prototype, needs our own components underneath
//   'engine'    = exists in the source engine, to copy and make generic
//   'new'       = to write
//   'mixed'     = the doc gives different answers for parts of the item
//   null        = the doc gives no status
// `status` is what the website shows: built, part-built or planned.

export type Layer = 'theme' | 'component' | 'motion' | 'block' | 'screen' | 'illustration' | 'starter' | 'agent-kit';
export type Tier = 'free' | 'pro';
export type Phase = 1 | 2 | 3 | 4 | 5;
export type Status = 'built' | 'part-built' | 'planned';
export type Origin = 'repo' | 'prototype' | 'engine' | 'new' | 'mixed' | null;

export interface CatalogItem {
  slug: string;
  name: string;
  layer: Layer;
  tier: Tier;
  phase: Phase;
  /** Grouping inside a layer, e.g. "Forms" for components. */
  group?: string;
  /** Business module, for phase 2 and 3 screens. */
  module?: string;
  description: string;
  status: Status;
  origin: Origin;
}

export const LAYERS: { id: Layer; label: string; blurb: string }[] = [
  { id: 'theme', label: 'Theme', blurb: 'One place to change the look.' },
  { id: 'component', label: 'Components', blurb: 'Every component is free, on desk and phone.' },
  { id: 'motion', label: 'Motion', blurb: 'Built-in motion ships with the components. Standalone effects come later.' },
  { id: 'block', label: 'Blocks', blurb: 'Layout blocks are free. Blocks wired to data are Pro.' },
  { id: 'screen', label: 'Screens', blurb: 'Screens that work, each with a backend recipe. Two are free.' },
  { id: 'illustration', label: 'Illustrations', blurb: 'Animated business scenes for landing pages and empty states.' },
  { id: 'starter', label: 'Starter apps', blurb: 'The whole thing running, on a reference server.' },
  { id: 'agent-kit', label: 'Agent kit', blurb: 'What a coding agent reads before it writes anything.' },
];

export const PHASES: { id: Phase; name: string; theme: string }[] = [
  { id: 1, name: 'Core', theme: 'The parts of the loop' },
  { id: 2, name: 'The working loop', theme: 'Sign in, list, record, form, states, on desk and phone' },
  { id: 3, name: 'Business screens', theme: 'Dispatch, field app, CRM, quotes and payments, assets and warranty' },
  { id: 4, name: 'Secondary', theme: 'Illustration, standalone motion, Brand Studio, AI activity' },
  { id: 5, name: 'Deployable app', theme: 'Reference server and starter apps' },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/\+/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Rest = Partial<Pick<CatalogItem, 'group' | 'module' | 'slug'>>;
const item = (
  layer: Layer, tier: Tier, phase: Phase, name: string, description: string,
  status: Status, origin: Origin, rest: Rest = {},
): CatalogItem => ({ slug: rest.slug ?? slugify(name), name, layer, tier, phase, description, status, origin, ...rest });

// ---------------------------------------------------------------- phase 1: core (40 free)

/** Built-in motion that ships so far, inside the batch-1 components. */
const MOTION_STATUS: Record<string, Status> = {
  'Number count-up': 'built',
  'Skeleton shimmer': 'built',
  'Press and focus feedback': 'part-built',
};

const comp = (group: string, name: string, description: string, status: Status, origin: Origin) =>
  item('component', 'free', 1, name, description, status, origin, { group });

const PHASE_1: CatalogItem[] = [
  item('theme', 'free', 1, 'Tokens + brand config',
    'Light and dark colours, one font, corner radius and spacing. One brand object re-themes everything.',
    'part-built', 'mixed'),

  // Actions and display (10)
  comp('Actions and display', 'Button', 'The standard action button.', 'built', 'new'),
  comp('Actions and display', 'Badge', 'A small label for status and counts.', 'built', 'new'),
  comp('Actions and display', 'Card', 'A surface that groups related content.', 'built', 'new'),
  comp('Actions and display', 'Avatar', 'A person or company, as a picture or initials.', 'built', 'new'),
  comp('Actions and display', 'Stat Card', 'One number with its label and change.', 'built', 'new'),
  comp('Actions and display', 'Empty State', 'What a list shows when there is nothing in it yet.', 'built', 'new'),
  comp('Actions and display', 'Icon Button', 'A button that is only an icon, with an accessible name.', 'built', 'new'),
  comp('Actions and display', 'Separator', 'A dividing line between groups.', 'built', 'new'),
  comp('Actions and display', 'Skeleton + Spinner', 'Loading placeholders and a busy indicator.', 'built', 'new'),
  comp('Actions and display', 'Tooltip', 'A short hint on hover or focus.', 'built', 'new'),

  // Forms (9)
  comp('Forms', 'Form kit', 'Field labels, required marks and form headings.', 'built', 'repo'),
  comp('Forms', 'Segmented Control', 'Switch between a few options in one row.', 'planned', 'new'),
  comp('Forms', 'Select + Combo Box', 'Pick one from a list. The combo box searches as you type.', 'part-built', 'mixed'),
  comp('Forms', 'Switch + Checkbox', 'On and off, and tick boxes.', 'planned', 'mixed'),
  comp('Forms', 'Date + Time Picker', 'Pick a day and a time.', 'planned', 'new'),
  comp('Forms', 'Text Field', 'A single line of text.', 'planned', 'new'),
  comp('Forms', 'Text Area', 'Several lines of text.', 'planned', 'new'),
  comp('Forms', 'Number Input', 'A number, with steps and limits.', 'planned', 'new'),
  comp('Forms', 'PIN Input', 'A short code, one box per digit.', 'planned', 'new'),

  // Data and overlays (5)
  comp('Data and overlays', 'Toaster', 'Brief messages that say what just happened.', 'planned', 'engine'),
  comp('Data and overlays', 'Dialog + Drawer', 'A centred dialog and a side panel.', 'planned', 'mixed'),
  comp('Data and overlays', 'Chart', 'Bars, lines, pie, sparkline and more from one component.', 'built', 'repo'),
  comp('Data and overlays', 'Data Table', 'A table with sorting, grouping, column choices and saved views.', 'built', 'repo'),
  comp('Data and overlays', 'Month Grid', 'A month calendar that shows items on each day.', 'built', 'repo'),

  // App frame (4)
  comp('App frame', 'App Shell', 'Sidebar, top bar, phone tab bar and account menu.', 'planned', 'prototype'),
  comp('App frame', 'Command Menu', 'Search and jump to anything from the keyboard.', 'planned', 'prototype'),
  comp('App frame', 'Stepper Form', 'A long form split into steps.', 'planned', 'prototype'),
  comp('App frame', 'Upload', 'Choose or drop files, with progress.', 'planned', 'engine'),

  // Phone (3)
  comp('Phone', 'Bottom Sheet', 'A panel that slides up from the bottom of a phone screen.', 'planned', 'engine'),
  comp('Phone', 'List Row', 'A touch-sized row for phone lists.', 'planned', 'engine'),
  comp('Phone', 'Pull to Refresh', 'Pull a list down to reload it.', 'planned', 'engine'),

  // Built-in motion (5)
  ...([
    ['Number count-up', 'Numbers count up to their value.'],
    ['Skeleton shimmer', 'A soft shimmer on loading placeholders.'],
    ['Overlay enter and exit', 'Dialogs, drawers and sheets move in and out.'],
    ['List reorder', 'Rows move to their new place when a list changes.'],
    ['Press and focus feedback', 'Controls respond to press and keyboard focus.'],
  ] as const).map(([name, description]) =>
    item('motion', 'free', 1, name, `${description} One switch turns motion off; reduced-motion is respected.`,
      MOTION_STATUS[name] ?? 'planned', null, { group: 'Built-in' })),

  // Layout blocks (2)
  item('block', 'free', 1, 'Page header', 'Title, description and actions at the top of a page.', 'planned', null, { group: 'Layout' }),
  item('block', 'free', 1, 'Filter bar', 'Search and filters above a list.', 'planned', null, { group: 'Layout' }),

  // Agent kit (1)
  item('agent-kit', 'free', 1, 'Agent kit',
    'The conventions guide, page recipes for the free screens, llms.txt and the MCP server for docs.',
    'planned', null),
];

// ---------------------------------------------------------------- phase 2: the working loop (2 free, 18 Pro)

const screen = (phase: Phase, module: string, tier: Tier, name: string, description: string, origin: Origin, slug?: string) =>
  item('screen', tier, phase, name, description, 'planned', origin, slug ? { module, slug } : { module });
const dataBlock = (phase: Phase, name: string, description: string) =>
  item('block', 'pro', phase, name, description, 'planned', null, { group: 'Data' });

const PHASE_2: CatalogItem[] = [
  // Sign-in and account screens (7)
  screen(2, 'Sign-in and account', 'free', 'Sign in', 'Email and password sign-in.', 'engine'),
  screen(2, 'Sign-in and account', 'pro', 'Sign up', 'Create an account.', 'new'),
  screen(2, 'Sign-in and account', 'pro', 'Forgot and reset password', 'Ask for a reset link and set a new password.', 'new'),
  screen(2, 'Sign-in and account', 'pro', 'Accept invite and set password', 'A new staff member joins from an invite.', 'engine'),
  screen(2, 'Sign-in and account', 'pro', 'Verify code', 'Confirm a code sent by email or text.', 'new'),
  screen(2, 'Sign-in and account', 'pro', 'PIN sign-in', 'A quick PIN sign-in on a phone, for field staff.', 'prototype'),
  screen(2, 'Sign-in and account', 'pro', 'Profile and account', 'A person edits their own details.', 'prototype'),

  // App basics (5)
  screen(2, 'App basics', 'free', 'Dashboard', 'Shows how the pieces fit together on one page.', 'prototype'),
  screen(2, 'App basics', 'pro', 'Staff and roles', 'Who works here and what each role can see.', 'engine'),
  screen(2, 'App basics', 'pro', 'Settings', 'Company settings in one form.', 'engine'),
  screen(2, 'App basics', 'pro', 'History and undo', 'Every change listed, with undo.', 'engine'),
  screen(2, 'App basics', 'pro', 'Trash and archive', 'Restore or remove what was archived or deleted.', 'engine'),

  // Phone versions (2)
  screen(2, 'Phone', 'pro', 'Phone list', 'Rows, search and pull to refresh.', 'mixed'),
  screen(2, 'Phone', 'pro', 'Phone record', 'A record with its actions in a bottom sheet.', 'mixed'),

  // Data blocks (6)
  dataBlock(2, 'Record list page', 'A list page wired to data: search, filter, sort and paging.'),
  dataBlock(2, 'Record drawer', 'One record in a side panel, with its fields and actions.'),
  dataBlock(2, 'Timeline', 'What happened to a record, in order.'),
  dataBlock(2, 'Settings form', 'A form that loads, validates and saves settings.'),
  dataBlock(2, 'Bulk action bar', 'Act on several selected rows at once.'),
  dataBlock(2, 'Undo history panel', 'Recent changes with an undo for each.'),
];

// ---------------------------------------------------------------- phase 3: business screens (32 Pro)

const biz = (module: string, origin: Origin, names: [string, string][]) =>
  names.map(([name, description]) => screen(3, module, 'pro', name, description, origin, slugify(`${module} ${name}`)));

const PHASE_3: CatalogItem[] = [
  ...biz('Dispatch', 'prototype', [
    ['Cases board', 'Cases as cards in columns by stage.'],
    ['Cases list', 'Every case in a table.'],
    ['New case', 'Open a case for a customer.'],
    ['Case work area', 'Everything about one case in one place.'],
    ['Partners', 'The outside technicians and companies you send work to.'],
    ['Schedule', 'Who is going where, and when.'],
  ]),
  ...biz('Field app', 'prototype', [
    ['Job offers', 'Jobs offered to a technician, to accept or decline.'],
    ["Today's jobs", 'What a technician has on today.'],
    ['Job detail and on-site status', 'One job, with status updates from site.'],
    ['Service report', 'What was done, written up on site.'],
    ['Open jobs', 'Jobs still in progress.'],
    ['Alerts', 'What needs attention.'],
    ['Invoices', "A technician's invoices for finished jobs."],
  ]),
  ...biz('CRM', 'mixed', [
    ['Contacts', 'The people you deal with.'],
    ['Companies', 'The organisations they belong to.'],
    ['Deals pipeline', 'Deals as cards in columns by stage.'],
    ['Lead inbox', 'New enquiries waiting for a reply.'],
  ]),
  ...biz('Quotes + payments', 'engine', [
    ['Quote builder', 'Build a quote from line items.'],
    ['Customer quote page', 'The page a customer opens to accept a quote.'],
    ['Invoices', 'Invoices and where each one stands.'],
    ['Payments', 'Payments received.'],
  ]),
  ...biz('Assets + warranty', 'engine', [
    ['Products', 'What you sell and service.'],
    ['Serial numbers', 'Each unit and where it has been.'],
    ['Warranty lookup', 'Check whether a unit is covered.'],
  ]),

  // Data blocks (8)
  dataBlock(3, 'Board', 'Cards in columns, moved between stages.'),
  dataBlock(3, 'Notes and comments', 'Notes on a record, by person and time.'),
  dataBlock(3, 'Line items editor', 'Rows of items, quantities and prices.'),
  dataBlock(3, 'Money summary', 'Subtotal, tax and total.'),
  dataBlock(3, 'Approval card', 'Something waiting for a yes or no.'),
  dataBlock(3, 'Schedule view', 'Work laid out across days and people.'),
  dataBlock(3, 'Setup guide', 'The steps to get an account ready.'),
  dataBlock(3, 'Photo report', 'Photos from site, attached to a job.'),
];

// ---------------------------------------------------------------- phase 4: secondary (11 free, 9 Pro)

// CATALOG.md §9 counts 12 illustrations (8 free, 4 Pro) and gives five example scenes, but does
// not name the twelve or say which are free. They are numbered here until that is decided.
const illustration = (n: number): CatalogItem =>
  item('illustration', n <= 8 ? 'free' : 'pro', 4, `Illustration ${n}`,
    'An animated business scene for landing pages and empty states. Scene not yet chosen.',
    'planned', null);

const PHASE_4: CatalogItem[] = [
  ...Array.from({ length: 12 }, (_, i) => illustration(i + 1)),

  // Standalone motion (6)
  item('motion', 'free', 4, 'Text reveal', 'Text appears word by word.', 'planned', null, { group: 'Standalone' }),
  item('motion', 'free', 4, 'Number ticker', 'A number rolls to a new value.', 'planned', null, { group: 'Standalone' }),
  item('motion', 'free', 4, 'List stagger', 'List items arrive one after another.', 'planned', null, { group: 'Standalone' }),
  item('motion', 'pro', 4, 'Page transition', 'Movement between pages.', 'planned', null, { group: 'Standalone' }),
  item('motion', 'pro', 4, 'Drag physics', 'Dragged things move with weight.', 'planned', null, { group: 'Standalone' }),
  item('motion', 'pro', 4, 'Background', 'A moving background for landing pages.', 'planned', null, { group: 'Standalone' }),

  screen(4, 'Brand', 'pro', 'Brand Studio', 'Edit the brand live and export the config.', null),
  screen(4, 'AI', 'pro', 'AI activity', 'What the assistant did, with approve and undo.', null),
];

// ---------------------------------------------------------------- phase 5: deployable app (2 Pro)

// CATALOG.md §10 lists three rows (reference server and two starters) while the §5 table counts
// two Pro items. The two starter apps are the items; the reference server ships inside them.
const PHASE_5: CatalogItem[] = [
  item('starter', 'pro', 5, 'Service business starter',
    'Console and field app, deployed with demo data on the reference server.', 'planned', null),
  item('starter', 'pro', 5, 'Sales CRM starter',
    'A console for leads, deals and quotes, on the reference server.', 'planned', null),
];

export const CATALOG: CatalogItem[] = [...PHASE_1, ...PHASE_2, ...PHASE_3, ...PHASE_4, ...PHASE_5];

export interface Counts { total: number; free: number; pro: number }

export function countItems(items: CatalogItem[]): Counts {
  const free = items.filter((i) => i.tier === 'free').length;
  return { total: items.length, free, pro: items.length - free };
}

export function countsByPhase(items: CatalogItem[] = CATALOG): Record<Phase, Counts> {
  const out = {} as Record<Phase, Counts>;
  for (const p of PHASES) out[p.id] = countItems(items.filter((i) => i.phase === p.id));
  return out;
}
