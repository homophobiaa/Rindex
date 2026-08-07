import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReactFlow } from 'reactflow';
import { useMotionTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Everything that belongs to the canvas itself — zoom, reframe, colour key
 * — in one cluster in a single corner. Previously these were three separate
 * floating objects in three different corners.
 *
 * Must be mounted inside `ReactFlowProvider`.
 */
export function CanvasUtilities({ onReframe }: { onReframe: () => void }) {
  const flow = useReactFlow();
  const [legendOpen, setLegendOpen] = useState(false);
  const transition = useMotionTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-col items-start gap-2">
      <AnimatePresence>
        {legendOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={transition}
            className={cn(
              'pointer-events-auto w-[min(15rem,calc(100vw-1.5rem))] rounded-xl border border-hairline',
              'bg-surface-1/95 p-2.5 shadow-2xl backdrop-blur-xl',
            )}
          >
            <ul className="space-y-1.5">
              {LEGEND.map((it) => (
                <li key={it.label} className="flex items-center gap-2">
                  <span
                    className="inline-block h-[3px] w-5 shrink-0 rounded-full"
                    style={{ background: it.color }}
                    aria-hidden
                  />
                  <span className="text-caption text-ink-muted">{it.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'pointer-events-auto flex items-center gap-0.5 rounded-xl border border-hairline',
          'bg-surface-1/90 p-1 shadow-xl backdrop-blur-xl',
        )}
      >
        <UtilButton label="Zoom out" onClick={() => flow.zoomOut({ duration: 160 })}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </UtilButton>
        <UtilButton label="Zoom in" onClick={() => flow.zoomIn({ duration: 160 })}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </UtilButton>
        <UtilButton label="Reset view" onClick={onReframe}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
          </svg>
        </UtilButton>

        <span className="mx-0.5 h-5 w-px bg-hairline" aria-hidden />

        <button
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          aria-expanded={legendOpen}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-lg px-2 text-caption transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
            legendOpen ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
          )}
        >
          Legend
          <svg
            viewBox="0 0 24 24"
            className={cn('h-3 w-3 transition-transform', legendOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const LEGEND: { color: string; label: string }[] = [
  { color: '#f04438', label: 'Active attack path' },
  { color: '#2c2e34', label: 'Possible step' },
  { color: '#27a644', label: 'Barrier that would stop it' },
  { color: '#d8341c', label: 'Impact' },
  { color: '#5e6ad2', label: 'Recovery' },
];

function UtilButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-ink-subtle transition-colors',
        'hover:bg-surface-2 hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
      )}
    >
      {children}
    </button>
  );
}
