import { Markdown } from '../md';
import type { DocId } from '../router';

export interface DocPage { id: DocId; title: string; source: string }

export function Docs({ pages, current, registryBase }: { pages: DocPage[]; current: DocId; registryBase: string | null }) {
  const index = Math.max(0, pages.findIndex((p) => p.id === current));
  const page = pages[index];
  const prev = pages[index - 1];
  const next = pages[index + 1];
  return (
    <main>
      <div className="wrap docs page">
        <nav className="docs-nav" aria-label="Docs">
          {pages.map((p) => (
            <a key={p.id} href={`#docs-${p.id}`} aria-current={p.id === page.id ? 'page' : undefined}>{p.title}</a>
          ))}
        </nav>
        <article className="docs-body">
          {registryBase == null && page.source.includes('<your-domain>') && (
            <p className="note">
              <span className="todo">registry address to be set</span> The domain is not decided yet, so examples show{' '}
              <code>https://&lt;your-domain&gt;</code>.
            </p>
          )}
          <Markdown source={page.source} />
          <div className="docs-next">
            {prev ? <a href={`#docs-${prev.id}`}>← {prev.title}</a> : <span />}
            {next && <a href={`#docs-${next.id}`}>{next.title} →</a>}
          </div>
        </article>
      </div>
    </main>
  );
}
