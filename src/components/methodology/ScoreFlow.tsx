import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FACTORS, PILLARS, computePillarScore, compositeScore } from '@/lib/risk';
import type { FactorState } from '@/lib/risk';
import { PILLAR_MATH, PILLAR_FLOOR } from '@/lib/methodology/facts';
import { useMotionTransition } from '@/lib/motion';

/**
 * The worked example.
 *
 * Walks one real answer all the way through the engine — factor, pillar
 * normalization, weighting, composite — using the actual scoring functions
 * rather than a re-implementation. Toggling the answer recomputes every
 * downstream number live, so the arithmetic is checkable on screen.
 */

/** A representative password answer, used as the example throughout. */
const EXAMPLE_FACTOR = 'pw-reuse';

function baseState(): FactorState {
  const s: FactorState = {};
  for (const f of FACTORS) s[f.id] = false;
  // Give the example a realistic surrounding profile: app-based MFA on,
  // nothing else notable, so the password pillar is the thing that moves.
  s['mfa-app'] = true;
  return s;
}

export function ScoreFlow() {
  const [reuses, setReuses] = useState(true);
  const transition = useMotionTransition({ duration: 0.35, ease: [0.16, 1, 0.3, 1] });

  const state = useMemo<FactorState>(
    () => ({ ...baseState(), [EXAMPLE_FACTOR]: reuses }),
    [reuses],
  );

  const pwMath = PILLAR_MATH.find((p) => p.id === 'password')!;
  const pwPillar = PILLARS.find((p) => p.id === 'password')!;
  const factor = FACTORS.find((f) => f.id === EXAMPLE_FACTOR)!;

  // Recomputed with the real engine — not duplicated arithmetic.
  const pwScore = computePillarScore('password', state);
  const composite = compositeScore(state);

  // The raw sum, shown so the normalization step is verifiable by hand.
  const raw = FACTORS.filter((f) => f.pillar === 'password' && state[f.id]).reduce(
    (sum, f) => sum + (f.kind === 'threat' ? f.delta : -f.delta),
    0,
  );
  const normalized = ((raw + pwMath.maxProtect) / pwMath.span) * 100;

  return (
    <div className="space-y-4">
      {/* The toggle that drives everything below */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-1/60 p-4">
        <div className="min-w-0">
          <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Example answer · &ldquo;How do you handle passwords?&rdquo;
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            Flip this and watch every number underneath move.
          </p>
        </div>
        <div className="flex gap-2">
          <Choice active={reuses} onClick={() => setReuses(true)} tone="danger">
            I reuse passwords
          </Choice>
          <Choice active={!reuses} onClick={() => setReuses(false)} tone="ok">
            I don&rsquo;t
          </Choice>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        <Step
          n={1}
          title="The answer becomes a factor"
          transition={transition}
        >
          <p className="text-body-sm text-ink-muted">
            Answers do not carry points of their own. Each option flips named switches. This one
            sets{' '}
            <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-caption text-ink">
              {factor.id}
            </code>{' '}
            to <strong className="text-ink">{String(reuses)}</strong>.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Chip label={`delta ${factor.delta}`} accent={reuses ? '#f04438' : '#62666d'} />
            <Chip label={`kind: ${factor.kind}`} accent={reuses ? '#f04438' : '#62666d'} />
            <Chip label={`pillar: ${factor.pillar}`} accent={pwPillar.accent} />
          </div>
        </Step>

        <Step n={2} title="The pillar is normalized, not summed" transition={transition}>
          <p className="text-body-sm text-ink-muted">
            Raw deltas would be meaningless on their own — a pillar with more factors would
            always look worse. So each pillar is scaled against its own full swing.
          </p>
          <div className="mt-3 space-y-1.5 rounded-lg border border-hairline bg-surface-2/50 p-3 font-mono text-caption">
            <Line
              label="raw"
              expr="Σ active threats − Σ active protectives"
              value={`${raw}`}
            />
            <Line
              label="span"
              expr={`maxThreat ${pwMath.maxThreat} + maxProtect ${pwMath.maxProtect}`}
              value={`${pwMath.span}`}
            />
            <Line
              label="normalized"
              expr={`(${raw} + ${pwMath.maxProtect}) ÷ ${pwMath.span} × 100`}
              value={normalized.toFixed(1)}
            />
            <Line
              label="pillar score"
              expr={`round, floored at ${PILLAR_FLOOR}`}
              value={`${pwScore}`}
              highlight
            />
          </div>
          <p className="mt-2.5 text-caption leading-relaxed text-ink-tertiary">
            In plain terms: 0 would mean every protective habit on and no threats; 100 means the
            reverse. The floor of {PILLAR_FLOOR} is there because a perfect 0 would be a promise
            nobody can keep — existing online carries a little risk no questionnaire can remove.
          </p>
        </Step>

        <Step n={3} title="Pillars are weighted, then added" transition={transition}>
          <p className="text-body-sm text-ink-muted">
            Six pillar scores, six fixed weights, one weighted sum. That is the entire final
            calculation. No second pass, no adjustment layer, no mysterious tuning step where
            the interesting decisions quietly happen.
          </p>
          <div className="mt-3 space-y-1">
            {PILLARS.map((p) => {
              const s = computePillarScore(p.id, state);
              return (
                <div key={p.id} className="flex items-center gap-2.5 text-caption">
                  <span className="w-[110px] shrink-0 truncate text-ink-muted sm:w-[130px]">
                    {p.label}
                  </span>
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: p.accent }}
                      animate={{ width: `${s}%` }}
                      transition={transition}
                    />
                  </div>
                  <span className="w-[132px] shrink-0 text-right font-mono tabular-nums text-ink-tertiary">
                    {String(s).padStart(2, '0')} × {p.weight.toFixed(2)} ={' '}
                    <span className="text-ink">{(s * p.weight).toFixed(1)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-baseline justify-between rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5">
            <span className="text-body-sm font-medium text-ink">Your RiskIndex</span>
            <motion.span
              key={composite}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
              className="font-mono text-[22px] tabular-nums text-ink"
            >
              {composite}
              <span className="ml-1 text-caption text-ink-tertiary">/100</span>
            </motion.span>
          </div>
          <p className="mt-2 text-caption leading-relaxed text-ink-tertiary">
            One answer moved the composite by{' '}
            <strong className="text-ink">
              {Math.abs(
                compositeScore({ ...baseState(), [EXAMPLE_FACTOR]: true }) -
                  compositeScore({ ...baseState(), [EXAMPLE_FACTOR]: false }),
              )}{' '}
              points
            </strong>
            . Password reuse is weighted heavily on purpose — it is the habit that turns one
            company&rsquo;s breach into your problem on twelve other sites.
          </p>
        </Step>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Step({
  n,
  title,
  children,
  transition,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  transition: ReturnType<typeof useMotionTransition>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={transition}
      className="rounded-xl border border-hairline bg-surface-1/60 p-4"
    >
      <div className="mb-2 flex items-baseline gap-2.5">
        <span className="font-mono text-caption tabular-nums text-primary">
          {String(n).padStart(2, '0')}
        </span>
        <h3 className="text-body-lg font-medium text-ink">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Line({
  label,
  expr,
  value,
  highlight,
}: {
  label: string;
  expr: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span className="text-ink-tertiary">
        <span className={highlight ? 'text-primary' : 'text-ink-subtle'}>{label}</span>
        <span className="ml-2 opacity-70">{expr}</span>
      </span>
      <span className={highlight ? 'tabular-nums text-primary' : 'tabular-nums text-ink'}>
        {value}
      </span>
    </div>
  );
}

function Chip({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 font-mono text-micro"
      style={{ borderColor: `${accent}44`, background: `${accent}14`, color: accent }}
    >
      {label}
    </span>
  );
}

function Choice({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: 'danger' | 'ok';
  children: React.ReactNode;
}) {
  const accent = tone === 'danger' ? '#f04438' : '#27a644';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
      style={
        active
          ? { borderColor: `${accent}66`, background: `${accent}1a`, color: accent }
          : { borderColor: '#23252a', background: 'transparent', color: '#8a8f98' }
      }
    >
      {children}
    </button>
  );
}
