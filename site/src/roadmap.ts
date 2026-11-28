// The public roadmap. Phases 1-5 are counted live from the catalog; the suite after them is reserved
// (docs/CATALOG.md §13). Dates are targets, shown as months, never promised days.
import { CATALOG, countItems, type Phase } from './catalog';

export type Stage = 'now' | 'next' | 'later' | 'future';

export interface RoadmapStep {
  id: string;
  phase?: Phase;
  stage: Stage;
  title: string;
  target: string;
  summary: string;
  points: string[];
}

export const ROADMAP: RoadmapStep[] = [
  {
    id: 'core', phase: 1, stage: 'now', title: 'Core components', target: 'December 2026',
    summary: 'Every component, free. The theme, light and dark, phones, and the agent kit.',
    points: ['31 components on one shared theme', 'Light and dark, phone sizing and reduced motion built in', 'Install with the shadcn CLI or by asking your coding agent'],
  },
  {
    id: 'loop', phase: 2, stage: 'next', title: 'The working loop', target: 'February 2027',
    summary: 'Sign in, list, record, form and every state in between, on desk and phone.',
    points: ['Sign-in, sign-up, invites, password reset and PIN sign-in', 'Staff, roles, settings, history with undo, trash', 'Each screen ships with its backend recipe: contract, mock, agent guide and checks'],
  },
  {
    id: 'business', phase: 3, stage: 'next', title: 'Business screens', target: 'March to June 2027',
    summary: 'Pro launches here, with dispatch and the field app first.',
    points: ['Dispatch board, cases and a field app for phones', 'CRM: contacts, companies, deals and leads', 'Quotes, invoices and payments; products, serials and warranty'],
  },
  {
    id: 'secondary', phase: 4, stage: 'later', title: 'Polish and reach', target: 'July to August 2027',
    summary: 'Illustrations, motion, a live brand editor and an AI activity screen.',
    points: ['Animated business scenes for landing pages and empty states', 'Brand Studio: change the look and export it', 'See what an AI assistant did, approve it or undo it'],
  },
  {
    id: 'deploy', phase: 5, stage: 'later', title: 'Deployable apps', target: 'September to October 2027',
    summary: 'The whole thing running: a reference server and two starter apps.',
    points: ['A service-business app: console plus field app', 'A sales CRM app', 'One command to create, seed and sign in'],
  },
  {
    id: 'suite', stage: 'future', title: 'The full business suite', target: '2028 onwards',
    summary: 'Set up a whole business system by directing a coding agent.',
    points: [
      'CRM in the spirit of HubSpot, finance in the spirit of Xero, operations like an ERP',
      'Connect to your other software, and to any AI model, hosted or self-hosted',
      'AI agents that act only with permission: approvals, an audit log and undo',
      'Admin with single sign-on and two-factor, plus dashboards and reports',
    ],
  },
];

export const STAGE_LABEL: Record<Stage, string> = { now: 'Now', next: 'Next', later: 'Later', future: 'Future' };

/** How far a phase has got: built (or part built) items out of its total. */
export function progress(phase: Phase) {
  const items = CATALOG.filter((i) => i.phase === phase);
  const c = countItems(items);
  return { ...c, built: items.filter((i) => i.status !== 'planned').length };
}
