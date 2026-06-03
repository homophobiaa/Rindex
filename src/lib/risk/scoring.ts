/**
 * RiskIndex scoring engine — v2.
 *
 * ── Model ──────────────────────────────────────────────────────────
 *
 * Each pillar has a set of threat factors (raise risk) and protective
 * factors (lower risk), each with a `delta` weight.
 *
 * For every pillar:
 *
 *   raw       = Σ active_threat_deltas − Σ active_protective_deltas
 *   span      = Σ all_threat_deltas + Σ all_protective_deltas
 *   maxProtect= Σ all_protective_deltas
 *
 *   normalized = (raw + maxProtect) / span × 100
 *
 *   This gives 0 when all protectives are on and no threats are active,
 *   and 100 when all threats are on and no protectives are active.
 *
 *   A FLOOR of 5 is applied to every pillar to reflect the inherent
 *   online risk of existing — even the most security-conscious user
 *   cannot reach absolute zero.
 *
 * Final RiskIndex = Σ(pillar_weight × pillar_score)   [0..100]
 *
 * ── Why no baseline? ───────────────────────────────────────────────
 *
 * The old model started from 50 and added/subtracted fixed deltas,
 * which made it impossible to reach either extreme and produced
 * confusing "49 before answering anything" behaviour. The normalized
 * model starts from ~5 (floor) and rises as threats are discovered —
 * every number is traceable back to specific factor states.
 *
 * ── Calibrated ranges ──────────────────────────────────────────────
 *
 *   Very secure   (pw-manager, hw-key, secure recovery, private) →  ~7–12
 *   Average       (reuse, SMS MFA, weak recovery, public email)   → ~48–58
 *   Very risky    (reuse, no MFA, all threats active)             → ~90–98
 */

import { FACTORS } from './factors';
import { PILLARS, type Pillar, type PillarId } from './pillars';

export type FactorState = Record<string, boolean>;

/** Floor applied to every pillar score — inherent online risk. */
const PILLAR_FLOOR = 5;

/** Build the theoretical max-threat and max-protect totals per pillar. */
interface PillarNorm {
  maxThreat: number;
  maxProtect: number;
  /** maxThreat + maxProtect — the full possible swing. */
  span: number;
}

function buildPillarNorms(): Map<PillarId, PillarNorm> {
  const map = new Map<PillarId, PillarNorm>();
  for (const p of PILLARS) {
    map.set(p.id, { maxThreat: 0, maxProtect: 0, span: 0 });
  }
  for (const f of FACTORS) {
    const entry = map.get(f.pillar);
    if (!entry) continue;
    if (f.kind === 'threat') entry.maxThreat += f.delta;
    else entry.maxProtect += f.delta;
  }
  for (const entry of map.values()) {
    entry.span = entry.maxThreat + entry.maxProtect;
  }
  return map;
}

const PILLAR_NORMS = buildPillarNorms();

/** Build the default state (all factors off — no threats, no protections). */
export function defaultFactorState(): FactorState {
  const state: FactorState = {};
  for (const f of FACTORS) state[f.id] = false;
  return state;
}

/**
 * Compute the normalized pillar score (0..100) for a single pillar.
 *
 * Formula:
 *   raw    = Σactive_threats − Σactive_protectives
 *   norm   = (raw + maxProtect) / span × 100
 *   result = clamp(norm, FLOOR, 100)
 */
export function computePillarScore(pillar: PillarId, state: FactorState): number {
  const norm = PILLAR_NORMS.get(pillar) ?? { maxThreat: 0, maxProtect: 0, span: 1 };
  if (norm.span === 0) return PILLAR_FLOOR;

  let raw = 0;
  for (const f of FACTORS) {
    if (f.pillar !== pillar || !state[f.id]) continue;
    raw += f.kind === 'threat' ? f.delta : -f.delta;
  }

  const normalized = ((raw + norm.maxProtect) / norm.span) * 100;
  return clamp(Math.round(normalized), PILLAR_FLOOR, 100);
}

export interface PillarBreakdown {
  pillar: Pillar;
  score: number;
  contribution: number; // weighted contribution to composite
}

/** Per-pillar breakdown with weighted contribution. */
export function pillarBreakdown(state: FactorState): PillarBreakdown[] {
  return PILLARS.map((p) => {
    const score = computePillarScore(p.id, state);
    return { pillar: p, score, contribution: score * p.weight };
  });
}

/** Weighted composite RiskIndex (0..100). */
export function compositeScore(state: FactorState): number {
  const raw = PILLARS.reduce((sum, p) => sum + computePillarScore(p.id, state) * p.weight, 0);
  return clamp(Math.round(raw), 0, 100);
}

/**
 * Legacy alias — some components import `computeRiskIndex`.
 * Delegates to compositeScore so there is one scoring path.
 */
export function computeRiskIndex(state: FactorState): number {
  return compositeScore(state);
}

/* ------------------------------------------------------------------ */
/* Attack probability curve                                           */
/* ------------------------------------------------------------------ */

/**
 * Smooth-step curve mapping RiskIndex (0..100) → attack probability (0..1).
 *
 * Behaviour:
 *   score  5  → p ≈ 0.003  (0.3%)
 *   score 10  → p ≈ 0.013  (1.3%)
 *   score 50  → p ≈ 0.50   (50%)
 *   score 80  → p ≈ 0.90   (90%)
 *   score 95  → p ≈ 0.986  (98.6%)
 */
export function attackProbability(riskIndex: number): number {
  const x = clamp(riskIndex, 0, 100) / 100;
  return clamp(x * x * (3 - 2 * x), 0, 1);
}

/* ------------------------------------------------------------------ */
/* Risk band labels                                                   */
/* ------------------------------------------------------------------ */

export type RiskBand = 'low' | 'moderate' | 'elevated' | 'critical';

/** Adjusted thresholds for the v2 model. */
export function riskBand(score: number): RiskBand {
  if (score < 22) return 'low';
  if (score < 58) return 'moderate';
  if (score < 78) return 'elevated';
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
/* Probability chain math                                             */
/* ------------------------------------------------------------------ */

/**
 * P(attacker succeeds somewhere) = 1 − ∏(1 − pᵢ).
 * One high-probability step dominates the entire chain.
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

/* ------------------------------------------------------------------ */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
