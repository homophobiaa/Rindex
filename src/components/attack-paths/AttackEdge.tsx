import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import type { AttackEdgeData, EdgeVariant } from '@/lib/attack-paths/types';

/**
 * Custom edge with semantic variants.
 *
 *   main      → solid neutral, becomes danger-red when the simulation lights it
 *   alt       → faint, never lit (probabilistic deviation from the main path)
 *   blocked   → dashed green-tinted, marks a barrier intercept
 *   impact    → solid red fan-out from the compromised pivot node
 *   recovery  → solid blue path to the recovery node
 */
function AttackEdgeImpl(props: EdgeProps<AttackEdgeData>) {
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
    borderRadius: 18,
  });

  const variant: EdgeVariant = data?.variant ?? 'main';
  const active = Boolean(data?.active);
  const v = visualFor(variant, active);

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: v.stroke,
          strokeWidth: v.width,
          strokeDasharray: v.dash,
          opacity: v.opacity,
          filter: v.glow,
          transition:
            'stroke 240ms ease, stroke-width 240ms ease, opacity 240ms ease, filter 240ms ease',
          ...styleProp,
        }}
        markerEnd={v.marker}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              opacity: v.opacity,
            }}
            /* 13px, not `micro`: edge labels live inside the zoomed
               viewport, so they render well below their nominal size. */
            className="rounded border border-hairline bg-surface-2/90 px-1.5 py-0.5 font-mono text-[14px] leading-tight text-ink-subtle backdrop-blur-sm"
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
      {!data?.label && active && typeof data?.probability === 'number' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded border border-danger/30 bg-surface-2/90 px-1.5 py-0.5 font-mono text-[14px] leading-tight text-danger"
          >
            {Math.round(data.probability * 100)}%
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

interface EdgeVisual {
  stroke: string;
  width: number;
  dash?: string;
  opacity: number;
  glow?: string;
  marker: string;
}

function visualFor(variant: EdgeVariant, active: boolean): EdgeVisual {
  switch (variant) {
    case 'main':
      return active
        ? {
            stroke: '#f04438',
            width: 2.4,
            dash: '6 6',
            opacity: 1,
            glow: 'drop-shadow(0 0 6px #f0443866)',
            marker: 'url(#attack-arrow-active)',
          }
        : {
            stroke: '#2c2e34',
            width: 1.6,
            opacity: 0.95,
            marker: 'url(#attack-arrow)',
          };
    case 'alt':
      return {
        stroke: '#2c2e34',
        width: 1.2,
        dash: '3 5',
        opacity: 0.45,
        marker: 'url(#attack-arrow-mute)',
      };
    case 'blocked':
      return {
        stroke: '#27a644',
        width: 1.6,
        dash: '4 6',
        opacity: 0.75,
        marker: 'url(#attack-arrow-barrier)',
      };
    case 'impact':
      return active
        ? {
            stroke: '#f04438',
            width: 2,
            opacity: 1,
            glow: 'drop-shadow(0 0 6px #f0443866)',
            marker: 'url(#attack-arrow-active)',
          }
        : {
            stroke: '#d8341c',
            width: 1.6,
            opacity: 0.75,
            marker: 'url(#attack-arrow-impact)',
          };
    case 'recovery':
      return {
        stroke: '#5e6ad2',
        width: 1.6,
        dash: '2 5',
        opacity: 0.7,
        marker: 'url(#attack-arrow-recovery)',
      };
  }
}

export const AttackEdge = memo(AttackEdgeImpl);
