import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { LinkButton } from '@/components/ui/Button';
import { Aurora } from '@/components/decor/Aurora';
import { GridBackdrop } from '@/components/decor/GridBackdrop';

export function ComingSoon({
  eyebrow,
  title,
  description,
  back = '/',
}: {
  eyebrow: string;
  title: string;
  description: string;
  back?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden py-32 md:py-40">
      <Aurora />
      <GridBackdrop />
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-balance text-display-md text-gradient md:text-display-lg">
            {title}
          </h1>
          <p className="mt-5 text-body-lg text-ink-subtle">{description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton to={back} variant="secondary">
              Back to home
            </LinkButton>
            <LinkButton to="/methodology">Read methodology</LinkButton>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 text-left">
            {['Local-only', 'Mathematically grounded', 'Open source'].map((t) => (
              <div key={t} className="panel p-4">
                <div className="text-eyebrow uppercase text-ink-subtle">Guarantee</div>
                <div className="mt-1 text-body text-ink">{t}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
