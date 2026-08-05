import { useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query from JS.
 *
 * Used only where a layout genuinely cannot be expressed in CSS alone —
 * for example when a component animates to a fixed pixel width on desktop
 * but must be full-width and static on mobile. Prefer Tailwind breakpoints
 * for anything that is purely styling.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    () => false,
  );
}

/** True at Tailwind's `lg` breakpoint and above. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
