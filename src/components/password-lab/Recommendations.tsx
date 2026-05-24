import { motion } from 'framer-motion';
import type { AnalysisResult, Recommendation } from '@/lib/password/analyze';

export function Recommendations({ analysis }: { analysis: AnalysisResult }) {
  if (analysis.length === 0) return null;
  const recs = analysis.recommendations;

  return (
    <div className="panel-glass gradient-border p-6 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Recommendations</span>
          <h3 className="mt-1 text-card-title text-ink">
            {recs.length > 0
              ? 'How to strengthen this password'
              : 'No improvements suggested — this password is solid'}
          </h3>
        </div>
        {recs.length > 0 && (
          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[12px] text-primary">
            +{recs.reduce((a, r) => a + r.estimatedBitGain, 0).toFixed(1)} bits possible
          </span>
        )}
      </div>

      {recs.length > 0 && (
        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {recs.map((r, i) => (
            <RecCard key={r.id} rec={r} index={i} />
          ))}
        </ol>
      )}
    </div>
  );
}

function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  const tone = impactTone(rec.impact);
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative flex gap-3 rounded-lg border border-hairline-tertiary bg-surface-2/40 p-4"
    >
      <div
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[12px]"
        style={{ background: `${tone.color}1f`, color: tone.color }}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-body-sm font-medium text-ink">{rec.title}</div>
          <span
            className="rounded-md px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums"
            style={{ background: `${tone.color}14`, color: tone.color }}
          >
            +{rec.estimatedBitGain.toFixed(1)} b
          </span>
        </div>
        <p className="mt-1 text-caption text-ink-subtle">{rec.description}</p>
      </div>
    </motion.li>
  );
}

function impactTone(i: Recommendation['impact']) {
  if (i === 'high') return { color: '#5e6ad2' };
  if (i === 'medium') return { color: '#4cc2ff' };
  return { color: '#27a644' };
}
