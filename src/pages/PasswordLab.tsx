import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { analyzePassword } from '@/lib/password/analyze';
import { PasswordInputCard } from '@/components/password-lab/PasswordInputCard';
import { ScorePanel } from '@/components/password-lab/ScorePanel';
import { AttackSimulation } from '@/components/password-lab/AttackSimulation';
import { PatternFindings } from '@/components/password-lab/PatternFindings';
import { EntropyVisualization } from '@/components/password-lab/EntropyVisualization';
import { Recommendations } from '@/components/password-lab/Recommendations';

/**
 * Password Lab — the first interactive RIndex experience.
 *
 * Privacy contract:
 *  - Password lives in component state only. Never written to storage.
 *  - Cleared on unmount.
 *  - No network calls at any point in the analysis pipeline.
 */
export default function PasswordLab() {
  const [password, setPassword] = useState('');
  const [safeMode, setSafeMode] = useState(false);

  // Clear sensitive state on unmount.
  useEffect(() => {
    return () => {
      setPassword('');
    };
  }, []);

  const analysis = useMemo(() => analyzePassword(password), [password]);

  return (
    <main className="relative pt-28 pb-section">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <div className="container-rindex">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="eyebrow">Password Lab</span>
          <h1 className="mt-3 text-display-lg text-gradient">
            Watch how an attacker would see your password.
          </h1>
          <p className="mt-4 text-body-lg text-ink-subtle">
            A real-time, fully local analysis pipeline — entropy estimation, attack
            simulation across hardware tiers, and explainable pattern detection. Nothing
            leaves your browser.
          </p>
        </motion.header>

        <div className="mt-12 grid gap-6">
          <PasswordInputCard
            password={password}
            onChange={setPassword}
            analysis={analysis}
            safeMode={safeMode}
            onSafeModeChange={setSafeMode}
          />

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

          {/* Methodology / trust footer */}
          <div className="panel mt-2 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
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
                  Every byte of this calculation runs in your browser. Open DevTools →
                  Network — you will see zero requests during analysis.
                </div>
              </div>
            </div>
            <a
              href="/methodology"
              className="inline-flex h-9 items-center gap-1.5 self-start rounded-md border border-hairline px-3 text-body-sm text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink sm:self-auto"
            >
              Methodology
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
