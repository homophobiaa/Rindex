import type { Scenario } from '@/lib/attack-paths/types';
import { SCENARIO_ICONS } from './scenario-icons';
import { cn } from '@/lib/cn';

interface VisualizerHeaderProps {
  scenarios: Scenario[];
  active: Scenario;
  index: number;
  onStep: (delta: number) => void;
  onBrowse: () => void;
  browserOpen: boolean;
}

/**
 * The visualizer's title bar — the single home for scenario identity.
 *
 * Left states what you are looking at (tool name, how many paths exist,
 * this path's name and one-line premise). Right is how you change it. The
 * name deliberately appears nowhere else in the tool.
 */
export function VisualizerHeader({
  scenarios,
  active,
  index,
  onStep,
  onBrowse,
  browserOpen,
}: VisualizerHeaderProps) {
  const Icon = SCENARIO_ICONS[active.iconKey] ?? SCENARIO_ICONS.shield;

  return (
    <header
      className={cn(
        'relative z-20 shrink-0 border-b border-hairline bg-surface-1/60 backdrop-blur-xl',
        'px-4 py-2.5 sm:px-6 lg:py-4 [@media(max-height:820px)]:lg:py-3',
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        {/* ── Identity ─────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-caption font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              Attack Paths
            </h1>
            <span className="h-3 w-px bg-hairline-strong" aria-hidden />
            <span className="font-mono text-micro uppercase tracking-wider text-ink-tertiary">
              {scenarios.length} scenarios
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary lg:hidden">
              <Icon className="h-4 w-4" />
            </span>
            <p className="min-w-0 truncate text-[19px] font-medium leading-tight tracking-[-0.3px] text-ink sm:text-card-title">
              {active.title}
            </p>
          </div>

          {/* The premise, in one line. `tagline` is authored short enough to
              survive a single line at every width; `description` is not. */}
          <p className="mt-1 line-clamp-2 max-w-[90ch] text-caption leading-snug text-ink-muted sm:text-body-sm lg:line-clamp-1">
            {active.tagline}
          </p>
        </div>

        {/* ── Scenario navigation ──────────────────────────────── */}
        <div className="flex shrink-0 items-stretch gap-1.5 lg:pt-0.5">
          <StepButton label="Previous scenario" onClick={() => onStep(-1)}>
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </StepButton>

          <button
            type="button"
            onClick={onBrowse}
            aria-haspopup="dialog"
            aria-expanded={browserOpen}
            className={cn(
              'group flex flex-1 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors lg:flex-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
              browserOpen
                ? 'border-primary/55 bg-primary/10'
                : 'border-hairline bg-surface-2/60 hover:border-hairline-strong hover:bg-surface-2',
            )}
          >
            <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary lg:grid">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-micro font-medium uppercase tracking-[0.14em] text-ink-tertiary">
                Attack scenario
              </span>
              <span className="mt-0.5 flex items-baseline gap-2">
                <span className="font-mono text-body-sm font-medium tabular-nums text-ink">
                  {String(index + 1).padStart(2, '0')}
                  <span className="text-ink-tertiary"> / {scenarios.length}</span>
                </span>
                <span className="text-caption text-primary transition-colors group-hover:text-primary-hover">
                  Explore paths
                </span>
              </span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 rotate-90 text-ink-tertiary" />
          </button>

          <StepButton label="Next scenario" onClick={() => onStep(1)}>
            <ChevronIcon className="h-4 w-4" />
          </StepButton>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid w-9 shrink-0 place-items-center rounded-xl border border-hairline bg-surface-2/60',
        'text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
      )}
    >
      {children}
    </button>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
