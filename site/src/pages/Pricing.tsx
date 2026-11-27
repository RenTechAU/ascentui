import { useState } from 'react';
import type { CheckoutClient, PlanId } from '../checkout';
import { PRICING_FAQ, PRO_STATUS } from '../content';
import { Plans } from '../Plans';
import { goTo } from '../router';

export function Pricing({ checkout }: { checkout: CheckoutClient }) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const buy = async (plan: PlanId) => {
    setBusy(plan);
    setMessage(null);
    const result = await checkout.start(plan);
    setBusy(null);
    setMessage(result.message);
    if (result.url) window.location.assign(result.url);
  };

  return (
    <main>
      <section className="wrap sec page">
        <div className="sec-head">
          <h1>Pay once. Build as many as you like.</h1>
          <p>No subscription. Use it in your own projects and your clients'.</p>
          <p className="small">{PRO_STATUS}</p>
        </div>
        <Plans onFree={goTo('library')} onBuy={buy} busy={busy} />
        <p className="note" role="status">
          {message ?? (checkout.mode === 'mock'
            ? 'Mock mode: checkout is not connected yet. The buttons above take no payment.'
            : 'Payment is taken on a hosted checkout page. You do not need an account to pay.')}
        </p>
      </section>

      <div className="band">
        <section className="wrap sec">
          <div className="sec-head">
            <h2>Questions</h2>
          </div>
          <div className="parts faq">
            {PRICING_FAQ.map((f) => (
              <div className="part" key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.tbc ? <span className="todo">{f.a.replace(/\.$/, '').toLowerCase()}</span> : f.a}</p>
              </div>
            ))}
          </div>
          <p className="small">
            The full terms are on the <a href="#licence">licence page</a>, which is still a draft.
          </p>
        </section>
      </div>
    </main>
  );
}
