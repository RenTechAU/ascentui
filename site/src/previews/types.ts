import type { ComponentType } from 'react';

export interface PropRow { name: string; type: string; def?: string; desc: string }

/** Everything a component page shows. One entry per catalog component. */
export interface Preview {
  /** Matches the catalog slug, and the page address #c-<slug> */
  slug: string;
  name: string;
  group: string;
  description: string;
  /** Registry item names to install, e.g. ['button'] */
  install: string[];
  /** The component's source files, for the Code view */
  sources: { file: string; code: string }[];
  /** The live preview on the component page */
  Demo: ComponentType;
  /** A smaller preview for the library grid; the Demo is used if missing */
  Thumb?: ComponentType;
  usage: string;
  examples: { title: string; code: string }[];
  props: { component: string; rows: PropRow[] }[];
  when: string[];
  whenNot: string[];
  keyboard?: [string, string][];
  /** The care taken that a builder would not think to ask for, in plain words */
  builtIn: string[];
}
