import { cn } from '@/lib/cn';

/**
 * Subtle dotted/lined grid backdrop with radial fade.
 * Pure CSS — no animation cost.
 */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <div
        className="absolute inset-0 bg-grid-fade [background-size:48px_48px] mask-fade-edges opacity-60"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hairline to-transparent" />
    </div>
  );
}
