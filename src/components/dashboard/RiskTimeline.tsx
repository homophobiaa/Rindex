import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { FactorState } from '@/lib/risk';
import { useReduceMotion } from '@/lib/reduce-motion';
import { riskTimeline } from '@/lib/dashboard';

/**
 * Risk reduction timeline.
 *
 * Shows how the RiskIndex falls as the user applies their highest-impact
 * fixes in order. The curve is real — every point is the live composite
 * score after applying that fix — so it can never drift from the rest of
 * the dashboard. Recharts renders the descent; the step chips below make
 * the cause of each drop explicit.
 */
export function RiskTimeline({ state }: { state: FactorState }) {
  const steps = useMemo(() => riskTimeline(state, 4), [state]);
  const reduceMotion = useReduceMotion();

  const data = steps.map((s, i) => ({
    name: i === 0 ? 'Now' : `Fix ${i}`,
    label: s.label,
    score: s.score,
    delta: s.delta,
  }));

  const start = steps[0]?.score ?? 0;
  const end = steps[steps.length - 1]?.score ?? start;
  const totalDrop = start - end;

  if (steps.length <= 1) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface-1/50 p-6 text-center">
        <p className="text-[13px] text-ink-subtle">
          There are no further high-impact fixes to model — your posture is already lean.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1/50">
      {/* Headline drop */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline px-6 py-4">
        <div>
          <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            Projected RiskIndex
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-[26px] tabular-nums text-ink">{start}</span>
            <ArrowRight />
            <span className="font-mono text-[26px] tabular-nums text-success">{end}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-micro font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            Total reduction
          </span>
          <div className="mt-1 font-mono text-[26px] tabular-nums text-success">−{totalDrop}</div>
        </div>
      </div>

      {/* Descent chart */}
      <div className="h-44 px-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 16, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: '#62666d', fontSize: 11 }}
              axisLine={{ stroke: '#1a1b20' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#62666d', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<TimelineTooltip />} cursor={{ stroke: '#2c2e34' }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#828fff"
              strokeWidth={2}
              fill="url(#timelineFill)"
              dot={{ r: 3, fill: '#828fff', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={!reduceMotion}
              animationDuration={reduceMotion ? 0 : 1100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Step chips */}
      <div className="flex flex-wrap gap-2 px-6 pb-5 pt-1">
        {steps.slice(1).map((s, i) => (
          <motion.div
            key={s.factorId ?? i}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex items-center gap-2 rounded-full border border-hairline bg-surface-2/50 py-1 pl-2.5 pr-3"
          >
            <span className="font-mono text-micro tabular-nums text-success">−{s.delta}</span>
            <span className="text-[11.5px] text-ink-subtle">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TimelineTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as { label: string; score: number; delta: number };
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 backdrop-blur-sm">
      <div className="text-[12px] font-medium text-ink">{p.label}</div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px]">
        <span className="font-mono tabular-nums text-ink-subtle">score {p.score}</span>
        {p.delta > 0 && <span className="font-mono tabular-nums text-success">−{p.delta}</span>}
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-ink-tertiary" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
