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

// What travels with every Pro screen: the backend recipe (docs/CATALOG.md section 3).
export const PARTS: { title: string; body: string }[] = [
  { title: 'Contract', body: 'The exact list of calls the screen makes and what comes back.' },
  { title: 'Mock client', body: 'Answers those calls from demo data, so the screen works the minute it is installed.' },
  { title: 'Agent guide', body: 'Instructions for your coding agent: tables to create, rules to enforce, mistakes to avoid.' },
  { title: 'Checks', body: 'Tests the agent runs on its own work until they pass.' },
];

// The selling pitch, in the owner's words (2026-11-27).
export const PITCH: { title: string; body: string }[] = [
  { title: 'Buy once, use forever', body: 'One payment. No subscription, no renewal, and the code is yours to keep and change.' },
  { title: 'A ready app in a day', body: 'Start from a working business app with demo data, then make it yours.' },
  { title: 'Only the essentials', body: 'A small set of components that cover the job. Nothing to learn that you will not use.' },
];

// ---- Pricing page

export const PRICING_FAQ: { q: string; a: string; tbc?: boolean }[] = [
  {
    q: 'What am I buying?',
    a: 'Lifetime access to every Pro item: screens that work and data blocks wired to data, each with a backend recipe your agent can follow. You get the source, in your own project, to keep and change. Pro items added in later phases are included.',
  },
  {
    q: 'What is free?',
    a: 'Every component, the theme and the agent kit, under the MIT licence, plus two screens: Sign in and Dashboard. You do not need an account to use them.',
  },
  {
    q: 'Do I pay once?',
    a: 'Yes. One payment, no subscription and no renewal. Access does not expire.',
  },
  {
    q: 'What is the first-100 offer?',
    a: 'The first 100 buyers pay the launch price: USD 149 for Individual or USD 399 for Team. The 100 is one pool shared by both plans. After that the prices are USD 299 and USD 699. There is no timer.',
  },
  {
    q: 'How do team seats work?',
    a: 'A Team licence covers up to 10 people. Each person signs in with their own email and creates their own access key. Keys and seats are not shared.',
  },
  {
    q: 'Can I use it for client work?',
    a: 'Yes. Use Pro items in as many projects as you like, including projects for clients. What you cannot do is republish the Pro source as a kit, template, library or registry. The licence page has the details.',
  },
  {
    q: 'How do I get the Pro code after paying?',
    a: 'You sign in with the email you paid with, create a personal access key, and install Pro items from the registry with the shadcn CLI. This is planned for the Pro launch.',
  },
  { q: 'Can I get a refund?', a: 'To be confirmed.', tbc: true },
];

export const PRO_STATUS =
  'Pro is not on sale yet. It launches with the working loop (phase 2). The free items are in pre-release.';
