import { motion } from 'framer-motion';
import { CLASSIFICATION_META, type AnalysisResult } from '@/lib/password/analyze';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Plain-language summary shown directly under the input.
 * Designed for low-attention readers: verdict → 3 problems → 3 fixes.
 */
export function VerdictSummary({ analysis }: { analysis: AnalysisResult }) {
  const meta = CLASSIFICATION_META[analysis.classification];
  const verdict = plainVerdict(analysis);
  const topProblems = analysis.patterns.slice(0, 3);
  const topFixes = analysis.recommendations.slice(0, 3);

  if (analysis.length === 0) {
    return (
      <div className="panel-glass gradient-border flex flex-col items-center gap-2 p-8 text-center md:p-10">
        <span className="text-eyebrow uppercase text-ink-subtle">Waiting for input</span>
        <h3 className="text-card-title text-ink">Type a password above to see your result.</h3>
        <p className="max-w-md text-body-sm text-ink-subtle">
          You can use a demo password or generate a strong one if you don&apos;t want to type yours.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={analysis.classification}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="panel-glass gradient-border relative overflow-hidden p-6 md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }}
      />

      <div className="grid gap-8 md:grid-cols-[auto,1fr] md:items-center">
        {/* Big result */}
        <div className="flex items-center gap-5">
          <CompactGauge score={analysis.score} color={meta.color} />
          <div>
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium"
              style={{
                borderColor: `${meta.color}55`,
                background: `${meta.color}14`,
                color: meta.color,
              }}
            >
              {meta.label.toUpperCase()}
            </span>
            <h2 className="mt-2 text-headline text-ink">{verdict}</h2>
            <p className="mt-1 text-body-sm text-ink-subtle">{meta.description}</p>
          </div>
        </div>

        {/* Problems + fixes */}
        <div className="grid gap-5 sm:grid-cols-2 md:border-l md:border-hairline md:pl-8">
          <SummaryList
            title="What&rsquo;s wrong"
            emptyLabel="No weaknesses detected."
            tone="danger"
            items={topProblems.map((p) => plainProblem(p.id, p.label))}
          />
          <SummaryList
            title="How to fix it"
            emptyLabel="Already strong — no changes needed."
            tone="primary"
            items={topFixes.map((r) => r.title)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CompactGauge({ score, color }: { score: number; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 100));
  return (
    <div className="relative h-[96px] w-[96px] shrink-0">
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
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          decimals={0}
          className="font-mono text-[26px] leading-none tabular-nums text-ink"
        />
        <span className="mt-0.5 text-[10px] tracking-wider text-ink-tertiary">/ 100</span>
      </div>
    </div>
  );
}

function SummaryList({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: React.ReactNode;
  items: string[];
  emptyLabel: string;
  tone: 'danger' | 'primary';
}) {
  const color = tone === 'danger' ? '#f04438' : '#5e6ad2';
  return (
    <div>
      <div className="text-eyebrow uppercase text-ink-subtle">{title}</div>
      {items.length === 0 ? (
        <div className="mt-2 text-body-sm text-ink-muted">{emptyLabel}</div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((label, i) => (
            <motion.li
              key={`${title}-${i}-${label}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-start gap-2 text-body-sm text-ink-muted"
            >
              <span
                aria-hidden
                className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span>{label}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Plain-language single-sentence verdict for low-attention readers. */
function plainVerdict(a: AnalysisResult): string {
  switch (a.classification) {
    case 'critical':
      return 'This password could be guessed almost instantly.';
    case 'weak':
      return 'This password would fall to common attacks within minutes.';
    case 'vulnerable':
      return 'Decent, but a determined attacker could crack it offline.';
    case 'safe':
      return 'Strong against realistic attacks.';
    case 'hardened':
      return 'Far beyond the reach of current cracking hardware.';
  }
}

/**
 * Translate technical finding labels into approachable phrasing.
 * Falls back to the original label if no mapping exists.
 */
function plainProblem(id: string, fallback: string): string {
  const map: Record<string, string> = {
    'common-password': 'It&rsquo;s on every leaked-password list',
    'dictionary-word': 'Built around a common dictionary word',
    'keyboard-sequence': 'Contains a keyboard pattern (e.g. qwerty, asdf)',
    'digits-only': 'Uses only digits — too easy to brute force',
    'letters-only': 'Uses only letters — no numbers or symbols',
    'repeated-char': 'Long runs of the same character',
    'trailing-year': 'Ends in a year like 2024 or 2025',
    'trailing-digits': 'Just digits tacked onto the end',
    'leet-speak': 'Predictable letter→number swaps (p@ssw0rd)',
    'sequential': 'Contains a sequence like abc or 1234',
    'low-diversity': 'Reuses the same few characters',
    'capitalized-word-suffix': 'Classic Word + numbers pattern',
    'too-short': 'Too short to be safe',
    'no-symbols': 'No special characters to slow attackers',
  };
  // Use HTML entities? React renders them as text. Use plain apostrophes.
  const raw = map[id];
  if (!raw) return fallback;
  return raw.replace(/&rsquo;/g, '\u2019');
}
