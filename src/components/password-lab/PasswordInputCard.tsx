import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AnalysisResult } from '@/lib/password/analyze';
import { generateSecurePassword } from '@/lib/password/analyze';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const SAFE_MODE_TEMPLATE = 'XxxxxxxxxxXX99!!';

type Props = {
  password: string;
  onChange: (v: string) => void;
  analysis: AnalysisResult;
  safeMode: boolean;
  onSafeModeChange: (v: boolean) => void;
};

/**
 * Cinematic password input panel. Live strength bar reflects the current
 * classification color and entropy bits. Never logs the password.
 */
export function PasswordInputCard({
  password,
  onChange,
  analysis,
  safeMode,
  onSafeModeChange,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleGenerate = () => {
    const next = generateSecurePassword(20);
    onChange(next);
    setVisible(true);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop */
    }
  };

  const pct = Math.min(100, (analysis.effectiveEntropyBits / 90) * 100);
  const color = classColor(analysis.classification);

  return (
    <div className="relative">
      {/* halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px]"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, ${color}26, transparent 70%)`,
          opacity: focused ? 1 : 0.6,
          transition: 'opacity 350ms ease',
        }}
      />

      <div className="panel-glass gradient-border noise relative overflow-hidden p-6 md:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-caption text-success">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Local-only analysis · 0 network requests
          </div>

          <div className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface-2 p-0.5 text-caption">
            <button
              type="button"
              onClick={() => {
                onSafeModeChange(false);
              }}
              className={cn(
                'rounded-[6px] px-2.5 py-1 transition-colors',
                !safeMode ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink',
              )}
            >
              Real password
            </button>
            <button
              type="button"
              onClick={() => {
                onSafeModeChange(true);
                if (!password) onChange(SAFE_MODE_TEMPLATE);
              }}
              className={cn(
                'rounded-[6px] px-2.5 py-1 transition-colors',
                safeMode ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink',
              )}
            >
              Simulate
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="mt-6">
          <label htmlFor="pw-input" className="text-eyebrow uppercase text-ink-subtle">
            {safeMode ? 'Pattern simulation' : 'Enter a password to analyze'}
          </label>
          <div
            className={cn(
              'mt-2 flex items-center gap-2 rounded-lg border bg-surface-2/60 px-4 py-3 transition-all duration-200',
              focused ? 'border-primary/50 bg-surface-2' : 'border-hairline',
            )}
            style={{ boxShadow: focused ? `0 0 0 4px ${color}1f` : undefined }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-subtle" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
            <input
              id="pw-input"
              type={visible || safeMode ? 'text' : 'password'}
              value={password}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              placeholder={safeMode ? 'Edit this safe pattern...' : 'Type or paste a password'}
              className="flex-1 bg-transparent font-mono text-[18px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <IconButton
                label={visible ? 'Hide' : 'Show'}
                onClick={() => setVisible((v) => !v)}
                icon={visible ? <EyeOffIcon /> : <EyeIcon />}
              />
              <IconButton
                label={copied ? 'Copied' : 'Copy'}
                onClick={handleCopy}
                disabled={!password}
                icon={copied ? <CheckIcon /> : <CopyIcon />}
              />
              <IconButton label="Clear" onClick={() => onChange('')} disabled={!password} icon={<XIcon />} />
            </div>
          </div>

          {/* live strength bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-caption">
              <span className="text-ink-subtle">Real-time entropy</span>
              <span className="font-mono text-ink-muted">
                {analysis.effectiveEntropyBits.toFixed(1)} bits · {analysis.length} chars
              </span>
            </div>
            <SegmentedStrengthBar pct={pct} color={color} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleGenerate} leadingIcon={<SparkleIcon />}>
            Generate secure password
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => onChange('')}
            disabled={!password}
            leadingIcon={<XIcon />}
          >
            Clear
          </Button>
          <span className="ml-auto max-w-md text-caption text-ink-tertiary">
            Tip: avoid pasting passwords you actively use on critical accounts. The pattern
            simulator gives you the same analysis without typing your real one.
          </span>
        </div>
      </div>
    </div>
  );
}

function SegmentedStrengthBar({ pct, color }: { pct: number; color: string }) {
  const segments = 24;
  const filled = Math.round((pct / 100) * segments);
  return (
    <div className="mt-2 flex h-2 gap-[3px]">
      {Array.from({ length: segments }).map((_, i) => {
        const isOn = i < filled;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: isOn ? 1 : 0.18,
              backgroundColor: isOn ? color : '#23252a',
            }}
            transition={{ duration: 0.4, delay: isOn ? i * 0.012 : 0, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-[2px]"
          />
        );
      })}
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function classColor(c: AnalysisResult['classification']): string {
  switch (c) {
    case 'critical':
    case 'weak':
      return '#f04438';
    case 'vulnerable':
      return '#f79009';
    case 'safe':
      return '#27a644';
    case 'hardened':
      return '#5e6ad2';
  }
}

/* icons */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.2 3.9M6.1 6.1C3.1 7.8 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" strokeLinecap="round" />
    </svg>
  );
}
