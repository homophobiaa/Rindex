import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { chainFailureProbability, weakestLink } from '@/lib/risk';
import { useMotionTransition } from '@/lib/motion';

/**
 * Weakest-entry-point visualization.
 *
 * The math here — `1 − ∏(1 − pᵢ)` — is the probability that AT LEAST ONE
 * route succeeds. That describes independent alternative ways in, not a
 * sequential chain where every step must succeed (which would be `∏ pᵢ`).
 * The four routes below are therefore presented as separate doors into the
 * same account, which is what the formula actually models.
 */
const ROUTES = [
  { label: 'Guess the password', detail: 'Credential stuffing or brute force.' },
  { label: 'Take over the email', detail: 'Reset the password via a leaked recovery inbox.' },
  { label: 'Intercept the 2FA code', detail: 'SIM swap or an approved push notification.' },
  { label: 'Answer the security questions', detail: 'Details often public on social media.' },
];

export function WeakestLinkChain() {
  const [probs, setProbs] = useState<number[]>([0.15, 0.55, 0.35, 0.25]);

  const compound = useMemo(() => chainFailureProbability(probs), [probs]);
  const weakIdx = useMemo(() => weakestLink(probs), [probs]);
  const barTransition = useMotionTransition({ duration: 0.4, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="space-y-5">
      {/* Independent entry routes */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROUTES.map((s, i) => {
          const isWeak = i === weakIdx;
          const p = probs[i];
          const accent = isWeak ? '#f04438' : '#5e6ad2';
          return (
            <motion.div
              key={s.label}
              layout
              className={
                isWeak
                  ? 'relative rounded-xl border border-danger/40 bg-danger/5 p-3'
                  : 'relative rounded-xl border border-hairline bg-surface-2/50 p-3'
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-caption text-ink-tertiary">
                  Route {i + 1}
                </span>
                {isWeak && (
                  <span className="rounded-full border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-micro font-medium uppercase tracking-wide text-danger">
                    Easiest way in
                  </span>
                )}
              </div>

              <div className="mt-1.5 text-body-sm font-medium text-ink">{s.label}</div>
              <p className="mt-0.5 text-caption leading-snug text-ink-tertiary">
                {s.detail}
              </p>

              <div className="mt-3 flex items-baseline justify-between text-caption">
                <span className="text-ink-subtle">Chance it works</span>
                <span
                  className="font-mono tabular-nums"
                  style={{ color: accent }}
                >
                  {(p * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(p * 100)}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) / 100;
                  setProbs((prev) => prev.map((x, j) => (j === i ? v : x)));
                }}
                className="mt-1 w-full accent-primary"
                aria-label={`Chance the "${s.label}" route works, in percent`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Compound readout */}
      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-caption font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            Chance at least one route works
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-[22px] tabular-nums text-ink">
              {(compound * 100).toFixed(0)}%
            </span>
            <span className="font-mono text-caption text-ink-tertiary">= 1 − ∏(1 − pᵢ)</span>
          </div>
        </div>
        <div className="flex-1 sm:max-w-md">
          <div
            className="h-2 overflow-hidden rounded-full bg-surface-3"
            role="img"
            aria-label={`${(compound * 100).toFixed(0)} percent chance at least one route succeeds`}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-warning to-danger"
              animate={{ width: `${compound * 100}%` }}
              transition={barTransition}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-caption text-ink-tertiary">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <p className="text-body-sm leading-relaxed text-ink-subtle">
        Drag the sliders. Tightening an already-strong route barely moves the total —
        the easiest way in dominates the result. That is why fixing your worst habit
        beats improving a good one.
      </p>
    </div>
  );
}
