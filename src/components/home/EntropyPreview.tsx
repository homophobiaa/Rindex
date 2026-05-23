import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

const examples = [
  { pw: 'qwerty', label: 'Top-10 password' },
  { pw: 'password1!', label: 'Common pattern' },
  { pw: 'Summer2024', label: 'Season + year' },
  { pw: 'Tr0ub4dor&3', label: 'Leet-speak word' },
  { pw: 'correct-horse-battery-staple', label: 'Passphrase' },
  { pw: 'k!9$Lp@2vRq#8nXwZ', label: 'Random 17' },
];

function estimateCharsetSize(pw: string): number {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^A-Za-z0-9]/.test(pw)) size += 32;
  return size || 26;
}

function estimateEntropy(pw: string): number {
  if (!pw) return 0;
  const charset = estimateCharsetSize(pw);
  const base = pw.length * Math.log2(charset);
  // Penalize obvious dictionary-style patterns
  const lowered = pw.toLowerCase();
  let penalty = 0;
  const commonWords = ['password', 'qwerty', 'summer', 'winter', 'admin', 'welcome', 'login'];
  for (const w of commonWords) if (lowered.includes(w)) penalty += 12;
  if (/^[a-z]+$/.test(pw)) penalty += 6;
  if (/(\d{4})$/.test(pw)) penalty += 4;
  // Reward passphrase-like length
  return Math.max(2, base - penalty);
}

function classify(bits: number) {
  if (bits < 28) return { label: 'Critical', tone: 'danger', color: '#f04438' } as const;
  if (bits < 40) return { label: 'Weak', tone: 'warning', color: '#f79009' } as const;
  if (bits < 60) return { label: 'Moderate', tone: 'info', color: '#4cc2ff' } as const;
  if (bits < 80) return { label: 'Strong', tone: 'success', color: '#27a644' } as const;
  return { label: 'Excellent', tone: 'success', color: '#27a644' } as const;
}

function timeToCrack(bits: number) {
  // assume 10^10 guesses / second offline attack
  const seconds = Math.pow(2, bits) / 1e10;
  if (seconds < 1) return '< 1 s';
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds < 31536000 * 1000) return `${(seconds / 31536000).toFixed(1)} yr`;
  const yr = seconds / 31536000;
  return `${yr.toExponential(2)} yr`;
}

export function EntropyPreview() {
  const [selected, setSelected] = useState(0);
  const pw = examples[selected].pw;
  const bits = useMemo(() => estimateEntropy(pw), [pw]);
  const cls = classify(bits);
  const charset = estimateCharsetSize(pw);

  return (
    <section className="relative py-section">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Eyebrow>Cryptography preview</Eyebrow>
            <h2 className="mt-4 text-balance text-display-md text-gradient md:text-display-lg">
              See how entropy actually changes things.
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-ink-subtle">
              Try a few example passwords. Every calculation below runs locally — no input is
              transmitted anywhere. The full Password Lab supports your own input safely.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2">
              {examples.map((ex, i) => (
                <button
                  key={ex.pw}
                  onClick={() => setSelected(i)}
                  className={`group flex items-center justify-between rounded-md border px-3 py-2 text-left transition-all ${
                    i === selected
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-hairline bg-surface-1 hover:border-hairline-strong hover:bg-surface-2'
                  }`}
                >
                  <span className="font-mono text-[12.5px] text-ink">{ex.pw}</span>
                  <span className="text-caption text-ink-subtle">{ex.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="panel-glass gradient-border p-6">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Local entropy analysis</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-caption text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  0 network requests
                </span>
              </div>

              <div className="mt-6">
                <div className="font-mono text-[14px] text-ink-tertiary">selected</div>
                <div className="mt-1 break-all font-mono text-[22px] text-ink">{pw}</div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Length" value={pw.length.toString()} />
                <Stat label="Charset" value={`${charset}`} />
                <Stat label="Entropy" value={`${bits.toFixed(1)} b`} />
                <Stat label="Crack time" value={timeToCrack(bits)} />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-ink-subtle">Strength</span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-caption font-medium"
                    style={{ borderColor: `${cls.color}55`, color: cls.color, background: `${cls.color}14` }}
                  >
                    {cls.label}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    key={pw}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (bits / 100) * 100)}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cls.color}77, ${cls.color})` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-md border border-hairline-tertiary bg-surface-2/60 p-4 font-mono text-[11.5px] leading-relaxed text-ink-tertiary">
                <span className="text-ink-muted">formula</span>{' '}
                entropy = log<sub>2</sub>(charset<sup>length</sup>) − Σ pattern_penalties
                <br />
                <span className="text-ink-muted">search</span>{' '}
                ≈ 2<sup>{bits.toFixed(1)}</sup> = {Math.pow(2, Math.min(bits, 60)).toExponential(2)} {bits > 60 ? '· (truncated)' : ''}
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
      <div className="text-caption text-ink-tertiary">{label}</div>
      <div className="mt-1 font-mono text-[16px] text-ink">{value}</div>
    </div>
  );
}
