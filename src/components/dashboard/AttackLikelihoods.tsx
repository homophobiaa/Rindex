import { motion } from 'framer-motion';
import type { FactorState } from '@/lib/risk';
import { attackLikelihoods, type AttackLikelihood } from '@/lib/dashboard';

/**
 * Estimated likelihood for the six attack archetypes the app models.
 * Animated horizontal bars, sorted most-likely first, each annotated with
 * the live factors currently driving it up.
 */
export function AttackLikelihoods({ state }: { state: FactorState }) {
  const items = attackLikelihoods(state);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((a, i) => (
        <LikelihoodCard key={a.id} attack={a} index={i} />
      ))}
    </div>
  );
}

function LikelihoodCard({ attack, index }: { attack: AttackLikelihood; index: number }) {
  const pct = Math.round(attack.probability * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-hairline bg-surface-1/50 p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink">{attack.label}</span>
        <span className="font-mono text-[15px] tabular-nums" style={{ color: attack.color }}>
          {pct}%
        </span>
      </div>
      <p className="mt-0.5 text-[11.5px] leading-snug text-ink-tertiary">{attack.blurb}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: attack.color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {attack.drivers.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {attack.drivers.map((d) => (
            <span
              key={d}
              className="rounded-full border border-hairline bg-surface-2/50 px-2 py-0.5 text-[10px] text-ink-subtle"
            >
              {d}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10.5px] text-success">
          <span className="h-1 w-1 rounded-full bg-success" />
          No active drivers — well defended
        </div>
      )}
    </motion.div>
  );
}
