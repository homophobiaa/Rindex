import { cn } from '@/lib/cn';

type LogoProps = {
  className?: string;
  /** Show wordmark next to the logomark. Uses logo-with-text.png when true. */
  withWordmark?: boolean;
  /** Pixel height of the rendered logo. */
  size?: number;
};

export function Logo({ className, withWordmark = true, size = 28 }: LogoProps) {
  const src = withWordmark ? '/logo-with-text.png' : '/logo.png';
  return (
    <span className={cn('inline-flex items-center', className)} aria-label="RIndex">
      <img
        src={src}
        alt="RIndex"
        style={{ height: size, width: 'auto' }}
        className="select-none"
        draggable={false}
      />
    </span>
  );
}
