import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { motion } from 'framer-motion';

import { AttackGraph } from '@/components/attack-paths/AttackGraph';
import { ScenarioSelector } from '@/components/attack-paths/ScenarioSelector';
import { SimulationControls } from '@/components/attack-paths/SimulationControls';
import { DetailsPanel } from '@/components/attack-paths/DetailsPanel';
import { RiskBreakdown } from '@/components/attack-paths/RiskBreakdown';
import {
  SCENARIOS,
  getScenario,
} from '@/lib/attack-paths/scenarios';
import {
  useAttackSimulation,
  useCurrentStep,
} from '@/lib/attack-paths/simulation';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Attack Path Visualizer.
 *
 * Full-viewport canvas workspace.  The graph is the product — every
 * supporting surface is a floating, collapsible overlay so it never
 * suffocates the visualization.
 */
export default function RiskGraph() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const scenario = getScenario(scenarioId);
  const { state: simulation, play, pause, reset, stepOnce, setSpeed } =
    useAttackSimulation(scenario);
  const currentStep = useCurrentStep(scenario, simulation);

  // Drop stale selection when the scenario changes.
  useEffect(() => {
    setSelectedNodeId(null);
  }, [scenarioId]);

  return (
    <main className="relative h-[calc(100vh-72px)] w-full overflow-hidden bg-canvas">
      {/* Subtle ambient gradient — keeps the canvas from feeling sterile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-fade opacity-60"
      />

      {/* Workspace: graph on the left, collapsible drawer on the right */}
      <div className="relative flex h-full w-full">
        <section className="relative h-full min-w-0 flex-1">
          <ReactFlowProvider>
            <AttackGraph
              scenario={scenario}
              simulation={simulation}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          </ReactFlowProvider>

          {/* Top-left overlay — scenario picker + header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="pointer-events-none absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-col gap-2"
          >
            <div className="pointer-events-auto">
              <ScenarioSelector
                scenarios={SCENARIOS}
                activeId={scenarioId}
                onSelect={setScenarioId}
              />
            </div>
            <div className="pointer-events-none ml-1 max-w-[420px]">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
                Attack Path Visualizer
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-subtle">
                {scenario.tagline}
              </p>
            </div>
          </motion.div>

          {/* Bottom-left overlay — risk breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
            className="pointer-events-auto absolute bottom-4 left-4 z-10"
          >
            <RiskBreakdown scenario={scenario} />
          </motion.div>

          {/* Bottom-center overlay — simulation cockpit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
            className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4"
          >
            <SimulationControls
              state={simulation}
              step={currentStep}
              onPlay={play}
              onPause={pause}
              onStep={stepOnce}
              onReset={reset}
              onSetSpeed={setSpeed}
            />
          </motion.div>

          {/* Legend pill — top right of canvas area */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
            className="pointer-events-auto absolute right-4 top-4 z-10"
          >
            <Legend />
          </motion.div>
        </section>

        {/* Right drawer — node inspector + scenario overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative z-20 h-full"
        >
          <DetailsPanel
            scenario={scenario}
            selectedNodeId={selectedNodeId}
            currentStep={currentStep}
          />
        </motion.div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Legend() {
  const items: { color: string; label: string }[] = [
    { color: '#f04438', label: 'Active path' },
    { color: '#2c2e34', label: 'Possible step' },
    { color: '#27a644', label: 'Barrier (blocked)' },
    { color: '#d8341c', label: 'Impact' },
    { color: '#5e6ad2', label: 'Recovery' },
  ];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-1/85 px-3 py-2 backdrop-blur-xl">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-[3px] w-5 rounded-full"
            style={{ background: it.color }}
          />
          <span className="text-[10.5px] text-ink-tertiary">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
