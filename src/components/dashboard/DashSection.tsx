import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Lightweight section wrapper for the dashboard.
 *
 * Deliberately un-boxed: a small eyebrow + title and the content, with
 * generous spacing. Keeps the page visual-first instead of a grid of
 * heavy cards.
 */
export function DashSection({
  eyebrow,
  title,
  hint,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn('mt-14', className)}
    >
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            {eyebrow}
          </span>
          <h2 className="mt-0.5 text-card-title font-medium text-ink">{title}</h2>
        </div>
        {hint && (
          <span className="hidden shrink-0 text-[11.5px] text-ink-tertiary sm:block">{hint}</span>
        )}
      </header>
      {children}
    </motion.section>
  );
}
