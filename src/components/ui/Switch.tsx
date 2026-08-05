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
 * The switch visual, with no semantics of its own.
 *
 * Used directly by `Switch`, and reused by controls where the whole row is
 * already the interactive element (and carries its own `aria-pressed`), so
 * that both render an identical track and knob.
 */
export function SwitchTrack({
  on,
  className,
}: {
  on: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border p-px',
        'transition-colors duration-200 ease-out',
        on
          ? 'border-primary/70 bg-primary shadow-glow-soft'
          : 'border-hairline-strong bg-surface-3',
        className,
      )}
    >
      <span
        className={cn(
          'block h-[18px] w-[18px] rounded-full bg-ink shadow-sm',
          'transition-transform duration-200 ease-out',
          on ? 'translate-x-[16px]' : 'translate-x-0',
        )}
      />
    </span>
  );
}

/**
 * Toggle switch built from a native button so keyboard support
 * (Space / Enter) and focus handling come for free.
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
        'group inline-flex shrink-0 rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !disabled && 'hover:brightness-110',
        className,
      )}
    >
      <SwitchTrack on={checked} />
    </button>
  );
}
