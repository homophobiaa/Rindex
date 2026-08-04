import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { useReduceMotion } from '@/lib/reduce-motion';
import { useMotionTransition } from '@/lib/motion';

/**
 * Hero visual — a layered "product screenshot" mock showing:
 *  - a circular Risk Score gauge (animated)
 *  - subscore bars (Recharts-style)
 *  - a live entropy readout
 *  - hairline category chips
 *  - a small attack-graph preview node cluster
 *
 * Pure SVG/CSS, no heavy deps. Designed to feel like a high-fidelity Linear-style
 * product capture framed in a glass panel.
 */
export function HeroVisual() {
  const reduceMotion = useReduceMotion();
  const score = useMotionValue(0);
  const display = useTransform(score, (v) => Math.round(v));

  useEffect(() => {
    if (reduceMotion) {
      score.set(68);
      return;
    }
    const controls = animate(score, 68, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.4,
    });
    return controls.stop;
  }, [score, reduceMotion]);

  return (
    <div className="relative">
      {/* glow under panel */}
      <div
        aria-hidden
        className="absolute inset-x-10 -bottom-10 h-40 rounded-full bg-primary/25 blur-3xl"
      />

      <div className="panel-glass gradient-border noise relative overflow-hidden rounded-xl p-3 sm:p-4">
        {/* top chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-2 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
          </div>
          <div className="font-mono text-[11px] text-ink-tertiary">
            rindex.local / assessment / results
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-ink-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Local
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-12 md:p-5">
          {/* GAUGE */}
          <div className="panel md:col-span-5 p-5">
            <div className="flex items-center justify-between">
              <div className="eyebrow">RIndex Score</div>
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                HIGH RISK
              </span>
            </div>

            <div className="relative mx-auto mt-4 h-44 w-44">
              <ScoreGauge progress={0.68} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="text-display-md tabular-nums text-gradient">
                  {display}
                </motion.span>
                <span className="text-caption text-ink-tertiary">/ 100</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              {[
                { k: 'Confidence', v: '94%' },
                { k: 'Profile', v: 'Personal' },
                { k: 'Signals', v: '23' },
                { k: 'Updated', v: 'just now' },
              ].map((s) => (
                <div key={s.k} className="flex items-center justify-between rounded-md border border-hairline-tertiary bg-surface-2/60 px-2.5 py-1.5">
                  <span className="text-ink-tertiary">{s.k}</span>
                  <span className="font-medium text-ink">{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SUBSCORES + ENTROPY */}
          <div className="md:col-span-7 grid grid-cols-1 gap-4">
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="eyebrow">Category breakdown</div>
                <span className="font-mono text-[11px] text-ink-tertiary">live</span>
              </div>
              <SubscoreList />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="panel p-4">
                <div className="eyebrow mb-2">Password entropy</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-headline tabular-nums text-ink">52.3</span>
                  <span className="text-caption text-ink-subtle">bits</span>
                </div>
                <div className="mt-2 font-mono text-[10.5px] leading-relaxed text-ink-tertiary">
                  search space ≈ 2<sup>52.3</sup>
                  <br />
                  ≈ 5.7 × 10<sup>15</sup> combinations
                </div>
                <EntropyBar />
              </div>

              <div className="panel p-4">
                <div className="eyebrow mb-2">Attack path</div>
                <MiniGraph />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ progress }: { progress: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const sweep = useMotionTransition({ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 });
  return (
    <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
      <defs>
        <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#828fff" />
          <stop offset="60%" stopColor="#5e6ad2" />
          <stop offset="100%" stopColor="#f79009" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r={r} stroke="#1c1c22" strokeWidth="10" fill="none" />
      <motion.circle
        cx="90"
        cy="90"
        r={r}
        stroke="url(#gauge)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - progress) }}
        transition={sweep}
      />
    </svg>
  );
}

const subscores = [
  { label: 'Password Risk', value: 78, tone: 'danger' },
  { label: 'Phishing Awareness', value: 54, tone: 'warning' },
  { label: 'Account Protection', value: 71, tone: 'danger' },
  { label: 'Device Security', value: 32, tone: 'success' },
  { label: 'Privacy Exposure', value: 64, tone: 'warning' },
  { label: 'Recovery Security', value: 48, tone: 'warning' },
] as const;

const toneColors: Record<string, string> = {
  danger: '#f04438',
  warning: '#f79009',
  success: '#27a644',
};

function SubscoreList() {
  const reduceMotion = useReduceMotion();
  return (
    <ul className="space-y-2.5">
      {subscores.map((s, i) => (
        <li key={s.label} className="grid grid-cols-12 items-center gap-3">
          <span className="col-span-5 text-[12.5px] text-ink-muted">{s.label}</span>
          <div className="col-span-5 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              initial={{ width: reduceMotion ? `${s.value}%` : 0 }}
              animate={{ width: `${s.value}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.2, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }
              }
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${toneColors[s.tone]}aa, ${toneColors[s.tone]})` }}
            />
          </div>
          <span className="col-span-2 text-right font-mono text-[11px] tabular-nums text-ink-subtle">
            {s.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EntropyBar() {
  const reduceMotion = useReduceMotion();
  const fill = useMotionTransition({ duration: 1.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] });
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
      <motion.div
        initial={{ width: reduceMotion ? '58%' : 0 }}
        animate={{ width: '58%' }}
        transition={fill}
        className="h-full rounded-full bg-gradient-to-r from-primary-hover via-primary to-warning"
      />
    </div>
  );
}

function MiniGraph() {
  const reduceMotion = useReduceMotion();
  // little attack chain
  const nodes = [
    { id: 'pw', x: 12, y: 50, label: 'Weak pw' },
    { id: 'reuse', x: 42, y: 22, label: 'Reuse' },
    { id: 'leak', x: 72, y: 50, label: 'Leak' },
    { id: 'tko', x: 100, y: 22, label: 'Takeover' },
  ];
  const edges = [
    ['pw', 'reuse'],
    ['reuse', 'leak'],
    ['leak', 'tko'],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative h-[88px] w-full">
      <svg viewBox="0 0 120 80" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="edge" x1="0" x2="1">
            <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f04438" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {edges.map(([a, b], i) => {
          const A = byId[a];
          const B = byId[b];
          return (
            <motion.line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="url(#edge)"
              strokeWidth="1"
              initial={{ pathLength: reduceMotion ? 1 : 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.6 + i * 0.2 }}
            />
          );
        })}
      </svg>
      {nodes.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: 0.5 + i * 0.15 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-hairline bg-surface-2 px-1.5 py-0.5 text-[9.5px] text-ink-muted shadow-glow-soft"
          style={{ left: `${(n.x / 120) * 100}%`, top: `${(n.y / 80) * 100}%` }}
        >
          {n.label}
        </motion.div>
      ))}
    </div>
  );
}
