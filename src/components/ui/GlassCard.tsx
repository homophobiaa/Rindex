import { cn } from '@/lib/cn';

export function GlassCard({
  className,
  children,
  glow = false,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div className={cn('panel-glass', glow && 'shadow-glow-soft', className)}>
      {children}
    </div>
  );
}
