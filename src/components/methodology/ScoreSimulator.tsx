import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FACTORS,
  PILLARS,
  attackProbability,
  compositeScore,
  defaultFactorState,
  pillarBreakdown,
  riskBand,
  riskBandColor,
  riskBandLabel,
  type FactorState,
} from '@/lib/risk';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/**
 * Interactive scoring demo.
 *
 * Lets the user toggle any factor on or off. The composite RiskIndex,
 * per-pillar bars, and attacker-success probability all recompute live
 * via the shared scoring engine in `@/lib/risk`.
 *
 * Same engine the future Personal Risk Profiler will consume — there is
 * no demo-only math here.
 */
export function ScoreSimulator() {
  const [state, setState] = useState<FactorState>(() => defaultFactorState());

  const composite = useMemo(() => compositeScore(state), [state]);
  const breakdown = useMemo(() => pillarBreakdown(state), [state]);
  const band = riskBand(composite);
  const accent = riskBandColor(band);
  const attackP = attackProbability(composite);

  const protective = FACTORS.filter((f) => f.kind === 'protective');
  const threat = FACTORS.filter((f) => f.kind === 'threat');

  const toggle = (id: string) => setState((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Toggles */}
      <div className="space-y-5">
        <ToggleGroup
          title="Protective layers"
          subtitle="Turn these on to lower your RiskIndex."
          accent="#27a644"
        >
          {protective.map((f) => (
            <FactorRow
              key={f.id}
              label={f.label}
              description={f.description}
              delta={f.delta}
              kind="protective"
              on={!!state[f.id]}
              onToggle={() => toggle(f.id)}
            />
          ))}
        </ToggleGroup>

        <ToggleGroup
          title="Threat conditions"
          subtitle="Each one widens the attacker's window."
          accent="#f04438"
        >
          {threat.map((f) => (
            <FactorRow
              key={f.id}
              label={f.label}
              description={f.description}
              delta={f.delta}
              kind="threat"
              on={!!state[f.id]}
              onToggle={() => toggle(f.id)}
            />
          ))}
        </ToggleGroup>
      </div>

      {/* Live readout */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface-1/70 p-4 backdrop-blur-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
              RiskIndex
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={band}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  color: accent,
                  background: `${accent}1a`,
                  border: `1px solid ${accent}33`,
                }}
              >
                {riskBandLabel(band)}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <AnimatedNumber
              value={composite}
              decimals={0}
              duration={0.6}
              className="text-[44px] font-semibold tabular-nums leading-none"
            />
            <span className="text-[14px] text-ink-tertiary">/100</span>
          </div>

          {/* Score bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }}
              animate={{ width: `${composite}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <Tile label="Attack-success P" value={`${(attackP * 100).toFixed(0)}%`} accent={accent} />
            <Tile
              label="Composite weight"
              value={`${PILLARS.length} pillars`}
              accent="#5e6ad2"
            />
          </div>

          {/* Pillar bars */}
          <div className="mt-4 space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
              Per-pillar score
            </div>
            {breakdown.map((b) => (
              <div key={b.pillar.id}>
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="text-ink-muted">{b.pillar.label}</span>
                  <span className="font-mono tabular-nums text-ink-tertiary">
                    {Math.round(b.score)}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: b.pillar.accent }}
                    animate={{ width: `${b.score}%` }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ToggleGroup({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[13px] font-medium text-ink">{title}</h3>
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: accent }}
        >
          {subtitle}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function FactorRow({
  label,
  description,
  delta,
  kind,
  on,
  onToggle,
}: {
  label: string;
  description: string;
  delta: number;
  kind: 'protective' | 'threat';
  on: boolean;
  onToggle: () => void;
}) {
  const sign = kind === 'threat' ? '+' : '−';
  const color = kind === 'threat' ? '#f04438' : '#27a644';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={
        on
          ? 'group flex items-start justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-left transition-colors'
          : 'group flex items-start justify-between gap-3 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2 text-left transition-colors hover:border-hairline-strong'
      }
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={on ? 'text-[12.5px] text-ink' : 'text-[12.5px] text-ink-muted'}>
            {label}
          </span>
          <span
            className="font-mono text-[10px] tabular-nums"
            style={{ color: on ? color : '#62666d' }}
          >
            {sign}
            {delta}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-tertiary">{description}</p>
      </div>
      <Switch on={on} />
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={
        on
          ? 'mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full bg-primary/80 px-0.5'
          : 'mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full bg-surface-4 px-0.5'
      }
    >
      <motion.span
        layout
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={
          on
            ? 'ml-auto h-3 w-3 rounded-full bg-white shadow-glow-soft'
            : 'h-3 w-3 rounded-full bg-ink-tertiary'
        }
      />
    </span>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-2/40 px-2 py-1.5">
      <div className="text-[9.5px] uppercase tracking-wider text-ink-tertiary">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
