import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp, staggerContainer } from '@/lib/motion';

const steps = [
  {
    n: '01',
    title: 'Answer a few questions',
    desc: 'Six areas: password habits, two-factor, recovery, devices, exposure and everyday behavior. Multiple choice, no long forms.',
  },
  {
    n: '02',
    title: 'Score the answers',
    desc: 'Each answer maps to a weighted factor. The six areas combine into one number between 0 and 100.',
  },
  {
    n: '03',
    title: 'Map the weak points',
    desc: 'Your answers drive a graph showing how one weak habit leads to the next, and which step matters most.',
  },
  {
    n: '04',
    title: 'Get an ordered fix list',
    desc: 'Recommendations sorted by how many points each one would remove, so you know what to do first.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-section">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
            Four steps, and you can check the math on every one.
          </h2>
          <p className="mt-4 text-body-lg text-ink-subtle">
            Nothing here is a black box. The Methodology page shows the weights and formulas
            behind each number.
          </p>
        </div>

        <motion.ol
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s) => (
            <motion.li
              key={s.n}
              variants={fadeUp}
              className="panel group relative h-full overflow-hidden p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wider text-ink-tertiary">
                  STEP {s.n}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
              </div>
              <h3 className="mt-4 text-card-title text-ink">{s.title}</h3>
              <p className="mt-2 text-body-sm text-ink-subtle">{s.desc}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}
