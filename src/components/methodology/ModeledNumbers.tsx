import { useState } from 'react';
import { motion } from 'framer-motion';
import { attackProbability } from '@/lib/risk';
import { BANDS } from '@/lib/methodology/facts';
import { useMotionTransition } from '@/lib/motion';

/**
 * Where the confident-looking percentages come from.
 *
 * The exposure curve is plotted directly from `attackProbability` so the
 * shape on screen is the function, not an artist's impression of it. The
 * point of the section is that the curve is a design decision, not a
 * measurement — so it shows the actual formula next to the actual plot.
 */

const WIDTH = 100;
const HEIGHT = 46;

function curvePath(): string {
  const pts: string[] = [];
  for (let x = 0; x <= 100; x += 2) {
    const y = HEIGHT - attackProbability(x) * HEIGHT;
    pts.push(`${x === 0 ? 'M' : 'L'} ${(x / 100) * WIDTH} ${y}`);
  }
  return pts.join(' ');
}

export function ModeledNumbers() {
  const [score, setScore] = useState(58);
  const transition = useMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });
  const p = attackProbability(score);
  const band = BANDS.find((b) => score >= b.from && score <= b.to) ?? BANDS[0];

  return (
    <div className="space-y-4">
      {/* The curve */}
      <div className="rounded-xl border border-hairline bg-surface-1/60 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-body-lg font-medium text-ink">The exposure curve, plotted honestly</h3>
          <code className="rounded bg-surface-3 px-2 py-0.5 font-mono text-caption text-ink-muted">
            f(x) = x²(3 − 2x)
          </code>
        </div>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          That one line is the entire &ldquo;attack success&rdquo; model. It is a smoothstep
          curve — a tidy S-shape that turns your score into a percentage. It was chosen because
          the shape felt proportionate, not because anyone went out and measured it.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_190px]">
          <div>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-[150px] w-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              aria-label="Smoothstep curve mapping risk score to a modeled exposure level"
            >
              {[0.25, 0.5, 0.75].map((g) => (
                <line
                  key={g}
                  x1={0}
                  x2={WIDTH}
                  y1={HEIGHT * g}
                  y2={HEIGHT * g}
                  stroke="#1c1c22"
                  strokeWidth="0.4"
                />
              ))}
              <path
                d={curvePath()}
                fill="none"
                stroke="#5e6ad2"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
              <motion.circle
                cx={(score / 100) * WIDTH}
                cy={HEIGHT - p * HEIGHT}
                r="2"
                fill={band.color}
                animate={{
                  cx: (score / 100) * WIDTH,
                  cy: HEIGHT - p * HEIGHT,
                }}
                transition={transition}
              />
            </svg>
            <div className="mt-1 flex justify-between font-mono text-micro text-ink-tertiary">
              <span>score 0</span>
              <span>score 100</span>
            </div>
            <label className="mt-3 block">
              <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
                Drag a score
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value, 10))}
                className="lab-range mt-1.5 w-full accent-primary"
                aria-label="RiskIndex score to plot on the exposure curve"
              />
            </label>
          </div>

          <div className="space-y-2">
            <Readout label="RiskIndex" value={String(score)} accent={band.color} />
            <Readout
              label="Modeled exposure"
              value={`${Math.round(p * 100)}%`}
              accent={band.color}
            />
            <Readout label="Band" value={band.label} accent={band.color} small />
            <p className="text-caption leading-snug text-ink-tertiary">
              Same score in, same percentage out, every time. That is determinism, not accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Naming */}
      <div className="rounded-xl border border-warning/30 bg-warning/[0.07] p-4">
        <h3 className="text-body-lg font-medium text-warning">
          A percentage sign is not evidence
        </h3>
        <p className="mt-1.5 text-body-sm leading-relaxed text-ink-muted">
          &ldquo;68%&rdquo; reads as though somebody counted something. Nobody did. Every
          percentage on this site is a rule-based transformation of answers you clicked thirty
          seconds ago. Reproducible, inspectable, internally consistent — and still not a
          measurement of the world outside your browser tab.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Term
            label="Calculated"
            body="Follows deterministically from your answers and the published weights. Pillar scores, the composite, projected changes."
            accent="#27a644"
          />
          <Term
            label="Modeled"
            body="A curve or weighting somebody designed to feel proportionate. Exposure level, attack-type weighting."
            accent="#f79009"
          />
          <Term
            label="Self-reported"
            body="Whatever you clicked. The foundation everything else is built on, accurate or not."
            accent="#4cc2ff"
          />
          <Term
            label="Illustrative"
            body="Present to explain an idea, not to describe you. Scenario walkthroughs and example figures."
            accent="#8a8f98"
          />
        </div>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/50 px-3 py-2">
      <div className="text-micro uppercase tracking-wider text-ink-tertiary">{label}</div>
      <div
        className={
          small
            ? 'mt-0.5 text-body-sm font-medium'
            : 'mt-0.5 font-mono text-[20px] tabular-nums'
        }
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

function Term({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-3 py-2.5">
      <div className="text-micro font-medium uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </div>
      <p className="mt-1 text-caption leading-snug text-ink-muted">{body}</p>
    </div>
  );
}
