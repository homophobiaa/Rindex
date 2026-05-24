import { AnimatePresence, motion } from 'framer-motion';
import {
  KIND_META,
  SEVERITY_COLOR,
  type AttackNodeData,
  type Scenario,
} from '@/lib/attack-paths/types';
import { KIND_ICONS } from './nodes/icons';

interface DetailsPanelProps {
  scenario: Scenario;
  selectedNodeId: string | null;
}

/**
 * Right-rail detail panel.  When no node is selected we show the scenario
 * overview; once the user clicks a node we render its full explanation,
 * mitigation steps, and "why this matters".
 */
export function DetailsPanel({ scenario, selectedNodeId }: DetailsPanelProps) {
  const node = scenario.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="panel-glass gradient-border relative h-full overflow-hidden p-5">
      <AnimatePresence mode="wait">
        {node ? (
          <NodeDetails key={node.id} data={node.data} />
        ) : (
          <ScenarioOverview key={`overview-${scenario.id}`} scenario={scenario} />
        )}
      </AnimatePresence>
    </div>
  );
}

function NodeDetails({ data }: { data: AttackNodeData }) {
  const meta = KIND_META[data.kind];
  const Icon = KIND_ICONS[data.kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
          style={{ background: `${meta.color}1f`, color: meta.color }}
        >
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10.5px] font-medium uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {data.severity && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: `${SEVERITY_COLOR[data.severity]}1a`,
                  color: SEVERITY_COLOR[data.severity],
                }}
              >
                {data.severity}
              </span>
            )}
          </div>
          <h3 className="mt-1 text-card-title leading-tight text-ink">{data.title}</h3>
          <p className="mt-0.5 text-body-sm text-ink-subtle">{data.short}</p>
        </div>
      </div>

      <Section title="What happens">
        <p className="text-body-sm text-ink-muted">{data.detail}</p>
      </Section>

      <Section title="Why this matters">
        <p className="text-body-sm text-ink-muted">{data.why}</p>
      </Section>

      {data.mitigation.length > 0 && (
        <Section title="How to defend">
          <ul className="space-y-2">
            {data.mitigation.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-ink-muted">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="leading-snug">{m}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {typeof data.successProb === 'number' && (
        <Section title="Attacker success">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${data.successProb * 100}%`,
                  background: meta.color,
                }}
              />
            </div>
            <span className="font-mono text-[12px] tabular-nums text-ink-muted">
              {Math.round(data.successProb * 100)}%
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-tertiary">
            Estimated probability the attacker succeeds at this step given they reached
            it.
          </p>
        </Section>
      )}
    </motion.div>
  );
}

function ScenarioOverview({ scenario }: { scenario: Scenario }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col"
    >
      <span className="text-eyebrow uppercase text-ink-subtle">Scenario overview</span>
      <h3 className="mt-1 text-card-title leading-tight text-ink">{scenario.title}</h3>
      <p className="mt-1.5 text-body-sm text-ink-subtle">{scenario.tagline}</p>

      <Section title="What you\u2019re looking at">
        <p className="text-body-sm text-ink-muted">{scenario.description}</p>
      </Section>

      <Section title="How to explore">
        <ul className="space-y-2 text-body-sm text-ink-muted">
          <li className="flex items-start gap-2">
            <Dot color="#5e6ad2" />
            <span>Press <strong className="text-ink">Play</strong> to watch the chain unfold step-by-step.</span>
          </li>
          <li className="flex items-start gap-2">
            <Dot color="#4cc2ff" />
            <span>Click any node to see what it means and how to defend against it.</span>
          </li>
          <li className="flex items-start gap-2">
            <Dot color="#27a644" />
            <span>Green nodes are <strong className="text-ink">barriers</strong> — controls that would stop the chain if present.</span>
          </li>
        </ul>
      </Section>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-tertiary">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}
