// Splits each component's "Built in for you" notes into the sections a component page shows:
// Accessibility, Motion and Responsive behaviour. Notes that fit none stay in the short summary.
// Where a component's notes say nothing about a section, EXTRA adds a line, written from its
// source in ui/src/components.
import type { Preview } from './types';

export interface Behaviour {
  summary: string[];
  a11y: string[];
  motion: string[];
  responsive: string[];
}

const SCREEN_READER = /screen reader/i;
const MOTION = /less motion|reduced motion|shimmer|count-up|counts up|slides?\b|grow in|motion|animat/i;
const RESPONSIVE = /touch|phone|narrow|tap target|small screen|44px|16px|home bar|full screen|sideways|screen edge/i;
const A11Y = /keyboard|focus|escape|arrow key|tab key|\btab\b|colour is (not|never)|cannot tell|contrast|aria|accessib|label is required|announced|read out|hear/i;

function classify(note: string): keyof Behaviour {
  if (SCREEN_READER.test(note)) return 'a11y';
  if (MOTION.test(note)) return 'motion';
  if (RESPONSIVE.test(note)) return 'responsive';
  if (A11Y.test(note)) return 'a11y';
  return 'summary';
}

const textSizes = 'Its text reads the theme’s sizes, which step up a little on touch screens. Nothing else about it changes.';
const noMotion = 'Nothing in it moves.';
const fieldMotion = 'The field’s edge eases to its focus and error look over the theme’s short duration; with less motion asked for, it changes at once.';

const EXTRA: Record<string, Partial<Behaviour>> = {
  button: { motion: ['A press shrinks it slightly, and hover and focus colours ease in over the theme’s short duration. Both stop for people who ask their device for less motion.'] },
  'icon-button': {
    motion: ['The same press feedback as Button. Its tooltip fades and slides in briefly, and simply appears when less motion is asked for.'],
  },
  badge: { motion: [noMotion], responsive: [textSizes] },
  card: { motion: [noMotion], responsive: [textSizes, 'It fills the width it is given, so it works in a grid, a list or a side panel.'] },
  avatar: { motion: [noMotion], responsive: ['Fixed sizes of 24, 32 and 40px, so rows of people line up on every screen.'] },
  'stat-card': { responsive: [textSizes, 'It fills the width it is given; put stat cards in a grid that wraps on narrow screens.'] },
  'empty-state': { motion: [noMotion], responsive: [textSizes, 'Centred and width-limited, so it reads well in a small card or a whole page.'] },
  separator: { motion: [noMotion], responsive: ['A hairline in any width or height it is given. The label stays centred.'] },
  'skeleton-and-spinner': { responsive: ['Skeletons take the width you give them, so the placeholder matches the layout at every size.'] },
  tooltip: {
    motion: ['The hint fades and slides in over the theme’s short duration, and simply appears for people who ask for less motion.'],
    responsive: ['Near the edge of the screen the hint slides sideways to stay in view, and it is never wider than the screen.'],
  },
  'form-kit': { motion: [fieldMotion] },
  'select-and-combo-box': { motion: ['The combo box arrow turns over as the list opens, over the theme’s short duration.'] },
  'date-and-time-picker': { motion: [noMotion] },
  'text-field': { motion: [fieldMotion], responsive: ['It fills the width of its form, on every screen.'] },
  'text-area': { motion: ['It grows line by line as people type, with no animation, so the text never jumps.'] },
  'number-input': { motion: ['The − and + buttons ease their colour on hover and press over the theme’s short duration.'] },
  'pin-input': { motion: [noMotion] },
  'month-grid': { motion: ['Days ease their background on hover and selection over the theme’s short duration; nothing slides.'] },
  chart: { responsive: ['It fills the width of its container and redraws when that changes, so it works in a card, a page or a phone.'] },
  'data-table': { motion: ['Hover colours and the row buttons fade in, and group arrows turn, over the theme’s short duration. With less motion asked for, they change at once.'] },
  'segmented-control': {},
  'switch-and-checkbox': { responsive: ['On touch screens the whole row grows to a 44px tap target. The look stays the same.'] },
};

/** The sections for one component page. */
export function behaviourOf(p: Preview): Behaviour {
  const out: Behaviour = { summary: [], a11y: [], motion: [], responsive: [] };
  for (const note of p.builtIn) out[classify(note)].push(note);
  const extra = EXTRA[p.slug] ?? {};
  for (const key of ['a11y', 'motion', 'responsive'] as const) {
    if (out[key].length === 0 && extra[key]) out[key].push(...extra[key]!);
  }
  return out;
}
