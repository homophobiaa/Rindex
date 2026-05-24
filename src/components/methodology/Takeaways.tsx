import { motion } from 'framer-motion';

/**
 * Final "how to lower your RiskIndex" actions.
 *
 * Six concise, ordered recommendations. Numbered, animated in
 * sequentially, designed to leave the reader with a clear next-step
 * mental model rather than a wall of bullet points.
 */

interface Takeaway {
  title: string;
  detail: string;
  impact: string;
}

const TAKEAWAYS: Takeaway[] = [
  {
    title: 'Use a password manager',
    detail: 'Generate unique high-entropy passwords for every account.',
    impact: 'Eliminates the #1 risk: reuse.',
  },
  {
    title: 'Enable hardware-key MFA',
    detail: 'WebAuthn / FIDO2 on critical accounts (email, bank, identity).',
    impact: 'Phishing-resistant — most attacks become impossible.',
  },
  {
    title: 'Strengthen recovery paths',
    detail: 'Replace SMS 2FA with TOTP or hardware. Store backup codes offline.',
    impact: 'Removes the easy bypass attackers love.',
  },
  {
    title: 'Compartmentalize identities',
    detail: 'Use separate emails for financial, identity, and casual accounts.',
    impact: 'A breach in one zone does not cascade.',
  },
  {
    title: 'Reduce public exposure',
    detail: 'Audit social profiles. Don\'t broadcast birthdays, locations, or security-question answers.',
    impact: 'Shrinks the attacker\'s reconnaissance surface.',
  },
  {
    title: 'Practice slow-MFA',
    detail: 'Never approve a 2FA prompt you didn\'t personally trigger.',
    impact: 'Defeats MFA-fatigue social engineering.',
  },
];

export function Takeaways() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TAKEAWAYS.map((t, i) => (
        <motion.article
          key={t.title}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-xl border border-hairline bg-surface-1/60 p-4 transition-colors hover:border-hairline-strong"
        >
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] tabular-nums text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-ink">{t.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-subtle">
                {t.detail}
              </p>
              <p className="mt-2 text-[11px] font-medium text-success">{t.impact}</p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
