import { cn } from '@/lib/cn';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
};

/**
 * Toggle switch built from a native button so keyboard support
 * (Space / Enter) and focus handling come for free.
 *
 * Visual language matches Button: hairline border at rest, primary fill
 * with soft glow when on, and the same focus ring treatment.
 */
export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
  ...aria
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      disabled={disabled}
      aria-checked={checked}
      {...aria}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border p-px',
        'transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'border-primary/70 bg-primary shadow-glow-soft'
          : 'border-hairline-strong bg-surface-3 hover:border-ink-tertiary',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block h-[18px] w-[18px] rounded-full bg-ink shadow-sm',
          'transition-transform duration-200 ease-out',
          checked ? 'translate-x-[16px]' : 'translate-x-0',
        )}
      />
    </button>
  );
}
