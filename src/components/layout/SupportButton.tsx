import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';

export const KOFI_URL = 'https://ko-fi.com/homophobiaa';
export const SUPPORT_LABEL = 'Support RIndex';
export const SUPPORT_HINT = 'Useful? You can buy me a coffee.';

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
      // flex, not block: an inline-block anchor sits on a line box, and the
      // baseline descender under it makes the box grow downward as well as
      // up. Flex removes the line box so the bottom edge stays pinned.
      className="pointer-events-none fixed bottom-0 right-0 z-40 hidden justify-end p-4 md:flex"
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
      }}
    >
      {/* Hover/focus state is driven entirely by CSS on this wrapper
          (`:hover` / `:focus-within`) — no JS state, no timers.
          Shrink-wraps to the pill, which is what makes the strip below
          inherit the pill's exact width via `w-full`.

          `pointer-events-none` here so the reserved (empty) space under the
          pill never blocks the page; only the pill itself takes pointer
          events, and hovering it still sets :hover on this ancestor. */}
      <div className="support-anchor pointer-events-none relative">
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${SUPPORT_LABEL} on Ko-fi — opens in a new tab. ${SUPPORT_HINT}`}
          className={cn(
            // z-10 so the pill is painted over the strip's top edge.
            'support-pill group pointer-events-auto relative z-10 flex min-h-[36px] items-center justify-center gap-2 rounded-full',
            'border border-hairline bg-surface-1/90 px-3.5 py-2 backdrop-blur-xl',
            'text-caption text-ink-subtle shadow-lg',
            'opacity-80 transition-[opacity,border-color,color] duration-200',
            'hover:border-hairline-strong hover:text-ink hover:opacity-100',
            // Plain `focus:` too — any focus should lift it, not only the
            // keyboard heuristic that drives :focus-visible.
            'focus:text-ink focus:opacity-100',
            'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-primary-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          )}
        >
          <CoffeeIcon className="h-3.5 w-3.5 shrink-0 text-primary transition-colors group-hover:text-primary-hover" />
          {SUPPORT_LABEL}
        </a>

        {/* The slot. Height animates 0fr → 1fr; the strip inside slides down
            from -80%, so it feeds out from under the pill. `--support-tuck` puts
            its straight top edge behind the pill, so there
            is no seam and no second capsule. aria-hidden because the link's
            accessible name already carries the message. */}
        <div className="support-roll pointer-events-none" aria-hidden>
          <div>
            <div
              className={cn(
                'support-note flex w-full items-center justify-center',
                // Straight top, rounded bottom, no top border — a strip, not
                // a capsule. Quieter surface and border than the pill.
                'rounded-b-lg rounded-t-none border border-t-0 border-hairline-tertiary',
                'bg-surface-2/80 px-3 pt-2.5 backdrop-blur-xl',
                'text-center text-micro leading-snug text-ink-tertiary',
              )}
            >
              {SUPPORT_HINT}
            </div>
          </div>
        </div>
      </div>
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
