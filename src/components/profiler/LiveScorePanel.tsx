import { motion, AnimatePresence } from 'framer-motion';
import {
  attackProbability,
  compositeScore,
  pillarBreakdown,
  riskBand,
  riskBandColor,
  riskBandLabel,
  type FactorState,
} from '@/lib/risk';
import { posture } from '@/lib/profile';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Sticky live-score side panel.
 *
 * Always-visible read-out of:
 *   • current RiskIndex (animated)
 *   • posture classification (Highly Exposed → Enterprise-Grade)
 *   • attacker-success probability
 *   • per-pillar bars showing weakest pillar at a glance
 *
 * Reads from the shared `@/lib/risk` engine — the same numbers that
 * power the Methodology page and the final dashboard.
 */
export function LiveScorePanel({ state }: { state: FactorState }) {
  const score = compositeScore(state);
  const band = riskBand(score);
  const accent = riskBandColor(band);
  const post = posture(score);
  const attackP = attackProbability(score);
  const breakdown = pillarBreakdown(state);
  const weakest = [...breakdown].sort((a, b) => b.score - a.score)[0];

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <motion.div
        layout
        className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-1/70 p-5 backdrop-blur-sm"
      >
        {/* Top accent strip — colored by current band */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        />

        <div className="flex items-baseline justify-between">
          <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            Live RiskIndex
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={band}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="rounded-full px-2 py-0.5 text-micro font-medium"
              style={{
                color: accent,
                background: `${accent}1a`,
                border: `1px solid ${accent}33`,
              }}
            >
              {riskBandLabel(band)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Score */}
        <div className="mt-3 flex items-baseline gap-1">
          <AnimatedNumber
            value={score}
            decimals={0}
            duration={0.55}
            className="text-[52px] font-semibold tabular-nums leading-none"
          />
          <span className="text-[14px] text-ink-tertiary">/100</span>
        </div>

        {/* Posture line */}
        <AnimatePresence mode="wait">
          <motion.p
            key={post.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mt-1 text-[12.5px] font-medium"
            style={{ color: post.accent }}
          >
            {post.label}
          </motion.p>
        </AnimatePresence>

        {/* Score bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Attack probability */}
        <div className="mt-4 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2">
          <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Attack-success probability
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="font-mono text-[18px] tabular-nums"
              style={{ color: accent }}
            >
              {Math.round(attackP * 100)}%
            </span>
            <span className="text-micro text-ink-tertiary">
              against your current posture
            </span>
          </div>
        </div>

        {/* Weakest pillar highlight */}
        {weakest && (
          <div className="mt-4">
            <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
              Currently weakest
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[12.5px] text-ink">{weakest.pillar.label}</span>
              <span
                className="font-mono text-[11px] tabular-nums"
                style={{ color: weakest.pillar.accent }}
              >
                {Math.round(weakest.score)}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: weakest.pillar.accent }}
                animate={{ width: `${weakest.score}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        {/* All pillars condensed */}
        <div className="mt-4 space-y-1.5">
          <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Per-pillar
          </div>
          {breakdown.map((b) => (
            <div key={b.pillar.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-micro text-ink-muted">
                {b.pillar.label}
              </span>
              <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: b.pillar.accent }}
                  animate={{ width: `${b.score}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="w-6 text-right font-mono text-micro tabular-nums text-ink-tertiary">
                {Math.round(b.score)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </aside>
  );
}
