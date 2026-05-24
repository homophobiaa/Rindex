import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children: React.ReactNode;
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 select-none';

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-glow-soft hover:bg-primary-hover hover:shadow-glow active:bg-primary-focus',
  secondary:
    'bg-surface-1 text-ink border border-hairline hover:border-hairline-strong hover:bg-surface-2',
  tertiary: 'bg-transparent text-ink hover:bg-surface-1',
  ghost: 'bg-transparent text-ink-subtle hover:text-ink hover:bg-surface-1/60',
};

export const Button = forwardRef<HTMLButtonElement, CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant = 'primary', size = 'md', className, leadingIcon, trailingIcon, children, ...rest }, ref) => (
    <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  ),
);
Button.displayName = 'Button';

type LinkButtonProps = CommonProps & {
  to: string;
  external?: boolean;
};

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  leadingIcon,
  trailingIcon,
  children,
  to,
  external,
}: LinkButtonProps) {
  const classes = cn(base, sizes[size], variants[variant], className);
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener" className={classes}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </a>
    );
  }
  return (
    <Link to={to} className={classes}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
