import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProfile } from '@/store/profile';
import { sampleProfile, SAMPLE_ANSWERED, SAMPLE_TOTAL } from '@/lib/dashboard';
import type { FactorState } from '@/lib/risk';
import { DashSection } from '@/components/dashboard/DashSection';
import { ScoreSummary } from '@/components/dashboard/ScoreSummary';
import { AttackLikelihoods } from '@/components/dashboard/AttackLikelihoods';
import { WeakestLinks } from '@/components/dashboard/WeakestLinks';
import { StrongestDefenses } from '@/components/dashboard/StrongestDefenses';
import { AttackMap } from '@/components/dashboard/AttackMap';
import { RiskTimeline } from '@/components/dashboard/RiskTimeline';
import { PriorityRecommendations } from '@/components/dashboard/PriorityRecommendations';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';

/**
 * Unified Risk Dashboard.
 *
 * The "my security posture" home for a completed profile. Reads from the
 * in-memory profile store (populated by the Personal Risk Profiler). When
 * no profile exists it shows a polished empty state with a sample-data
 * preview, so the page is never broken or blank.
 *
 * Every number on this page derives from the SHARED `@/lib/risk` engine
 * via `@/lib/dashboard` — there is no parallel scoring logic.
 */
export default function Dashboard() {
  const { result } = useProfile();
  const [previewing, setPreviewing] = useState(false);

  // No real profile and not previewing → empty state.
  if (!result && !previewing) {
    return (
      <PageShell>
        <DashboardEmptyState onPreview={() => setPreviewing(true)} />
      </PageShell>
    );
  }

  const isSample = !result;
  const state: FactorState = result?.state ?? sampleProfile();
  const answeredCount = result?.answeredCount ?? SAMPLE_ANSWERED;
  const totalQuestions = result?.totalQuestions ?? SAMPLE_TOTAL;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
              Unified Risk Dashboard
            </span>
            <h1 className="mt-1 text-headline font-semibold text-ink">Your security posture</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/assessment"
              className="rounded-full border border-hairline bg-surface-2/60 px-4 py-2 text-[12.5px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
            >
              {result ? 'Re-run profiler' : 'Start profiler'}
            </Link>
            <Link
              to="/risk-graph"
              className="rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-[12.5px] text-ink transition-colors hover:bg-primary/25"
            >
              Full attack paths →
            </Link>
          </div>
        </motion.header>

        {/* Sample banner */}
        {isSample && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/[0.07] px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-warning/15 text-warning">
                <InfoIcon />
              </span>
              <p className="text-[12.5px] text-ink-subtle">
                <span className="font-medium text-ink">Sample data.</span> This is an example
                profile — run the profiler to see your own numbers.
              </p>
            </div>
            <Link
              to="/assessment"
              className="shrink-0 rounded-full border border-warning/40 bg-warning/10 px-3.5 py-1.5 text-[12px] font-medium text-warning transition-colors hover:bg-warning/20"
            >
              Start Risk Profiler →
            </Link>
          </motion.div>
        )}

        {/* 1 · Score summary (the 5-second read) */}
        <ScoreSummary
          state={state}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
        />

        {/* 4 · Attack likelihoods */}
        <DashSection
          eyebrow="Threat model"
          title="Attack likelihoods"
          hint="Estimated success odds, most likely first"
        >
          <AttackLikelihoods state={state} />
        </DashSection>

        {/* 2 + 3 · Weakest links and strongest defenses, side by side */}
        <DashSection eyebrow="Diagnosis" title="Weakest links & strongest defenses">
          <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-danger/90">
                Top risk drivers
              </h3>
              <WeakestLinks state={state} />
            </div>
            <div>
              <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-success/90">
                What you do well
              </h3>
              <StrongestDefenses state={state} />
            </div>
          </div>
        </DashSection>

        {/* 5 · Personalized attack map */}
        <DashSection
          eyebrow="Graph"
          title="Personalized attack map"
          hint="Generated from your answers"
        >
          <AttackMap state={state} />
        </DashSection>

        {/* 6 · Risk reduction timeline */}
        <DashSection
          eyebrow="Forecast"
          title="Risk reduction timeline"
          hint="Apply the top fixes in order"
        >
          <RiskTimeline state={state} />
        </DashSection>

        {/* 7 · Priority recommendations */}
        <DashSection
          eyebrow="Action plan"
          title="Priority recommendations"
          hint="Ranked by impact per effort"
        >
          <PriorityRecommendations state={state} />
        </DashSection>

        <p className="mx-auto mt-14 max-w-xl text-center text-[11px] leading-relaxed text-ink-tertiary">
          Every calculation ran locally in your browser. No answers were transmitted, stored, or
          logged. Reload this tab and your profile is gone.
        </p>
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative pb-section pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>
      <div className="container-rindex">{children}</div>
    </main>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 7.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
