import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recommendationsFor, type Recommendation } from '@/lib/profile';
import type { FactorState } from '@/lib/risk';

/**
 * Floating "live insights" card.
 *
 * Surfaces the user's current top-2 weak points (highest-impact open
 * recommendations) as the flow progresses. The list mutates in real
 * time — every answer can promote a new top weakness, which keeps the
 * panel feeling alive and responsive.
 *
 * Only renders when there is at least one applicable recommendation
 * so we never show empty state during the very first interactions.
 */
export function LiveInsights({ state }: { state: FactorState }) {
  const top = useMemo(() => recommendationsFor(state).slice(0, 2), [state]);

  return (
    <div className="rounded-2xl border border-hairline bg-surface-1/50 p-4 backdrop-blur-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
          Live insights
        </span>
        <span className="font-mono text-[9.5px] tabular-nums text-ink-tertiary">
          updates per answer
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {top.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] text-ink-tertiary"
            >
              No critical weaknesses detected yet. Keep going to refine the picture.
            </motion.p>
          )}
          {top.map((rec) => (
            <InsightRow key={rec.factorId} rec={rec} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InsightRow({ rec }: { rec: Recommendation }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-lg border border-hairline bg-surface-2/40 px-3 py-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink">{rec.title}</span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-warning">
          −{rec.impact} pts
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-tertiary">
        {rec.detail}
      </p>
    </motion.div>
  );
}
