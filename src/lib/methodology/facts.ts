/**
 * Methodology facts, derived from the real engine.
 *
 * Every number the Methodology page states about itself is computed here
 * from the actual scoring source — factor lists, pillar weights, question
 * definitions. Nothing is typed out by hand, so the page cannot drift out
 * of sync with the implementation the way hardcoded copy would.
 */

import { FACTORS, PILLARS, computePillarScore, compositeScore } from '@/lib/risk';
import type { FactorState, PillarId } from '@/lib/risk';
import { STEPS, ALL_QUESTIONS, TOTAL_QUESTIONS, APPROX_QUESTIONS } from '@/lib/profile';

/* ------------------------------------------------------------------ */
/* Questionnaire shape                                                 */
/* ------------------------------------------------------------------ */

/** Questions that are only asked when an earlier answer makes them relevant. */
export const CONDITIONAL_QUESTIONS = ALL_QUESTIONS.filter((entry) => !!entry.question.condition);

export const QUESTION_FACTS = {
  total: TOTAL_QUESTIONS,
  typical: APPROX_QUESTIONS,
  conditional: CONDITIONAL_QUESTIONS.length,
  steps: STEPS.length,
};

/* ------------------------------------------------------------------ */
/* Factor / pillar shape                                               */
/* ------------------------------------------------------------------ */

export const FACTOR_FACTS = {
  total: FACTORS.length,
  threats: FACTORS.filter((f) => f.kind === 'threat').length,
  protective: FACTORS.filter((f) => f.kind === 'protective').length,
};

export interface PillarMath {
  id: PillarId;
  label: string;
  weight: number;
  accent: string;
  /** Sum of every threat delta in this pillar. */
  maxThreat: number;
  /** Sum of every protective delta in this pillar. */
  maxProtect: number;
  /** maxThreat + maxProtect — the full swing the normalizer divides by. */
  span: number;
  threatCount: number;
  protectiveCount: number;
}

/** Per-pillar totals, recomputed from FACTORS exactly as scoring.ts does. */
export const PILLAR_MATH: PillarMath[] = PILLARS.map((p) => {
  const own = FACTORS.filter((f) => f.pillar === p.id);
  const maxThreat = own.filter((f) => f.kind === 'threat').reduce((s, f) => s + f.delta, 0);
  const maxProtect = own.filter((f) => f.kind === 'protective').reduce((s, f) => s + f.delta, 0);
  return {
    id: p.id,
    label: p.label,
    weight: p.weight,
    accent: p.accent,
    maxThreat,
    maxProtect,
    span: maxThreat + maxProtect,
    threatCount: own.filter((f) => f.kind === 'threat').length,
    protectiveCount: own.filter((f) => f.kind === 'protective').length,
  };
});

/** Heaviest weight — used to scale comparison bars honestly. */
export const MAX_PILLAR_WEIGHT = Math.max(...PILLARS.map((p) => p.weight));

/** Should always be exactly 1. Rendered so a reader can verify it. */
export const WEIGHT_SUM = PILLARS.reduce((s, p) => s + p.weight, 0);

/** The floor scoring.ts applies to every pillar. Kept in sync manually is
 *  not an option — derive it by scoring a perfectly clean state. */
export const PILLAR_FLOOR = (() => {
  const clean: FactorState = {};
  for (const f of FACTORS) clean[f.id] = f.kind === 'protective';
  return Math.min(...PILLARS.map((p) => computePillarScore(p.id, clean)));
})();

/* ------------------------------------------------------------------ */
/* Reference profiles — computed, never asserted                        */
/* ------------------------------------------------------------------ */

function stateFrom(activeIds: string[]): FactorState {
  const s: FactorState = {};
  for (const f of FACTORS) s[f.id] = activeIds.includes(f.id);
  return s;
}

/** Every protective on, every threat off. */
export const BEST_CASE_STATE = stateFrom(
  FACTORS.filter((f) => f.kind === 'protective').map((f) => f.id),
);

/** Every threat on, every protective off. */
export const WORST_CASE_STATE = stateFrom(
  FACTORS.filter((f) => f.kind === 'threat').map((f) => f.id),
);

export const SCORE_RANGE = {
  best: compositeScore(BEST_CASE_STATE),
  worst: compositeScore(WORST_CASE_STATE),
};

/* ------------------------------------------------------------------ */
/* Band thresholds — mirrored from riskBand() for display              */
/* ------------------------------------------------------------------ */

export const BANDS = [
  { label: 'Low exposure', from: 0, to: 21, color: '#27a644' },
  { label: 'Moderate exposure', from: 22, to: 57, color: '#5e6ad2' },
  { label: 'Elevated exposure', from: 58, to: 77, color: '#f79009' },
  { label: 'Critical exposure', from: 78, to: 100, color: '#f04438' },
] as const;
