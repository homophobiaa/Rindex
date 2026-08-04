import { useMemo } from 'react';
import type { Transition, Variants } from 'framer-motion';
import { useReduceMotion } from '@/lib/reduce-motion';

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeStandard = [0.4, 0, 0.2, 1] as const;

/** Collapses any animation to a single instant frame. */
export const INSTANT: Transition = { duration: 0 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: easeOutExpo } },
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

/* ------------------------------------------------------------------ */
/* Reduced-motion helpers                                              */
/*                                                                     */
/* `<MotionConfig reducedMotion="always">` in App.tsx already snaps    */
/* every transform + width/height/top/left/right/bottom animation.     */
/* These helpers cover what it deliberately leaves alone: SVG draw     */
/* props (strokeDashoffset, pathLength), imperative `animate()` calls, */
/* chart reveals, viewport tweens and purely-visual timers.            */
/* ------------------------------------------------------------------ */

/**
 * Returns the given transition normally, or an instant one when the user
 * has reduced motion enabled. Use for animations Framer Motion's
 * `reducedMotion` setting does not treat as positional.
 */
export function useMotionTransition(transition: Transition): Transition {
  const reduce = useReduceMotion();
  return reduce ? INSTANT : transition;
}

/**
 * Duration in seconds, or 0 when motion is reduced.
 * For APIs that take a raw number (React Flow `fitView`, Recharts, …)
 * pass `ms` to get milliseconds instead.
 */
export function useMotionDuration(seconds: number, unit: 's' | 'ms' = 's') {
  const reduce = useReduceMotion();
  if (reduce) return 0;
  return unit === 'ms' ? seconds * 1000 : seconds;
}

/**
 * Variants for scroll/entrance reveals. Under reduced motion the element
 * is fully visible in both states — content is never hidden, it simply
 * appears without travel or delay.
 */
export function useRevealVariants(): { fadeUp: Variants; fadeIn: Variants; scaleIn: Variants } {
  const reduce = useReduceMotion();
  return useMemo(() => {
    if (!reduce) return { fadeUp, fadeIn, scaleIn };
    const shown: Variants = {
      hidden: { opacity: 1 },
      show: { opacity: 1, transition: INSTANT },
    };
    return { fadeUp: shown, fadeIn: shown, scaleIn: shown };
  }, [reduce]);
}

/**
 * Props for an SVG draw / sweep animation — `strokeDashoffset`, `pathLength`,
 * bar `width`, and friends. Framer Motion's `reducedMotion` setting does not
 * treat these as positional, so they need explicit handling.
 *
 * Under reduced motion the element renders at its final value immediately,
 * so the shape is always fully drawn and never invisible.
 */
export function useDrawProps<T extends Record<string, string | number>>(
  from: T,
  to: T,
  transition: Transition,
) {
  const reduce = useReduceMotion();
  return useMemo(
    () =>
      reduce
        ? { initial: to, animate: to, transition: INSTANT }
        : { initial: from, animate: to, transition },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduce, JSON.stringify(from), JSON.stringify(to)],
  );
}

/** Stagger container that collapses to no stagger / no delay when reduced. */
export function useStaggerContainer(stagger = 0.08, delay = 0): Variants {
  const reduce = useReduceMotion();
  return useMemo(
    () => (reduce ? staggerContainer(0, 0) : staggerContainer(stagger, delay)),
    [reduce, stagger, delay],
  );
}
