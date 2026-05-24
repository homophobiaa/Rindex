import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sha256Hex, diffHashes, tinyPerturbation, type HashDiff } from '@/lib/crypto-lab/hash';
import { CopyButton } from './CopyButton';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hashing demo — hashes the user's input with real Web Crypto SHA-256.
 *
 * Also hashes a "tiny perturbation" of the same input (flipped case) so
 * we can visualize the avalanche effect side-by-side: a 1-character change
 * scrambles ~half of all 256 bits.
 */
export function HashingDemo() {
  const [input, setInput] = useState('hello world');
  const [hash, setHash] = useState('');
  const [twinHash, setTwinHash] = useState('');
  const twin = useMemo(() => tinyPerturbation(input), [input]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([sha256Hex(input), sha256Hex(twin)]).then(([h, t]) => {
      if (cancelled) return;
      setHash(h);
      setTwinHash(t);
    });
    return () => {
      cancelled = true;
    };
  }, [input, twin]);

  const diff: HashDiff | null =
    hash && twinHash ? diffHashes(hash, twinHash) : null;

  return (
    <div className="space-y-5">
      {/* Input */}
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
          Input text
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type anything…"
          className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
        />
      </label>

      {/* Side-by-side hashes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HashCard
          eyebrow="SHA-256"
          label="Your input"
          source={input || '(empty)'}
          hash={hash}
        />
        <HashCard
          eyebrow="SHA-256 · twin"
          label={`Perturbed: ${twinDescription(input, twin)}`}
          source={twin || '(empty)'}
          hash={twinHash}
          changedMask={diff?.changedMask}
        />
      </div>

      {/* Avalanche readout */}
      {diff && (
        <motion.div
          key={`${diff.diffBits}-${diff.diffNibbles}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface-2/40 p-3.5 sm:grid-cols-4"
        >
          <Metric label="Changed bits" value={`${diff.diffBits} / ${diff.totalBits}`} />
          <Metric
            label="% bits flipped"
            value={`${((diff.diffBits / diff.totalBits) * 100).toFixed(1)}%`}
            accent
          />
          <Metric label="Changed nibbles" value={`${diff.diffNibbles} / ${diff.totalNibbles}`} />
          <Metric label="Algorithm" value="SHA-256 (Web Crypto)" />
        </motion.div>
      )}

      <p className="text-[11.5px] leading-relaxed text-ink-tertiary">
        Tip: SHA-256 is one-way. Two different inputs almost always produce
        wildly different outputs — that\u2019s the <em>avalanche effect</em>.
        A good hash function flips ~50% of output bits when you change a
        single input character.
      </p>
    </div>
  );
}

function twinDescription(input: string, twin: string): string {
  if (input.length === 0) return 'added a space';
  if (twin.length > input.length) return 'appended a trailing space';
  return 'flipped first letter case';
}

interface HashCardProps {
  eyebrow: string;
  label: string;
  source: string;
  hash: string;
  changedMask?: boolean[];
}

function HashCard({ eyebrow, label, source, hash, changedMask }: HashCardProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-subtle">{label}</div>
        </div>
        {hash && <CopyButton value={hash} />}
      </div>

      <div className="font-mono text-[11.5px] text-ink-muted">
        <span className="break-all opacity-80">{source}</span>
      </div>

      <div className="mt-2 break-all font-mono text-[11.5px] leading-relaxed">
        <AnimatePresence mode="wait">
          {hash ? (
            <motion.div
              key={hash}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {hash.split('').map((ch, i) =>
                changedMask?.[i] ? (
                  <span
                    key={i}
                    className="text-danger"
                    style={{
                      textShadow: '0 0 6px rgba(240, 68, 56, 0.45)',
                    }}
                  >
                    {ch}
                  </span>
                ) : (
                  <span key={i} className="text-ink">
                    {ch}
                  </span>
                ),
              )}
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-ink-tertiary"
            >
              hashing…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
        {label}
      </div>
      <div
        className={
          accent
            ? 'mt-0.5 font-mono text-[14px] tabular-nums text-danger'
            : 'mt-0.5 font-mono text-[13px] tabular-nums text-ink'
        }
      >
        {value}
      </div>
    </div>
  );
}
