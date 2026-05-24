import { motion } from 'framer-motion';
import type { SimSpeed, SimulationState, CurrentStepInfo } from '@/lib/attack-paths/simulation';
import { PlayIcon, PauseIcon, StepIcon, ResetIcon } from './nodes/icons';
import { cn } from '@/lib/cn';

interface SimulationControlsProps {
  state: SimulationState;
  step: CurrentStepInfo;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: SimSpeed) => void;
}

const SPEEDS: SimSpeed[] = [0.5, 1, 2];

/**
 * Floating simulation cockpit.  Lives at the bottom of the canvas, in a
 * horizontal glass pill — transport + speed + progress + current-step
 * banner all in one row.
 */
export function SimulationControls({
  state,
  step,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
}: SimulationControlsProps) {
  const playing = state.status === 'running';
  const total = step.total;
  const idx = step.index; // 1-based; 0 when not yet started
  const shownIdx = Math.max(1, idx);
  const progress = total > 1 ? Math.max(0, idx - 1) / (total - 1) : 0;

  return (
    <div className="pointer-events-auto flex flex-col items-stretch gap-2">
      {/* Step banner */}
      {step.node && (
        <motion.div
          key={step.node.id + state.status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[640px] rounded-lg border border-hairline bg-surface-1/85 px-3.5 py-2 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
              STAGE {String(shownIdx).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            {step.stageLabel && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                {step.stageLabel}
              </span>
            )}
            <span className="text-[12.5px] font-medium text-ink">{step.node.data.title}</span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-subtle">
            {step.node.data.short}
          </p>
        </motion.div>
      )}

      {/* Transport pill */}
      <div className="mx-auto flex items-center gap-2 rounded-full border border-hairline bg-surface-1/90 px-2 py-1.5 backdrop-blur-xl shadow-2xl">
        <TransportButton
          label={playing ? 'Pause' : 'Play'}
          onClick={playing ? onPause : onPlay}
          primary
        >
          {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
        </TransportButton>

        <TransportButton label="Step" onClick={onStep}>
          <StepIcon className="h-3.5 w-3.5" />
        </TransportButton>

        <TransportButton label="Reset" onClick={onReset}>
          <ResetIcon className="h-3.5 w-3.5" />
        </TransportButton>

        <span className="mx-1 h-5 w-px bg-hairline" />

        {/* Progress */}
        <div className="flex w-[180px] items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
            {String(shownIdx).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-danger"
              animate={{ width: `${Math.max(4, progress * 100)}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <span className="mx-1 h-5 w-px bg-hairline" />

        {/* Speed */}
        <div className="flex items-center rounded-full bg-surface-2 p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[10.5px] tabular-nums transition-colors',
                state.speed === s
                  ? 'bg-primary/90 text-white'
                  : 'text-ink-tertiary hover:text-ink',
              )}
              aria-pressed={state.speed === s}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TransportButtonProps {
  onClick: () => void;
  label: string;
  primary?: boolean;
  children: React.ReactNode;
}

function TransportButton({ onClick, label, primary, children }: TransportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-full transition-colors',
        primary
          ? 'bg-primary text-white shadow-[0_0_18px_-6px_#5e6ad2cc] hover:bg-primary/90'
          : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
