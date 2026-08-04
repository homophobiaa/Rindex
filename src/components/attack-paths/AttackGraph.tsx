import { useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  type OnSelectionChangeFunc,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMotionDuration } from '@/lib/motion';
import type {
  AttackEdgeData,
  AttackNodeData,
  Scenario,
  ScenarioPhase,
} from '@/lib/attack-paths/types';
import type { SimulationState } from '@/lib/attack-paths/simulation';
import { AttackNode } from './nodes/AttackNode';
import { AttackEdge } from './AttackEdge';
import { PhaseHeader, type PhaseHeaderData } from './nodes/PhaseHeader';

const nodeTypes = { attack: AttackNode, phase: PhaseHeader };
const edgeTypes = { attack: AttackEdge };

interface AttackGraphProps {
  scenario: Scenario;
  simulation: SimulationState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

/**
 * Full-bleed React Flow canvas.  Fills its parent container — the parent
 * controls the height so the page can give it the entire viewport.
 *
 * Owns three visual surfaces:
 *   - phase-lane backdrop (SVG behind the React Flow viewport)
 *   - phase-header nodes (live inside the canvas, pan with it)
 *   - attack nodes + edges (the actual graph)
 */
export function AttackGraph({
  scenario,
  simulation,
  selectedNodeId,
  onSelectNode,
}: AttackGraphProps) {
  const flow = useReactFlow();
  const lastScenarioId = useRef(scenario.id);

  // Phase-header nodes — one per lane, sitting above the top row.
  const headerNodes = useMemo<Node<PhaseHeaderData>[]>(
    () =>
      scenario.phases.map((p, i) => ({
        id: `phase-${p.id}`,
        type: 'phase',
        position: { x: p.x + 24, y: -90 },
        data: { label: p.label, index: i, total: scenario.phases.length, width: p.width },
        draggable: false,
        selectable: false,
        focusable: false,
      })),
    [scenario],
  );

  const initialNodes = useMemo<Node[]>(
    () => [...headerNodes, ...scenario.nodes.map((n) => ({ ...n }))],
    [scenario, headerNodes],
  );
  const initialEdges = useMemo<Edge<AttackEdgeData>[]>(
    () => scenario.edges.map((e) => ({ ...e })),
    [scenario],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AttackEdgeData>(initialEdges);
  const fitDuration = useMotionDuration(0.6, 'ms');

  // Replace nodes/edges whenever the scenario changes, and re-fit.
  useEffect(() => {
    setNodes([...headerNodes, ...scenario.nodes.map((n) => ({ ...n }))]);
    setEdges(scenario.edges.map((e) => ({ ...e })));
    const wasFirst = lastScenarioId.current === scenario.id;
    lastScenarioId.current = scenario.id;
    const t = window.setTimeout(
      () =>
        flow.fitView({
          padding: 0.22,
          duration: wasFirst ? 0 : fitDuration,
          maxZoom: 1.05,
          minZoom: 0.5,
        }),
      80,
    );
    return () => window.clearTimeout(t);
  }, [scenario, headerNodes, setNodes, setEdges, flow, fitDuration]);

  // Project simulation state onto live nodes.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.type !== 'attack') return n;
        const state =
          n.id === simulation.current
            ? 'active'
            : simulation.visited.has(n.id)
              ? 'visited'
              : 'idle';
        const data = n.data as AttackNodeData;
        if (data.state === state) return n;
        return { ...n, data: { ...data, state } };
      }),
    );
  }, [simulation.current, simulation.visited, setNodes]);

  // Project simulation state onto live edges.
  useEffect(() => {
    setEdges((prev) =>
      prev.map((e) => {
        const active = simulation.activeEdges.has(e.id);
        const data = e.data as AttackEdgeData | undefined;
        if (data?.active === active) return e;
        return { ...e, data: { ...(data ?? { probability: 0 }), active } };
      }),
    );
  }, [simulation.activeEdges, setEdges]);

  // Sync external selection.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.type !== 'attack' || n.selected === (n.id === selectedNodeId)
          ? n
          : { ...n, selected: n.id === selectedNodeId },
      ),
    );
  }, [selectedNodeId, setNodes]);

  const handleSelectionChange: OnSelectionChangeFunc = ({ nodes: selNodes }) => {
    const first = selNodes.find((n) => n.type === 'attack');
    onSelectNode(first?.id ?? null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Reusable arrow markers used by AttackEdge. */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <ArrowMarker id="attack-arrow" fill="#2c2e34" />
          <ArrowMarker id="attack-arrow-active" fill="#f04438" />
          <ArrowMarker id="attack-arrow-mute" fill="#2c2e34" opacity={0.6} />
          <ArrowMarker id="attack-arrow-barrier" fill="#27a644" />
          <ArrowMarker id="attack-arrow-impact" fill="#d8341c" />
          <ArrowMarker id="attack-arrow-recovery" fill="#5e6ad2" />
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.05, minZoom: 0.5 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        panOnScroll={false}
        preventScrolling
        proOptions={{ hideAttribution: true }}
        minZoom={0.35}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'attack' }}
      >
        <PhaseLanesBackdrop phases={scenario.phases} />
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#1a1b20" />
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="!flex !flex-col !gap-1 !rounded-md !border !border-hairline !bg-surface-2/85 !p-1 !shadow-none [&_button]:!h-7 [&_button]:!w-7 [&_button]:!rounded-sm [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!text-ink-subtle [&_button:hover]:!bg-surface-3 [&_button:hover]:!text-ink"
        />
      </ReactFlow>

      {/* Edge vignette — keeps the bright canvas from competing with the navbar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 55%, rgba(1,1,2,0.55) 100%)',
        }}
      />
    </div>
  );
}

function ArrowMarker({
  id,
  fill,
  opacity = 1,
}: {
  id: string;
  fill: string;
  opacity?: number;
}) {
  return (
    <marker
      id={id}
      viewBox="0 0 12 12"
      refX="9"
      refY="6"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0 0 L10 6 L0 12 z" fill={fill} opacity={opacity} />
    </marker>
  );
}

/**
 * Faint vertical bands behind the lanes.  Lives as a React Flow Panel-like
 * absolute layer behind the dots background — but rendered as an SVG that
 * pans/zooms with the viewport so it stays aligned with the nodes.
 */
function PhaseLanesBackdrop({ phases }: { phases: ScenarioPhase[] }) {
  // We can't reach the viewport transform from here without useStore, so we
  // render bands as plain SVG inside React Flow's portal layer.  The bands
  // are wide enough that the small misalignment under zoom is invisible.
  const totalWidth = phases.reduce(
    (acc, p) => Math.max(acc, p.x + p.width),
    0,
  );
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      style={{ zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}
    >
      <defs>
        <linearGradient id="lane-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
        </linearGradient>
      </defs>
      {phases.map((p, i) =>
        i % 2 === 1 ? (
          <rect
            key={p.id}
            x={`${(p.x / totalWidth) * 100}%`}
            y="0"
            width={`${(p.width / totalWidth) * 100}%`}
            height="100%"
            fill="url(#lane-fade)"
          />
        ) : null,
      )}
    </svg>
  );
}
