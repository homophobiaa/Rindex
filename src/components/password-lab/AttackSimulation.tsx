import { motion } from 'framer-motion';
import type { AnalysisResult } from '@/lib/password/analyze';

/**
 * Attack simulation matrix — every realistic attacker capability tier,
 * with animated difficulty bars. Reflects guesses-to-crack at 50% of keyspace.
 */
export function AttackSimulation({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="panel p-6 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Attack simulation</span>
          <h2 className="mt-1 text-card-title text-ink">Time to crack across attacker tiers</h2>
        </div>
        <div className="text-right">
          <div className="text-caption text-ink-tertiary">Avg. guesses-to-crack</div>
          <div className="font-mono text-[15px] text-ink">
            {analysis.guessesToCrack > 1e12
              ? analysis.guessesToCrack.toExponential(2)
              : Math.round(analysis.guessesToCrack).toLocaleString()}
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {analysis.scenarios.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-lg border border-hairline-tertiary bg-surface-2/40 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-micro text-ink-tertiary">
                    {(s.guessesPerSecond).toExponential(0).replace('+', '')} /s
                  </span>
                  <span className="text-body-sm font-medium text-ink">{s.label}</span>
                </div>
                <p className="mt-0.5 max-w-2xl text-caption text-ink-subtle">{s.description}</p>
              </div>
              <span
                className="rounded-md border px-2 py-0.5 font-mono text-[12px] tabular-nums"
                style={difficultyStyle(s.difficulty)}
              >
                {s.timeText}
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, s.difficulty * 100)}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colorForDifficulty(s.difficulty)}88, ${colorForDifficulty(s.difficulty)})`,
                }}
              />
            </div>
          </motion.li>
        ))}
      </ul>

      <p className="mt-5 font-mono text-micro text-ink-tertiary">
        Assumes average-case attacker finds the password after exhausting half the search space.
        Hash rates are approximate single-machine estimates for educational comparison.
      </p>
    </div>
  );
}

function colorForDifficulty(d: number): string {
  if (d < 0.2) return '#f04438'; // red — instant / minutes
  if (d < 0.45) return '#f79009'; // orange — hours / days
  if (d < 0.7) return '#4cc2ff'; // cyan — years
  return '#27a644'; // green — centuries+
}

function difficultyStyle(d: number): React.CSSProperties {
  const color = colorForDifficulty(d);
  return {
    color,
    borderColor: `${color}55`,
    background: `${color}14`,
  };
}
