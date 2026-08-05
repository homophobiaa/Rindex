import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { analyzePassword, CLASSIFICATION_META } from '@/lib/password/analyze';
import { useMotionTransition } from '@/lib/motion';

/**
 * Homepage entropy preview.
 *
 * Uses the SAME analyzer as the Password Lab (`analyzePassword`) so the two
 * surfaces can never disagree about the same password. Previously this
 * component carried its own simplified copy of the entropy math, which
 * produced different bits, a different score and different band labels.
 */
const EXAMPLES = [
  { pw: 'qwerty', label: 'Keyboard run' },
  { pw: 'password1!', label: 'Common word + suffix' },
  { pw: 'Summer2024', label: 'Season + year' },
  { pw: 'Tr0ub4dor&3', label: 'Leet-speak word' },
  { pw: 'correct-horse-battery-staple', label: 'Passphrase' },
  { pw: 'k!9$Lp@2vRq#8nXwZ', label: 'Random, 17 chars' },
];

/** The tier the headline "time to crack" figure refers to. */
const HEADLINE_SCENARIO = 'offline-fast-hash';

export function EntropyPreview() {
  // Starts on a mid-range example. `qwerty` legitimately scores 0 once the
  // pattern penalties are applied, and opening on an empty bar reads as a
  // broken widget rather than a weak password.
  const [selected, setSelected] = useState(2);
  const pw = EXAMPLES[selected].pw;
  const analysis = useMemo(() => analyzePassword(pw), [pw]);
  const meta = CLASSIFICATION_META[analysis.classification];
  const scenario =
    analysis.scenarios.find((s) => s.id === HEADLINE_SCENARIO) ?? analysis.scenarios[0];
  const barTransition = useMotionTransition({ duration: 0.9, ease: [0.16, 1, 0.3, 1] });

  return (
    <section className="relative py-section">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Eyebrow>Entropy preview</Eyebrow>
            <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
              Length beats complexity.
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-ink-subtle">
              Pick an example to see how entropy — and the effort needed to crack it —
              changes. These run through the same analyzer as the Password Lab, in your
              browser.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.pw}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    i === selected
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-hairline bg-surface-1 hover:border-hairline-strong hover:bg-surface-2'
                  }`}
                >
                  {/* Never truncated — the length of a passphrase is the lesson. */}
                  <span className="break-all font-mono text-body-sm text-ink">{ex.pw}</span>
                  <span className="shrink-0 text-caption text-ink-subtle">{ex.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="panel-glass gradient-border p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow">Entropy analysis</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-caption text-ink-tertiary">
                  Runs in your browser
                </span>
              </div>

              <div className="mt-5">
                <div className="text-caption text-ink-tertiary">Selected example</div>
                <div className="mt-1 break-all font-mono text-[clamp(16px,4.5vw,20px)] text-ink">
                  {pw}
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Characters" value={analysis.length.toString()} />
                <Stat label="Charset size" value={analysis.composition.charsetSize.toString()} />
                <Stat label="Entropy" value={`${analysis.effectiveEntropyBits.toFixed(1)} bits`} />
                <Stat label="Score" value={`${analysis.score}/100`} />
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption text-ink-subtle">Strength</span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-caption font-medium"
                    style={{
                      borderColor: `${meta.color}55`,
                      color: meta.color,
                      background: `${meta.color}14`,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3"
                  role="img"
                  aria-label={`Strength score ${analysis.score} out of 100`}
                >
                  <motion.div
                    key={pw}
                    initial={{ width: 0 }}
                    /* Floor of 2% so a legitimate score of 0 still renders as a
                       sliver instead of looking like a failed render. */
                    animate={{ width: `${Math.max(2, analysis.score)}%` }}
                    transition={barTransition}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${meta.color}77, ${meta.color})` }}
                  />
                </div>
                <p className="mt-2 text-caption text-ink-subtle">{meta.description}</p>
              </div>

              <div className="mt-5 rounded-md border border-hairline-tertiary bg-surface-2/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-caption text-ink-tertiary">
                    Time to crack — {scenario.label}
                  </span>
                  <span className="font-mono text-body-sm text-ink">{scenario.timeText}</span>
                </div>
                <p className="mt-2 text-caption leading-relaxed text-ink-tertiary">
                  Assumes {scenario.description} Estimates the average case: half the
                  search space, no prior knowledge of the password.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline-tertiary bg-surface-2/60 px-3 py-2.5">
      <dt className="text-caption text-ink-tertiary">{label}</dt>
      <dd className="mt-1 font-mono text-body-sm text-ink">{value}</dd>
    </div>
  );
}
