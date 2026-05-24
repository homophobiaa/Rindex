import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { chainFailureProbability, weakestLink } from '@/lib/risk';

/**
 * Weakest-link visualization.
 *
 * Renders a 4-step attack chain as connected nodes. Each step has a
 * per-step success probability that the user can adjust. The compound
 * probability — `1 - Π(1 - p_i)` — is shown live, and the weakest link
 * is highlighted in red.
 *
 * The message: a chain is only as strong as its worst link, and tiny
 * weak spots dominate the overall risk.
 */
const STEPS = [
  { label: 'Password guess', detail: 'Credential stuffing or brute force.' },
  { label: 'Email takeover', detail: 'Reset password via leaked recovery email.' },
  { label: 'Social account', detail: 'Pivot to identity-bearing services.' },
  { label: 'Payment access', detail: 'Authorize transfers, change addresses.' },
];

export function WeakestLinkChain() {
  const [probs, setProbs] = useState<number[]>([0.15, 0.55, 0.35, 0.25]);

  const compound = useMemo(() => chainFailureProbability(probs), [probs]);
  const weakIdx = useMemo(() => weakestLink(probs), [probs]);

  return (
    <div className="space-y-5">
      {/* Chain */}
      <div className="grid gap-3 sm:grid-cols-4">
        {STEPS.map((s, i) => {
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
              {/* Connector arrow (not on first card) */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute -left-2 top-1/2 hidden h-px w-3 -translate-y-1/2 sm:block"
                  style={{ background: '#23252a' }}
                />
              )}

              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] text-ink-tertiary">
                  step {i + 1}
                </span>
                {isWeak && (
                  <span className="text-[9.5px] font-medium uppercase tracking-wider text-danger">
                    weakest
                  </span>
                )}
              </div>

              <div className="mt-1 text-[12.5px] font-medium text-ink">{s.label}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-tertiary">
                {s.detail}
              </p>

              <div className="mt-3 flex items-baseline justify-between text-[11px]">
                <span className="text-ink-subtle">P(success)</span>
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
                aria-label={`Probability for ${s.label}`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Compound readout */}
      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            Chain compromise probability
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-tertiary">
            1 − ∏(1 − pᵢ) ={' '}
            <span className="text-ink">{(compound * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex-1 sm:max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-warning to-danger"
              animate={{ width: `${compound * 100}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9.5px] text-ink-tertiary">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-ink-tertiary">
        Notice that lowering the smallest probability barely moves the
        total, while the weakest step alone almost determines the
        outcome. This is why attackers always look for the easiest door.
      </p>
    </div>
  );
}
