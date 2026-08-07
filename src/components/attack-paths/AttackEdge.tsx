import { memo, useLayoutEffect, useRef, useState } from 'react';
import { EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import type { AttackEdgeData, EdgeVariant } from '@/lib/attack-paths/types';
import { DEFAULT_ANCHOR } from '@/lib/attack-paths/label-layout';
import { useReduceMotion } from '@/lib/reduce-motion';
import { cn } from '@/lib/cn';

/**
 * Custom edge with semantic variants.
 *
 *   main      → neutral, turns danger-red when the simulation lights it
 *   alt       → faint, never lit (probabilistic deviation from the path)
 *   blocked   → dashed green, marks a barrier intercept
 *   impact    → red fan-out from the compromised pivot node
 *   recovery  → blue path to the recovery node
 *
 * Motion is drawn on *overlay* paths, never on the structural line. An
 * earlier version dashed the red line itself and animated its dash offset:
 * mechanically it ran, but a 7/5 dash at 2.2px under a red glow closes up
 * into what looks like a solid line, and the "pulse" was stroked in the
 * same #f04438 as the line beneath it, so it had nothing to stand out
 * against. The structural line now stays solid and the motion rides on top
 * in a much lighter tint.
 *
 *   active            → light-red dashes streaming source → target
 *   active + current  → same, faster, plus a near-white comet
 *   recovery          → slow, quiet drift
 *   blocked           → static, on purpose: a barrier is where flow stops
 *
 * Dash geometry is expressed in `pathLength` units so a short 60px hop and
 * a long fan-out show the same amount of travel.
 */
function AttackEdgeImpl(props: EdgeProps<AttackEdgeData>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    interactionWidth = 20,
    style: styleProp,
  } = props;

  const reduceMotion = useReduceMotion();

  const [edgePath, midX, midY] = getSmoothStepPath({
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
  const current = Boolean(data?.current);
  const v = visualFor(variant, active, current, reduceMotion);

  /* The anchor is resolved against the *rendered* path, not a model of it.
     React Flow reroutes a smooth step differently once a target ends up
     left of or level with its source, which a hand-rolled polyline gets
     wrong — and a dragged node reaches those cases constantly. Sampling the
     real element is exact for every route it can produce.

     `edgePath` changes on every drag frame, so this re-runs with it and the
     chip stays welded to the line. */
  const anchor = data?.labelAnchor ?? DEFAULT_ANCHOR;
  const pathRef = useRef<SVGPathElement | null>(null);
  const [at, setAt] = useState<{ x: number; y: number; nx: number; ny: number } | null>(null);

  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    if (!len) return;
    const d = Math.min(Math.max(anchor.t, 0), 1) * len;
    const p = el.getPointAtLength(d);
    // Tangent from a short chord either side, for the perpendicular offset.
    const a = el.getPointAtLength(Math.max(0, d - 2));
    const b = el.getPointAtLength(Math.min(len, d + 2));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    setAt((prev) =>
      prev && Math.abs(prev.x - p.x) < 0.5 && Math.abs(prev.y - p.y) < 0.5
        ? prev
        : { x: p.x, y: p.y, nx: -dy / m, ny: dx / m },
    );
  }, [edgePath, anchor.t]);

  // Before the first measurement, fall back to React Flow's own midpoint.
  const base = at ?? { x: midX, y: midY, nx: 0, ny: 1 };
  const labelX = base.x + base.nx * anchor.offset;
  const labelY = base.y + base.ny * anchor.offset;
  // A tick back to the line whenever the chip is far enough off it that the
  // association would otherwise have to be guessed.
  const showTick = Math.abs(anchor.offset) > 22;

  const hasLabel = Boolean(data?.label);
  const showPct = !hasLabel && active && typeof data?.probability === 'number';

  return (
    <>
      {/* Structural line. Stays solid — motion is layered on top. */}
      <path
        id={id}
        ref={pathRef}
        d={edgePath}
        fill="none"
        className="react-flow__edge-path"
        style={{
          stroke: v.stroke,
          strokeWidth: v.width,
          strokeDasharray: v.dash,
          opacity: v.opacity,
          filter: v.glow,
          transition: 'stroke 240ms ease, stroke-width 240ms ease, opacity 240ms ease',
          ...styleProp,
        }}
        markerEnd={v.marker}
      />

      {/* Streaming dashes — the "energy travelling the wire" layer. */}
      {v.stream && !reduceMotion && (
        <path
          d={edgePath}
          className={cn(
            'attack-edge-stream',
            v.stream.fast && 'is-fast',
            v.stream.slow && 'is-slow',
          )}
          pathLength={100}
          fill="none"
          stroke={v.stream.color}
          strokeWidth={v.stream.width}
          strokeLinecap="round"
          style={{ opacity: v.stream.opacity }}
        />
      )}

      {/* Comet on the step the replay just took. */}
      {v.comet && !reduceMotion && (
        <path
          // Keyed on the current node so a new stage restarts the run
          // instead of inheriting the previous edge's phase.
          key={`comet-${data?.current ? 'on' : 'off'}`}
          d={edgePath}
          className="attack-edge-comet"
          pathLength={100}
          fill="none"
          stroke={v.comet.color}
          strokeWidth={v.comet.width}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${v.stroke})` }}
        />
      )}

      {(hasLabel || showPct) && (
        <EdgeLabelRenderer>
          {showTick && (
            <div
              aria-hidden
              className="attack-edge-tick"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${(base.x + labelX) / 2}px, ${(base.y + labelY) / 2}px) rotate(${Math.atan2(labelY - base.y, labelX - base.x)}rad)`,
                width: Math.hypot(labelX - base.x, labelY - base.y),
                background: v.stroke,
                opacity: active ? 0.5 : 0.28,
              }}
            />
          )}
          <div
            // Names the edge this chip belongs to. The label layer is a
            // flat sibling of the edge SVG, so without this the pairing is
            // not expressed anywhere in the DOM.
            data-edge={id}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              opacity: v.labelOpacity,
            }}
            className={cn(
              'attack-edge-label whitespace-nowrap rounded-md border px-[7px] py-[1px]',
              'font-mono text-[13px] leading-[19px] transition-colors duration-200',
              active
                ? 'border-danger/40 bg-[#17090a] text-ink-muted'
                : 'border-hairline-strong bg-[#0e0e12] text-ink-subtle',
            )}
          >
            {hasLabel ? (
              <>
                {data?.label}
                {typeof data?.probability === 'number' && (
                  <span className={cn('ml-1', active ? 'text-danger' : 'text-ink-tertiary')}>
                    · {Math.round(data.probability * 100)}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-danger">{Math.round((data?.probability ?? 0) * 100)}%</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Hit target, matching what `BaseEdge` would have rendered. */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={interactionWidth}
        className="react-flow__edge-interaction"
      />
    </>
  );
}

interface Overlay {
  color: string;
  width: number;
  opacity?: number;
  fast?: boolean;
  slow?: boolean;
}

interface EdgeVisual {
  stroke: string;
  width: number;
  dash?: string;
  opacity: number;
  labelOpacity: number;
  glow?: string;
  marker: string;
  stream?: Overlay;
  comet?: Overlay;
}

/**
 * Overlay tints are deliberately far from their base stroke — that
 * contrast is the whole reason the motion is visible.
 */
const STREAM_RED = '#ff9d94';
const COMET_RED = '#fff2ef';
const STREAM_BLUE = '#95a0ee';

function visualFor(
  variant: EdgeVariant,
  active: boolean,
  current: boolean,
  reduce: boolean,
): EdgeVisual {
  // With the overlays suppressed, the current step has to be readable from
  // the static stroke alone, so it takes the light tint the comet would
  // otherwise have carried.
  const litRed = reduce && current ? STREAM_RED : '#f04438';

  switch (variant) {
    case 'main':
      return active
        ? {
            stroke: litRed,
            width: current ? (reduce ? 3.2 : 2.6) : 2.1,
            opacity: 1,
            labelOpacity: 1,
            glow: current
              ? 'drop-shadow(0 0 7px #f0443899)'
              : 'drop-shadow(0 0 5px #f0443855)',
            marker: 'url(#attack-arrow-active)',
            stream: { color: STREAM_RED, width: current ? 2.4 : 1.9, opacity: current ? 0.95 : 0.75, fast: current },
            comet: current ? { color: COMET_RED, width: 3.2 } : undefined,
          }
        : {
            stroke: '#2c2e34',
            width: 1.6,
            opacity: 0.95,
            labelOpacity: 1,
            marker: 'url(#attack-arrow)',
          };
    case 'alt':
      return {
        stroke: '#2c2e34',
        width: 1.2,
        dash: '3 5',
        opacity: 0.45,
        labelOpacity: 0.8,
        marker: 'url(#attack-arrow-mute)',
      };
    case 'blocked':
      // Deliberately still: a barrier is where flow stops.
      return {
        stroke: '#27a644',
        width: 1.6,
        dash: '4 6',
        opacity: 0.75,
        labelOpacity: 0.95,
        marker: 'url(#attack-arrow-barrier)',
      };
    case 'impact':
      return active
        ? {
            stroke: litRed,
            width: current ? (reduce ? 3 : 2.4) : 2,
            opacity: 1,
            labelOpacity: 1,
            glow: 'drop-shadow(0 0 6px #f0443877)',
            marker: 'url(#attack-arrow-active)',
            stream: { color: STREAM_RED, width: current ? 2.2 : 1.8, opacity: current ? 0.95 : 0.7, fast: current },
            comet: current ? { color: COMET_RED, width: 3 } : undefined,
          }
        : {
            stroke: '#d8341c',
            width: 1.6,
            opacity: 0.75,
            labelOpacity: 0.95,
            marker: 'url(#attack-arrow-impact)',
          };
    case 'recovery':
      // Quieter than the attack path: thinner, dimmer, slower.
      return {
        stroke: '#5e6ad2',
        width: 1.6,
        opacity: 0.7,
        labelOpacity: 0.95,
        marker: 'url(#attack-arrow-recovery)',
        stream: { color: STREAM_BLUE, width: 1.4, opacity: 0.5, slow: true },
      };
  }
}

export const AttackEdge = memo(AttackEdgeImpl);
