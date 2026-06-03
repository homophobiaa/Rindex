import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Polished empty state shown when no profiler data exists.
 *
 * Primary CTA starts the profiler; secondary action loads a sample
 * dashboard so visitors can see what they will get before committing.
 */
export function DashboardEmptyState({ onPreview }: { onPreview: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl pt-10 text-center"
    >
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-hairline bg-surface-1/60">
        <ShieldIcon />
      </div>

      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
        Unified Risk Dashboard
      </span>
      <h1 className="mt-2 text-headline font-semibold text-ink">
        Your security posture, in one place
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-ink-subtle">
        Run the Personal Risk Profiler and this dashboard fills in: your overall RiskIndex,
        weakest links, attack likelihoods, a personalized attack map, and a ranked plan to bring
        the number down.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/assessment"
          className="rounded-full border border-primary/40 bg-primary/15 px-6 py-3 text-[14px] font-medium text-ink shadow-glow-soft transition-colors hover:bg-primary/25"
        >
          Start Risk Profiler →
        </Link>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full border border-hairline bg-surface-2/60 px-6 py-3 text-[14px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
        >
          Preview with sample data
        </button>
      </div>

      {/* Feature preview chips */}
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {PREVIEW.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
            className="rounded-xl border border-hairline bg-surface-1/40 p-4 text-left"
          >
            <div className="text-[12.5px] font-medium text-ink">{p.title}</div>
            <p className="mt-1 text-[11.5px] leading-snug text-ink-tertiary">{p.detail}</p>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-ink-tertiary">
        Everything is computed locally in your browser. Nothing is transmitted or stored — reload
        the tab and your profile is gone.
      </p>
    </motion.div>
  );
}

const PREVIEW = [
  { title: 'Overall RiskIndex', detail: 'One animated score with a clear posture label and verdict.' },
  { title: 'Attack likelihoods', detail: 'Estimated odds for phishing, SIM swap, stuffing, and more.' },
  { title: 'Ranked fix plan', detail: 'The highest-impact, lowest-effort changes, in order.' },
];

function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-primary" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.2-7 9-4-0.8-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
