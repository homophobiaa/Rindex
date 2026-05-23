import { motion } from 'framer-motion';
import { LinkButton } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Aurora } from '@/components/decor/Aurora';
import { GridBackdrop } from '@/components/decor/GridBackdrop';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/motion';
import { HeroVisual } from './HeroVisual';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
      <Aurora />
      <GridBackdrop />

      <Container>
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Cybersecurity risk analysis · built for your browser</Eyebrow>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance text-[44px] font-semibold leading-[1.05] tracking-[-1.4px] sm:text-[60px] md:text-display-xl"
          >
            <span className="text-gradient">Find out how </span>
            <span className="text-gradient-primary">hackable</span>
            <span className="text-gradient"> you really are.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-pretty text-body-lg text-ink-muted"
          >
            RIndex analyzes your password strength, phishing awareness, account protection and
            digital habits using cryptographic entropy and graph-based risk analysis — entirely
            inside your browser. No data leaves your device.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton to="/assessment" size="lg">
              Start security check
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </LinkButton>
            <LinkButton to="/methodology" variant="secondary" size="lg">
              How it works
            </LinkButton>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-caption text-ink-subtle"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              100% local browser processing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Works fully offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Open source &amp; auditable
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.25 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <HeroVisual />
        </motion.div>
      </Container>
    </section>
  );
}
