/**
 * RiskIndex scoring engine.
 *
 * Pure functions only. Same shape will be re-used by the upcoming
 * Personal Risk Profiler — there is no page-local logic.
 *
 * Score model
 * -----------
 *   baseline (50) + sum(threat deltas) − sum(protective deltas)
 *   clamped to 0..100
 *
 *   0   = safest
 *   100 = most exposed
 *
 * Composite scoring
 * -----------------
 *   The composite RiskIndex is a weighted sum across the six pillars
 *   (see pillars.ts). Each pillar's per-pillar score is computed the
 *   same way using only the factors that belong to it.
 *
 * Weakest-link
 * ------------
 *   Compounding probability: the chance the attacker succeeds at any
 *   step is 1 - Π(1 - p_i). One weak link dominates the chain.
 */

import { FACTORS, type Factor } from './factors';
import { PILLARS, type Pillar, type PillarId } from './pillars';

export type FactorState = Record<string, boolean>;

export const RISK_BASELINE = 50;

/** Build the initial factor state using each factor's `defaultOn` flag. */
export function defaultFactorState(): FactorState {
  const state: FactorState = {};
  for (const f of FACTORS) state[f.id] = !!f.defaultOn;
  return state;
}

/** Compute the raw delta a factor contributes when active. */
function appliedDelta(f: Factor): number {
  return f.kind === 'threat' ? f.delta : -f.delta;
}

/** Compute the overall RiskIndex (0..100) from a factor state. */
export function computeRiskIndex(state: FactorState): number {
  let score = RISK_BASELINE;
  for (const f of FACTORS) {
    if (state[f.id]) score += appliedDelta(f);
  }
  return clamp(score, 0, 100);
}

/** Compute the per-pillar score (0..100) using only that pillar's factors. */
export function computePillarScore(pillar: PillarId, state: FactorState): number {
  let score = RISK_BASELINE;
  for (const f of FACTORS) {
    if (f.pillar !== pillar) continue;
    if (state[f.id]) score += appliedDelta(f);
  }
  return clamp(score, 0, 100);
}

export interface PillarBreakdown {
  pillar: Pillar;
  score: number;
  contribution: number; // weighted contribution to the composite (0..100)
}

/** Per-pillar breakdown with weighted contribution. */
export function pillarBreakdown(state: FactorState): PillarBreakdown[] {
  return PILLARS.map((p) => {
    const score = computePillarScore(p.id, state);
    return { pillar: p, score, contribution: score * p.weight };
  });
}

/** Weighted composite score across all pillars. */
export function compositeScore(state: FactorState): number {
  return clamp(
    pillarBreakdown(state).reduce((sum, b) => sum + b.contribution, 0),
    0,
    100,
  );
}

/* ------------------------------------------------------------------ */
/* Probability + chain math                                            */
/* ------------------------------------------------------------------ */

/**
 * Compounded-failure probability across an attack chain.
 *
 * Given per-step success probabilities p_i (each 0..1), the chance the
 * attacker succeeds *somewhere* in the chain is:
 *
 *   P(any) = 1 − Π(1 − p_i)
 *
 * The maximum p_i is the chain's weakest link — even one high-probability
 * step pulls the whole result up.
 */
export function chainFailureProbability(steps: number[]): number {
  if (steps.length === 0) return 0;
  const survival = steps.reduce((acc, p) => acc * (1 - clamp(p, 0, 1)), 1);
  return 1 - survival;
}

/** Returns the index of the highest-probability (weakest) step. */
export function weakestLink(steps: number[]): number {
  let idx = 0;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i] > steps[idx]) idx = i;
  }
  return idx;
}

/**
 * Derive a rough attack-success probability (0..1) from the composite
 * RiskIndex. Higher index → higher attack probability. We use a smooth
 * curve so toggles feel continuous in the UI.
 */
export function attackProbability(riskIndex: number): number {
  const x = clamp(riskIndex, 0, 100) / 100;
  // Smoothstep-ish — slightly compressed at the ends.
  return clamp(x * x * (3 - 2 * x), 0, 1);
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export type RiskBand = 'low' | 'moderate' | 'elevated' | 'critical';

export function riskBand(score: number): RiskBand {
  if (score < 30) return 'low';
  if (score < 55) return 'moderate';
  if (score < 75) return 'elevated';
  return 'critical';
}

export function riskBandLabel(band: RiskBand): string {
  switch (band) {
    case 'low':
      return 'Low exposure';
    case 'moderate':
      return 'Moderate exposure';
    case 'elevated':
      return 'Elevated exposure';
    case 'critical':
      return 'Critical exposure';
  }
}

export function riskBandColor(band: RiskBand): string {
  switch (band) {
    case 'low':
      return '#27a644';
    case 'moderate':
      return '#5e6ad2';
    case 'elevated':
      return '#f79009';
    case 'critical':
      return '#f04438';
  }
}

/* ------------------------------------------------------------------ */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
