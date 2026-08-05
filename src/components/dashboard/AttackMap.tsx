import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type OnSelectionChangeFunc,
} from 'reactflow';
import { AnimatePresence, motion } from 'framer-motion';
import 'reactflow/dist/style.css';

import type { FactorState } from '@/lib/risk';
import { useMotionDuration } from '@/lib/motion';
import { buildAttackMap } from '@/lib/dashboard';
import { AttackNode } from '@/components/attack-paths/nodes/AttackNode';
import { AttackEdge } from '@/components/attack-paths/AttackEdge';
import { KIND_META, type AttackNodeData } from '@/lib/attack-paths/types';

const nodeTypes = { attack: AttackNode };
const edgeTypes = { attack: AttackEdge };

/**
 * Personalized attack map.
 *
 * Renders a React Flow graph generated from THIS user's factor state — not
 * a fixed scenario. It reuses the same node/edge renderers as the full
 * Attack Paths page, so the topology is dynamic but the look is consistent.
 * Read-only: pan/zoom and node inspection, no editing or simulation.
 */
export function AttackMap({ state }: { state: FactorState }) {
  return (
    <ReactFlowProvider>
      <AttackMapInner state={state} />
    </ReactFlowProvider>
  );
}

function AttackMapInner({ state }: { state: FactorState }) {
  const { nodes, edges, entryCount, defenseCount } = useMemo(
    () => buildAttackMap(state),
    [state],
  );
  const flow = useReactFlow();
  const [selected, setSelected] = useState<AttackNodeData | null>(null);
  const fitDuration = useMotionDuration(0.5, 'ms');

  // Re-fit whenever the generated topology changes.
  useEffect(() => {
    setSelected(null);
    const t = window.setTimeout(
      () => flow.fitView({ padding: 0.2, duration: fitDuration, maxZoom: 1, minZoom: 0.4 }),
      60,
    );
    return () => window.clearTimeout(t);
  }, [nodes, flow, fitDuration]);

  const handleSelectionChange: OnSelectionChangeFunc = ({ nodes: sel }) => {
    const first = sel[0];
    setSelected(first ? (first.data as AttackNodeData) : null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1/40">
      <div className="relative h-[400px] w-full">
        {/* Arrow markers used by AttackEdge variants. */}
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
          onSelectionChange={handleSelectionChange}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.4 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnScroll={false}
          zoomOnScroll={false}
          proOptions={{ hideAttribution: true }}
          minZoom={0.35}
          maxZoom={1.4}
          defaultEdgeOptions={{ type: 'attack' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#1a1b20" />
        </ReactFlow>

        {/* Topology summary pill */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-lg border border-hairline bg-surface-1/85 px-3 py-1.5 backdrop-blur-xl">
          <Stat color="#f04438" label="entry points" value={entryCount} />
          <span className="h-3 w-px bg-hairline" />
          <Stat color="#27a644" label="defenses" value={defenseCount} />
        </div>

        {/* Node details on selection */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-3 left-3 right-3 rounded-xl border border-hairline bg-surface-1/90 p-4 backdrop-blur-xl sm:max-w-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-micro font-medium uppercase tracking-wider"
                  style={{
                    color: KIND_META[selected.kind].color,
                    background: `${KIND_META[selected.kind].color}1a`,
                  }}
                >
                  {KIND_META[selected.kind].badge}
                </span>
                <span className="text-[13px] font-medium text-ink">{selected.title}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-subtle">{selected.detail}</p>
              <p className="mt-1.5 text-[11.5px] italic leading-snug text-ink-tertiary">
                {selected.why}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend / helper */}
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-4 py-2.5 text-micro text-ink-tertiary">
        <LegendDot color="#f04438" label="weakness" />
        <LegendDot color="#27a644" label="active defense" />
        <LegendDot color="#d8341c" label="impact" />
        <span className="ml-auto">Tap a node for detail</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="font-mono text-[11px] tabular-nums text-ink">{value}</span>
      <span className="text-micro text-ink-tertiary">{label}</span>
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function ArrowMarker({ id, fill, opacity = 1 }: { id: string; fill: string; opacity?: number }) {
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
