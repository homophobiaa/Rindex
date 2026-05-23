import { cn } from '@/lib/cn';

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-surface-1 shadow-inner-hairline">
        <svg viewBox="0 0 32 32" className="h-4 w-4">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a9b1ff" />
              <stop offset="100%" stopColor="#5e6ad2" />
            </linearGradient>
          </defs>
          <path
            d="M6 26 L6 6 L17 6 C21 6 24 8.5 24 12.2 C24 15 22 17.2 19.2 17.9 L26 26 L21 26 L14.6 18.5 L10.4 18.5 L10.4 26 Z M10.4 14.5 L16.4 14.5 C18.4 14.5 19.6 13.6 19.6 12.2 C19.6 10.8 18.4 10 16.4 10 L10.4 10 Z"
            fill="url(#logoGrad)"
          />
        </svg>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{ boxShadow: '0 0 24px -6px rgba(94,106,210,0.55)' }}
        />
      </span>
      {withWordmark && (
        <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
          RIndex
        </span>
      )}
    </span>
  );
}
