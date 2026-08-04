import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useReduceMotion } from '@/lib/reduce-motion';
import { useMotionTransition } from '@/lib/motion';

/**
 * Live cybersecurity metrics. Numbers are simulated client-side to feel alive,
 * but represent real-world public statistics rounded for educational use.
 */
const metrics = [
  { label: 'Credentials leaked / second (worldwide)', start: 73, drift: 1.2, suffix: '' },
  { label: 'Avg. password entropy', start: 38.2, drift: 0.02, suffix: ' bits' },
  { label: '% of users reusing passwords', start: 64, drift: 0.05, suffix: '%' },
  { label: 'Average breach detection time', start: 204, drift: 0.1, suffix: ' days' },
];

export function LiveMetrics() {
  const [values, setValues] = useState(metrics.map((m) => m.start));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // The drift is decorative only. Under reduced motion, hold the baseline
    // figures steady instead of restlessly ticking.
    if (reduceMotion) {
      setValues(metrics.map((m) => m.start));
      return;
    }
    const id = setInterval(() => {
      setValues((prev) =>
        prev.map((v, i) => {
          const m = metrics[i];
          const delta = (Math.random() - 0.45) * m.drift;
          return Math.max(0, +(v + delta).toFixed(2));
        }),
      );
    }, 1400);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="relative py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Eyebrow>Reality check</Eyebrow>
            <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
              The internet leaks faster than most people realize.
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-ink-subtle">
              RIndex is built around the idea that personal security is measurable. These
              numbers are generated in your browser — no telemetry, no fetching.
            </p>
            <p className="mt-3 font-mono text-caption text-ink-tertiary">
              # generated client-side · educational only
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {metrics.map((m, i) => (
                <MetricCard key={m.label} index={i}>
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-ink-subtle">{m.label}</span>
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-[34px] leading-none tabular-nums text-ink">
                    {values[i].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="ml-1 text-[14px] text-ink-subtle">{m.suffix}</span>
                  </div>
                  <div className="mt-4 h-px w-full bg-gradient-to-r from-primary/40 via-hairline to-transparent" />
                </MetricCard>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function MetricCard({ index, children }: { index: number; children: React.ReactNode }) {
  const transition = useMotionTransition({ duration: 0.6, delay: index * 0.08 });
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={transition}
      className="panel relative overflow-hidden p-5"
    >
      {children}
    </motion.div>
  );
}
