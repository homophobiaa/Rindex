import { motion } from 'framer-motion';
import { useDrawProps } from '@/lib/motion';
import type { FactorState } from '@/lib/risk';
import { posture } from '@/lib/profile';
import {
  confidenceFor,
  scoreSummary,
  weakestLinks,
  priorityRecommendations,
} from '@/lib/dashboard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * The 5-second hero.
 *
 * Left: the large animated RiskIndex with posture, verdict, and a
 * confidence chip. Right: the two things a low-attention-span user needs
 * — their single biggest problem and the first fix to make. Everything
 * else on the page is detail behind these three facts.
 */
export function ScoreSummary({
  state,
  answeredCount,
  totalQuestions,
}: {
  state: FactorState;
  answeredCount: number;
  totalQuestions: number;
}) {
  const summary = scoreSummary(state);
  const post = posture(summary.score);
  const confidence = confidenceFor(answeredCount, totalQuestions);
  const biggest = weakestLinks(state, 1)[0];
  const firstFix = priorityRecommendations(state, 1)[0];

  // Gauge ring geometry — swept via stroke-dashoffset for a smooth tween.
  const R = 48;
  const CIRC = 2 * Math.PI * R;
  const gaugeSweep = useDrawProps(
    { strokeDashoffset: CIRC },
    { strokeDashoffset: CIRC * (1 - summary.score / 100) },
    { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
  );

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Score gauge */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-1/50 p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: summary.accent }}
        />
        <div className="relative flex items-center gap-6">
          {/* Gauge ring */}
          <div className="relative grid h-28 w-28 shrink-0 place-items-center">
            <svg viewBox="0 0 112 112" className="absolute inset-0 h-28 w-28 -rotate-90">
              <circle cx="56" cy="56" r={R} fill="none" stroke="#1a1b20" strokeWidth="7" />
              <motion.circle
                cx="56"
                cy="56"
                r={R}
                fill="none"
                stroke={summary.accent}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                {...gaugeSweep}
              />
            </svg>
            <div className="relative text-center">
              <AnimatedNumber
                value={summary.score}
                duration={1.3}
                className="text-[40px] font-semibold leading-none tabular-nums text-ink"
              />
              <div className="mt-0.5 text-micro uppercase tracking-[0.16em] text-ink-tertiary">
                / 100
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
              RiskIndex
            </span>
            <div
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: `${post.accent}1a`,
                border: `1px solid ${post.accent}44`,
                color: post.accent,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: post.accent }} />
              <span className="text-[12px] font-medium">{post.label}</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-subtle">{summary.verdict}</p>
          </div>
        </div>

        {/* Confidence + attack-probability footer */}
        <div className="relative mt-5 flex items-center justify-between border-t border-hairline pt-3">
          <Metric label="Attack probability" value={`${Math.round(summary.attackProbability * 100)}%`} />
          <ConfidenceChip ratio={confidence.ratio} label={confidence.label} accent={post.accent} />
        </div>
      </div>

      {/* 5-second action card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface-1/50 p-6">
        <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
          Read this first
        </span>

        {biggest ? (
          <FocusRow
            index="01"
            label="Your biggest problem"
            title={biggest.title}
            detail={biggest.detail}
            accent="#f04438"
          />
        ) : (
          <FocusRow
            index="01"
            label="Your biggest problem"
            title="No critical weaknesses"
            detail="Nothing is dragging your score down hard right now. Keep your defenses on."
            accent="#27a644"
          />
        )}

        {firstFix && (
          <FocusRow
            index="02"
            label="Fix this first"
            title={firstFix.action}
            detail={`${firstFix.why}`}
            accent={post.accent}
            badge={`−${firstFix.scoreReduction} pts`}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FocusRow({
  index,
  label,
  title,
  detail,
  accent,
  badge,
}: {
  index: string;
  label: string;
  title: string;
  detail: string;
  accent: string;
  badge?: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-hairline bg-surface-2/40 p-3.5">
      <span
        className="mt-0.5 font-mono text-[11px] tabular-nums"
        style={{ color: accent }}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-micro font-medium uppercase tracking-[0.14em] text-ink-tertiary">
            {label}
          </span>
          {badge && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-micro font-medium"
              style={{ background: `${accent}1a`, color: accent }}
            >
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-0.5 text-[14px] font-medium text-ink">{title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-subtle">{detail}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-micro font-medium uppercase tracking-[0.16em] text-ink-tertiary">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[18px] tabular-nums text-ink">{value}</div>
    </div>
  );
}

function ConfidenceChip({
  ratio,
  label,
  accent,
}: {
  ratio: number;
  label: string;
  accent: string;
}) {
  const C = 2 * Math.PI * 15;
  const sweep = useDrawProps(
    { strokeDashoffset: C },
    { strokeDashoffset: C * (1 - ratio) },
    { duration: 1, ease: [0.16, 1, 0.3, 1] },
  );
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="text-micro font-medium uppercase tracking-[0.16em] text-ink-tertiary">
          Answered
        </div>
        <div className="mt-0.5 text-[12px] font-medium text-ink">{label}</div>
      </div>
      <div className="grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1b20" strokeWidth="3" />
          <motion.circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            {...sweep}
          />
        </svg>
      </div>
    </div>
  );
}
