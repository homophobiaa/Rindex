import { motion } from 'framer-motion';
import { useMotionTransition } from '@/lib/motion';
import { CLASSIFICATION_META, type AnalysisResult } from '@/lib/password/analyze';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Hero score panel — animated circular gauge + classification + key stats.
 */
export function ScorePanel({ analysis }: { analysis: AnalysisResult }) {
  const meta = CLASSIFICATION_META[analysis.classification];
  const progress = analysis.score / 100;
  const r = 78;
  const c = 2 * Math.PI * r;
  const sweep = useMotionTransition({ duration: 1.4, ease: [0.16, 1, 0.3, 1] });
  const badgeIn = useMotionTransition({ duration: 0.4 });

  return (
    <div className="panel-glass gradient-border relative overflow-hidden p-6 md:p-8">
      <div className="flex items-center justify-between">
        <span className="text-eyebrow uppercase text-ink-subtle">RIndex score</span>
        <motion.span
          key={meta.label}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={badgeIn}
          className="rounded-full border px-2.5 py-1 text-caption font-medium"
          style={{
            borderColor: `${meta.color}55`,
            background: `${meta.color}14`,
            color: meta.color,
          }}
        >
          {meta.label.toUpperCase()}
        </motion.span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
        <div className="relative h-48 w-48 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="scoreGauge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={meta.color} stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={r} stroke="#1c1c22" strokeWidth="10" fill="none" />
            <motion.circle
              cx="100"
              cy="100"
              r={r}
              stroke="url(#scoreGauge)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={c}
              animate={{ strokeDashoffset: c * (1 - progress) }}
              transition={sweep}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber
              value={analysis.score}
              decimals={0}
              className="font-mono text-[52px] leading-none tabular-nums text-ink"
            />
            <span className="mt-1 text-caption text-ink-tertiary">/ 100</span>
          </div>
          {/* pulsing dot ring */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 60px -20px ${meta.color}55`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div className="flex-1">
          <h3 className="text-card-title text-ink">{meta.description}</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Entropy" value={`${analysis.effectiveEntropyBits.toFixed(1)} b`} mono />
            <Stat label="Length" value={analysis.length.toString()} mono />
            <Stat label="Charset" value={analysis.composition.charsetSize.toString()} mono />
            <Stat label="Diversity" value={`${Math.round(analysis.diversity * 100)}%`} mono />
            <Stat label="Patterns" value={analysis.patterns.length.toString()} mono />
            <Stat
              label="Search space"
              value={
                analysis.effectiveEntropyBits > 0
                  ? `2^${analysis.effectiveEntropyBits.toFixed(0)}`
                  : '—'
              }
              mono
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-hairline-tertiary bg-surface-2/60 px-3 py-2">
      <div className="text-[10.5px] uppercase tracking-wider text-ink-tertiary">{label}</div>
      <div className={`mt-1 text-[15px] text-ink ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value}
      </div>
    </div>
  );
}
