import { motion } from 'framer-motion';
import { LinkButton } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export function CTASection() {
  return (
    <section className="relative py-section">
      <Container>
        <div className="panel-glass gradient-border relative overflow-hidden p-10 md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px"
            style={{
              background:
                'radial-gradient(600px circle at 20% 0%, rgba(94,106,210,0.18), transparent 60%), radial-gradient(500px circle at 90% 100%, rgba(76,194,255,0.10), transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-balance text-display-md text-gradient md:text-display-lg"
            >
              Most weak points are habits.
              <br />
              <span className="text-gradient-primary">Find yours in about a minute.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-5 max-w-xl text-body-lg text-ink-subtle"
            >
              About ten questions, no signup, nothing sent anywhere. You get a score, the
              reasoning behind it, and a short list of what to fix first.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <LinkButton to="/assessment" size="lg">
                Start security check
              </LinkButton>
              <LinkButton to="/password-lab" variant="secondary" size="lg">
                Try Password Lab
              </LinkButton>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
