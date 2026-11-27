import { Markdown } from '../md';

export function Licence({ source, company }: { source: string; company: string | null }) {
  return (
    <main>
      <div className="wrap page narrow">
        <p className="note">
          <strong>Draft, not yet legal text.</strong> This page describes the intended terms in plain words. It has not been
          reviewed by a lawyer and is not a binding licence. Licensor:{' '}
          {company ?? <span className="todo">company name to be set</span>}.
        </p>
        <Markdown source={source} />
      </div>
    </main>
  );
}
