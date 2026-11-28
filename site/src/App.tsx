import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATALOG } from './catalog';
import { checkoutFromEnv } from './checkout';
import { COMPANY, REGISTRY_BASE } from './content';
import licence from './docs/licence.md?raw';
import { DOCS, registry } from './nav';
import { ComponentPage } from './pages/Component';
import { DesignSystem } from './pages/DesignSystem';
import { Docs } from './pages/Docs';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Licence } from './pages/Licence';
import { Pricing } from './pages/Pricing';
import { goTo, useRoute } from './router';
import { Footer } from './shell/Footer';
import { isMac, Palette, usePaletteShortcut } from './shell/Palette';
import { Logo, Shell, SkipLink, ThemeToggle } from './shell/Shell';

const checkout = checkoutFromEnv();

/** Home keeps its marketing layout. Its header leads into the rest of the site. */
function HomeHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="wrap nav" id="top">
      <a className="brand" href="#top">
        <Logo />
        AscentUI
      </a>
      <nav className="nav-links" aria-label="Pages">
        <a href="#library">Library</a>
        <a href="#docs">Docs</a>
        <a href="#design-system">Design system</a>
        <a href="#pricing">Pricing</a>
      </nav>
      <div className="nav-cta">
        <button type="button" className="nav-search" onClick={onSearch} aria-keyshortcuts={isMac() ? 'Meta+K' : 'Control+K'}>
          Search <kbd aria-hidden>{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <ThemeToggle />
        <Button className="light" size="sm" onClick={goTo('library')}>Browse library</Button>
      </div>
    </header>
  );
}

export function App() {
  const route = useRoute();
  const [palette, setPalette] = useState(false);
  const openPalette = useCallback(() => setPalette(true), []);
  usePaletteShortcut(useCallback(() => setPalette((o) => !o), []));

  const page = (
    <>
      {route.page === 'library' && <Library items={CATALOG} section={route.section} />}
      {route.page === 'component' && <ComponentPage slug={route.component} registry={registry} />}
      {route.page === 'docs' && <Docs pages={DOCS} current={route.doc} registryBase={REGISTRY_BASE} />}
      {route.page === 'ds' && <DesignSystem current={route.ds} />}
      {route.page === 'pricing' && <Pricing checkout={checkout} />}
      {route.page === 'licence' && <Licence source={licence} company={COMPANY} />}
    </>
  );

  return (
    <>
      <SkipLink />
      {route.page === 'home' ? (
        <>
          <HomeHeader onSearch={openPalette} />
          <Home />
          <div className="wrap">
            <Footer />
          </div>
        </>
      ) : (
        <Shell route={route} onSearch={openPalette}>{page}</Shell>
      )}
      <Palette open={palette} onOpenChange={setPalette} />
    </>
  );
}
