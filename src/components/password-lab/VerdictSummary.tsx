import { motion } from 'framer-motion';
import { useMotionTransition } from '@/lib/motion';
import { CLASSIFICATION_META, type AnalysisResult } from '@/lib/password/analyze';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Plain-language summary shown directly under the input.
 * Layout is intentionally vertical: a wide hero row (gauge + verdict),
 * followed by a two-column card grid so the side panels never get squeezed.
 */
export function VerdictSummary({ analysis }: { analysis: AnalysisResult }) {
  const meta = CLASSIFICATION_META[analysis.classification];

  if (analysis.length === 0) {
    return (
      <div className="panel-glass gradient-border flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center md:p-10">
        <span className="text-eyebrow uppercase text-ink-subtle">Waiting for input</span>
        <h2 className="text-card-title text-ink">Type a password above to see your result.</h2>
        <p className="max-w-md text-body-sm text-ink-subtle">
          You can use a demo password or generate a strong one if you don&rsquo;t want
          to type yours.
        </p>
      </div>
    );
  }

  const verdict = plainVerdict(analysis);
  const topProblems = analysis.patterns.slice(0, 3);
  const topFixes = analysis.recommendations.slice(0, 3);

  return (
    <div className="panel-glass gradient-border relative overflow-hidden p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }}
      />

      {/* Hero row — full width so the verdict never shares horizontal space with the lists */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
        <CompactGauge score={analysis.score} color={meta.color} />
        <div className="min-w-0 flex-1">
          <motion.span
            key={meta.label}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium"
            style={{
              borderColor: `${meta.color}55`,
              background: `${meta.color}14`,
              color: meta.color,
            }}
          >
            {meta.label.toUpperCase()}
          </motion.span>
          <h2 className="mt-2 text-[22px] font-medium leading-tight tracking-tight text-ink sm:text-headline">
            {verdict}
          </h2>
          <p className="mt-1.5 text-body-sm text-ink-subtle">{meta.description}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 h-px w-full bg-hairline" />

      {/* Problems + Fixes — equal cards, never squeezed */}
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title="What&rsquo;s wrong"
          icon={<AlertIcon />}
          tone="danger"
          items={topProblems.map((p) => plainProblem(p.id, p.label))}
          emptyLabel="No weaknesses detected."
        />
        <SummaryCard
          title="How to fix it"
          icon={<ShieldIcon />}
          tone="primary"
          items={topFixes.map((r) => r.title)}
          emptyLabel="Already strong — no changes needed."
        />
      </div>
    </div>
  );
}

function CompactGauge({ score, color }: { score: number; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 100));
  const sweep = useMotionTransition({ duration: 1.1, ease: [0.16, 1, 0.3, 1] });
  return (
    <div className="relative h-[104px] w-[104px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="#1c1c22" strokeWidth="7" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={sweep}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          decimals={0}
          className="font-mono text-[28px] leading-none tabular-nums text-ink"
        />
        <span className="mt-0.5 text-micro tracking-wider text-ink-tertiary">/ 100</span>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyLabel: string;
  tone: 'danger' | 'primary';
}) {
  const color = tone === 'danger' ? '#f04438' : '#5e6ad2';
  return (
    <div
      className="rounded-lg border bg-surface-2/40 p-4 sm:p-5"
      style={{ borderColor: `${color}26` }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
          style={{ background: `${color}1f`, color }}
        >
          {icon}
        </span>
        <h4 className="text-body-sm font-semibold tracking-tight text-ink">{title}</h4>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 text-body-sm text-ink-muted">{emptyLabel}</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((label, i) => (
            <motion.li
              key={`${i}-${label}`}
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="flex items-start gap-2.5 text-body-sm text-ink-muted"
            >
              <span
                aria-hidden
                className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span className="leading-snug">{label}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* icons */
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Plain-language single-sentence verdict for low-attention readers. */
function plainVerdict(a: AnalysisResult): string {
  switch (a.classification) {
    case 'critical':
      return 'This password could be guessed almost instantly.';
    case 'weak':
      return 'This would fall to common attacks within minutes.';
    case 'vulnerable':
      return 'Decent, but a determined attacker could crack it offline.';
    case 'safe':
      return 'Strong against realistic attacks.';
    case 'hardened':
      return 'Far beyond the reach of current cracking hardware.';
  }
}

/**
 * Translate technical finding IDs into approachable phrasing.
 * Falls back to the original label if no mapping exists.
 */
function plainProblem(id: string, fallback: string): string {
  const map: Record<string, string> = {
    'common-password': 'It’s on every leaked-password list',
    'dictionary-word': 'Built around a common dictionary word',
    'keyboard-sequence': 'Contains a keyboard pattern (e.g. qwerty, asdf)',
    'digits-only': 'Uses only digits — too easy to brute force',
    'letters-only': 'Uses only letters — no numbers or symbols',
    'repeated-char': 'Long runs of the same character',
    'trailing-year': 'Ends in a year like 2024 or 2025',
    'trailing-digits': 'Just digits tacked onto the end',
    'leet-speak': 'Predictable letter→number swaps (p@ssw0rd)',
    sequential: 'Contains a sequence like abc or 1234',
    'low-diversity': 'Reuses the same few characters',
    'capitalized-word-suffix': 'Classic Word + numbers pattern',
    'too-short': 'Too short to be safe',
    'no-symbols': 'No special characters to slow attackers',
  };
  return map[id] ?? fallback;
}
