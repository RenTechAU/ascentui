// Hash routing with plain `#name` anchors. No router dependency.
import { useEffect, useState } from 'react';

export type Page = 'home' | 'library' | 'docs' | 'pricing' | 'licence' | 'component' | 'ds';

export const DOC_IDS = ['introduction', 'install', 'theming', 'accessibility', 'agents', 'skills', 'loop', 'changelog'] as const;
export type DocId = (typeof DOC_IDS)[number];

export const DS_IDS = ['colors', 'typography', 'radius', 'shadows', 'spacing', 'motion', 'focus', 'layers'] as const;
export type DsId = (typeof DS_IDS)[number];

/** Library sections, as they appear in the address: #library-<section>. Each is a catalog layer. */
export const SECTION_IDS = ['components', 'screens', 'blocks', 'illustrations', 'motion', 'starter-apps', 'agent-kit', 'theme'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface Route {
  page: Page;
  /** Which docs page, when `page` is 'docs'. */
  doc: DocId;
  /** Which design-system page, when `page` is 'ds'. */
  ds: DsId;
  /** Which library section, when `page` is 'library'. null shows every section. */
  section: SectionId | null;
  /** Which component, when `page` is 'component': its catalog slug, from #c-<slug>. */
  component: string;
  /** An element on the home page to scroll to, e.g. `how`. */
  anchor: string | null;
}

export function parseHash(hash: string): Route {
  const name = hash.replace(/^#/, '').toLowerCase();
  const base: Route = { page: 'home', doc: 'introduction', ds: 'colors', section: null, component: '', anchor: null };
  if (name === 'library' || name === 'pricing' || name === 'licence') return { ...base, page: name };
  if (name === 'license') return { ...base, page: 'licence' };
  if (name === 'docs') return { ...base, page: 'docs' };
  if (name === 'design-system' || name === 'ds') return { ...base, page: 'ds' };
  if (name.startsWith('c-')) return { ...base, page: 'component', component: name.slice(2) };
  if (name.startsWith('docs-')) {
    const doc = DOC_IDS.find((d) => d === name.slice(5));
    return { ...base, page: 'docs', doc: doc ?? 'introduction' };
  }
  if (name.startsWith('ds-')) {
    const ds = DS_IDS.find((d) => d === name.slice(3));
    return { ...base, page: 'ds', ds: ds ?? 'colors' };
  }
  if (name.startsWith('library-')) {
    const section = SECTION_IDS.find((s) => s === name.slice(8));
    return { ...base, page: 'library', section: section ?? null };
  }
  if (name && name !== 'top') return { ...base, anchor: name };
  return base;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  // A new page starts at the top; a home-page anchor scrolls to its section.
  // A change of library section alone keeps the scroll position: it is a filter, not a new page.
  useEffect(() => {
    const el = route.anchor ? document.getElementById(route.anchor) : null;
    if (el) el.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route.page, route.doc, route.ds, route.component, route.anchor]);
  return route;
}

export const goTo = (name: string) => () => {
  window.location.hash = name;
};

/** Change the address without a page change, e.g. when a library filter is picked. */
export function replaceHash(name: string) {
  const next = `#${name}`;
  if (window.location.hash === next) return;
  try {
    history.replaceState(history.state, '', next);
    // Let the router (and the sidebar's current link) follow. A filter change does not scroll.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    // Some sandboxed frames refuse; the filter still works, only the address does not follow.
  }
}

/** Move keyboard focus to the page's heading after a navigation, so screen readers hear where they are. */
export function focusMain() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const main = document.getElementById('main');
      const target = main?.querySelector<HTMLElement>('h1') ?? main;
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }),
  );
}
