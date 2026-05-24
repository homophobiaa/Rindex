import { motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import type { SimulationState } from '@/lib/attack-paths/simulation';
import { PauseIcon, PlayIcon, ResetIcon, StepIcon } from './nodes/icons';

interface SimulationControlsProps {
  scenario: Scenario;
  simulation: SimulationState;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
}

/**
 * Play / pause / step / reset controls for the attack-path simulation,
 * plus a progress strip showing how far through the chain we are.
 */
export function SimulationControls({
  scenario,
  simulation,
  onPlay,
  onPause,
  onStep,
  onReset,
}: SimulationControlsProps) {
  const total = scenario.path.length;
  const done = simulation.stepIndex;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const running = simulation.status === 'running';
  const finished = simulation.status === 'done';

  return (
    <div className="panel p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Simulation</span>
          <h3 className="mt-0.5 text-[15px] font-medium tracking-tight text-ink">
            Walk the chain
          </h3>
        </div>
        <span className="font-mono text-[11px] text-ink-tertiary">
          {done}/{total}
        </span>
      </div>

      {/* Progress strip */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #f04438, #f79009)',
          }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Buttons */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <ControlButton
          label={running ? 'Pause' : finished ? 'Done' : 'Play'}
          onClick={running ? onPause : onPlay}
          disabled={finished}
          primary
          icon={running ? <PauseIcon /> : <PlayIcon />}
        />
        <ControlButton
          label="Step"
          onClick={onStep}
          disabled={finished}
          icon={<StepIcon />}
        />
        <ControlButton label="Reset" onClick={onReset} icon={<ResetIcon />} />
        <StatusPill status={simulation.status} />
      </div>

      <p className="mt-3 text-[11.5px] leading-snug text-ink-subtle">
        Each step animates the attacker advancing one node along the canonical
        attack path. Click any node to inspect it.
      </p>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  icon,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-[12px] font-medium text-white shadow-glow-soft transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
          : 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-hairline bg-surface-2 text-[12px] font-medium text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
      }
      aria-label={label}
    >
      <span className="h-3.5 w-3.5">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatusPill({ status }: { status: SimulationState['status'] }) {
  const map: Record<SimulationState['status'], { label: string; color: string }> = {
    idle: { label: 'Idle', color: '#62666d' },
    running: { label: 'Running', color: '#27a644' },
    paused: { label: 'Paused', color: '#f79009' },
    done: { label: 'Done', color: '#5e6ad2' },
  };
  const meta = map[status];
  return (
    <div
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-[11px] font-medium uppercase tracking-wider"
      style={{
        borderColor: `${meta.color}33`,
        background: `${meta.color}14`,
        color: meta.color,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </div>
  );
}
