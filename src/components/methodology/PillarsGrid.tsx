import { motion } from 'framer-motion';
import { PILLARS } from '@/lib/risk';
import { useReduceMotion } from '@/lib/reduce-motion';

/** Heaviest pillar defines full-width, so bars are comparable to each other. */
const MAX_WEIGHT = Math.max(...PILLARS.map((p) => p.weight));

/**
 * Visual grid of the six scoring pillars.
 *
 * Each card shows:
 *   • pillar accent + label + one-line blurb
 *   • animated weight bar (relative contribution to the composite)
 *   • a list of what counts toward that pillar
 *   • a short "why it matters" rationale
 *
 * Weights come from `PILLARS` so the same numbers drive the math and
 * the visualization — there is no second source of truth.
 */
export function PillarsGrid() {
  const reduceMotion = useReduceMotion();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PILLARS.map((p, i) => (
        <motion.article
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="group relative overflow-hidden rounded-xl border border-hairline bg-surface-1/70 p-4 transition-colors hover:border-hairline-strong"
        >
          {/* Accent strip */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)` }}
          />

          <div className="flex items-baseline justify-between">
            <h3 className="text-[14px] font-medium text-ink">{p.label}</h3>
            <span
              className="font-mono text-micro tabular-nums"
              style={{ color: p.accent }}
            >
              {Math.round(p.weight * 100)}%
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-subtle">{p.blurb}</p>

          {/* Weight bar — scaled against the heaviest pillar so the bars
              compare to one another. Full width = the 25% maximum. */}
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3"
            role="img"
            aria-label={`Weight ${Math.round(p.weight * 100)} percent of the composite score`}
          >
            <motion.div
              initial={{ width: reduceMotion ? `${(p.weight / MAX_WEIGHT) * 100}%` : 0 }}
              whileInView={{ width: `${(p.weight / MAX_WEIGHT) * 100}%` }}
              viewport={{ once: true }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.9, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }
              }
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${p.accent}, ${p.accent}80)` }}
            />
          </div>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.measures.map((m) => (
              <li
                key={m}
                className="rounded-md border border-hairline bg-surface-2/50 px-1.5 py-0.5 text-micro text-ink-muted"
              >
                {m}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11.5px] leading-snug text-ink-tertiary">
            {p.rationale}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
