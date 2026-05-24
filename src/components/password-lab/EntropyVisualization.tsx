import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalysisResult } from '@/lib/password/analyze';

/**
 * Entropy visualization — composition bars, entropy comparison to common
 * benchmarks, and a clear delta between raw and effective entropy.
 */
export function EntropyVisualization({ analysis }: { analysis: AnalysisResult }) {
  const comp = analysis.composition;
  const compositionData = [
    { name: 'lower', value: comp.lowercase, color: '#5e6ad2' },
    { name: 'UPPER', value: comp.uppercase, color: '#8b91e3' },
    { name: 'digits', value: comp.digits, color: '#4cc2ff' },
    { name: 'symbols', value: comp.symbols, color: '#27a644' },
  ];

  const benchmarks = [
    { name: '8-char numeric', bits: 26.6 },
    { name: '8-char lower', bits: 37.6 },
    { name: '12-char mixed', bits: 71 },
    { name: 'Your password', bits: analysis.effectiveEntropyBits, highlight: true },
    { name: 'Diceware 4w', bits: 51.6 },
    { name: 'Diceware 6w', bits: 77.5 },
    { name: '256-bit key', bits: 256 },
  ];

  return (
    <div className="panel p-6 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-eyebrow uppercase text-ink-subtle">Entropy visualization</span>
          <h3 className="mt-1 text-card-title text-ink">How much randomness you actually have</h3>
        </div>
        <div className="hidden text-right md:block">
          <div className="text-caption text-ink-tertiary">Raw → Effective</div>
          <div className="font-mono text-[13px] text-ink-muted">
            {analysis.rawEntropyBits.toFixed(1)} → {analysis.effectiveEntropyBits.toFixed(1)} bits
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Composition */}
        <div className="lg:col-span-2">
          <div className="text-caption text-ink-tertiary">Character composition</div>
          <div className="mt-2 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compositionData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#1c1c22" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca0aa', fontSize: 11 }}
                  axisLine={{ stroke: '#1c1c22' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6e727b', fontSize: 11 }}
                  axisLine={{ stroke: '#1c1c22' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={{
                    background: '#0f1014',
                    border: '1px solid #1c1c22',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#9ca0aa' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {compositionData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-caption text-ink-subtle">
            <KV label="Unique chars" value={comp.unique.toString()} />
            <KV label="Charset size" value={comp.charsetSize.toString()} />
            <KV label="Shannon" value={`${analysis.diversity.toFixed(2)}`} />
            <KV label="Penalty" value={`${(analysis.rawEntropyBits - analysis.effectiveEntropyBits).toFixed(1)} b`} />
          </div>
        </div>

        {/* Benchmarks */}
        <div className="lg:col-span-3">
          <div className="text-caption text-ink-tertiary">Entropy vs. common benchmarks</div>
          <ul className="mt-2 space-y-1.5">
            {benchmarks.map((b, i) => {
              const max = 280;
              const pct = Math.min(100, (b.bits / max) * 100);
              return (
                <li
                  key={b.name}
                  className="grid items-center gap-x-3 gap-y-1 [grid-template-columns:minmax(0,1fr)_auto] sm:[grid-template-columns:120px_minmax(0,1fr)_64px]"
                >
                  <div className="truncate text-caption text-ink-muted">{b.name}</div>
                  <div
                    className={`justify-self-end font-mono text-[12px] tabular-nums sm:order-3 ${
                      b.highlight ? 'text-primary' : 'text-ink-subtle'
                    }`}
                  >
                    {b.bits.toFixed(1)} b
                  </div>
                  <div className="relative col-span-2 h-2.5 overflow-hidden rounded-full bg-surface-2 sm:col-span-1 sm:order-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: b.highlight
                          ? 'linear-gradient(90deg, #5e6ad2, #8b91e3)'
                          : '#2a2c33',
                        boxShadow: b.highlight ? '0 0 18px -4px #5e6ad2aa' : undefined,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 font-mono text-[10.5px] text-ink-tertiary">
            Effective entropy = log₂(charset^length) − pattern penalties. NIST guidance
            considers ≥ 60 bits adequate; ≥ 80 bits robust against offline cracking.
          </p>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-hairline-tertiary bg-surface-2/40 px-2.5 py-1.5">
      <span className="text-ink-tertiary">{label}</span>
      <span className="font-mono text-ink-muted">{value}</span>
    </div>
  );
}
