import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp, staggerContainer } from '@/lib/motion';

const steps = [
  {
    n: '01',
    title: 'Interactive questionnaire',
    desc: 'Six categories — password habits, 2FA, phishing, devices, privacy and recovery. Fast, animated, no walls of text.',
  },
  {
    n: '02',
    title: 'Cryptographic analysis',
    desc: 'Password entropy estimated from charset, length, patterns and dictionary detection — using log₂ of the effective search space.',
  },
  {
    n: '03',
    title: 'Risk graph construction',
    desc: 'Your weaknesses are connected as a weighted directed graph showing how attackers chain vulnerabilities.',
  },
  {
    n: '04',
    title: 'Personalized action plan',
    desc: 'Ranked recommendations by impact, difficulty and risk reduction. Mathematically explainable, never hand-wavy.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-section">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
            From a quick check to a complete attack-path map.
          </h2>
          <p className="mt-4 text-body-lg text-ink-subtle">
            RIndex turns vague worries into a concrete, mathematically-grounded picture of your
            personal attack surface.
          </p>
        </div>

        <motion.ol
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s, i) => (
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
              <div className="mt-6 h-px w-full bg-gradient-to-r from-hairline via-primary/30 to-transparent" />
              <div className="mt-3 flex items-center justify-between text-caption text-ink-tertiary">
                <span>Stage</span>
                <span className="font-mono">{i + 1} / {steps.length}</span>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}
