// Hash routing with plain `#name` anchors. No router dependency.
import { useEffect, useState } from 'react';

export type Page = 'home' | 'library' | 'docs' | 'pricing' | 'licence' | 'component';

export const DOC_IDS = ['introduction', 'install', 'theming', 'agents', 'loop'] as const;
export type DocId = (typeof DOC_IDS)[number];

export interface Route {
  page: Page;
  /** Which docs page, when `page` is 'docs'. */
  doc: DocId;
  /** Which component, when `page` is 'component': its catalog slug, from #c-<slug>. */
  component: string;
  /** An element on the page to scroll to, e.g. `how` on the home page. */
  anchor: string | null;
}

export function parseHash(hash: string): Route {
  const name = hash.replace(/^#/, '').toLowerCase();
  const base: Route = { page: 'home', doc: 'introduction', component: '', anchor: null };
  if (name === 'library' || name === 'pricing' || name === 'licence') return { ...base, page: name };
  if (name === 'license') return { ...base, page: 'licence' };
  if (name === 'docs') return { ...base, page: 'docs' };
  if (name.startsWith('c-')) return { ...base, page: 'component', component: name.slice(2) };
  if (name.startsWith('docs-')) {
    const doc = DOC_IDS.find((d) => d === name.slice(5));
    return { ...base, page: 'docs', doc: doc ?? 'introduction' };
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
  useEffect(() => {
    const el = route.anchor ? document.getElementById(route.anchor) : null;
    if (el) el.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route.page, route.doc, route.component, route.anchor]);
  return route;
}

export const goTo = (name: string) => () => {
  window.location.hash = name;
};
