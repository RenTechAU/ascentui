import { Button } from '@/components/ui/button';
import { CATALOG } from './catalog';
import { checkoutFromEnv } from './checkout';
import { COMPANY, REGISTRY_BASE } from './content';
import agents from './docs/agents.md?raw';
import install from './docs/install.md?raw';
import introduction from './docs/introduction.md?raw';
import licence from './docs/licence.md?raw';
import loop from './docs/loop.md?raw';
import theming from './docs/theming.md?raw';
import { Docs, type DocPage } from './pages/Docs';
import { Home } from './pages/Home';
import { ComponentPage } from './pages/Component';
import { Library } from './pages/Library';
import { Licence } from './pages/Licence';
import { Pricing } from './pages/Pricing';
import { goTo, useRoute, type Page } from './router';

function Logo() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 18 L11 4 L19 18" stroke="var(--ink)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M7.5 18 L11 12 L14.5 18" stroke="var(--muted)" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

// Examples in the docs use the registry address, or a placeholder until the domain is decided.
const registry = REGISTRY_BASE ?? 'https://<your-domain>';
const fill = (source: string) => source.replaceAll('{{REGISTRY}}', registry);

const DOCS: DocPage[] = [
  { id: 'introduction', title: 'Introduction', source: fill(introduction) },
  { id: 'install', title: 'Installation', source: fill(install) },
  { id: 'theming', title: 'Theming', source: fill(theming) },
  { id: 'agents', title: 'Using with agents', source: fill(agents) },
  { id: 'loop', title: 'The loop', source: fill(loop) },
];

const NAV: { page: Page; href: string; label: string }[] = [
  { page: 'library', href: '#library', label: 'Library' },
  { page: 'docs', href: '#docs', label: 'Docs' },
  { page: 'pricing', href: '#pricing', label: 'Pricing' },
];

const checkout = checkoutFromEnv();

export function App() {
  const route = useRoute();
  return (
    <>
      <header className="wrap nav" id="top">
        <a className="brand" href="#top">
          <Logo />
          AscentUI
        </a>
        <nav className="nav-links" aria-label="Pages">
          {NAV.map((n) => (
            <a key={n.page} href={n.href} aria-current={route.page === n.page || (n.page === 'library' && route.page === 'component') ? 'page' : undefined}>{n.label}</a>
          ))}
        </nav>
        <div className="nav-cta">
          <Button className="light" size="sm" onClick={goTo('library')}>Browse library</Button>
        </div>
      </header>

      {route.page === 'home' && <Home />}
      {route.page === 'library' && <Library items={CATALOG} />}
      {route.page === 'component' && <ComponentPage slug={route.component} registry={registry} />}
      {route.page === 'docs' && <Docs pages={DOCS} current={route.doc} registryBase={REGISTRY_BASE} />}
      {route.page === 'pricing' && <Pricing checkout={checkout} />}
      {route.page === 'licence' && <Licence source={licence} company={COMPANY} />}

      <footer className="wrap foot">
        <span>AscentUI. Business blocks for people building their own platform.</span>
        <nav className="foot-links" aria-label="Footer">
          <a href="#library">Library</a>
          <a href="#docs">Docs</a>
          <a href="#pricing">Pricing</a>
          <a href="#licence">Licence</a>
        </nav>
        <span>{COMPANY ?? <span className="todo">company name to be set</span>}</span>
      </footer>
    </>
  );
}
