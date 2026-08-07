import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AttackEdgeData, AttackNodeData, Scenario } from '@/lib/attack-paths/types';
import { KIND_META, SEVERITY_COLOR } from '@/lib/attack-paths/types';
import { formatPct } from '@/lib/attack-paths/simulation';
import { KIND_ICONS } from './nodes/icons';
import { useMotionTransition } from '@/lib/motion';
import { useReduceMotion } from '@/lib/reduce-motion';
import { useIsWide } from '@/lib/use-media-query';
import { cn } from '@/lib/cn';

interface NodeInspectorProps {
  scenario: Scenario;
  selectedNodeId: string | null;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Contextual detail surface for one selected node.
 *
 * Only exists while something is selected — the canvas gets the whole area
 * back the moment it closes. Wide screens get a right drawer over the
 * canvas; narrow screens get a bottom sheet, because a 340px drawer beside
 * a phone-width canvas leaves neither usable.
 *
 * It never repeats the scenario overview; that lives in the header.
 */
export function NodeInspector({ scenario, selectedNodeId, onClose }: NodeInspectorProps) {
  const selected = selectedNodeId
    ? scenario.nodes.find((n) => n.id === selectedNodeId) ?? null
    : null;
  const isWide = useIsWide();
  const reduce = useReduceMotion();
  const transition = useMotionTransition({ duration: 0.3, ease: EASE });

  // Escape closes, matching the scenario browser.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected, onClose]);

  // Reduced motion: no travel, just presence.
  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isWide
      ? {
          initial: { opacity: 0, x: 28 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 24 },
        }
      : {
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 24 },
        };

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key="inspector"
          {...enter}
          transition={transition}
          aria-label={`Details for ${selected.data.title}`}
          className={cn(
            'absolute z-30 flex flex-col overflow-hidden border-hairline bg-surface-1/95 backdrop-blur-2xl',
            'shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)] lg:shadow-[-12px_0_48px_-18px_rgba(0,0,0,0.8)]',
            // Sheet below lg, drawer from lg.
            'inset-x-0 bottom-0 max-h-[68%] rounded-t-2xl border-t',
            'lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[360px] lg:rounded-none lg:border-l lg:border-t-0',
            'xl:w-[400px]',
          )}
        >
          <span
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-hairline-strong lg:hidden"
          />

          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
            <span className="text-micro font-medium uppercase tracking-[0.16em] text-ink-tertiary">
              Selected step
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className={cn(
                'grid h-7 w-7 place-items-center rounded-md text-ink-subtle transition-colors',
                'hover:bg-surface-2 hover:text-ink',
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

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <NodeDetails
              node={selected.data as AttackNodeData}
              incoming={incomingEdges(scenario, selected.id)}
              outgoing={outgoingEdges(scenario, selected.id)}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */

function NodeDetails({
  node,
  incoming,
  outgoing,
}: {
  node: AttackNodeData;
  incoming: { label?: string; probability: number; from?: string }[];
  outgoing: { label?: string; probability: number; to?: string }[];
}) {
  const meta = KIND_META[node.kind];
  const Icon = KIND_ICONS[node.kind];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-micro font-medium uppercase tracking-wider"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.badge}
          </span>
          {node.severity && (
            <span
              className="rounded px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wider"
              style={{
                background: `${SEVERITY_COLOR[node.severity]}1a`,
                color: SEVERITY_COLOR[node.severity],
              }}
            >
              {node.severity}
            </span>
          )}
        </div>

        <h2 className="mt-2 text-card-title font-medium leading-snug text-ink">
          {node.title}
        </h2>
        <p className="mt-1.5 text-body-sm leading-relaxed text-ink-muted">{node.short}</p>
      </div>

      {node.detail && (
        <Section title="What happens">
          <p className="text-body-sm leading-relaxed text-ink-muted">{node.detail}</p>
        </Section>
      )}

      {node.why && (
        <Section title="Why this matters">
          <p className="text-body-sm leading-relaxed text-ink-muted">{node.why}</p>
        </Section>
      )}

      {typeof node.successProb === 'number' && (
        <Section title="Modeled success at this step">
          <Meter value={node.successProb} color={meta.color} />
          <p className="mt-1.5 text-caption leading-relaxed text-ink-subtle">
            How often this stage works, assuming the attacker gets to it.
          </p>
        </Section>
      )}

      {(incoming.length > 0 || outgoing.length > 0) && (
        <Section title="Connections">
          <ul className="space-y-1.5">
            {incoming.map((e, i) => (
              <li key={`in-${i}`} className="flex items-center gap-2">
                <Arrow direction="in" />
                <span className="min-w-0 flex-1 text-caption text-ink-muted">
                  {e.from ?? 'upstream'}
                  {e.label && <span className="ml-1 text-ink-tertiary">— {e.label}</span>}
                </span>
                <span className="font-mono text-caption tabular-nums text-ink-muted">
                  {formatPct(e.probability)}
                </span>
              </li>
            ))}
            {outgoing.map((e, i) => (
              <li key={`out-${i}`} className="flex items-center gap-2">
                <Arrow direction="out" />
                <span className="min-w-0 flex-1 text-caption text-ink-muted">
                  {e.to ?? 'downstream'}
                  {e.label && <span className="ml-1 text-ink-tertiary">— {e.label}</span>}
                </span>
                <span className="font-mono text-caption tabular-nums text-ink-muted">
                  {formatPct(e.probability)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {node.mitigation && node.mitigation.length > 0 && (
        <Section title="Mitigations">
          <ul className="space-y-2">
            {node.mitigation.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="text-body-sm leading-relaxed text-ink-muted">{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-caption font-medium uppercase tracking-wider text-ink-tertiary">
        {title}
      </div>
      {children}
    </section>
  );
}

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(value * 100)}%`, background: color }}
        />
      </div>
      <span className="font-mono text-caption tabular-nums text-ink-muted">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function Arrow({ direction }: { direction: 'in' | 'out' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3 w-3 shrink-0 text-ink-tertiary', direction === 'in' && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function incomingEdges(scenario: Scenario, nodeId: string) {
  return scenario.edges
    .filter((e) => e.target === nodeId)
    .map((e) => {
      const data = (e.data ?? { probability: 0 }) as AttackEdgeData;
      const from = scenario.nodes.find((n) => n.id === e.source)?.data.title;
      return { label: data.label, probability: data.probability, from };
    });
}

function outgoingEdges(scenario: Scenario, nodeId: string) {
  return scenario.edges
    .filter((e) => e.source === nodeId)
    .map((e) => {
      const data = (e.data ?? { probability: 0 }) as AttackEdgeData;
      const to = scenario.nodes.find((n) => n.id === e.target)?.data.title;
      return { label: data.label, probability: data.probability, to };
    });
}
