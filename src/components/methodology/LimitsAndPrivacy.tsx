import { motion } from 'framer-motion';
import { useMotionTransition } from '@/lib/motion';

/**
 * Privacy behaviour and limitations.
 *
 * Both are deliberately concrete: each privacy line describes a mechanism
 * that can be verified in the source, and each limitation is stated as a
 * flat fact rather than softened into a disclaimer nobody reads.
 */

const PRIVACY = [
  {
    title: 'Answers live in a variable',
    detail:
      'Your assessment sits in React state for this tab. Not a database, not a cookie, not local storage.',
    tone: 'ok' as const,
  },
  {
    title: 'Reloading wipes the result',
    detail:
      'Refresh, and the profile is gone — you start again. Inconvenient by design, not by oversight.',
    tone: 'ok' as const,
  },
  {
    title: 'Nothing is transmitted by the app',
    detail:
      'There is no backend and no analytics call. The code contains no fetch to any server, which you can verify yourself.',
    tone: 'ok' as const,
  },
  {
    title: 'Two things do touch your device',
    detail:
      'Your reduced-motion preference is saved so it survives a reload, and the app files are cached so the site works offline.',
    tone: 'note' as const,
  },
  {
    title: 'The host still sees the request',
    detail:
      'Loading any website tells the server hosting it that somebody asked for the page. That applies here too, and no frontend can claim otherwise.',
    tone: 'note' as const,
  },
];

const LIMITS = [
  {
    title: 'Everything rests on self-reporting',
    detail:
      'The score describes the answers given, not the person giving them. Flatter yourself and the number will happily flatter you back.',
  },
  {
    title: 'The weights are considered judgement, not measurement',
    detail:
      'They were hand-tuned so a careful profile lands low and a careless one lands high. No dataset was used to fit them, and we would rather say so than imply a rigour that is not there.',
  },
  {
    title: 'Six pillars is a simplification',
    detail:
      'Real exposure involves threat models, specific services and plain luck. Ten questions cannot capture that, and this does not pretend to.',
  },
  {
    title: 'Nothing is verified externally',
    detail:
      'No breach lookup, no monitoring, no scanning, no connection to any account. It cannot tell you whether you are already compromised.',
  },
  {
    title: 'A low score is not a guarantee',
    detail:
      'Scoring well means the common failure modes are covered. Targeted attackers, zero-days and bad luck do not consult your RiskIndex first.',
  },
  {
    title: 'This is not a security audit',
    detail:
      'An audit involves an expert examining your actual systems. This is a questionnaire with arithmetic attached. Excellent for deciding what to fix on a Sunday afternoon; not something to hand to a compliance officer.',
  },
];

export function PrivacyReality() {
  const transition = useMotionTransition({ duration: 0.35, ease: [0.16, 1, 0.3, 1] });
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {PRIVACY.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...transition, delay: i * 0.04 }}
          className={
            p.tone === 'ok'
              ? 'rounded-lg border border-success/25 bg-success/[0.06] px-3.5 py-3'
              : 'rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3'
          }
        >
          <div
            className={
              p.tone === 'ok'
                ? 'text-body-sm font-medium text-success'
                : 'text-body-sm font-medium text-ink-muted'
            }
          >
            {p.title}
          </div>
          <p className="mt-1 text-caption leading-relaxed text-ink-tertiary">{p.detail}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function Limitations() {
  const transition = useMotionTransition({ duration: 0.35, ease: [0.16, 1, 0.3, 1] });
  return (
    <div className="space-y-2">
      {LIMITS.map((l, i) => (
        <motion.div
          key={l.title}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...transition, delay: i * 0.04 }}
          className="flex gap-3 rounded-lg border border-hairline bg-surface-1/60 px-4 py-3"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
            aria-hidden
          />
          <div className="min-w-0">
            <div className="text-body-sm font-medium text-ink">{l.title}</div>
            <p className="mt-0.5 text-caption leading-relaxed text-ink-subtle">{l.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
