import { motion } from 'framer-motion';

/**
 * Intro / hook screen.
 *
 * One-tap entry into the flow. Designed to dispel the "long survey"
 * feeling: a single visible CTA, two reassurance lines, and clear
 * "private + fast" framing.
 */
export function IntroScene({ onStart, totalQuestions }: { onStart: () => void; totalQuestions: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="eyebrow">Personal Risk Profiler</span>
      <h1 className="mt-3 text-display-md text-gradient">
        Find your RiskIndex in about a minute.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-body text-ink-subtle">
        Around {totalQuestions} multiple-choice questions about your habits. No signup,
        nothing sent anywhere. Your score updates as you answer, and you finish with a
        ranked list of what to change first.
      </p>

      {/* Trust strip */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <TrustChip dot="#27a644" label="Runs locally" />
        <TrustChip dot="#5e6ad2" label="No signup" />
        <TrustChip dot="#4cc2ff" label="Live scoring" />
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-6 py-3 text-[14px] font-medium text-ink shadow-glow-soft transition-colors hover:bg-primary/25"
      >
        Start the diagnostic
        <ArrowRight />
      </motion.button>

      {/* Floating preview chips */}
      <div className="mt-12 grid gap-2 sm:grid-cols-3">
        {PREVIEW.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-hairline bg-surface-1/50 p-4 text-left"
          >
            <div
              className="text-micro font-medium uppercase tracking-[0.18em]"
              style={{ color: p.accent }}
            >
              {p.tag}
            </div>
            <div className="mt-1 text-[13px] font-medium text-ink">{p.label}</div>
            <p className="mt-1 text-[11.5px] leading-snug text-ink-tertiary">{p.detail}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const PREVIEW = [
  {
    tag: 'Live score',
    label: 'Watch your RiskIndex evolve',
    detail: 'Every answer updates the composite score and per-pillar bars in real time.',
    accent: '#5e6ad2',
  },
  {
    tag: 'Attack paths',
    label: 'See how the steps connect',
    detail: 'A worked model of how one weak habit opens the door to the next.',
    accent: '#f04438',
  },
  {
    tag: 'Fix plan',
    label: 'Walk away with an action list',
    detail: 'Highest-impact fixes ranked first. No vague "stay safe online" advice.',
    accent: '#27a644',
  },
];

function TrustChip({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2/60 px-2.5 py-0.5 text-[11px] text-ink-muted">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
