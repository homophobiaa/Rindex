import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import type { AttackEdgeData } from '@/lib/attack-paths/types';

interface AttackEdgeStyle {
  /** Whether this edge is currently lit by the simulation. */
  active?: boolean;
}

/**
 * Custom edge — smooth-step path with an optional probability label and
 * an active/highlight state used by the simulation engine.
 */
function AttackEdgeImpl(
  props: EdgeProps<AttackEdgeData & AttackEdgeStyle>,
) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style: styleProp,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const active = Boolean(data?.active);
  const stroke = active ? '#f04438' : '#2c2e34';
  const width = active ? 2.2 : 1.4;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke,
          strokeWidth: width,
          strokeDasharray: active ? '6 6' : undefined,
          filter: active ? 'drop-shadow(0 0 6px #f0443866)' : undefined,
          ...styleProp,
        }}
        markerEnd={active ? 'url(#attack-arrow-active)' : 'url(#attack-arrow)'}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded border border-hairline bg-surface-2/90 px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle backdrop-blur-sm"
          >
            {data.label}
            {typeof data.probability === 'number' && (
              <span className="ml-1 text-ink-tertiary">
                · {Math.round(data.probability * 100)}%
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
      {!data?.label && typeof data?.probability === 'number' && active && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded border border-danger/30 bg-surface-2/90 px-1.5 py-0.5 font-mono text-[10px] text-danger"
          >
            {Math.round((data?.probability ?? 0) * 100)}%
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const AttackEdge = memo(AttackEdgeImpl);
