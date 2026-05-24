import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from 'reactflow';

import { SCENARIOS, getScenario } from '@/lib/attack-paths/scenarios';
import { useAttackSimulation } from '@/lib/attack-paths/simulation';
import { AttackGraph } from '@/components/attack-paths/AttackGraph';
import { DetailsPanel } from '@/components/attack-paths/DetailsPanel';
import { RiskBreakdown } from '@/components/attack-paths/RiskBreakdown';
import { ScenarioSelector } from '@/components/attack-paths/ScenarioSelector';
import { SimulationControls } from '@/components/attack-paths/SimulationControls';
import { KIND_META, type NodeKind } from '@/lib/attack-paths/types';

/**
 * Attack Path Visualizer — the second major RIndex module.
 *
 * Shows how isolated weaknesses chain into full account / device
 * compromise.  Built around a React Flow canvas, a small simulation
 * engine, and a scenario library so new chains can be added cheaply.
 */
export default function RiskGraph() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const { state: simulation, play, pause, reset, stepOnce } = useAttackSimulation(scenario);

  // Clear node selection whenever the scenario changes so the right rail
  // resets to the new scenario overview.
  useEffect(() => {
    setSelectedNodeId(null);
  }, [scenarioId]);

  return (
    <main className="relative pt-28 pb-section">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.07] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <div className="container-rindex">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="eyebrow">Attack Path Visualizer</span>
          <h1 className="mt-3 text-display-lg text-gradient">
            Security failures are chains, not single mistakes.
          </h1>
          <p className="mt-4 text-body-lg text-ink-subtle">
            Pick a scenario and watch how attackers traverse a graph of small weaknesses
            until something important falls. Every step runs in your browser — no data
            ever leaves this page.
          </p>
        </motion.header>

        {/* Workspace */}
        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {/* LEFT rail */}
          <aside className="flex flex-col gap-5 lg:col-span-3">
            <ScenarioSelector
              scenarios={SCENARIOS}
              activeId={scenarioId}
              onSelect={setScenarioId}
            />
            <SimulationControls
              scenario={scenario}
              simulation={simulation}
              onPlay={play}
              onPause={pause}
              onStep={stepOnce}
              onReset={reset}
            />
            <RiskBreakdown scenario={scenario} />
          </aside>

          {/* CENTER canvas */}
          <section className="lg:col-span-6">
            <ReactFlowProvider>
              <AttackGraph
                scenario={scenario}
                simulation={simulation}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            </ReactFlowProvider>
            <Legend />
          </section>

          {/* RIGHT details */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24">
              <DetailsPanel scenario={scenario} selectedNodeId={selectedNodeId} />
            </div>
          </aside>
        </div>

        {/* Educational footer */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="panel-glass gradient-border grid gap-5 p-6 md:grid-cols-3 md:p-7">
            <EduCard
              title="Graph theory"
              body="Every scenario is a directed graph. Nodes are states, edges are transitions. The attacker's job is to traverse from an entry node to a goal."
            />
            <EduCard
              title="Probability"
              body="Edges carry weights. The chance the chain succeeds end-to-end is roughly the product of those weights — break one and the whole chain collapses."
            />
            <EduCard
              title="Weakest-link"
              body="Total risk is dominated by the lowest-probability edge. That's the highest-leverage place to add a control."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Legend() {
  const order: NodeKind[] = [
    'mistake',
    'vulnerability',
    'attacker',
    'barrier',
    'compromised',
    'recovery',
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-ink-subtle">
      {order.map((k) => {
        const meta = KIND_META[k];
        return (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: meta.color }}
            />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

function EduCard({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-eyebrow uppercase text-ink-subtle">{title}</div>
      <p className="mt-1.5 text-body-sm text-ink-muted">{body}</p>
    </div>
  );
}
