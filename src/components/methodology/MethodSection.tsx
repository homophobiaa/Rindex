import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface MethodSectionProps {
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  /** Optional footer note rendered under the panel. */
  footnote?: string;
  /** Render the panel without the surface card (for fully custom layouts). */
  flush?: boolean;
}

/**
 * Methodology page section shell.
 *
 * Numbered eyebrow + title + description + content panel. Mirrors the
 * visual language of `LabSection` from the Crypto Lab so both pages
 * read as part of the same product.
 */
export function MethodSection({
  index,
  eyebrow,
  title,
  description,
  children,
  className,
  footnote,
  flush,
}: MethodSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn('scroll-mt-24', className)}
    >
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] tabular-nums text-ink-tertiary">
            {String(index).padStart(2, '0')}
          </span>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
            <h2 className="mt-0.5 text-headline font-medium text-ink">{title}</h2>
          </div>
        </div>
      </header>

      <p className="mb-6 max-w-2xl text-body text-ink-subtle">{description}</p>

      {flush ? (
        <div>{children}</div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface-1/60 p-5 backdrop-blur-sm sm:p-6">
          {children}
        </div>
      )}

      {footnote && (
        <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-ink-tertiary">
          {footnote}
        </p>
      )}
    </motion.section>
  );
}
