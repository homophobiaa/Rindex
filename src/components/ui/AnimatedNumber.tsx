import { useEffect } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';
import { useReduceMotion } from '@/lib/reduce-motion';

/**
 * Animated number that tweens to its target value.
 * Renders an integer or fixed-decimal string and respects reduced motion.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.2,
  className,
  format,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  /** Optional custom formatter. Receives the live tweened number. */
  format?: (n: number) => string;
}) {
  const reduceMotion = useReduceMotion();
  const mv = useMotionValue(0);
  const display = useTransform(mv, (latest) => {
    if (format) return format(latest);
    return latest.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  useEffect(() => {
    if (reduceMotion) {
      mv.set(value);
      return;
    }
    // Tween from whatever value is currently displayed so rapid changes
    // never visually snap backwards.
    const controls = animate(mv.get(), value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => mv.set(latest),
    });
    return controls.stop;
  }, [value, duration, mv, reduceMotion]);

  return <motion.span className={className}>{display}</motion.span>;
}
