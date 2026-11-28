// The app-shell layout every page except Home sits in: a left sidebar (brand, search, site sections,
// every component) and a top bar (sidebar toggle, site theme, Get Pro). On narrow screens the
// sidebar becomes a drawer behind a menu button.
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { componentGroups, DOCS, DS_PAGES } from '../nav';
import { usePref, useSiteTheme } from '../prefs';
import { focusMain, goTo, type Route } from '../router';
import { Footer } from './Footer';
import { isMac } from './Palette';

export function Logo() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 18 L11 4 L19 18" stroke="var(--ink)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M7.5 18 L11 12 L14.5 18" stroke="var(--muted)" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

const Svg = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICON = {
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  panel: 'M4 4h16v16H4zM9 4v16',
  close: 'M6 6l12 12M18 6L6 18',
  sun: 'M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  chevron: 'M9 6l6 6-6 6',
  pro: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
};

/** The small star that marks a Pro item. */
export const ProMark = () => (
  <span className="pro-mark" title="Pro">
    <Svg d={ICON.pro} size={12} />
    <span className="vh">Pro</span>
  </span>
);

/** Matches the CSS breakpoint where the sidebar turns into a drawer. */
const NARROW = '(max-width: 899px)';
function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

function Disclosure({ label, open, onToggle, current, children }: { label: string; open: boolean; onToggle: () => void; current: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <li>
      <button type="button" className="sb-link sb-parent" aria-expanded={open} aria-controls={id} data-current={current || undefined} onClick={onToggle}>
        <span>{label}</span>
        <span className="sb-chev" aria-hidden><Svg d={ICON.chevron} size={14} /></span>
      </button>
      <ul id={id} className="sb-sub" hidden={!open}>{children}</ul>
    </li>
  );
}

function SidebarContent({ route, onSearch, onNavigate, onClose }: { route: Route; onSearch: () => void; onNavigate: () => void; onClose?: () => void }) {
  const [docsOpen, setDocsOpen] = useState(route.page === 'docs');
  const [dsOpen, setDsOpen] = useState(route.page === 'ds');
  // Entering a section opens it; leaving does not close it, so the sidebar does not jump around.
  useEffect(() => { if (route.page === 'docs') setDocsOpen(true); }, [route.page]);
  useEffect(() => { if (route.page === 'ds') setDsOpen(true); }, [route.page]);

  const groups = componentGroups();
  const all = groups.flatMap((g) => g.items);
  const live = all.filter((i) => i.live).length;
  const here = (yes: boolean) => (yes ? 'page' : undefined);

  return (
    <>
      <div className="sb-top">
        <a className="brand" href="#top" onClick={onNavigate}>
          <Logo />
          AscentUI
        </a>
        {onClose && (
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={onClose}>
            <Svg d={ICON.close} />
          </button>
        )}
      </div>
      <button type="button" className="sb-search" onClick={onSearch} aria-keyshortcuts={isMac() ? 'Meta+K' : 'Control+K'}>
        <Svg d={ICON.search} size={14} />
        <span>Search</span>
        <kbd aria-hidden>{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <nav className="sb-nav" aria-label="Site">
        <ul className="sb-list">
          <li>
            <a className="sb-link" href="#library" aria-current={here(route.page === 'library' && route.section === null)} onClick={onNavigate}>Library</a>
          </li>
          <Disclosure label="Docs" open={docsOpen} onToggle={() => setDocsOpen((o) => !o)} current={route.page === 'docs'}>
            {DOCS.map((d) => (
              <li key={d.id}>
                <a className="sb-link" href={`#docs-${d.id}`} aria-current={here(route.page === 'docs' && route.doc === d.id)} onClick={onNavigate}>{d.title}</a>
              </li>
            ))}
          </Disclosure>
          <Disclosure label="Design system" open={dsOpen} onToggle={() => setDsOpen((o) => !o)} current={route.page === 'ds'}>
            {DS_PAGES.map((d) => (
              <li key={d.id}>
                <a className="sb-link" href={`#ds-${d.id}`} aria-current={here(route.page === 'ds' && route.ds === d.id)} onClick={onNavigate}>{d.title}</a>
              </li>
            ))}
          </Disclosure>
          <li>
            <a className="sb-link" href="#pricing" aria-current={here(route.page === 'pricing')} onClick={onNavigate}>Pricing</a>
          </li>
        </ul>
        <div className="sb-comps">
          <h2 className="sb-heading">
            <a href="#library-components" onClick={onNavigate} aria-current={here(route.page === 'library' && route.section === 'components')}>Components</a>
            <span className="sb-count" aria-label={`${live} of ${all.length} built`}>{live}/{all.length}</span>
          </h2>
          {groups.map((g) => (
            <div key={g.group} className="sb-group">
              <h3 className="sb-group-head">{g.group}</h3>
              <ul className="sb-list">
                {g.items.map((c) =>
                  c.live ? (
                    <li key={c.slug}>
                      <a className="sb-link" href={`#c-${c.slug}`} aria-current={here(route.page === 'component' && route.component === c.slug)} onClick={onNavigate}>
                        <span>{c.name}</span>
                        {c.tier === 'pro' && <ProMark />}
                      </a>
                    </li>
                  ) : (
                    <li key={c.slug}>
                      <span className="sb-link sb-soon">
                        <span>{c.name}</span>
                        <span className="soon">Soon</span>
                        {c.tier === 'pro' && <ProMark />}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

/** The light and dark switch for the site itself. Component previews keep their own switch. */
export function ThemeToggle() {
  const [theme, setTheme] = useSiteTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="icon-btn" aria-label={`Switch the site to ${next} theme`} title={`Switch to ${next} theme`} onClick={() => setTheme(next)}>
      <Svg d={theme === 'dark' ? ICON.sun : ICON.moon} />
    </button>
  );
}

export function Shell({ route, onSearch, children }: { route: Route; onSearch: () => void; children: ReactNode }) {
  const narrow = useNarrow();
  const [collapsed, setCollapsed] = usePref<'open' | 'closed'>('asc-site-sidebar', 'open', ['open', 'closed']);
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const navigating = useRef(false);

  // The phone drawer is the browser's own modal dialog: the page behind is out of reach, and
  // Escape closes it. Focus goes to the close button inside, and back to the menu button after.
  useEffect(() => {
    const d = drawerRef.current;
    if (!d) return;
    if (drawer && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>('.sb-top .icon-btn')?.focus();
    } else if (!drawer && d.open) d.close();
  }, [drawer]);
  useEffect(() => { if (!narrow) setDrawer(false); }, [narrow]);
  useEffect(() => {
    const d = drawerRef.current;
    if (!d) return;
    const onClose = () => {
      setDrawer(false);
      if (navigating.current) focusMain();
      else menuBtn.current?.focus();
      navigating.current = false;
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, [narrow]);

  const closeAfterNav = useCallback(() => {
    navigating.current = true;
    // After the link has done its work, so the click is not lost when the drawer empties.
    setTimeout(() => setDrawer(false), 0);
  }, []);
  const searchFromDrawer = useCallback(() => {
    setDrawer(false);
    // Let the drawer give focus back before the palette takes it.
    setTimeout(onSearch, 0);
  }, [onSearch]);

  const sidebarOpen = !narrow && collapsed === 'open';

  return (
    <div className="shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      {!narrow && (
        <aside className="sb" id="sidebar" aria-label="Sidebar" hidden={!sidebarOpen}>
          <SidebarContent route={route} onSearch={onSearch} onNavigate={() => undefined} />
        </aside>
      )}
      {narrow && (
        <dialog
          ref={drawerRef}
          className="sb sb-drawer"
          aria-label="Menu"
          onClick={(e) => e.target === e.currentTarget && setDrawer(false)}
        >
          {drawer && <SidebarContent route={route} onSearch={searchFromDrawer} onNavigate={closeAfterNav} onClose={() => setDrawer(false)} />}
        </dialog>
      )}

      <div className="content">
        <header className="topbar">
          {narrow ? (
            <>
              <button ref={menuBtn} type="button" className="icon-btn" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={drawer} onClick={() => setDrawer(true)}>
                <Svg d={ICON.menu} />
              </button>
              <a className="brand brand-sm" href="#top">
                <Logo />
                AscentUI
              </a>
              <button type="button" className="icon-btn" aria-label="Search" onClick={onSearch}>
                <Svg d={ICON.search} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="icon-btn"
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              onClick={() => setCollapsed(sidebarOpen ? 'closed' : 'open')}
            >
              <Svg d={ICON.panel} />
            </button>
          )}
          <div className="topbar-end">
            <ThemeToggle />
            <Button className="light" size="sm" onClick={goTo('pricing')}>Get Pro</Button>
          </div>
        </header>
        <div className="content-body">{children}</div>
        <Footer />
      </div>
    </div>
  );
}

/** The first thing a keyboard reaches: jump past the sidebar to the page itself. */
export function SkipLink() {
  return (
    <a
      className="skip"
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('main');
        if (!main) return;
        main.setAttribute('tabindex', '-1');
        main.focus();
      }}
    >
      Skip to content
    </a>
  );
}
