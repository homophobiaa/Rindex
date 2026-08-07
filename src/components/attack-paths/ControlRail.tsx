import { motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import type { SimSpeed, SimulationState, CurrentStepInfo } from '@/lib/attack-paths/simulation';
import { useMotionTransition } from '@/lib/motion';
import { PlayIcon, PauseIcon, StepIcon, ResetIcon } from './nodes/icons';
import { ChainReadout } from './ChainReadout';
import { cn } from '@/lib/cn';

interface ControlRailProps {
  scenario: Scenario;
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
 * The visualizer's bottom edge: transport, where the replay is, and the
 * modeled chain value — one attached strip instead of three cards floating
 * over the canvas. The current step lives here and only here.
 */
export function ControlRail({
  scenario,
  state,
  step,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
}: ControlRailProps) {
  const playing = state.status === 'running';
  const total = step.total;
  const idx = step.index; // 1-based; 0 before the first step
  const shown = Math.max(1, idx);
  const progress = total > 1 ? Math.max(0, idx - 1) / (total - 1) : 0;
  const barTransition = useMotionTransition({ duration: 0.4, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="relative z-20 shrink-0 border-t border-hairline bg-surface-1/80 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:gap-x-4 sm:px-5 sm:py-2.5">
        {/* ── Transport ────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-1">
          <RailButton
            label={playing ? 'Pause replay' : 'Play replay'}
            onClick={playing ? onPause : onPlay}
            primary
          >
            {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </RailButton>
          <RailButton label="Step forward" onClick={onStep}>
            <StepIcon className="h-4 w-4" />
          </RailButton>
          <RailButton label="Restart replay" onClick={onReset}>
            <ResetIcon className="h-4 w-4" />
          </RailButton>
        </div>

        <span className="hidden h-6 w-px shrink-0 bg-hairline sm:block" aria-hidden />

        {/* ── Where the replay is ──────────────────────────────── */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 font-mono text-body-sm tabular-nums text-ink-subtle">
            <span className="text-ink">{String(shown).padStart(2, '0')}</span>
            <span className="text-ink-tertiary"> / {String(total).padStart(2, '0')}</span>
          </span>

          <div className="relative h-1.5 w-full min-w-[56px] max-w-[220px] shrink overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-danger"
              animate={{ width: `${Math.max(3, progress * 100)}%` }}
              transition={barTransition}
            />
          </div>

          {/* Current step — the only place it is written. */}
          <div className="hidden min-w-0 flex-1 items-baseline gap-2 md:flex">
            {step.node ? (
              <>
                <span className="truncate text-body-sm font-medium text-ink">
                  {step.node.data.title}
                </span>
                {step.stageLabel && (
                  <span className="shrink-0 text-micro font-medium uppercase tracking-wider text-primary">
                    {step.stageLabel}
                  </span>
                )}
              </>
            ) : (
              <span className="truncate text-body-sm text-ink-subtle">
                Press play to walk the path from habit to impact.
              </span>
            )}
          </div>
        </div>

        {/* ── Speed + model value ──────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="flex items-center rounded-lg bg-surface-2 p-0.5"
            role="group"
            aria-label="Replay speed"
          >
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetSpeed(s)}
                aria-label={`Playback speed ${s} times`}
                aria-pressed={state.speed === s}
                className={cn(
                  'inline-flex min-h-[28px] min-w-[36px] items-center justify-center rounded-md px-1.5',
                  'font-mono text-caption tabular-nums transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
                  state.speed === s
                    ? 'bg-primary text-white'
                    : 'text-ink-subtle hover:text-ink',
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          <ChainReadout scenario={scenario} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function RailButton({
  onClick,
  label,
  primary,
  children,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
        primary
          ? 'bg-primary text-white shadow-[0_0_18px_-6px_#5e6ad2cc] hover:bg-primary-hover'
          : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
