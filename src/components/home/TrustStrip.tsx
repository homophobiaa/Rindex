import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { fadeUp, staggerContainer } from '@/lib/motion';

const items = [
  {
    title: 'Frontend-only',
    desc: 'No backend, no database, no analytics tied to your answers.',
    icon: BrowserIcon,
  },
  {
    title: 'No stored passwords',
    desc: 'Passwords never touch localStorage, sessionStorage or the network.',
    icon: LockIcon,
  },
  {
    title: 'Local computation',
    desc: 'Entropy, scoring and risk graphs are computed in your browser.',
    icon: CpuIcon,
  },
  {
    title: 'Mathematically scored',
    desc: 'Based on entropy, combinatorics and graph-based attack chains.',
    icon: SigmaIcon,
  },
  {
    title: 'Public source code',
    desc: 'Inspect exactly how every score and recommendation is calculated.',
    icon: CodeIcon,
  },
  {
    title: 'Offline-capable',
    desc: 'Visit once online, then disconnect — RIndex keeps working.',
    icon: WifiOffIcon,
  },
];

export function TrustStrip() {
  return (
    <section className="relative py-section">
      <Container>
        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} className="eyebrow justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Privacy by architecture
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-balance text-display-md text-gradient md:text-display-lg"
          >
            Built so your data never has to trust us.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-body-lg text-ink-subtle">
            Every calculation happens inside your browser. There is no server to compromise,
            because there is no server at all.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={staggerContainer(0.05, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((it) => (
            <motion.li
              key={it.title}
              variants={fadeUp}
              className="panel group relative overflow-hidden p-6 transition-colors hover:border-hairline-strong hover:bg-surface-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface-2 text-primary-hover">
                <it.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-card-title text-ink">{it.title}</h3>
              <p className="mt-1.5 text-body-sm text-ink-subtle">{it.desc}</p>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/0 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}

/* --- icons --- */
type IconProps = { className?: string };
function BrowserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
function CpuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2" />
    </svg>
  );
}
function SigmaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M6 5h12l-7 7 7 7H6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function CodeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WifiOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3 3l18 18M9 18a3 3 0 0 1 6 0M6.5 14.5a7 7 0 0 1 9-1M2 9a13 13 0 0 1 14-3" strokeLinecap="round" />
    </svg>
  );
}
