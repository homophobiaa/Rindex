import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useReduceMotion } from '@/lib/reduce-motion';
import { useMotionTransition } from '@/lib/motion';

/**
 * Scale illustration.
 *
 * One simulated counter (a rate, which is the only figure that makes sense
 * to tick) plus three static reference figures. Nothing here is measured
 * telemetry — the section is labelled as an illustration and the counter is
 * explicitly marked "simulated" so it is never mistaken for live data.
 *
 * The figures are rounded, order-of-magnitude teaching values. They are
 * listed in CLAIMS_AUDIT.md because they carry no citation.
 */

/** Simulated rate — ticks upward like a counter would. */
const RATE_PER_SECOND = 70;

/** Static reference figures. These do not drift; they are not measurements. */
const REFERENCE = [
  {
    label: 'Reuse the same password somewhere',
    value: '~2 in 3',
    note: 'Typical figure in password-habit surveys',
  },
  {
    label: 'Entropy of a common 8-character password',
    value: '≈ 38 bits',
    note: 'Computed from charset and length',
  },
  {
    label: 'Entropy considered safe against offline cracking',
    value: '≥ 80 bits',
    note: 'The target the Password Lab scores against',
  },
];

export function LiveMetrics() {
  const reduceMotion = useReduceMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // The ticker is decorative. Under reduced motion it holds a stable value
    // rather than counting, which keeps the figure readable.
    if (reduceMotion) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const leaked = RATE_PER_SECOND * (reduceMotion ? 60 : elapsed || 1);

  return (
    <section className="relative py-section">
      <Container>
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Eyebrow>Why this matters</Eyebrow>
            <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
              Passwords fail at scale, not one at a time.
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-ink-subtle">
              Credential leaks are a volume problem — which is why reuse is the single
              habit that turns one breach into many. RIndex measures the habits you
              control, not the breaches you cannot.
            </p>
            <p className="mt-3 text-caption text-ink-tertiary">
              Rounded teaching figures, shown to convey scale. Not measured data.
            </p>
          </div>

          <div className="md:col-span-7">
            {/* Simulated counter */}
            <SimCard>
              <div className="flex items-center justify-between gap-3">
                <span className="text-body-sm text-ink-muted">
                  Credentials leaked while you have been on this page
                </span>
                <span className="shrink-0 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-caption text-ink-tertiary">
                  Simulated
                </span>
              </div>
              <div className="mt-3 font-mono text-[clamp(28px,7vw,40px)] leading-none tabular-nums text-ink">
                {leaked.toLocaleString()}
              </div>
              <p className="mt-2 text-caption text-ink-tertiary">
                Counting at an assumed {RATE_PER_SECOND}/second. This is an animation,
                not a feed — RIndex makes no network requests.
              </p>
            </SimCard>

            {/* Static reference figures */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {REFERENCE.map((r, i) => (
                <RefCard key={r.label} index={i}>
                  <div className="font-mono text-[22px] leading-none tabular-nums text-ink">
                    {r.value}
                  </div>
                  <div className="mt-2 text-body-sm text-ink-muted">{r.label}</div>
                  <p className="mt-1.5 text-caption leading-snug text-ink-tertiary">{r.note}</p>
                </RefCard>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SimCard({ children }: { children: React.ReactNode }) {
  const transition = useMotionTransition({ duration: 0.6 });
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={transition}
      className="panel p-5"
    >
      {children}
    </motion.div>
  );
}

function RefCard({ index, children }: { index: number; children: React.ReactNode }) {
  const transition = useMotionTransition({ duration: 0.5, delay: 0.06 * index });
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={transition}
      className="panel p-4"
    >
      {children}
    </motion.div>
  );
}
