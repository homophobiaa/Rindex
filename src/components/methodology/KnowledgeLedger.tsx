import { motion } from 'framer-motion';
import { useMotionTransition } from '@/lib/motion';

/**
 * The honest inventory: everything the app has access to, next to
 * everything people assume it has access to. The asymmetry between the
 * two columns is the point, so they are deliberately rendered side by side
 * at equal visual weight.
 */

const KNOWS = [
  {
    title: 'The answers you clicked',
    detail: 'Around ten multiple-choice answers, held in memory for this tab.',
  },
  {
    title: 'A password you typed into the Password Lab',
    detail: 'Only if you used it, only while the page is open, and only to score it locally.',
  },
  {
    title: 'Numbers it calculated from those two things',
    detail: 'Pillar scores, the composite, the recommendation order. All derived, nothing fetched.',
  },
  {
    title: 'Whether you asked for reduced motion',
    detail: 'The one preference saved to your device, so the setting survives a reload.',
  },
];

const DOES_NOT_KNOW = [
  {
    title: 'Any password you actually use',
    detail: 'The assessment never asks for one. It asks how you manage them.',
  },
  {
    title: 'Whether you told the truth',
    detail: 'Self-reported means self-reported. Optimistic answers produce an optimistic score.',
  },
  {
    title: 'What is in your accounts',
    detail: 'No sign-in, no OAuth, no permissions, no access to anything of yours.',
  },
  {
    title: 'Whether you appear in a breach',
    detail: 'No breach database is consulted. No email is looked up anywhere.',
  },
  {
    title: 'How your devices are configured',
    detail: 'Nothing is scanned. It cannot see your OS, patches, or lock screen.',
  },
  {
    title: 'What happens to you next',
    detail: 'It has no idea. Neither does anyone else selling you a number.',
  },
];

export function KnowledgeLedger() {
  const transition = useMotionTransition({ duration: 0.4, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Column
        heading="What it has"
        count={KNOWS.length}
        accent="#27a644"
        items={KNOWS}
        transition={transition}
        icon="check"
      />
      <Column
        heading="What it does not have"
        count={DOES_NOT_KNOW.length}
        accent="#f04438"
        items={DOES_NOT_KNOW}
        transition={transition}
        icon="cross"
      />
    </div>
  );
}

function Column({
  heading,
  count,
  accent,
  items,
  transition,
  icon,
}: {
  heading: string;
  count: number;
  accent: string;
  items: { title: string; detail: string }[];
  transition: ReturnType<typeof useMotionTransition>;
  icon: 'check' | 'cross';
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-body-lg font-medium" style={{ color: accent }}>
          {heading}
        </h3>
        <span className="font-mono text-caption tabular-nums text-ink-tertiary">{count}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <motion.li
            key={it.title}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ ...transition, delay: i * 0.04 }}
            className="flex gap-2.5"
          >
            <span className="mt-0.5 shrink-0" style={{ color: accent }} aria-hidden>
              {icon === 'check' ? <CheckIcon /> : <CrossIcon />}
            </span>
            <div className="min-w-0">
              <div className="text-body-sm font-medium text-ink">{it.title}</div>
              <p className="mt-0.5 text-caption leading-snug text-ink-tertiary">{it.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
