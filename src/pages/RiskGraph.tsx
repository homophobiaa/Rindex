import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { AttackGraph, type GraphActions } from '@/components/attack-paths/AttackGraph';
import { VisualizerHeader } from '@/components/attack-paths/VisualizerHeader';
import { ScenarioBrowser } from '@/components/attack-paths/ScenarioBrowser';
import { ControlRail } from '@/components/attack-paths/ControlRail';
import { NodeInspector } from '@/components/attack-paths/NodeInspector';
import { SCENARIOS, getScenario } from '@/lib/attack-paths/scenarios';
import { useAttackSimulation, useCurrentStep } from '@/lib/attack-paths/simulation';
import { useMotionTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Attack Path Visualizer.
 *
 * A tool route, not a page: navbar → visualizer header → canvas → control
 * rail, filling the viewport with no site container and no footer. Every
 * supporting surface is attached to an edge of the tool, and the canvas
 * gets everything that is left.
 */
export default function RiskGraph() {
  // Scenario lives in the query string so a specific attack path can be
  // linked directly, and browser back/forward steps through them.
  const [params, setParams] = useSearchParams();
  const requested = params.get('scenario');
  const scenarioId = SCENARIOS.some((s) => s.id === requested)
    ? (requested as string)
    : SCENARIOS[0].id;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const actionsRef = useRef<GraphActions | null>(null);

  const scenario = getScenario(scenarioId);
  const index = Math.max(0, SCENARIOS.findIndex((s) => s.id === scenarioId));
  const { state: simulation, play, pause, reset, stepOnce, setSpeed } =
    useAttackSimulation(scenario);
  const currentStep = useCurrentStep(scenario, simulation);
  const hintTransition = useMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });

  const selectScenario = useCallback(
    (id: string) => {
      setParams(id === SCENARIOS[0].id ? {} : { scenario: id });
    },
    [setParams],
  );

  const stepScenario = useCallback(
    (delta: number) => {
      const next = (index + delta + SCENARIOS.length) % SCENARIOS.length;
      selectScenario(SCENARIOS[next].id);
    },
    [index, selectScenario],
  );

  // A node id from the previous graph would keep the inspector open on
  // nothing, so selection is dropped whenever the scenario changes.
  useEffect(() => {
    setSelectedNodeId(null);
  }, [scenarioId]);

  const registerActions = useCallback((a: GraphActions) => {
    actionsRef.current = a;
  }, []);

  // Closing goes through the graph: React Flow owns selection internally, so
  // clearing only our copy would be undone by its next selection event.
  const closeInspector = useCallback(() => {
    if (actionsRef.current) actionsRef.current.clearSelection();
    else setSelectedNodeId(null);
  }, []);

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden bg-canvas',
        // The tool owns the viewport under the 72px navbar. `min-h` keeps it
        // usable on very short windows, where the document may scroll a little.
        'h-[calc(100dvh-72px)] min-h-[540px]',
      )}
    >
      <VisualizerHeader
        scenarios={SCENARIOS}
        active={scenario}
        index={index}
        onStep={stepScenario}
        onBrowse={() => setBrowserOpen(true)}
        browserOpen={browserOpen}
      />

      {/* ── Canvas region — everything left over ─────────────────── */}
      <div className="relative min-h-0 flex-1">
        <ReactFlowProvider>
          <AttackGraph
            scenario={scenario}
            simulation={simulation}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onRegisterActions={registerActions}
          />
        </ReactFlowProvider>

        {/* Low-key nudge, not a widget. Steps aside once it is obeyed. */}
        <AnimatePresence>
          {!selectedNodeId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={hintTransition}
              className="pointer-events-none absolute right-4 top-3 z-10 hidden text-caption text-ink-tertiary sm:block"
            >
              Click any node — the red ones come with context.
            </motion.p>
          )}
        </AnimatePresence>

        <NodeInspector
          scenario={scenario}
          selectedNodeId={selectedNodeId}
          onClose={closeInspector}
        />
      </div>

      <ControlRail
        scenario={scenario}
        state={simulation}
        step={currentStep}
        onPlay={play}
        onPause={pause}
        onStep={stepOnce}
        onReset={reset}
        onSetSpeed={setSpeed}
      />

      <ScenarioBrowser
        scenarios={SCENARIOS}
        activeId={scenarioId}
        open={browserOpen}
        onSelect={selectScenario}
        onClose={() => setBrowserOpen(false)}
      />
    </div>
  );
}
