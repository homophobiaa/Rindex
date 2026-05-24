import { AnimatePresence, motion } from 'framer-motion';
import type { AnalysisResult, PatternFinding } from '@/lib/password/analyze';

export function PatternFindings({ analysis }: { analysis: AnalysisResult }) {
  const empty = analysis.patterns.length === 0 && analysis.length > 0;

  return (
    <div className="panel p-6 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Pattern detection</span>
          <h3 className="mt-1 text-card-title text-ink">
            What attackers would notice
          </h3>
        </div>
        <span className="rounded-md border border-hairline-tertiary bg-surface-2 px-2 py-1 font-mono text-[12px] text-ink-muted">
          {analysis.patterns.length} finding{analysis.patterns.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-5">
        <AnimatePresence mode="popLayout">
          {empty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-lg border border-success/25 bg-success/5 p-4"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-success/15 text-success">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <div className="text-body-sm font-medium text-ink">No weak patterns detected</div>
                <div className="text-caption text-ink-subtle">
                  Your password resists every heuristic in our detection suite.
                </div>
              </div>
            </motion.div>
          )}

          {!empty && analysis.patterns.length === 0 && (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-dashed border-hairline-tertiary bg-surface-2/40 p-6 text-center text-caption text-ink-tertiary"
            >
              Type a password to see live pattern detection.
            </motion.div>
          )}

          {analysis.patterns.length > 0 && (
            <motion.ul
              key="findings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {analysis.patterns.map((p, i) => (
                <FindingCard key={p.id} finding={p} index={i} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: PatternFinding; index: number }) {
  const tone = severityTone(finding.severity);
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-lg border bg-surface-2/40 p-4"
      style={{ borderColor: `${tone.color}33` }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tone.color }}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="text-body-sm font-medium text-ink">{finding.label}</div>
          <p className="mt-1 text-caption text-ink-subtle">{finding.detail}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider"
            style={{ background: `${tone.color}1f`, color: tone.color }}
          >
            {finding.severity}
          </span>
          <span className="font-mono text-[10.5px] text-ink-tertiary">
            −{finding.penaltyBits.toFixed(1)} bits
          </span>
        </div>
      </div>
    </motion.li>
  );
}

function severityTone(s: PatternFinding['severity']) {
  if (s === 'high') return { color: '#f04438' };
  if (s === 'medium') return { color: '#f79009' };
  return { color: '#4cc2ff' };
}
