import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useDarkExtension } from '@/lib/dark-extension';
import { useMotionTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

const DISMISS_KEY = 'rindex-darkreader-banner-dismissed';
const SUCCESS_MS = 3500;

/**
 * Routes whose bottom-left corner is already occupied. The attack-path
 * canvas puts the risk breakdown there at lg, so the banner is lifted clear
 * of it rather than sitting on top.
 */
const RAISED_ROUTES = ['/risk-graph'];

/**
 * Large-display sizing steps.
 *
 * Everything in this banner was fixed px, so it stayed literally identical
 * from 1440px to 3840px and read as tiny on a big monitor. Discrete steps
 * (rather than a fluid clamp) keep laptop and mobile pixel-for-pixel as they
 * were, and only grow once there is genuinely more room.
 */
const WIDTH_STEPS =
  'min-[1920px]:max-w-[min(40rem,calc(100vw-20rem))] min-[2560px]:max-w-[min(48rem,calc(100vw-24rem))]';
const TEXT_STEPS = 'text-caption min-[1920px]:text-body-sm min-[2560px]:text-body';
const ICON_STEPS =
  'h-4 w-4 min-[1920px]:h-[18px] min-[1920px]:w-[18px] min-[2560px]:h-5 min-[2560px]:w-5';
const SHELL_PAD_STEPS =
  'min-[1920px]:gap-3.5 min-[1920px]:px-4 min-[1920px]:py-3 min-[2560px]:gap-4 min-[2560px]:rounded-2xl min-[2560px]:px-5 min-[2560px]:py-4';
const BUTTON_STEPS =
  'min-[1920px]:px-4 min-[1920px]:py-2 min-[2560px]:px-5 min-[2560px]:py-2.5';

type View = 'hidden' | 'warn' | 'success';

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Banner shown when a dark-mode extension is restyling RIndex.
 *
 * Three states in one shell: warning while the extension is active, a brief
 * thank-you when it is switched off, then gone. Dismissal is per-tab-session
 * only, and never touches the extension or the site's styling — a page
 * cannot turn Dark Reader off, so nothing here pretends to.
 */
export function DarkExtensionBanner() {
  const { active, label } = useDarkExtension();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [view, setView] = useState<View>('hidden');
  /** Whether this page session has ever seen the extension active. */
  const everSeenActive = useRef(false);
  const transition = useMotionTransition({ duration: 0.32, ease: [0.22, 1, 0.36, 1] });

  useEffect(() => {
    if (active) {
      everSeenActive.current = true;
      setView(dismissed ? 'hidden' : 'warn');
      return;
    }
    // Inactive. Only celebrate if we actually watched it go off — never on a
    // plain load where no extension was ever present.
    if (!everSeenActive.current) {
      setView('hidden');
      return;
    }
    setView('success');
    const t = window.setTimeout(() => setView('hidden'), SUCCESS_MS);
    return () => window.clearTimeout(t);
  }, [active, dismissed]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode etc. — dismissal still applies for this mount.
    }
    setDismissed(true);
    setView('hidden');
  };

  const raised = RAISED_ROUTES.includes(pathname);

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-0 z-[45] flex w-full justify-start px-4 md:w-auto',
        raised ? 'bottom-[124px]' : 'bottom-0',
      )}
      style={{
        paddingBottom: raised ? undefined : 'calc(1rem + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
      }}
    >
      {/* Polite live region: announced without interrupting, never focused. */}
      <div aria-live="polite" aria-atomic="true" className="w-full md:w-auto">
        <AnimatePresence mode="wait">
          {view === 'warn' && (
            <motion.div
              key="warn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={transition}
              className={cn(
                'pointer-events-auto flex max-w-[min(34rem,100%)] flex-col gap-2.5 rounded-xl',
                // Reserve the Ko-fi pill's corner on md+ so the two never meet.
                'md:max-w-[min(34rem,calc(100vw-17rem))]',
                WIDTH_STEPS,
                'border border-hairline bg-surface-1/95 p-3.5 shadow-lg backdrop-blur-xl',
                'sm:flex-row sm:items-center sm:gap-3 sm:py-2.5',
                SHELL_PAD_STEPS,
              )}
            >
              <MoonIcon className={cn('shrink-0 text-warning', ICON_STEPS)} />
              <p className={cn('min-w-0 flex-1 leading-snug text-ink-muted', TEXT_STEPS)}>
                {label ?? 'A dark-mode extension'} detected. RIndex is already dark —
                double-dark makes the colors a little cursed.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className={cn(
                  'shrink-0 self-start whitespace-nowrap rounded-full border border-hairline',
                  'bg-surface-2 px-3 py-1.5 text-ink-subtle transition-colors',
                  TEXT_STEPS,
                  BUTTON_STEPS,
                  'hover:border-hairline-strong hover:text-ink',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:self-auto',
                )}
              >
                Keep it cursed
              </button>
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={transition}
              className={cn(
                'pointer-events-auto flex max-w-[min(34rem,100%)] items-center gap-2.5 rounded-xl',
                'md:max-w-[min(34rem,calc(100vw-17rem))]',
                WIDTH_STEPS,
                'border border-success/30 bg-success/[0.08] px-3.5 py-2.5 shadow-lg backdrop-blur-xl',
                SHELL_PAD_STEPS,
              )}
            >
              <CheckIcon className={cn('shrink-0 text-success', ICON_STEPS)} />
              <p className={cn('leading-snug text-ink-muted', TEXT_STEPS)}>
                Much better. One dark mode is plenty.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}
