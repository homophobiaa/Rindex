import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import { useMotionTransition } from '@/lib/motion';
import { useReduceMotion } from '@/lib/reduce-motion';
import { SCENARIO_ICONS } from './scenario-icons';
import { cn } from '@/lib/cn';

interface ScenarioBrowserProps {
  scenarios: Scenario[];
  activeId: string;
  open: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Scenario browser.
 *
 * Choosing a path is one of the two things this tool does, so it gets a
 * deliberate surface rather than a dropdown: a centred panel on desktop, a
 * bottom sheet on touch. Every scenario is visible at once — with ten items
 * a search box would be friction, not help.
 *
 * Keyboard: arrows move across the grid, Enter selects, Escape closes.
 */
export function ScenarioBrowser({
  scenarios,
  activeId,
  open,
  onSelect,
  onClose,
}: ScenarioBrowserProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReduceMotion();
  const panelTransition = useMotionTransition({ duration: 0.26, ease: EASE });
  const backdropTransition = useMotionTransition({ duration: 0.2, ease: 'easeOut' });

  const items = useCallback(
    () => Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-scenario]') ?? []),
    [],
  );

  // Focus the current scenario when the panel opens so arrows work at once.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el =
        gridRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]') ??
        items()[0];
      el?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [open, items]);

  // Escape closes from anywhere, including the backdrop.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /**
   * Roving focus. The grid is one column on narrow screens and two from
   * `sm`, so the horizontal step is read from the live layout rather than
   * assumed — otherwise left/right would jump two rows on mobile.
   */
  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const list = items();
    if (list.length === 0) return;
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const firstTop = list[0].offsetTop;
    const perRow = Math.max(1, list.filter((el) => el.offsetTop === firstTop).length);

    let next = at;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else if (e.key === 'ArrowRight') next = at + 1;
    else if (e.key === 'ArrowLeft') next = at - 1;
    else if (e.key === 'ArrowDown') next = at + perRow;
    else next = at - perRow;

    list[Math.min(list.length - 1, Math.max(0, next))]?.focus();
  };

  const activeIndex = Math.max(0, scenarios.findIndex((s) => s.id === activeId));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
        >
          <button
            type="button"
            aria-label="Close scenario browser"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-canvas/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose an attack scenario"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
            transition={panelTransition}
            className={cn(
              'relative flex max-h-[86dvh] w-full flex-col overflow-hidden border border-hairline',
              'bg-surface-1/97 shadow-2xl backdrop-blur-2xl',
              'rounded-t-2xl sm:max-h-[80dvh] sm:max-w-[860px] sm:rounded-2xl',
            )}
          >
            {/* Sheet grabber — touch affordance only. */}
            <span
              aria-hidden
              className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-hairline-strong sm:hidden"
            />

            <header className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
              <div className="min-w-0">
                <h2 className="text-subhead font-medium text-ink">Attack scenarios</h2>
                <p className="mt-1 text-body-sm text-ink-subtle">
                  Ten worked examples. Pick your poison — they all end badly, just
                  differently.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline',
                  'text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div
              ref={gridRef}
              onKeyDown={onGridKeyDown}
              className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto px-4 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6"
            >
              {scenarios.map((s, i) => {
                const isActive = s.id === activeId;
                const Icon = SCENARIO_ICONS[s.iconKey] ?? SCENARIO_ICONS.shield;
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-scenario
                    data-active={isActive}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => {
                      onSelect(s.id);
                      onClose();
                    }}
                    className={cn(
                      'group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/70',
                      isActive
                        ? 'border-primary/55 bg-primary/10'
                        : 'border-hairline bg-surface-2/40 hover:border-hairline-strong hover:bg-surface-2/80',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/25 text-primary-hover'
                          : 'bg-surface-3 text-ink-subtle group-hover:text-ink',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-micro tabular-nums text-ink-tertiary">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {/* Wraps: the title is the whole point of the row. */}
                        <span
                          className={cn(
                            'text-body-sm font-medium leading-snug',
                            isActive ? 'text-ink' : 'text-ink-muted group-hover:text-ink',
                          )}
                        >
                          {s.title}
                        </span>
                        {isActive && (
                          <span className="ml-auto shrink-0 self-center rounded-full bg-primary/20 px-2 py-0.5 text-micro font-medium uppercase tracking-wider text-primary-hover">
                            Viewing
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-caption leading-relaxed text-ink-subtle">
                        {s.tagline}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <footer className="shrink-0 border-t border-hairline px-5 py-2.5 sm:px-6">
              <p className="text-micro text-ink-tertiary">
                Currently viewing {String(activeIndex + 1).padStart(2, '0')} of{' '}
                {scenarios.length} · <span className="font-mono">↑↓←→</span> to move ·{' '}
                <span className="font-mono">Enter</span> to open ·{' '}
                <span className="font-mono">Esc</span> to close
              </p>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
