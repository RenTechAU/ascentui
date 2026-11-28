import type { DsId } from '../router';

export function DesignSystem({ current }: { current: DsId }) {
  return (
    <main id="main">
      <section className="wrap sec page"><h1>{current}</h1></section>
    </main>
  );
}
