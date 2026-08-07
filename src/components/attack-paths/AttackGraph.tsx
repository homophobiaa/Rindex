import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
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
import { CanvasUtilities } from './CanvasUtilities';

const nodeTypes = { attack: AttackNode, phase: PhaseHeader };
const edgeTypes = { attack: AttackEdge };

/** Authored node box, in graph units. Matches `AttackNode`'s own size. */
const NODE_W = 240;
const NODE_H = 116;
/**
 * Gap between a stage label and the top row of nodes. Measured from the
 * scenario's own topmost node rather than from the origin: scenarios start
 * on different rows, and a fixed offset left a 200px band of dead canvas
 * above the graph on the ones that start low.
 */
const HEADER_GAP = 46;
const HEADER_H = 20;

/**
 * Framing bounds. Below `MIN_ZOOM` node titles stop being readable at 100%
 * browser zoom, so the graph is cropped instead of shrunk — this is a
 * pannable canvas, and a legible partial view beats an illegible whole one.
 * `MAX_ZOOM` stops a large monitor from simply inflating everything.
 */
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.25;

export interface GraphActions {
  /** Re-frame the current scenario (animated). */
  reframe: () => void;
  /** Drop node selection inside React Flow, which owns it. */
  clearSelection: () => void;
}

interface AttackGraphProps {
  scenario: Scenario;
  simulation: SimulationState;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onRegisterActions: (actions: GraphActions) => void;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Full-bleed React Flow canvas. Fills its parent, which owns the height —
 * the visualizer gives it everything between the header and the rail.
 */
export function AttackGraph({
  scenario,
  simulation,
  selectedNodeId,
  onSelectNode,
  onRegisterActions,
}: AttackGraphProps) {
  const flow = useReactFlow();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const firstScenario = useRef(true);

  const headerY = useMemo(
    () => Math.min(...scenario.nodes.map((n) => n.position.y)) - HEADER_GAP,
    [scenario],
  );

  // Phase-header nodes — one per lane, sitting just above the top row.
  const headerNodes = useMemo<Node<PhaseHeaderData>[]>(
    () =>
      scenario.phases.map((p, i) => ({
        id: `phase-${p.id}`,
        type: 'phase',
        position: { x: p.x + 24, y: headerY },
        data: { label: p.label, index: i, total: scenario.phases.length, width: p.width },
        draggable: false,
        selectable: false,
        focusable: false,
      })),
    [scenario, headerY],
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
  const frameDuration = useMotionDuration(0.5, 'ms');

  /* ---------------------------------------------------------------- *
   * Framing
   *
   * Bounds come from the authored `position` values rather than React
   * Flow's bounds helpers: those read `positionAbsolute`, which is
   * undefined until the nodes have been measured, and the first frame has
   * to be right before anything is painted.
   * ---------------------------------------------------------------- */
  const bounds = useMemo(() => {
    const pathIds = new Set(scenario.path);
    const boxes = scenario.nodes.map((n) => ({
      x: n.position.x,
      y: n.position.y,
      w: NODE_W,
      h: NODE_H,
      onPath: pathIds.has(n.id),
    }));
    const labelBand = scenario.phases.map((p) => ({
      x: p.x + 24,
      y: headerY,
      w: p.width,
      h: HEADER_H,
      onPath: false,
    }));

    return { full: rectOf([...boxes, ...labelBand]), boxes, labelBand };
  }, [scenario, headerY]);

  const frame = useCallback(
    (duration: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;

      const { full, boxes, labelBand } = bounds;
      const padX = 28;
      const padY = 28;
      const zoom = clamp(
        Math.min((width - padX * 2) / full.width, (height - padY * 2) / full.height),
        MIN_ZOOM,
        MAX_ZOOM,
      );

      // Horizontal: centre when it all fits. When the readability floor
      // forces a crop, anchor at the entry point instead — the attack reads
      // left to right, so the first step is what must be on screen.
      const croppedX = full.width * zoom > width - 2;
      const x = croppedX
        ? padX - full.x * zoom
        : width / 2 - (full.x + full.width / 2) * zoom;

      // Vertical framing follows what that horizontal anchor actually puts
      // on screen. On a cropped canvas only a left-hand slice is visible,
      // and rows belonging to columns far off to the right must not drag
      // the framing — that is what leaves a band of dead canvas.
      const visRight = full.x + (width - padX) / zoom;
      const onScreen = croppedX ? boxes.filter((b) => b.x < visRight) : boxes;
      const slice = onScreen.length ? onScreen : boxes;
      const vRect = rectOf([...slice, ...labelBand.filter((b) => b.x < visRight)]);

      // Still too tall? Fall back to the canonical path through that slice,
      // so the storyline sits on the midline and the branches bleed.
      const croppedY = vRect.height * zoom > height - 2;
      const pathSlice = slice.filter((b) => b.onPath);
      const focus = croppedY && pathSlice.length ? rectOf(pathSlice) : vRect;

      let y = height / 2 - (focus.y + focus.height / 2) * zoom;
      if (croppedY) {
        const top = padY - vRect.y * zoom;
        const bottom = height - padY - (vRect.y + vRect.height) * zoom;
        y = Math.min(top, Math.max(bottom, y));
      }

      flow.setViewport({ x, y, zoom }, duration ? { duration } : undefined);
    },
    [flow, bounds],
  );

  // Swap graph + re-frame on every scenario change. The very first frame is
  // instant; later ones animate so the change reads as a transition.
  useEffect(() => {
    setNodes([...headerNodes, ...scenario.nodes.map((n) => ({ ...n }))]);
    setEdges(scenario.edges.map((e) => ({ ...e })));
    const instant = firstScenario.current;
    firstScenario.current = false;
    const t = window.setTimeout(() => frame(instant ? 0 : frameDuration), 60);
    return () => window.clearTimeout(t);
  }, [scenario, headerNodes, setNodes, setEdges, frame, frameDuration]);

  // Re-frame when the canvas itself changes size (window resize, drawer
  // open on a narrow window, orientation change).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => frame(0));
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [frame]);

  /** Deselect through React Flow, which owns selection state. */
  const clearSelection = useCallback(() => {
    setNodes((prev) => prev.map((n) => (n.selected ? { ...n, selected: false } : n)));
    onSelectNode(null);
  }, [setNodes, onSelectNode]);

  useEffect(() => {
    onRegisterActions({ reframe: () => frame(frameDuration), clearSelection });
  }, [onRegisterActions, frame, frameDuration, clearSelection]);

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

  // Sync external selection back onto the nodes.
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
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
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
        onInit={() => frame(0)}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        panOnScroll={false}
        preventScrolling
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.8}
        defaultEdgeOptions={{ type: 'attack' }}
      >
        <PhaseLanesBackdrop phases={scenario.phases} />
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#212227" />
      </ReactFlow>

      <CanvasUtilities onReframe={() => frame(frameDuration)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function rectOf(boxes: { x: number; y: number; w: number; h: number }[]): Rect {
  if (boxes.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
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
 * Faint vertical bands behind the lanes — enough tonal separation that the
 * canvas reads as a work surface rather than flat black.
 */
function PhaseLanesBackdrop({ phases }: { phases: ScenarioPhase[] }) {
  const totalWidth = phases.reduce((acc, p) => Math.max(acc, p.x + p.width), 0);
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
