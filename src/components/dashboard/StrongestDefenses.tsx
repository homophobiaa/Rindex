import { motion } from 'framer-motion';
import type { FactorState } from '@/lib/risk';
import { strongestDefenses } from '@/lib/dashboard';

/**
 * What the user is already doing well. The mirror of WeakestLinks — the
 * dashboard rewards good habits, it does not only flag bad ones.
 */
export function StrongestDefenses({ state }: { state: FactorState }) {
  const defenses = strongestDefenses(state, 5);

  if (defenses.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-surface-1/50 px-4 py-5">
        <h4 className="text-[13.5px] font-medium text-ink">No active defenses yet</h4>
        <p className="mt-0.5 text-[12px] text-ink-subtle">
          Start with a password manager and an authenticator app — both move several attack
          likelihoods at once.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {defenses.map((d, i) => (
        <motion.div
          key={d.factorId}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/[0.06] px-4 py-3"
        >
          <CheckIcon />
          <div className="min-w-0">
            <h4 className="text-[13px] font-medium text-ink">{d.title}</h4>
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-tertiary">{d.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 shrink-0 text-success"
      aria-hidden
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path
        d="M7 12.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
