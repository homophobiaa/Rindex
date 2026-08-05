import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CHARSETS,
  ATTACKERS,
  bruteForce,
  growthSeries,
  humanizeSeconds,
} from '@/lib/crypto-lab/bruteforce';
import { useMotionTransition } from '@/lib/motion';

/**
 * Brute-force mini simulator.
 *
 * Three controls (charset, length, attacker speed) feed three readouts
 * (combinations, scientific order, crack time) and a small growth chart
 * that shows how time-to-crack explodes with each added character.
 *
 * The math is straightforward: combinations = charset^length, and average
 * crack time is half the keyspace divided by the attacker's guess rate.
 */
export function BruteForceSim() {
  const [charsetId, setCharsetId] = useState(CHARSETS[2].id); // letters mixed-case
  const [length, setLength] = useState(8);
  const [attackerId, setAttackerId] = useState(ATTACKERS[2].id); // fast hash

  const charset = CHARSETS.find((c) => c.id === charsetId)!;
  const attacker = ATTACKERS.find((a) => a.id === attackerId)!;

  const result = useMemo(
    () =>
      bruteForce({
        charsetSize: charset.size,
        length,
        rate: attacker.rate,
      }),
    [charset.size, length, attacker.rate],
  );

  const series = useMemo(
    () => growthSeries(charset.size, attacker.rate, 16),
    [charset.size, attacker.rate],
  );

  const maxLog = series[series.length - 1].log10 || 1;
  const yourRow = series.find((r) => r.length === length);
  // Bars snap to their final height under reduced motion instead of sweeping.
  const barTransition = useMotionTransition({ duration: 0.4, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Charset */}
        <ControlBlock title="Character set">
          <div className="flex flex-col gap-1">
            {CHARSETS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCharsetId(c.id)}
                className={
                  c.id === charsetId
                    ? 'flex items-baseline justify-between rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-left'
                    : 'flex items-baseline justify-between rounded-md border border-transparent px-2.5 py-1.5 text-left text-ink-muted transition-colors hover:bg-surface-2/60 hover:text-ink'
                }
              >
                <span className="text-[12px]">{c.label}</span>
                <span className="font-mono text-micro tabular-nums text-ink-tertiary">
                  {c.size}
                </span>
              </button>
            ))}
          </div>
        </ControlBlock>

        {/* Length */}
        <ControlBlock title="Password length">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-ink-subtle">Characters</span>
            <span className="font-mono text-[18px] tabular-nums text-primary">
              {length}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={16}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="lab-range mt-2 w-full accent-primary"
          />
          <div className="mt-1 flex justify-between font-mono text-micro text-ink-tertiary">
            <span>4</span>
            <span>16</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-ink-tertiary">
            Each added character multiplies the search space by{' '}
            <span className="text-ink">{charset.size}</span>.
          </p>
        </ControlBlock>

        {/* Attacker */}
        <ControlBlock title="Attacker speed">
          <div className="flex flex-col gap-1">
            {ATTACKERS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAttackerId(a.id)}
                className={
                  a.id === attackerId
                    ? 'rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-left'
                    : 'rounded-md border border-transparent px-2.5 py-1.5 text-left text-ink-muted transition-colors hover:bg-surface-2/60 hover:text-ink'
                }
              >
                <div className="flex items-baseline justify-between text-[12px]">
                  <span>{a.label}</span>
                </div>
                <div className="text-micro text-ink-tertiary">{a.description}</div>
              </button>
            ))}
          </div>
        </ControlBlock>
      </div>

      {/* Result metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BigMetric
          label="Search space"
          value={result.scientific}
          sub={`${charset.size}^${length} combinations`}
        />
        <BigMetric label="Order of magnitude" value={`10^${result.log10.toFixed(1)}`} sub="log10" />
        <BigMetric
          label="Modeled crack time"
          value={result.human}
          sub={`at ${humanizeRate(attacker.rate)}/sec`}
          accent
        />
      </div>

      {/* Stated assumptions — the number above is only meaningful with these */}
      <div className="rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3">
        <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
          What this figure assumes
        </div>
        <ul className="mt-1.5 grid gap-1 text-[12.5px] leading-relaxed text-ink-muted sm:grid-cols-2">
          <li>• The password is chosen uniformly at random from the character set.</li>
          <li>• The attacker knows the length and character set already.</li>
          <li>• A steady {humanizeRate(attacker.rate)} guesses/second, sustained.</li>
          <li>• Average case — half the search space, not the full sweep.</li>
        </ul>
        <p className="mt-2 text-caption leading-relaxed text-ink-tertiary">
          These are modeled estimates, not predictions. Change any assumption and the answer
          moves by orders of magnitude.
        </p>
      </div>

      {/* The honest caveat */}
      <div className="rounded-lg border border-danger/30 bg-danger/[0.07] px-3.5 py-3">
        <div className="text-micro font-medium uppercase tracking-wider text-danger">
          Real attacks do not start here
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
          Nobody enumerates the keyspace from <span className="font-mono">aaaa</span>. Attackers
          begin with passwords already leaked in previous breaches, then dictionary words, then
          predictable mutations — <span className="font-mono">Summer2024!</span> falls in
          seconds despite scoring well above. Brute force is the ceiling on how long a{' '}
          <em>random</em> password lasts; it says nothing about a memorable one.
        </p>
      </div>

      {/* Growth chart */}
      <div className="rounded-lg border border-hairline bg-surface-2/40 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div>
            <div className="text-micro font-medium uppercase tracking-wider text-primary">
              Exponential growth
            </div>
            <div className="mt-0.5 text-[11px] text-ink-subtle">
              log10 of search space by length · {charset.label.toLowerCase()}
            </div>
          </div>
          {yourRow && (
            <div className="text-right">
              <div className="text-micro uppercase tracking-wider text-ink-tertiary">
                Length {length}
              </div>
              <div className="font-mono text-[13px] tabular-nums text-ink">
                {humanizeSeconds(yourRow.seconds)}
              </div>
            </div>
          )}
        </div>

        <div className="flex h-[140px] items-end gap-1">
          {series.map((row) => {
            const heightPct = (row.log10 / Math.max(1, maxLog)) * 100;
            const isCurrent = row.length === length;
            return (
              <div key={row.length} className="group relative flex flex-1 flex-col items-center">
                <motion.div
                  className="w-full rounded-t"
                  style={{
                    background: isCurrent
                      ? 'linear-gradient(180deg, #f04438, #a31b13)'
                      : 'linear-gradient(180deg, rgba(94,106,210,0.85), rgba(94,106,210,0.25))',
                  }}
                  initial={false}
                  animate={{ height: `${Math.max(2, heightPct)}%` }}
                  transition={barTransition}
                />
                <span
                  className={
                    isCurrent
                      ? 'mt-1 font-mono text-micro tabular-nums text-danger'
                      : 'mt-1 font-mono text-micro tabular-nums text-ink-tertiary'
                  }
                >
                  {row.length}
                </span>
                {/* Hover detail. The same figures are always available in the
                    readout above, so nothing is hidden from touch users. */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded border border-hairline bg-surface-1/95 px-2 py-1 text-micro text-ink-muted shadow-lg group-hover:block">
                  10^{row.log10.toFixed(1)} · {humanizeSeconds(row.seconds)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 text-micro text-ink-tertiary">
          Bar height = log10(combinations). Each added character is a full
          step taller — that\u2019s exponential.
        </div>
      </div>
    </div>
  );
}

function humanizeRate(rate: number): string {
  if (rate >= 1e12) return `${(rate / 1e12).toFixed(0)}T`;
  if (rate >= 1e9) return `${(rate / 1e9).toFixed(0)}B`;
  if (rate >= 1e6) return `${(rate / 1e6).toFixed(0)}M`;
  if (rate >= 1e3) return `${(rate / 1e3).toFixed(0)}k`;
  return rate.toString();
}

function ControlBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
      <div className="mb-2 text-micro font-medium uppercase tracking-wider text-ink-tertiary">
        {title}
      </div>
      {children}
    </div>
  );
}

function BigMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1/60 px-4 py-3.5">
      <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={
          accent
            ? 'mt-1 font-mono text-[20px] font-medium tabular-nums text-danger'
            : 'mt-1 font-mono text-[20px] font-medium tabular-nums text-ink'
        }
      >
        {value}
      </motion.div>
      <div className="mt-0.5 text-[11px] text-ink-subtle">{sub}</div>
    </div>
  );
}
