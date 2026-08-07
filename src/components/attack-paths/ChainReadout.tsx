import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import { chainProbability, formatPct, weakestLink } from '@/lib/attack-paths/simulation';
import { useMotionTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Modeled chain value for the current scenario, plus the weakest link that
 * drives it. Lives in the control rail as one chip: the number is always
 * visible, the explanation is one click away, and neither floats loose on
 * the canvas.
 */
export function ChainReadout({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const transition = useMotionTransition({ duration: 0.18, ease: [0.16, 1, 0.3, 1] });

  const chain = chainProbability(scenario);
  const weakest = weakestLink(scenario);
  const weakestNode = weakest ? scenario.nodes.find((n) => n.id === weakest.target) : null;

  // Close on outside click / Escape. The popover sits over a live canvas, so
  // it must never be something you have to hunt for a way out of.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // A new scenario means a new number; a stale popover would be confusing.
  useEffect(() => setOpen(false), [scenario.id]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
          open
            ? 'border-hairline-strong bg-surface-3'
            : 'border-hairline bg-surface-2/60 hover:border-hairline-strong',
        )}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
        <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
          Modeled chain
        </span>
        <span className="font-mono text-body-sm font-medium tabular-nums text-ink">
          {formatPct(chain)}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={transition}
            className={cn(
              'absolute bottom-[calc(100%+10px)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))]',
              'rounded-xl border border-hairline bg-surface-1/97 p-3.5 shadow-2xl backdrop-blur-xl',
            )}
          >
            <p className="text-body-sm leading-relaxed text-ink-muted">
              The product of every step&rsquo;s success rate along this path, over{' '}
              {scenario.path.length} stages. The weights are authored to teach the
              path — a model, not a prophecy.
            </p>

            {weakest && weakestNode && (
              <div className="mt-3 rounded-lg border border-hairline bg-surface-2/60 p-2.5">
                <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
                  Weakest link · {formatPct(weakest.probability)}
                </div>
                <div className="mt-0.5 text-body-sm font-medium text-ink">
                  {weakestNode.data.title}
                </div>
                <p className="mt-1 text-caption leading-relaxed text-ink-subtle">
                  Strengthening this stage gives the largest drop in overall risk.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
