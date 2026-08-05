import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface LabSectionProps {
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  concept: string;
  weakness?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Visual shell shared by every lab section.
 *
 * Provides a numbered eyebrow, title, short description, and an
 * educational "what it teaches / weakness" footer.  Keeps the four labs
 * visually consistent without nesting each one inside its own heavy card.
 */
export function LabSection({
  index,
  eyebrow,
  title,
  description,
  concept,
  weakness,
  children,
  className,
}: LabSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn('scroll-mt-24', className)}
    >
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-micro tabular-nums text-ink-tertiary">
            {String(index).padStart(2, '0')}
          </span>
          <div>
            <span className="text-micro font-medium uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
            <h2 className="mt-0.5 text-headline font-medium text-ink">{title}</h2>
          </div>
        </div>
      </header>

      <p className="mb-6 max-w-2xl text-body text-ink-subtle">{description}</p>

      <div className="rounded-2xl border border-hairline bg-surface-1/60 p-5 backdrop-blur-sm sm:p-6">
        {children}
      </div>

      <footer className="mt-4 grid gap-3 sm:grid-cols-2">
        <ConceptCard label="Why it matters" body={concept} accent="#5e6ad2" />
        {weakness && <ConceptCard label="Weakness / lesson" body={weakness} accent="#f04438" />}
      </footer>
    </motion.section>
  );
}

function ConceptCard({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3">
      <div
        className="text-micro font-medium uppercase tracking-wider"
        style={{ color: accent }}
      >
        {label}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
