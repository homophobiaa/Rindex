import { motion } from 'framer-motion';
import { STEPS } from '@/lib/profile';

/**
 * Compact horizontal step indicator shown at the top of the flow.
 *
 * Shows one pill per step with progress fill. The current step pulses
 * subtly so the user always knows where they are without having to
 * read numbers.
 */
export function ProgressTrack({
  currentStep,
  answeredByStep,
}: {
  currentStep: number;
  /** Map of stepIndex → number of questions answered in that step. */
  answeredByStep: number[];
}) {
  return (
    <div className="flex w-full items-center gap-1.5">
      {STEPS.map((step, i) => {
        const answered = answeredByStep[i] ?? 0;
        const total = step.questions.length;
        const isDone = answered >= total;
        const isActive = i === currentStep;
        const frac = total === 0 ? 0 : answered / total;

        return (
          <div key={step.id} className="flex flex-1 flex-col gap-1">
            <div className="relative h-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isDone
                    ? step.accent
                    : isActive
                      ? `linear-gradient(90deg, ${step.accent}, ${step.accent}55)`
                      : '#2c2e34',
                }}
                animate={{ width: isDone ? '100%' : `${frac * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className={
                  isActive
                    ? 'text-[10px] font-medium tracking-wider text-ink'
                    : isDone
                      ? 'text-[10px] font-medium tracking-wider text-ink-muted'
                      : 'text-[10px] font-medium tracking-wider text-ink-tertiary'
                }
              >
                {step.label}
              </span>
              {isActive && (
                <motion.span
                  className="h-1 w-1 rounded-full"
                  style={{ background: step.accent }}
                  animate={{ scale: [1, 1.6, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
