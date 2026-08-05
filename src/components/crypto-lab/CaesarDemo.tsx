import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { shiftText, bruteForceAllShifts } from '@/lib/crypto-lab/caesar';
import { useMotionTransition } from '@/lib/motion';

/**
 * Caesar cipher — deliberately compact.
 *
 * Kept only to make one point that the modern sections cannot: when the
 * keyspace is small enough, "encrypted" means nothing. Every one of the 25
 * possible decryptions is shown at once, because that is the whole attack.
 */
export function CaesarDemo() {
  const [plain, setPlain] = useState('meet me at dawn');
  const [shift, setShift] = useState(3);

  const cipher = useMemo(() => shiftText(plain, shift), [plain, shift]);
  const rows = useMemo(() => bruteForceAllShifts(cipher), [cipher]);
  const transition = useMotionTransition({ duration: 0.22, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="block">
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Message
          </span>
          <input
            type="text"
            value={plain}
            onChange={(e) => setPlain(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
              Shift
            </span>
            <span className="font-mono text-body-sm tabular-nums text-primary">{shift}</span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            value={shift}
            onChange={(e) => setShift(parseInt(e.target.value, 10))}
            className="lab-range w-full accent-primary"
            aria-label="Caesar cipher shift amount"
          />
        </div>
      </div>

      <motion.div
        key={cipher}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition}
        className="rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3"
      >
        <span className="text-micro font-medium uppercase tracking-wider text-primary">
          Ciphertext
        </span>
        <div className="mt-1 break-all font-mono text-body-sm text-ink">
          {cipher || <span className="text-ink-tertiary">(empty)</span>}
        </div>
      </motion.div>

      {/* The entire attack, always visible — no disclosure needed for 25 keys. */}
      <div className="rounded-lg border border-danger/25 bg-danger/[0.05] p-3.5">
        <div className="text-micro font-medium uppercase tracking-wider text-danger">
          Broken in one screen — all 25 keys tried
        </div>
        <div className="mt-2 grid gap-x-4 gap-y-0.5 font-mono text-[11.5px] sm:grid-cols-2">
          {rows
            .filter((r) => r.shift !== 0)
            .map((row) => {
              const isPlain = row.shift === ((shift % 26) + 26) % 26;
              return (
                <div
                  key={row.shift}
                  className={
                    isPlain
                      ? 'flex gap-2 rounded bg-success/15 px-1.5 py-0.5 text-success'
                      : 'flex gap-2 px-1.5 py-0.5 text-ink-tertiary'
                  }
                >
                  <span className="w-5 shrink-0 tabular-nums opacity-70">{row.shift}</span>
                  <span className="truncate">{row.text}</span>
                </div>
              );
            })}
        </div>
        <p className="mt-2.5 text-caption leading-relaxed text-ink-muted">
          A human spots the readable line instantly; a script spots it with a dictionary check.
          Modern ciphers survive this because their keyspace is around 2<sup>256</sup> rather
          than 25 — there is no list to scan.
        </p>
      </div>
    </div>
  );
}
