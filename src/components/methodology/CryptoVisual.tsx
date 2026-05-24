import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sha256Hex } from '@/lib/crypto-lab/hash';

/**
 * Tiny cryptography visualization for the Methodology page.
 *
 * Echoes the input through real Web Crypto SHA-256 and highlights how a
 * single keystroke produces a completely different fingerprint. Not a
 * replacement for the full Crypto Lab — just a sample that hints at
 * what's available there.
 */
export function CryptoVisual() {
  const [input, setInput] = useState('rindex');
  const [hash, setHash] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    sha256Hex(input).then((h) => {
      if (!cancelled) setHash(h);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
          Input
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-surface-2/60 px-3 py-2 font-mono text-[13px] text-ink outline-none transition-colors focus:border-primary/60"
          placeholder="Type anything…"
        />
      </div>

      <div className="rounded-xl border border-hairline bg-surface-2/40 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            SHA-256 fingerprint
          </span>
          <span className="font-mono text-[10px] tabular-nums text-ink-tertiary">
            256 bits · 64 hex
          </span>
        </div>
        <div
          className="mt-2 grid gap-1"
          style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
        >
          {hash.split('').map((c, i) => (
            <motion.span
              key={`${i}-${c}`}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.004 }}
              className="rounded-sm bg-surface-3/60 py-1 text-center font-mono text-[11px] text-ink-muted"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="One-way" value="Yes" detail="Easy to compute, infeasible to invert." />
        <Stat label="Deterministic" value="Yes" detail="Same input → same output." />
        <Stat label="Avalanche" value="≈50%" detail="One bit flips half the output." />
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[14px] text-primary">{value}</div>
      <p className="mt-1 text-[10.5px] leading-snug text-ink-tertiary">{detail}</p>
    </div>
  );
}
