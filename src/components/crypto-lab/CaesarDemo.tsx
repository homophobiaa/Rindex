import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { shiftText, alphabetMap, bruteForceAllShifts } from '@/lib/crypto-lab/caesar';
import { CopyButton } from './CopyButton';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Interactive Caesar / shift cipher.
 *
 *   - User edits plaintext + shift; ciphertext updates live.
 *   - Alphabet mapping panel shows the A→X substitution.
 *   - Brute-force panel lists all 26 possible decryptions so it\u2019s
 *     obvious why this cipher is trivially broken.
 */
export function CaesarDemo() {
  const [plain, setPlain] = useState('Attack at dawn');
  const [shift, setShift] = useState(3);
  const [bruteOpen, setBruteOpen] = useState(false);

  const cipher = useMemo(() => shiftText(plain, shift), [plain, shift]);
  const mapping = useMemo(() => alphabetMap(shift), [shift]);
  const bruteRows = useMemo(() => bruteForceAllShifts(cipher), [cipher]);

  return (
    <div className="space-y-5">
      {/* Plaintext + shift control */}
      <div className="grid gap-4 lg:grid-cols-[1fr,260px]">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
            Plaintext
          </span>
          <input
            type="text"
            value={plain}
            onChange={(e) => setPlain(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
              Shift
            </span>
            <span className="font-mono text-[13px] tabular-nums text-primary">
              {String(shift).padStart(2, '0')}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            value={shift}
            onChange={(e) => setShift(parseInt(e.target.value, 10))}
            className="lab-range w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-ink-tertiary">
            <span>0</span>
            <span>25</span>
          </div>
        </div>
      </div>

      {/* Ciphertext */}
      <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
            Ciphertext · shift {shift}
          </span>
          <CopyButton value={cipher} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={cipher}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="break-all font-mono text-[14px] text-ink"
          >
            {cipher || <span className="text-ink-tertiary">(empty)</span>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Alphabet mapping */}
      <div>
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
          Substitution alphabet
        </div>
        <div
          className="grid gap-1.5 text-center"
          style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        >
          {mapping.map((pair) => (
            <div
              key={pair.plain}
              className="rounded-md border border-hairline bg-surface-2/40 px-1 py-1.5"
            >
              <div className="font-mono text-[11px] text-ink-tertiary">
                {pair.plain}
              </div>
              <div className="text-[10px] text-ink-tertiary">↓</div>
              <div className="font-mono text-[11.5px] font-medium text-primary">
                {pair.cipher}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brute force */}
      <div>
        <button
          type="button"
          onClick={() => setBruteOpen((v) => !v)}
          className="flex items-center gap-2 text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
          aria-expanded={bruteOpen}
        >
          <Chevron open={bruteOpen} />
          {bruteOpen ? 'Hide' : 'Show'} all 26 brute-force decryptions
        </button>

        <AnimatePresence initial={false}>
          {bruteOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid gap-1.5 rounded-lg border border-hairline bg-surface-2/40 p-3 font-mono text-[12px]">
                {bruteRows.map((row) => {
                  const isOriginal = row.shift === ((shift % 26) + 26) % 26;
                  return (
                    <div
                      key={row.shift}
                      className={
                        isOriginal
                          ? 'flex gap-3 rounded px-2 py-1 text-ink bg-primary/10'
                          : 'flex gap-3 rounded px-2 py-1 text-ink-muted'
                      }
                    >
                      <span className="w-8 shrink-0 tabular-nums text-ink-tertiary">
                        −{String(row.shift).padStart(2, '0')}
                      </span>
                      <span className="truncate">{row.text}</span>
                      {isOriginal && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-primary">
                          match
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
