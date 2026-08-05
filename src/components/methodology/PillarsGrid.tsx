import { motion } from 'framer-motion';
import { PILLARS } from '@/lib/risk';
import { PILLAR_MATH, MAX_PILLAR_WEIGHT, WEIGHT_SUM } from '@/lib/methodology/facts';
import { useReduceMotion } from '@/lib/reduce-motion';

/**
 * The six pillars and what each one is worth.
 *
 * Bar length is scaled against the heaviest pillar so the bars compare to
 * each other honestly — full width means "the 25% maximum", not "100%".
 * Every number (weight, factor counts, span) is read from the engine.
 */
export function PillarsGrid() {
  const reduceMotion = useReduceMotion();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p, i) => {
          const math = PILLAR_MATH.find((m) => m.id === p.id)!;
          const barPct = (p.weight / MAX_PILLAR_WEIGHT) * 100;
          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }
              }
              className="group relative overflow-hidden rounded-xl border border-hairline bg-surface-1/70 p-4 transition-colors hover:border-hairline-strong"
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`,
                }}
                aria-hidden
              />

              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-body-sm font-medium text-ink">{p.label}</h3>
                <span
                  className="font-mono text-caption tabular-nums"
                  style={{ color: p.accent }}
                >
                  {Math.round(p.weight * 100)}%
                </span>
              </div>
              <p className="mt-1 text-caption text-ink-subtle">{p.blurb}</p>

              <div
                className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3"
                role="img"
                aria-label={`Weight ${Math.round(p.weight * 100)} percent of the composite score`}
              >
                <motion.div
                  initial={{ width: reduceMotion ? `${barPct}%` : 0 }}
                  whileInView={{ width: `${barPct}%` }}
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

              {/* Real per-pillar math, straight from the factor table */}
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-micro">
                <Stat label={`${math.threatCount} threats`} />
                <Stat label={`${math.protectiveCount} protective`} />
                <Stat label={`span ${math.span}`} />
              </div>

              <p className="mt-3 text-caption leading-snug text-ink-tertiary">{p.rationale}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-2.5">
        <p className="text-caption text-ink-tertiary">
          Bars are scaled against the heaviest pillar, so full width means{' '}
          {Math.round(MAX_PILLAR_WEIGHT * 100)}% — not 100%.
        </p>
        <span className="font-mono text-caption tabular-nums text-ink-subtle">
          weights sum = {WEIGHT_SUM.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <span className="rounded border border-hairline bg-surface-2/50 px-1.5 py-0.5 text-ink-tertiary">
      {label}
    </span>
  );
}
