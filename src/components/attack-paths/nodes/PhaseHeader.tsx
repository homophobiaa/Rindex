import { memo } from 'react';
import type { NodeProps } from 'reactflow';

export interface PhaseHeaderData {
  label: string;
  index: number;
  total: number;
  /** Lane width — matches the column width in scenarios.ts. */
  width: number;
}

/**
 * Lane / phase header rendered as a non-interactive React Flow node.
 * Lives at the top of each column and pans/zooms with the canvas so it
 * always stays aligned with the nodes beneath it.
 */
function PhaseHeaderImpl({ data }: NodeProps<PhaseHeaderData>) {
  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: data.width - 24 }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
          {String(data.index + 1).padStart(2, '0')}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
          {data.label}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-hairline via-hairline/40 to-transparent" />
      </div>
    </div>
  );
}

export const PhaseHeader = memo(PhaseHeaderImpl);
