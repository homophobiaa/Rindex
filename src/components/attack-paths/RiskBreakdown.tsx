import { useMemo } from 'react';
import {
  chainProbability,
  formatPct,
  weakestLink,
} from '@/lib/attack-paths/simulation';
import { KIND_META, type Scenario } from '@/lib/attack-paths/types';

interface RiskBreakdownProps {
  scenario: Scenario;
}

/**
 * Quantitative breakdown of the scenario:
 *   - chain probability (product of edge weights along the canonical path)
 *   - the weakest link in the chain
 *   - count by node kind, for a quick legend
 *
 * This is where the math the project requires (probability, graph
 * traversal, weakest-link analysis) shows up explicitly.
 */
export function RiskBreakdown({ scenario }: RiskBreakdownProps) {
  const { chain, weak, counts } = useMemo(() => {
    const chain = chainProbability(scenario);
    const weak = weakestLink(scenario);
    const counts = scenario.nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.data.kind] = (acc[n.data.kind] ?? 0) + 1;
      return acc;
    }, {});
    return { chain, weak, counts };
  }, [scenario]);

  const weakSource = weak ? scenario.nodes.find((n) => n.id === weak.source) : null;
  const weakTarget = weak ? scenario.nodes.find((n) => n.id === weak.target) : null;

  return (
    <div className="panel p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Risk math</span>
          <h3 className="mt-0.5 text-[15px] font-medium tracking-tight text-ink">
            Chain probability
          </h3>
        </div>
        <span className="font-mono text-[12px] tabular-nums text-ink-muted">
          P = {formatPct(chain)}
        </span>
      </div>

      <p className="mt-2 text-[11.5px] leading-snug text-ink-subtle">
        Product of every edge weight along the canonical path. Roughly: the chance an
        unprotected target falls all the way through.
      </p>

      {weak && weakSource && weakTarget && (
        <div className="mt-3 rounded-md border border-hairline-tertiary bg-surface-2/40 p-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-tertiary">
            Weakest link
          </div>
          <div className="mt-1 text-body-sm text-ink-muted">
            <span className="text-ink">{weakSource.data.title}</span>
            <span className="mx-1.5 text-ink-tertiary">→</span>
            <span className="text-ink">{weakTarget.data.title}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-tertiary">
            P = {formatPct(weak.probability)} — strengthen this step first.
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {Object.entries(counts).map(([kind, n]) => {
          const meta = KIND_META[kind as keyof typeof KIND_META];
          return (
            <div
              key={kind}
              className="flex items-center justify-between rounded-md border border-hairline-tertiary bg-surface-2/40 px-2 py-1.5"
            >
              <span className="flex items-center gap-2 text-[11px] text-ink-subtle">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.badge}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-ink-muted">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
