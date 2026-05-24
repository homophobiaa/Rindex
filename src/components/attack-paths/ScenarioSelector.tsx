import { motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import { cn } from '@/lib/cn';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Vertical list of scenarios.  Each card shows the title, tagline and
 * a small accent strip on the left.
 */
export function ScenarioSelector({
  scenarios,
  activeId,
  onSelect,
}: ScenarioSelectorProps) {
  return (
    <div className="panel p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Scenario</span>
          <h3 className="mt-0.5 text-[15px] font-medium tracking-tight text-ink">
            Pick an attack chain
          </h3>
        </div>
        <span className="rounded-md border border-hairline-tertiary bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-tertiary">
          {scenarios.length}
        </span>
      </div>

      <ul className="mt-3 grid gap-1.5">
        {scenarios.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  'group relative flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-hairline-tertiary bg-surface-2/40 hover:border-hairline-strong hover:bg-surface-2',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-1 inline-block h-2 w-2 shrink-0 rounded-full transition-colors',
                    active ? 'bg-primary' : 'bg-ink-tertiary group-hover:bg-ink-subtle',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-tight text-ink">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-subtle">
                    {s.tagline}
                  </span>
                </span>
                {active && (
                  <motion.span
                    layoutId="scenario-pip"
                    className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-primary"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
