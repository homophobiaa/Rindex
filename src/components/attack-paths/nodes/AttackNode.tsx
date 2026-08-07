import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { KIND_META, SEVERITY_COLOR, type AttackNodeData } from '@/lib/attack-paths/types';
import { KIND_ICONS } from './icons';

/**
 * Unified attack-graph node.  Every kind shares the same shell so visual
 * rhythm stays consistent — only the accent color, icon, and eyebrow
 * change.  Idle / visited / active states are driven by the simulation.
 */
function AttackNodeImpl({ data, selected }: NodeProps<AttackNodeData>) {
  const meta = KIND_META[data.kind];
  const Icon = KIND_ICONS[data.kind];
  const state = data.state ?? 'idle';

  const isActive = state === 'active';
  const isVisited = state === 'visited' || isActive;

  // Border / background palette varies subtly across states.
  const borderColor = isActive
    ? meta.color
    : isVisited
      ? `${meta.color}88`
      : selected
        ? '#5e6ad2aa'
        : '#23252a';

  const background = isActive
    ? `linear-gradient(180deg, ${meta.tint}, rgba(10,10,13,0.92))`
    : isVisited
      ? meta.tint
      : 'rgba(10, 10, 13, 0.86)';

  const boxShadow = isActive
    ? `0 0 0 1px ${meta.color}, 0 0 30px -2px ${meta.color}aa, 0 10px 30px -16px ${meta.color}99`
    : selected
      ? '0 0 0 1px #5e6ad2aa, 0 8px 28px -12px #5e6ad266'
      : '0 1px 0 0 rgba(255,255,255,0.04), 0 8px 24px -18px rgba(0,0,0,0.6)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative w-[240px] rounded-xl border backdrop-blur-md"
      style={{
        background,
        borderColor,
        boxShadow,
        transition:
          'border-color 240ms ease, box-shadow 240ms ease, background 240ms ease',
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle(meta.color, isVisited)} />
      <Handle type="source" position={Position.Right} style={handleStyle(meta.color, isVisited)} />

      {isActive && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${meta.color}33, transparent 65%)`,
          }}
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative px-3.5 py-3">
        {/* Header row: kind chip + severity */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span
              className="text-[13px] font-medium uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.badge}
            </span>
          </div>
          {data.severity && (
            <span
              className="rounded px-1.5 py-0.5 text-[12.5px] font-semibold uppercase tracking-wider"
              style={{
                background: `${SEVERITY_COLOR[data.severity]}1a`,
                color: SEVERITY_COLOR[data.severity],
              }}
            >
              {data.severity}
            </span>
          )}
        </div>

        {/* Title + short. Sized for the framing floor in `AttackGraph`: at
            the minimum zoom these still land above the readability floor. */}
        <div className="mt-2">
          <div className="line-clamp-2 text-[16px] font-medium leading-snug text-ink">
            {data.title}
          </div>
          <div className="mt-1 line-clamp-2 text-body-sm leading-snug text-ink-muted">
            {data.short}
          </div>
        </div>

        {/* Optional success probability bar */}
        {typeof data.successProb === 'number' && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(data.successProb * 100)}%`,
                  background: meta.color,
                }}
              />
            </div>
            <span className="font-mono text-[13px] tabular-nums text-ink-subtle">
              {Math.round(data.successProb * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Hover affordance — subtle ring on the right edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 right-0 w-[2px] rounded-r opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `${meta.color}55` }}
      />
    </motion.div>
  );
}

function handleStyle(color: string, lit: boolean) {
  return {
    width: 8,
    height: 8,
    background: lit ? color : '#2c2e34',
    border: '2px solid #010102',
  } as const;
}

export const AttackNode = memo(AttackNodeImpl);
