import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  attackProbability,
  compositeScore,
  pillarBreakdown,
  riskBand,
  riskBandColor,
  type FactorState,
} from '@/lib/risk';
import { posture, recommendationsFor, strengthsFor } from '@/lib/profile';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Final result dashboard.
 *
 * The "earned" reveal screen at the end of the flow. Designed to feel
 * cinematic without being a wall: layered transparency, large animated
 * score, posture banner, prioritized fix plan, and strengths so users
 * who already have a strong posture get rewarded, not just lectured.
 */
export function ResultDashboard({
  state,
  onRestart,
}: {
  state: FactorState;
  onRestart: () => void;
}) {
  const score = compositeScore(state);
  const band = riskBand(score);
  const accent = riskBandColor(band);
  const post = posture(score);
  const attackP = attackProbability(score);

  const breakdown = pillarBreakdown(state);
  const recs = useMemo(() => recommendationsFor(state), [state]);
  const strengths = useMemo(() => strengthsFor(state), [state]);

  // "Improvement headroom": how many points could be shed by acting on
  // every open recommendation. Capped at the current score.
  const headroom = Math.min(score, recs.reduce((s, r) => s + r.impact, 0));
  const projected = Math.max(0, Math.round(score - headroom));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-4xl"
    >
      {/* Hero reveal */}
      <div className="text-center">
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.18em' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-tertiary"
        >
          Your RiskIndex
        </motion.span>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 inline-flex items-baseline gap-2"
        >
          <AnimatedNumber
            value={score}
            duration={1.4}
            className="text-[96px] font-semibold tabular-nums leading-none"
          />
          <span className="text-[22px] text-ink-tertiary">/100</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
          style={{
            background: `${post.accent}1a`,
            border: `1px solid ${post.accent}44`,
            color: post.accent,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: post.accent }} />
          <span className="text-[12px] font-medium">{post.label}</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-ink-subtle"
        >
          {post.blurb}
        </motion.p>
      </div>

      {/* Hero metrics row */}
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <HeroTile
          label="Attack-success P"
          value={`${Math.round(attackP * 100)}%`}
          accent={accent}
          detail="Probability an attacker compromises something."
        />
        <HeroTile
          label="Potential RiskIndex"
          value={`${projected}`}
          accent={post.accent}
          detail={`Score if you act on every open fix (−${Math.round(headroom)} pts).`}
        />
        <HeroTile
          label="Open fixes"
          value={`${recs.length}`}
          accent="#5e6ad2"
          detail="Concrete, factor-level changes you can make today."
        />
      </div>

      {/* Pillar breakdown */}
      <Section title="Per-pillar breakdown" subtitle="Where your risk concentrates.">
        <div className="grid gap-3 sm:grid-cols-2">
          {breakdown
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((b, i) => (
              <motion.div
                key={b.pillar.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-hairline bg-surface-1/60 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-ink">{b.pillar.label}</span>
                  <span
                    className="font-mono text-[12px] tabular-nums"
                    style={{ color: b.pillar.accent }}
                  >
                    {Math.round(b.score)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-ink-tertiary">{b.pillar.blurb}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: b.pillar.accent }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            ))}
        </div>
      </Section>

      {/* Fix plan */}
      {recs.length > 0 && (
        <Section
          title="Personalized fix plan"
          subtitle="Ranked by RiskIndex impact — start at the top."
        >
          <div className="space-y-2">
            {recs.map((r, i) => (
              <motion.article
                key={r.factorId}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-3 rounded-xl border border-hairline bg-surface-1/60 p-4"
              >
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <span className="font-mono text-[11px] tabular-nums text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-micro font-medium text-danger">
                    −{r.impact}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13.5px] font-medium text-ink">{r.title}</h4>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-subtle">
                    {r.detail}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Section
          title="What you already do well"
          subtitle="These habits are pulling your score down — keep them."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {strengths.map((s, i) => (
              <motion.div
                key={s.factorId}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 px-3 py-2.5"
              >
                <CheckIcon />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-ink">{s.title}</div>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-ink-tertiary">
                    {s.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Footer CTAs */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border border-hairline bg-surface-2/60 px-5 py-2.5 text-[13px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
        >
          Run it again
        </button>
        <Link
          to="/dashboard"
          className="rounded-full border border-primary/40 bg-primary/15 px-5 py-2.5 text-[13px] text-ink shadow-glow-soft transition-colors hover:bg-primary/25"
        >
          Open your security dashboard →
        </Link>
        <Link
          to="/methodology"
          className="rounded-full border border-hairline bg-surface-2/60 px-5 py-2.5 text-[13px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
        >
          How this is scored
        </Link>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-[11px] leading-relaxed text-ink-tertiary">
        Every calculation ran locally in your browser. No answers were
        transmitted, stored, or logged. Reload this tab and your profile
        is gone.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <header className="mb-4">
        <h3 className="text-card-title font-medium text-ink">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-subtle">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function HeroTile({
  label,
  value,
  accent,
  detail,
}: {
  label: string;
  value: string;
  accent: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1/60 p-4">
      <div className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
        {label}
      </div>
      <div
        className="mt-1 font-mono text-[28px] tabular-nums leading-none"
        style={{ color: accent }}
      >
        {value}
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-ink-tertiary">{detail}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 shrink-0 text-success"
      aria-hidden
    >
      <path
        d="M5 12l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
