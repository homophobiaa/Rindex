import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  toBinary,
  toHex,
  toDecimal,
  toBase64,
  byteCount,
  bitCount,
} from '@/lib/crypto-lab/encoding';
import { CopyButton } from './CopyButton';

type Format = 'binary' | 'hex' | 'decimal' | 'base64';

interface FormatMeta {
  id: Format;
  label: string;
  base: string;
  hint: string;
}

const FORMATS: FormatMeta[] = [
  {
    id: 'binary',
    label: 'Binary',
    base: 'Base 2',
    hint: 'How CPUs actually store data — eight bits per byte.',
  },
  {
    id: 'hex',
    label: 'Hexadecimal',
    base: 'Base 16',
    hint: 'Compact byte view — each byte fits in two hex digits.',
  },
  {
    id: 'decimal',
    label: 'Decimal codes',
    base: 'Base 10',
    hint: 'Each number is the UTF-8 code point of one byte.',
  },
  {
    id: 'base64',
    label: 'Base64',
    base: 'Base 64',
    hint: 'Common for tokens, emails, and JWT payloads.',
  },
];

/**
 * Encoding / number-system converter.
 *
 * Shows the same input rendered in four different bases so it's obvious
 * that "text" is just a particular interpretation of raw bytes.
 */
export function EncodingConverter() {
  const [input, setInput] = useState('Hi 👋');
  const [active, setActive] = useState<Format>('binary');

  const outputs = useMemo(
    () => ({
      binary: toBinary(input),
      hex: toHex(input),
      decimal: toDecimal(input),
      base64: toBase64(input),
    }),
    [input],
  );

  const bytes = useMemo(() => byteCount(input), [input]);
  const bits = useMemo(() => bitCount(input), [input]);

  const activeOutput = outputs[active];
  const activeMeta = FORMATS.find((f) => f.id === active)!;

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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-hairline bg-surface-2/40 p-1">
        {FORMATS.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              className={
                isActive
                  ? 'relative flex-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink'
                  : 'relative flex-1 rounded-md px-2.5 py-1.5 text-[12px] text-ink-tertiary transition-colors hover:text-ink'
              }
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId="encoding-pill"
                  className="absolute inset-0 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/30"
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className="relative">
                {f.label}
                <span className="ml-1.5 hidden text-micro text-ink-tertiary sm:inline">
                  ({f.base})
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Output */}
      <motion.div
        key={active + activeOutput}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="rounded-lg border border-hairline bg-surface-2/40 p-3.5"
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-micro font-medium uppercase tracking-wider text-primary">
              {activeMeta.label} · {activeMeta.base}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-subtle">{activeMeta.hint}</div>
          </div>
          {activeOutput && <CopyButton value={activeOutput} />}
        </div>
        <div className="break-all font-mono text-[12.5px] leading-relaxed text-ink">
          {activeOutput || <span className="text-ink-tertiary">(empty)</span>}
        </div>
      </motion.div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-hairline bg-surface-2/40 p-3.5">
        <Counter label="Characters" value={input.length.toString()} />
        <Counter label="UTF-8 bytes" value={bytes.toString()} />
        <Counter label="Bits" value={bits.toString()} accent />
      </div>
    </div>
  );
}

function Counter({
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
      <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
        {label}
      </div>
      <div
        className={
          accent
            ? 'mt-0.5 font-mono text-[15px] tabular-nums text-primary'
            : 'mt-0.5 font-mono text-[15px] tabular-nums text-ink'
        }
      >
        {value}
      </div>
    </div>
  );
}
