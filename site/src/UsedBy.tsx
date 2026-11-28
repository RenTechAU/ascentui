// A slow rolling strip of customer logos under the hero. Hidden until CUSTOMERS has real, approved entries.
import { CUSTOMERS } from './content';

const PREVIEW: typeof CUSTOMERS = Array.from({ length: 8 }, (_, i) => ({ name: `Customer ${i + 1}` }));

export function UsedBy() {
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview-logos');
  const list = CUSTOMERS.length > 0 ? CUSTOMERS : preview ? PREVIEW : [];
  if (list.length === 0) return null;
  // Two copies side by side; the track moves by exactly one copy, so the loop has no seam.
  const copy = (hidden: boolean) => (
    <ul className="ub-set" aria-hidden={hidden || undefined}>
      {list.map((c) => (
        <li key={c.name}>
          {c.logo ? <img src={c.logo} alt={hidden ? '' : c.name} height={22} /> : <span>{c.name}</span>}
        </li>
      ))}
    </ul>
  );
  return (
    <section className="ub" aria-label="Used by">
      <p>Used by service businesses and the people who build for them</p>
      <div className="ub-view">
        <div className="ub-track">{copy(false)}{copy(true)}</div>
      </div>
    </section>
  );
}
