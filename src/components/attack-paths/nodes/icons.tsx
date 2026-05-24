import type { NodeKind } from '@/lib/attack-paths/types';

/**
 * Tiny inline icons used by attack-graph nodes.  Kept here so every node
 * kind shares a consistent stroke/weight system.
 */
type IconProps = { className?: string };

const STROKE = 1.7;

function svg(children: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'h-4 w-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function MistakeIcon(p: IconProps) {
  return svg(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      <path d="M16.5 4.5l3 3M19.5 4.5l-3 3" />
    </>,
    p.className,
  );
}

export function VulnerabilityIcon(p: IconProps) {
  return svg(
    <>
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      <path d="M12 8v5M12 16h.01" />
    </>,
    p.className,
  );
}

export function AttackerIcon(p: IconProps) {
  return svg(
    <>
      <path d="M14 4l6 6-9 9H5v-6l9-9z" />
      <path d="M13 5l6 6" />
    </>,
    p.className,
  );
}

export function BarrierIcon(p: IconProps) {
  return svg(
    <>
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </>,
    p.className,
  );
}

export function CompromisedIcon(p: IconProps) {
  return svg(
    <>
      <circle cx="8.5" cy="14" r="3.5" />
      <path d="M11 12l9-9M16 4l4 4M18 6l-3 3" />
    </>,
    p.className,
  );
}

export function RecoveryIcon(p: IconProps) {
  return svg(
    <>
      <path d="M3 12a9 9 0 0 1 15.5-6.3M21 5v4h-4" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3M3 19v-4h4" />
    </>,
    p.className,
  );
}

export function PlayIcon(p: IconProps) {
  return svg(<path d="M7 5l12 7-12 7V5z" />, p.className);
}
export function PauseIcon(p: IconProps) {
  return svg(
    <>
      <rect x="7" y="5" width="3.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
    </>,
    p.className,
  );
}
export function StepIcon(p: IconProps) {
  return svg(
    <>
      <path d="M5 5v14M9 12l8-7v14l-8-7z" />
    </>,
    p.className,
  );
}
export function ResetIcon(p: IconProps) {
  return svg(
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>,
    p.className,
  );
}

export const KIND_ICONS: Record<NodeKind, (p: IconProps) => JSX.Element> = {
  mistake: MistakeIcon,
  vulnerability: VulnerabilityIcon,
  attacker: AttackerIcon,
  barrier: BarrierIcon,
  compromised: CompromisedIcon,
  recovery: RecoveryIcon,
};
