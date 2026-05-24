import { useEffect, useMemo } from 'react';
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

import type { AttackEdgeData, AttackNodeData, Scenario } from '@/lib/attack-paths/types';
import type { SimulationState } from '@/lib/attack-paths/simulation';
import { AttackNode } from './nodes/AttackNode';
import { AttackEdge } from './AttackEdge';

const nodeTypes = { attack: AttackNode };
const edgeTypes = { attack: AttackEdge };

interface AttackGraphProps {
  scenario: Scenario;
  simulation: SimulationState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

/**
 * React Flow canvas tuned for the RIndex dark theme.  Receives a scenario
 * + live simulation state and renders an interactive directed graph.
 */
export function AttackGraph({
  scenario,
  simulation,
  selectedNodeId,
  onSelectNode,
}: AttackGraphProps) {
  const initialNodes = useMemo<Node<AttackNodeData>[]>(
    () => scenario.nodes.map((n) => ({ ...n })),
    [scenario],
  );
  const initialEdges = useMemo<Edge<AttackEdgeData>[]>(
    () => scenario.edges.map((e) => ({ ...e })),
    [scenario],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<AttackNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AttackEdgeData>(initialEdges);
  const flow = useReactFlow();

  // Replace nodes/edges whenever the scenario changes.
  useEffect(() => {
    setNodes(scenario.nodes.map((n) => ({ ...n })));
    setEdges(scenario.edges.map((e) => ({ ...e })));
    // fit view after the swap settles.
    const t = window.setTimeout(() => flow.fitView({ padding: 0.18, duration: 600 }), 60);
    return () => window.clearTimeout(t);
  }, [scenario, setNodes, setEdges, flow]);

  // Project simulation state onto the live nodes / edges.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        const state =
          n.id === simulation.current
            ? 'active'
            : simulation.visited.has(n.id)
              ? 'visited'
              : 'idle';
        if (n.data.state === state) return n;
        return { ...n, data: { ...n.data, state } };
      }),
    );
  }, [simulation.current, simulation.visited, setNodes]);

  useEffect(() => {
    setEdges((prev) =>
      prev.map((e) => {
        const active = simulation.activeEdges.has(e.id);
        if (
          (e.data as (AttackEdgeData & { active?: boolean }) | undefined)?.active === active
        ) {
          return e;
        }
        return {
          ...e,
          data: { ...(e.data as AttackEdgeData), active } as AttackEdgeData,
        };
      }),
    );
  }, [simulation.activeEdges, setEdges]);

  // Reflect external selection (e.g. legend / breakdown panel clicks).
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.selected === (n.id === selectedNodeId)
          ? n
          : { ...n, selected: n.id === selectedNodeId },
      ),
    );
  }, [selectedNodeId, setNodes]);

  const handleSelectionChange: OnSelectionChangeFunc = ({ nodes: selNodes }) => {
    onSelectNode(selNodes[0]?.id ?? null);
  };

  return (
    <div className="relative h-[640px] w-full overflow-hidden rounded-xl border border-hairline bg-surface-1/50">
      {/* Reusable arrow markers used by AttackEdge. */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <marker
            id="attack-arrow"
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 6 L0 12 z" fill="#2c2e34" />
          </marker>
          <marker
            id="attack-arrow-active"
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 6 L0 12 z" fill="#f04438" />
          </marker>
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
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'attack' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#1c1c22"
        />
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="!rounded-md !border !border-hairline !bg-surface-2/80 [&_button]:!border-hairline [&_button]:!bg-surface-2 [&_button]:!text-ink-subtle hover:[&_button]:!text-ink"
        />
      </ReactFlow>

      {/* Soft vignette on edges for premium feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(1,1,2,0.6) 100%)',
        }}
      />
    </div>
  );
}
