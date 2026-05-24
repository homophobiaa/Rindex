import { cn } from '@/lib/cn';

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-eyebrow uppercase text-ink-subtle">
          <span className="h-1 w-1 rounded-full bg-primary" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-display-md text-gradient">{title}</h2>
      {description && (
        <p className={cn('max-w-2xl text-body text-ink-subtle', align === 'left' && 'mt-1')}>
          {description}
        </p>
      )}
    </div>
  );
}
