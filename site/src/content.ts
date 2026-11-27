// Everything on the landing page that is a decision rather than a design.
// `null` means "not decided yet" and renders as a visible placeholder.

export const REGISTRY_BASE: string | null = null; // e.g. 'https://ascentui.com'
export const COMPANY: string | null = null; // legal name for the footer

// Individual: USD 149 for the first 100 buyers, then USD 299. Lifetime access. (Set 2026-11-28.)
// Team (10 seats): USD 399 for the first 100 buyers, then USD 699.
// The first 100 is one shared pool across both plans.
export const PRICES: {
  individual: { launch: number; launchSpots: number; regular: number } | null;
  team: { launch: number; launchSpots: number; regular: number; seats: number } | null;
} = {
  individual: { launch: 149, launchSpots: 100, regular: 299 },
  team: { launch: 399, launchSpots: 100, regular: 699, seats: 10 },
};

export type Tier = 'free' | 'pro';

export const MODULES: { name: string; tier: Tier; body: string; parts: string }[] = [
  {
    name: 'Building blocks',
    tier: 'free',
    body: 'Data table with saved views, combo box, charts, month grid and a form kit.',
    parts: 'ui',
  },
  {
    name: 'Foundations',
    tier: 'pro',
    body: 'Staff, sign-in, roles and tab access, a history ledger with undo, archive and trash.',
    parts: 'ui + schema + server + demo',
  },
  {
    name: 'Dispatch + field app',
    tier: 'pro',
    body: 'Cases board, case drawer, resolve form and a partner app for jobs and invoices.',
    parts: 'ui + schema + server + demo',
  },
  {
    name: 'CRM',
    tier: 'pro',
    body: 'Leads, contacts and companies, a deals pipeline and a timeline.',
    parts: 'ui + schema + server + demo',
  },
  {
    name: 'Quotes + payments',
    tier: 'pro',
    body: 'Line items, a quote page customers can accept, payments, tax by region config.',
    parts: 'ui + schema + server + demo',
  },
  {
    name: 'Assets + warranty',
    tier: 'pro',
    body: 'Products, serial number lifecycle, warranty and a parts ledger.',
    parts: 'ui + schema + server + demo',
  },
];

export const PARTS: { title: string; body: string }[] = [
  { title: 'Screen', body: 'React components that take a typed client. No hidden fetches.' },
  { title: 'Database schema', body: 'One clean SQL file per module, with what it requires spelled out.' },
  { title: 'Server logic', body: 'A router you mount in your app, with the business rules already in it.' },
  { title: 'Demo data', body: 'A fictional company seeded in, so the first run looks like a business.' },
];

// The selling pitch, in the owner's words (2026-11-27).
export const PITCH: { title: string; body: string }[] = [
  { title: 'Buy once, use forever', body: 'One payment. No subscription, no renewal, and the code is yours to keep and change.' },
  { title: 'A ready app in a day', body: 'Start from a working business app with demo data, then make it yours.' },
  { title: 'Only the essentials', body: 'A small set of components that cover the job. Nothing to learn that you will not use.' },
];
