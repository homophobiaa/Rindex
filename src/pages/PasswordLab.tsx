import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { analyzePassword } from '@/lib/password/analyze';
import { PasswordInputCard } from '@/components/password-lab/PasswordInputCard';
import { VerdictSummary } from '@/components/password-lab/VerdictSummary';
import { ScorePanel } from '@/components/password-lab/ScorePanel';
import { AttackSimulation } from '@/components/password-lab/AttackSimulation';
import { PatternFindings } from '@/components/password-lab/PatternFindings';
import { EntropyVisualization } from '@/components/password-lab/EntropyVisualization';
import { Recommendations } from '@/components/password-lab/Recommendations';

/**
 * Password Lab — the first interactive RIndex experience.
 *
 * Layout flow (low-attention friendly):
 *  1. Input card with three obvious actions.
 *  2. Plain-language verdict (score + what's wrong + how to fix).
 *  3. Optional advanced analysis (charts, attack matrix, etc.).
 *
 * Privacy contract:
 *  - Password lives only in component state. Never written to storage.
 *  - Cleared on unmount. No network calls.
 */
export default function PasswordLab() {
  const [password, setPassword] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const verdictRef = useRef<HTMLDivElement | null>(null);
  const advancedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      setPassword('');
    };
  }, []);

  const analysis = useMemo(() => analyzePassword(password), [password]);

  // If the user clears the input, collapse advanced sections so they
  // don't pop back open unexpectedly when typing resumes.
  useEffect(() => {
    if (analysis.length === 0 && showAdvanced) {
      setShowAdvanced(false);
    }
  }, [analysis.length, showAdvanced]);

  const handleAnalyze = () => {
    verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleAdvanced = () => {
    setShowAdvanced((prev) => {
      const next = !prev;
      if (next) {
        // Scroll after render
        window.setTimeout(() => {
          advancedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
      return next;
    });
  };

  return (
    <main className="relative pt-28 pb-section">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <div className="container-rindex">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="eyebrow">Password Lab</span>
          <h1 className="mt-3 text-display-lg text-gradient">
            How strong is your password?
          </h1>
          <p className="mt-4 text-body-lg text-ink-subtle">
            Find out in 2 seconds. We&rsquo;ll show you the score, what&rsquo;s wrong,
            and how to fix it — all in your browser.
          </p>
        </motion.header>

        {/* Input */}
        <div className="mx-auto mt-10 max-w-2xl">
          <PasswordInputCard
            password={password}
            onChange={setPassword}
            analysis={analysis}
            isDemo={isDemo}
            onDemoChange={setIsDemo}
            onAnalyze={handleAnalyze}
          />
        </div>

        {/* Verdict */}
        <div ref={verdictRef} className="mx-auto mt-6 max-w-3xl scroll-mt-24">
          <VerdictSummary analysis={analysis} />
        </div>

        {/* Advanced toggle */}
        {analysis.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center">
            <button
              type="button"
              onClick={handleToggleAdvanced}
              className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1/60 px-4 py-2 text-body-sm text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
            >
              <span>
                {showAdvanced ? 'Hide advanced analysis' : 'Show advanced analysis'}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Advanced sections */}
        {showAdvanced && analysis.length > 0 && (
          <motion.section
            ref={advancedRef}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 max-w-5xl scroll-mt-24"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="text-eyebrow uppercase text-ink-subtle">Advanced analysis</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <ScorePanel analysis={analysis} />
                </div>
                <div className="lg:col-span-2">
                  <PatternFindings analysis={analysis} />
                </div>
              </div>

              <AttackSimulation analysis={analysis} />
              <EntropyVisualization analysis={analysis} />
              <Recommendations analysis={analysis} />
            </div>
          </motion.section>
        )}

        {/* Trust footer */}
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <div className="text-body-sm font-medium text-ink">100% local analysis</div>
                <div className="text-caption text-ink-subtle">
                  Every byte of this calculation runs in your browser. No network requests.
                </div>
              </div>
            </div>
            <a
              href="/methodology"
              className="inline-flex h-9 items-center gap-1.5 self-start rounded-md border border-hairline px-3 text-body-sm text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink sm:self-auto"
            >
              How this works
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
