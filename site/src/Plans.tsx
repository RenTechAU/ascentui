// The three plans, as on the landing page. Used by the home page and the pricing page.
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRICES } from './content';

function Price({ plan }: { plan: { launch: number; launchSpots: number; regular: number } | null }) {
  if (plan == null) return <div className="plan-price tbc">Price to be set</div>;
  return (
    <>
      <div className="plan-price">
        ${plan.launch}
        <small>USD, once</small>
      </div>
      <div className="plan-launch">
        <Badge tone="success" size="sm">First {plan.launchSpots} buyers</Badge>
        <span>then ${plan.regular}</span>
      </div>
    </>
  );
}

export function Plans({
  onFree,
  onBuy,
  busy = null,
}: {
  onFree: () => void;
  onBuy: (plan: 'individual' | 'team') => void;
  /** The plan whose checkout is being started, if any. */
  busy?: 'individual' | 'team' | null;
}) {
  return (
    <div className="plans">
      <div className="plan">
        <div className="plan-name">Free</div>
        <div className="plan-price">$0</div>
        <p>24 components, the theme and the agent kit, MIT licensed. Includes the app shell and a data table.</p>
        <Button className="round" variant="secondary" onClick={onFree}>Browse the library</Button>
      </div>
      <div className="plan best">
        <div className="plan-name">Individual</div>
        <Price plan={PRICES.individual} />
        <p>Lifetime access to the power components and every Pro screen with its backend recipe, for one person. Everything added later is included.</p>
        <Button className="light" loading={busy === 'individual'} onClick={() => onBuy('individual')}>Get all-access</Button>
      </div>
      <div className="plan">
        <div className="plan-name">Team</div>
        <Price plan={PRICES.team} />
        <p>
          The same, for a team{PRICES.team ? ` of up to ${PRICES.team.seats}` : ''}. One-time payment, lifetime access.
        </p>
        <Button className="round" variant="secondary" loading={busy === 'team'} onClick={() => onBuy('team')}>Get team access</Button>
      </div>
    </div>
  );
}
