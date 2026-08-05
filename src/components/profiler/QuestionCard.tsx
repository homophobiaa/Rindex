import { motion } from 'framer-motion';
import type { Question, QuestionOption } from '@/lib/profile';

/**
 * Single-question card.
 *
 * Renders the prompt + helper line + a list of visually distinct
 * option buttons. Selection auto-advances upward — this card never
 * waits for an explicit "Next" click, which is what makes the flow
 * feel fast.
 *
 * The risk gradient on each option (0..3) drives a subtle danger
 * indicator so the user can intuit which choices are safer without
 * being told.
 */
export function QuestionCard({
  question,
  selectedId,
  onSelect,
  accent,
}: {
  question: Question;
  selectedId?: string;
  onSelect: (option: QuestionOption) => void;
  accent: string;
}) {
  return (
    <div>
      <motion.h2
        layout
        className="text-headline font-medium text-ink"
      >
        {question.prompt}
      </motion.h2>
      {question.helper && (
        <motion.p
          layout
          className="mt-1.5 text-[13px] text-ink-subtle"
        >
          {question.helper}
        </motion.p>
      )}

      <motion.div
        layout
        className="mt-6 grid gap-2.5"
      >
        {question.options.map((opt, i) => {
          const isSelected = selectedId === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.995 }}
              aria-pressed={isSelected}
              className={
                isSelected
                  ? 'group relative flex items-start gap-3 overflow-hidden rounded-xl border-2 bg-surface-1/80 px-4 py-3.5 text-left transition-colors'
                  : 'group relative flex items-start gap-3 overflow-hidden rounded-xl border border-hairline bg-surface-1/50 px-4 py-3.5 text-left transition-colors hover:border-hairline-strong hover:bg-surface-2/40'
              }
              style={isSelected ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}33, 0 0 30px -8px ${accent}66` } : undefined}
            >
              {/* Risk indicator dots */}
              <RiskDots level={opt.risk} accent={accent} active={isSelected} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={
                      isSelected
                        ? 'text-[14px] font-medium text-ink'
                        : 'text-[14px] font-medium text-ink-muted group-hover:text-ink'
                    }
                  >
                    {opt.label}
                  </span>
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="font-mono text-micro uppercase tracking-wider"
                      style={{ color: accent }}
                    >
                      selected
                    </motion.span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-tertiary">
                  {opt.detail}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * Three-dot risk indicator (0..3). Higher number = warmer color, more
 * filled dots. Helps users intuit option safety at a glance.
 */
function RiskDots({
  level,
  accent,
  active,
}: {
  level: 0 | 1 | 2 | 3;
  accent: string;
  active: boolean;
}) {
  const RISK_COLORS = ['#27a644', '#5e6ad2', '#f79009', '#f04438'];
  const color = active ? accent : RISK_COLORS[level];
  return (
    <div className="mt-1 flex shrink-0 flex-col gap-1">
      {[2, 1, 0].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full"
          style={{
            background: level > i ? color : '#2c2e34',
            opacity: level > i ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  );
}
