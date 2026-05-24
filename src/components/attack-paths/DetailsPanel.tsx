import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type {
  AttackEdgeData,
  AttackNodeData,
  Scenario,
} from '@/lib/attack-paths/types';
import { KIND_META, SEVERITY_COLOR } from '@/lib/attack-paths/types';
import type { CurrentStepInfo } from '@/lib/attack-paths/simulation';
import { formatPct } from '@/lib/attack-paths/simulation';
import { KIND_ICONS } from './nodes/icons';
import { cn } from '@/lib/cn';

interface DetailsPanelProps {
  scenario: Scenario;
  selectedNodeId: string | null;
  currentStep: CurrentStepInfo;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Collapsible right drawer.  Shows the selected node's full breakdown when
 * one is selected, or a scenario overview + live "what's happening now"
 * card otherwise.  Collapses to a thin handle to give the canvas more room.
 */
export function DetailsPanel({
  scenario,
  selectedNodeId,
  currentStep,
}: DetailsPanelProps) {
  const [open, setOpen] = useState(true);
  const selected = selectedNodeId
    ? scenario.nodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  return (
    <motion.aside
      animate={{ width: open ? 360 : 36 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="relative h-full shrink-0 overflow-hidden rounded-l-xl border border-hairline bg-surface-1/85 backdrop-blur-xl"
    >
      {/* Collapse handle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Collapse details' : 'Expand details'}
        className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center text-ink-tertiary transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className={cn('h-3.5 w-3.5 transition-transform', !open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Collapsed rail label */}
      {!open && (
        <div className="flex h-full items-center justify-center">
          <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-tertiary [writing-mode:vertical-rl]">
            Details
          </span>
        </div>
      )}

      {/* Open contents */}
      {open && (
        <div className="flex h-full w-[360px] flex-col">
          <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
              {selected ? 'Node inspector' : 'Scenario overview'}
            </span>
          </header>

          <div className="custom-scroll flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {selected ? (
                <NodeDetails
                  key={selected.id}
                  node={selected.data as AttackNodeData}
                  incoming={incomingEdges(scenario, selected.id)}
                  outgoing={outgoingEdges(scenario, selected.id)}
                />
              ) : (
                <ScenarioDetails
                  key="overview"
                  scenario={scenario}
                  currentStep={currentStep}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.aside>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="space-y-4"
    >
      {/* Header chip */}
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ background: `${meta.color}22`, color: meta.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.badge}
            </span>
            {node.severity && (
              <span
                className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
                style={{
                  background: `${SEVERITY_COLOR[node.severity]}1a`,
                  color: SEVERITY_COLOR[node.severity],
                }}
              >
                {node.severity}
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-[14.5px] font-medium leading-snug text-ink">
            {node.title}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-subtle">
            {node.short}
          </p>
        </div>
      </div>

      {node.detail && (
        <Section title="What happens">
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{node.detail}</p>
        </Section>
      )}

      {node.why && (
        <Section title="Why this matters">
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{node.why}</p>
        </Section>
      )}

      {typeof node.successProb === 'number' && (
        <Section title="Conditional success">
          <Meter value={node.successProb} color={meta.color} />
          <p className="mt-1.5 text-[11.5px] leading-snug text-ink-tertiary">
            Probability this stage succeeds, assuming the attacker reaches it.
          </p>
        </Section>
      )}

      {(incoming.length > 0 || outgoing.length > 0) && (
        <Section title="Connections">
          <ul className="space-y-1.5">
            {incoming.map((e, i) => (
              <li key={`in-${i}`} className="flex items-center gap-2 text-[11.5px]">
                <Arrow direction="in" />
                <span className="flex-1 truncate text-ink-muted">
                  {e.from ?? 'upstream'}
                  {e.label && <span className="ml-1 text-ink-tertiary">— {e.label}</span>}
                </span>
                <span className="font-mono text-[10.5px] tabular-nums text-ink-subtle">
                  {formatPct(e.probability)}
                </span>
              </li>
            ))}
            {outgoing.map((e, i) => (
              <li key={`out-${i}`} className="flex items-center gap-2 text-[11.5px]">
                <Arrow direction="out" />
                <span className="flex-1 truncate text-ink-muted">
                  {e.to ?? 'downstream'}
                  {e.label && <span className="ml-1 text-ink-tertiary">— {e.label}</span>}
                </span>
                <span className="font-mono text-[10.5px] tabular-nums text-ink-subtle">
                  {formatPct(e.probability)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {node.mitigation && node.mitigation.length > 0 && (
        <Section title="Mitigations">
          <ul className="space-y-1.5">
            {node.mitigation.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-ink-muted">
                <span
                  className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function ScenarioDetails({
  scenario,
  currentStep,
}: {
  scenario: Scenario;
  currentStep: CurrentStepInfo;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-[15px] font-medium leading-snug text-ink">{scenario.title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-subtle">
          {scenario.description ?? scenario.tagline}
        </p>
      </div>

      <Section title="Replay status">
        {currentStep.node ? (
          <>
            <div className="rounded-md border border-hairline bg-surface-2/60 p-2.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                {currentStep.stageLabel ?? `Stage ${currentStep.index}`}
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-ink">
                {currentStep.node.data.title}
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-subtle">
                {currentStep.node.data.short}
              </p>
            </div>
            {currentStep.next && (
              <p className="mt-2 text-[11.5px] text-ink-tertiary">
                Next: <span className="text-ink-muted">{currentStep.next.data.title}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px] text-ink-tertiary">
            Press play to walk the attacker\u2019s path from origin to impact.
          </p>
        )}
      </Section>

      <Section title="Stages">
        <ol className="space-y-1.5">
          {scenario.path.map((id, i) => {
            const n = scenario.nodes.find((x) => x.id === id);
            const isCurrent =
              currentStep.node?.id === id && currentStep.index === i + 1;
            return (
              <li
                key={id}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[12px]',
                  isCurrent
                    ? 'border-primary/40 bg-primary/10 text-ink'
                    : 'border-transparent text-ink-muted',
                )}
              >
                <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 truncate">
                  {n?.data.title ?? id}
                </span>
                {scenario.stageLabels?.[i] && (
                  <span className="text-[10px] uppercase tracking-wider text-ink-tertiary">
                    {scenario.stageLabels[i]}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Section>

      <p className="text-[11px] leading-relaxed text-ink-tertiary">
        Tip: click any node to inspect mitigations and downstream impact.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
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
      <span className="font-mono text-[10.5px] tabular-nums text-ink-subtle">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function Arrow({ direction }: { direction: 'in' | 'out' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3 w-3 text-ink-tertiary', direction === 'in' && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
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
