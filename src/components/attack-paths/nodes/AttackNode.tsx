import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { KIND_META, SEVERITY_COLOR, type AttackNodeData } from '@/lib/attack-paths/types';
import { KIND_ICONS } from './icons';

/**
 * Unified attack-graph node.  Every node kind shares a single component
 * so visual rhythm stays consistent — only the accent colour, icon, and
 * eyebrow change.
 */
function AttackNodeImpl({ data, selected }: NodeProps<AttackNodeData>) {
  const meta = KIND_META[data.kind];
  const Icon = KIND_ICONS[data.kind];
  const state = data.state ?? 'idle';

  const isActive = state === 'active';
  const isVisited = state === 'visited' || isActive;

  // Container styles change subtly across idle / visited / active.
  const borderColor = isActive
    ? meta.color
    : isVisited
      ? `${meta.color}88`
      : selected
        ? '#2c2e34'
        : '#23252a';

  const background = isVisited ? `${meta.tint}` : 'rgba(10, 10, 13, 0.9)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative w-[230px] rounded-lg border backdrop-blur-md transition-colors"
      style={{
        background,
        borderColor,
        boxShadow: isActive
          ? `0 0 0 1px ${meta.color}aa, 0 0 28px -4px ${meta.color}99`
          : selected
            ? '0 0 0 1px #5e6ad2aa, 0 6px 24px -10px #5e6ad244'
            : '0 1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Handles — both sides so edges flow predictably. */}
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle(meta.color, isVisited)}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle(meta.color, isVisited)}
      />

      {/* Active pulse */}
      {isActive && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${meta.color}33, transparent 65%)`,
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative px-3.5 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.badge}
            </span>
          </div>
          {data.severity && (
            <span
              className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
              style={{
                background: `${SEVERITY_COLOR[data.severity]}1a`,
                color: SEVERITY_COLOR[data.severity],
              }}
            >
              {data.severity}
            </span>
          )}
        </div>

        {/* Title + short */}
        <div className="mt-1.5">
          <div className="truncate text-[13.5px] font-medium text-ink">{data.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-ink-subtle">
            {data.short}
          </div>
        </div>

        {/* Optional probability chip */}
        {typeof data.successProb === 'number' && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(data.successProb * 100)}%`,
                  background: meta.color,
                }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
              {Math.round(data.successProb * 100)}%
            </span>
          </div>
        )}
      </div>
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
