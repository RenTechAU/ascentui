import { ACTIONS_DISPLAY } from './actions-display';
import { DATA_OVERLAYS } from './data-overlays';
import { FORMS } from './forms';
import type { Preview } from './types';

export type { Preview } from './types';

/** Every component with a live preview, in catalog order. Later batches are added here. */
export const PREVIEWS: Preview[] = [...ACTIONS_DISPLAY, ...FORMS, ...DATA_OVERLAYS];

export const previewBySlug = (slug: string) => PREVIEWS.find((p) => p.slug === slug);
