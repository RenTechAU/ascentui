import { useMemo } from 'react';
import { Toc } from '../components/Toc';
import { headings, Markdown } from '../md';
import type { DocPage } from '../nav';
import type { DocId } from '../router';

export function Docs({ pages, current, registryBase }: { pages: DocPage[]; current: DocId; registryBase: string | null }) {
  const index = Math.max(0, pages.findIndex((p) => p.id === current));
  const page = pages[index];
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const toc = useMemo(() => headings(page.source), [page.source]);
  return (
    <main id="main">
      <div className="wrap docs page">
        <div className="with-toc">
          <article className="docs-body" key={page.id}>
            <nav className="crumbs" aria-label="Breadcrumb">
              <a href="#docs">Docs</a> <span aria-hidden>/</span> <span aria-current="page">{page.title}</span>
            </nav>
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
          <Toc key={`toc-${page.id}`} items={toc} />
        </div>
      </div>
    </main>
  );
}
