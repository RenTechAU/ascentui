// The footer under every page: live counts from the catalog, so they never go stale.
import { CATALOG, LAYERS } from '../catalog';
import { COMPANY } from '../content';
import { PREVIEWS } from '../previews';

const PLURAL: Record<string, [string, string]> = {
  theme: ['theme', 'themes'],
  component: ['component', 'components'],
  motion: ['motion effect', 'motion effects'],
  block: ['block', 'blocks'],
  screen: ['screen', 'screens'],
  illustration: ['illustration', 'illustrations'],
  starter: ['starter app', 'starter apps'],
  'agent-kit': ['agent kit', 'agent kits'],
};

export function catalogLine(): string {
  const order = ['component', 'screen', 'block', 'illustration', 'motion', 'starter', 'agent-kit', 'theme'];
  return LAYERS.slice()
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((l) => {
      const n = CATALOG.filter((i) => i.layer === l.id).length;
      return `${n} ${PLURAL[l.id][n === 1 ? 0 : 1]}`;
    })
    .join(' · ');
}

export function Footer() {
  const built = CATALOG.filter((i) => i.status !== 'planned').length;
  return (
    <footer className="foot">
      <p className="foot-counts">
        {catalogLine()}
        <span className="foot-built"> · {PREVIEWS.length} components live, {built} of {CATALOG.length} items built or part built</span>
      </p>
      <div className="foot-row">
        <nav className="foot-links" aria-label="Footer">
          <a href="#library">Library</a>
          <a href="#docs">Docs</a>
          <a href="#design-system">Design system</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#pricing">Pricing</a>
          <a href="#licence">Licence</a>
          <a href="./llms.txt">llms.txt</a>
        </nav>
        <span>{COMPANY ?? <span className="todo">company name to be set</span>}</span>
      </div>
    </footer>
  );
}
