import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { goTo } from '../router';
import { progress, ROADMAP, STAGE_LABEL } from '../roadmap';

const TONE = { now: 'success', next: 'info', later: 'neutral', future: 'purple' } as const;

export function Roadmap() {
  return (
    <main id="main">
      <section className="wrap sec page">
        <div className="sec-head">
          <h1>Roadmap</h1>
          <p>
            What is built, what comes next, and where AscentUI is heading. Every lifetime licence includes phases 1 to 5 as
            they ship. The first 100 buyers also get the full business suite for life, with no further payment.
          </p>
          <p className="small">Dates are targets and may move. Built counts update as each item ships.</p>
        </div>

        <ol className="rm">
          {ROADMAP.map((s) => {
            const p = s.phase ? progress(s.phase) : null;
            return (
              <li key={s.id} className="rm-step" data-stage={s.stage}>
                <div className="rm-dot" aria-hidden />
                <div className="rm-body">
                  <div className="rm-head">
                    <Badge tone={TONE[s.stage]}>{STAGE_LABEL[s.stage]}</Badge>
                    <span className="rm-target">{s.target}</span>
                    {p && (
                      <span className="rm-count">
                        {p.built} of {p.total} built · {p.free} free · {p.pro} Pro
                      </span>
                    )}
                  </div>
                  <h2>{s.phase ? `${s.phase}. ` : ''}{s.title}</h2>
                  {s.stage === 'future' && (
                    <p className="rm-note">Included for life for the first 100 buyers. Priced separately for everyone after.</p>
                  )}
                  <p>{s.summary}</p>
                  {p && p.total > 0 && (
                    <div className="rm-bar" role="img" aria-label={`${p.built} of ${p.total} built`}>
                      <span style={{ width: `${Math.round((p.built / p.total) * 100)}%` }} />
                    </div>
                  )}
                  <ul>{s.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rm-cta">
          <p>Buy once: phases 1 to 5 are yours as they ship. Be one of the first 100 and the full suite is too.</p>
          <Button className="light" onClick={goTo('pricing')}>See pricing</Button>
          <Button className="round" variant="secondary" onClick={goTo('library')}>Browse what is built</Button>
        </div>
      </section>
    </main>
  );
}
