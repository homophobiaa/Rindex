import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';

export const KOFI_URL = 'https://ko-fi.com/homophobiaa';
export const SUPPORT_LABEL = 'Support RIndex';
export const SUPPORT_HINT = 'Useful? The tip jar is over here.';

/**
 * Routes where a bottom-corner pill would sit on top of something that
 * matters. The attack-path canvas fills the viewport and already owns all
 * four corners (details drawer, risk breakdown, transport controls, legend),
 * so the floating shortcut is suppressed there — the footer link remains.
 */
const SUPPRESSED_ROUTES = ['/risk-graph'];

/** Small coffee cup — matches the 1.6–1.8 stroke weight used elsewhere. */
function CoffeeIcon({ className }: { className?: string }) {
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
      <path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7 3v2.5M11 3v2.5" />
    </svg>
  );
}

/**
 * Floating support shortcut.
 *
 * Desktop only — on narrow screens a fixed pill competes with content and the
 * mobile menu, so the footer link carries it instead. It is a plain anchor:
 * no widget, no iframe, no Ko-fi script. Nothing from ko-fi.com is requested
 * until the link is clicked, which also keeps the offline build clean.
 */
export function SupportButton() {
  const { pathname } = useLocation();
  if (SUPPRESSED_ROUTES.includes(pathname)) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-40 hidden p-4 md:block"
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
      }}
    >
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noreferrer noopener"
        title={SUPPORT_HINT}
        aria-label={`${SUPPORT_LABEL} on Ko-fi — opens in a new tab`}
        className={cn(
          'pointer-events-auto group inline-flex min-h-[36px] items-center gap-2 rounded-full',
          'border border-hairline bg-surface-1/90 px-3.5 py-2 backdrop-blur-xl',
          'text-caption text-ink-subtle shadow-lg',
          // Opacity + color only. No transform, nothing that draws the eye.
          'opacity-80 transition-[opacity,border-color,color] duration-200',
          'hover:border-hairline-strong hover:text-ink hover:opacity-100',
          // Plain `focus:` too — any focus should lift it, not only the
          // keyboard heuristic that drives :focus-visible.
          'focus:text-ink focus:opacity-100',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        )}
      >
        <CoffeeIcon className="h-3.5 w-3.5 text-primary transition-colors group-hover:text-primary-hover" />
        {SUPPORT_LABEL}
      </a>
    </div>
  );
}

/** Inline text version for the footer. Always present, all breakpoints. */
export function SupportLink({ className }: { className?: string }) {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noreferrer noopener"
      title={SUPPORT_HINT}
      aria-label={`${SUPPORT_LABEL} on Ko-fi — opens in a new tab`}
      className={cn(
        'inline-flex min-h-[32px] items-center gap-1.5 rounded px-1 text-ink-subtle',
        'transition-colors hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
        className,
      )}
    >
      <CoffeeIcon className="h-3.5 w-3.5 text-primary" />
      {SUPPORT_LABEL}
    </a>
  );
}
