import { motion } from 'framer-motion';
import type { FactorState } from '@/lib/risk';
import { priorityRecommendations, DIFFICULTY_META } from '@/lib/dashboard';

/**
 * Ranked, actionable fixes. Ordered by impact-per-effort so the best
 * return-on-time move sits at the top. Each card carries the four things
 * the spec asks for: the action, the expected score reduction, the
 * difficulty, and why it matters.
 */
export function PriorityRecommendations({ state }: { state: FactorState }) {
  const recs = priorityRecommendations(state, 6);

  if (recs.length === 0) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/[0.06] px-5 py-6 text-center">
        <h4 className="text-[14px] font-medium text-ink">Nothing urgent to fix</h4>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] text-ink-subtle">
          Every modeled weakness is already closed. Re-run the profiler whenever you add a new
          account, device, or service to keep this current.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {recs.map((r, i) => {
        const diff = DIFFICULTY_META[r.difficulty];
        return (
          <motion.article
            key={r.factorId}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col rounded-2xl border border-hairline bg-surface-1/50 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 font-mono text-[12px] tabular-nums text-primary">
                  {i + 1}
                </span>
                <h4 className="text-[14px] font-medium leading-snug text-ink">{r.action}</h4>
              </div>
            </div>

            <p className="mt-2.5 flex-1 text-[12.5px] leading-relaxed text-ink-subtle">{r.why}</p>

            <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3">
              <Stat label="Score" value={`−${r.scoreReduction}`} color="#f04438" />
              <span className="h-7 w-px bg-hairline" />
              <Stat label="Effort" value={diff.label} color={diff.color} />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-tertiary">
        {label}
      </span>
      <span className="font-mono text-[13px] tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
