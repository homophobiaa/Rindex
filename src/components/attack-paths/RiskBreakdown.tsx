import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scenario } from '@/lib/attack-paths/types';
import { chainProbability, weakestLink, formatPct } from '@/lib/attack-paths/simulation';
import { cn } from '@/lib/cn';

interface RiskBreakdownProps {
  scenario: Scenario;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Compact risk-breakdown mini-card.  Lives at bottom-left of the canvas and
 * collapses to a one-line summary so it never competes with the graph.
 */
export function RiskBreakdown({ scenario }: RiskBreakdownProps) {
  const [open, setOpen] = useState(false);
  const chain = chainProbability(scenario);
  const weakest = weakestLink(scenario);
  const weakestNode = weakest
    ? scenario.nodes.find((n) => n.id === weakest.target)
    : null;

  return (
    <div className="w-[280px] overflow-hidden rounded-lg border border-hairline bg-surface-1/85 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-2/40"
        aria-expanded={open}
      >
        <span
          className="inline-block h-2 w-2 rounded-full bg-danger shadow-[0_0_6px_2px_rgba(240,68,56,0.4)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
            Chain probability
          </div>
          <div className="font-mono text-[13px] tabular-nums text-ink">
            {formatPct(chain)}
            <span className="ml-1.5 text-[10.5px] text-ink-tertiary">
              · {scenario.path.length} stages
            </span>
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={cn(
            'h-3.5 w-3.5 text-ink-tertiary transition-transform',
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
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="border-t border-hairline p-3 pt-2.5">
              <Block title="What this means">
                <p className="text-[11.5px] leading-relaxed text-ink-subtle">
                  Chain probability is the product of every step\u2019s success rate
                  along the canonical attack path. Lower is safer.
                </p>
              </Block>

              {weakest && weakestNode && (
                <Block title="Weakest link">
                  <div className="rounded-md border border-hairline bg-surface-2/60 p-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                      {formatPct(weakest.probability)} likelihood
                    </div>
                    <div className="mt-0.5 text-[12px] font-medium text-ink">
                      {weakestNode.data.title}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-ink-subtle">
                      Strengthening this stage gives the largest drop in overall risk.
                    </p>
                  </div>
                </Block>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-2.5 last:mb-0">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
        {title}
      </div>
      {children}
    </section>
  );
}
