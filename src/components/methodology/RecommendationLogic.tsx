import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FACTORS, compositeScore } from '@/lib/risk';
import type { FactorState } from '@/lib/risk';
import { priorityRecommendations, riskTimeline } from '@/lib/dashboard';
import { useMotionTransition } from '@/lib/motion';

/**
 * How the fix list is ordered, demonstrated on a fixed sample profile.
 *
 * Runs the real `priorityRecommendations` and `riskTimeline` so the ranking
 * shown here is the ranking the dashboard produces — including the
 * difficulty penalty, which is the part people assume is arbitrary.
 */

/** A deliberately messy but realistic profile, fixed so the demo is stable. */
function sampleState(): FactorState {
  const s: FactorState = {};
  for (const f of FACTORS) s[f.id] = false;
  s['pw-reuse'] = true;
  s['mfa-none'] = true;
  s['rec-weak-email'] = true;
  s['exp-public-email'] = true;
  s['bhv-phishing'] = true;
  return s;
}

export function RecommendationLogic() {
  const state = useMemo(sampleState, []);
  const recs = useMemo(() => priorityRecommendations(state, 4), [state]);
  const timeline = useMemo(() => riskTimeline(state, 4), [state]);
  const transition = useMotionTransition({ duration: 0.35, ease: [0.16, 1, 0.3, 1] });
  const start = compositeScore(state);
  const end = timeline[timeline.length - 1]?.score ?? start;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-surface-1/60 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-body-lg font-medium text-ink">Ranked by payoff, not by alarm</h3>
          <span className="rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-micro text-ink-tertiary">
            Live output · sample profile
          </span>
        </div>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Every unfixed weakness gets scored twice: how many points it would shed, and how
          annoying it is to actually do. The list below is the real engine running on a made-up
          profile that reuses passwords, has no MFA, a weak recovery inbox and a public email.
        </p>

        <div className="mt-3.5 space-y-2">
          {recs.map((r, i) => (
            <motion.div
              key={r.factorId}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...transition, delay: i * 0.05 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2.5"
            >
              <span className="font-mono text-caption tabular-nums text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 text-body-sm text-ink">{r.action}</span>
              <span className="rounded-full border border-hairline bg-surface-3 px-2 py-0.5 text-micro text-ink-subtle">
                {r.difficulty}
              </span>
              <span className="font-mono text-caption tabular-nums text-danger">
                −{r.scoreReduction} pts
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-hairline bg-surface-2/50 p-3">
          <div className="font-mono text-caption text-ink-muted">
            <span className="text-ink-subtle">rank score</span> = points saved ÷ (1 + difficulty
            × 0.4)
          </div>
          <p className="mt-1.5 text-caption leading-relaxed text-ink-tertiary">
            The divisor is why a big-but-painful fix can sit below a small-but-trivial one.
            Advice you will not follow saves zero points, so effort is priced in deliberately.
          </p>
        </div>
      </div>

      {/* Projection */}
      <div className="rounded-xl border border-hairline bg-surface-1/60 p-4">
        <h3 className="text-body-lg font-medium text-ink">
          &ldquo;Projected score&rdquo; means what-if, not forecast
        </h3>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          The dashboard shows where the score would land after each fix. That number is produced
          by flipping the relevant answer and re-running the same arithmetic — nothing more. It
          is a recalculation of a hypothetical, not a prediction about your future.
        </p>

        <div className="mt-3.5 flex flex-wrap items-stretch gap-2">
          {timeline.map((s, i) => (
            <div key={`${s.factorId ?? 'start'}-${i}`} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-ink-tertiary" aria-hidden>
                  →
                </span>
              )}
              <div className="flex w-[124px] flex-col rounded-lg border border-hairline bg-surface-2/50 px-3 py-2 text-center">
                <div className="font-mono text-[18px] tabular-nums text-ink">{s.score}</div>
                {/* Wraps rather than truncating — a clipped action label is
                    useless, and these are short enough to fit two lines. */}
                <div className="mt-0.5 text-micro leading-snug text-ink-tertiary">
                  {i === 0 ? 'as answered' : s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-caption leading-relaxed text-ink-tertiary">
          Applying all four would move this sample profile from{' '}
          <strong className="text-ink">{start}</strong> to{' '}
          <strong className="text-ink">{end}</strong>. RIndex has no way to check whether you did
          any of it — there is nothing to verify against. Re-run the assessment and answer
          differently, and the number changes. That is the only mechanism.
        </p>
      </div>
    </div>
  );
}
