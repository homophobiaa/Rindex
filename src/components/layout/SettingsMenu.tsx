import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Switch } from '@/components/ui/Switch';
import { useReduceMotion, setReduceMotionOverride } from '@/lib/reduce-motion';
import { useMotionTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Discreet preferences popover in the header.
 *
 * Holds display/accessibility preferences that apply across the whole app.
 * Kept out of page content deliberately — these are app-level settings,
 * not part of any single assessment flow.
 */
export function SettingsMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = useReduceMotion();
  const transition = useMotionTransition({ duration: 0.16, ease: [0.16, 1, 0.3, 1] });
  const labelId = useId();
  const descId = useId();
  const switchId = useId();

  // Close on outside click and on Escape (returning focus to the trigger).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Display preferences"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          open
            ? 'border-hairline-strong bg-surface-2 text-ink'
            : 'border-hairline bg-surface-1 text-ink-subtle hover:border-hairline-strong hover:bg-surface-2 hover:text-ink',
        )}
      >
        <SlidersIcon className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Display preferences"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={transition}
            className="panel-glass absolute right-0 top-[calc(100%+8px)] z-50 w-[288px] origin-top-right p-4 shadow-glow-soft"
          >
            <p className="text-eyebrow uppercase text-ink-tertiary">Preferences</p>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <label
                  id={labelId}
                  htmlFor={switchId}
                  data-testid="reduce-motion-label"
                  className="block cursor-pointer text-body-sm font-medium text-ink"
                >
                  Reduce motion
                </label>
                <p id={descId} className="mt-0.5 text-caption leading-snug text-ink-subtle">
                  Minimizes non-essential movement and animations.
                </p>
              </div>
              <Switch
                id={switchId}
                data-testid="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={setReduceMotionOverride}
                aria-labelledby={labelId}
                aria-describedby={descId}
                className="mt-0.5"
              />
            </div>

            <div className="hairline-divider my-3" />
            <p className="text-caption leading-snug text-ink-tertiary">
              Follows your system setting until you choose here. Saved on this device only.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}
