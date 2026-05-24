import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import { cn } from '@/lib/cn';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Floating scenario selector — collapsed to a compact pill by default,
 * expands to a vertical list on click.  Designed to live in the top-left
 * corner of the canvas without dominating the layout.
 */
export function ScenarioSelector({
  scenarios,
  activeId,
  onSelect,
}: ScenarioSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 rounded-lg border border-hairline bg-surface-1/85 px-3 py-2 backdrop-blur-xl transition-colors hover:border-hairline-strong',
          open && 'border-hairline-strong',
        )}
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Dot />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
            Scenario
          </span>
          <span className="text-[12.5px] font-medium text-ink">{active.title}</span>
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+8px)] z-20 w-[300px] rounded-lg border border-hairline bg-surface-1/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {scenarios.map((s) => {
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(s.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'group relative flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-primary/10 text-ink'
                        : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                        isActive ? 'bg-primary' : 'bg-ink-tertiary',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium leading-tight">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-ink-subtle">
                        {s.tagline}
                      </span>
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="scenario-active-pip"
                        className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-primary"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        'ml-1 h-3.5 w-3.5 text-ink-tertiary transition-transform',
        open && 'rotate-180',
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Dot() {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(94,106,210,0.4)]"
      aria-hidden
    />
  );
}
