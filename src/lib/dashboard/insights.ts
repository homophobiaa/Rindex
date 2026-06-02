/**
 * Unified Risk Dashboard — insight derivation.
 *
 * Everything here is a PURE function of the shared `@/lib/risk` FactorState.
 * There is no separate scoring engine: weakest links and strengths reuse
 * the profiler's `recommendationsFor` / `strengthsFor`, the timeline reuses
 * `compositeScore`, and the attack likelihoods are a thin, transparent
 * mapping from the same factors the rest of the app already evaluates.
 *
 * Keeping it derivation-only means the dashboard, the profiler result
 * screen, and the methodology page can never disagree about a score.
 */

import {
  FACTORS,
  attackProbability,
  compositeScore,
  factorById,
  riskBand,
  riskBandColor,
  type FactorState,
} from '@/lib/risk';
import { recommendationsFor, strengthsFor } from '@/lib/profile';

/* ------------------------------------------------------------------ */
/* Difficulty metadata — how much effort a fix takes.                  */
/* ------------------------------------------------------------------ */

export type Difficulty = 'easy' | 'moderate' | 'involved';

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; rank: number }> = {
  easy: { label: 'Easy', color: '#27a644', rank: 0 },
  moderate: { label: 'Moderate', color: '#f79009', rank: 1 },
  involved: { label: 'Involved', color: '#a78bfa', rank: 2 },
};

/** Effort to flip each factor into its protective state. */
const FACTOR_DIFFICULTY: Record<string, Difficulty> = {
  'reused-password': 'involved', // requires changing many passwords
  'password-manager': 'moderate',
  'unique-passwords': 'involved',
  'hardware-key': 'moderate', // buy + enroll a key
  'sms-2fa-only': 'easy', // swap to an authenticator app
  'backup-codes': 'easy',
  'weak-recovery': 'moderate',
  'device-encryption': 'easy', // one toggle
  'public-wifi': 'easy', // habit / VPN
  'public-email': 'moderate',
  'mfa-fatigue': 'easy', // behavioral
  oversharing: 'easy',
};

function difficultyFor(factorId: string): Difficulty {
  return FACTOR_DIFFICULTY[factorId] ?? 'moderate';
}

/* ------------------------------------------------------------------ */
/* Score summary                                                       */
/* ------------------------------------------------------------------ */

export interface ScoreSummary {
  score: number;
  band: ReturnType<typeof riskBand>;
  accent: string;
  attackProbability: number; // 0..1
  /** One-line verdict tuned to the band. */
  verdict: string;
}

const VERDICT_BY_BAND: Record<ReturnType<typeof riskBand>, string> = {
  low: 'You are a hard target. A few refinements would make you nearly untouchable.',
  moderate: 'A solid baseline with a handful of open doors worth closing this week.',
  elevated: 'Several attack paths are realistically open — the top fix alone moves the needle a lot.',
  critical: 'Multiple critical weaknesses compound on each other. Start at the top of the list today.',
};

export function scoreSummary(state: FactorState): ScoreSummary {
  const score = Math.round(compositeScore(state));
  const band = riskBand(score);
  return {
    score,
    band,
    accent: riskBandColor(band),
    attackProbability: attackProbability(score),
    verdict: VERDICT_BY_BAND[band],
  };
}

/* ------------------------------------------------------------------ */
/* Confidence                                                          */
/* ------------------------------------------------------------------ */

export interface Confidence {
  /** 0..1 — share of the questionnaire that informed this profile. */
  ratio: number;
  level: 'low' | 'medium' | 'high';
  label: string;
}

export function confidenceFor(answeredCount: number, totalQuestions: number): Confidence {
  const ratio = totalQuestions > 0 ? Math.min(1, answeredCount / totalQuestions) : 0;
  let level: Confidence['level'] = 'low';
  if (ratio >= 0.99) level = 'high';
  else if (ratio >= 0.6) level = 'medium';
  const label =
    level === 'high'
      ? 'High confidence'
      : level === 'medium'
        ? 'Partial profile'
        : 'Low confidence';
  return { ratio, level, label };
}

/* ------------------------------------------------------------------ */
/* Weakest links & strongest defenses                                  */
/* ------------------------------------------------------------------ */

export interface WeakLink {
  factorId: string;
  title: string;
  detail: string;
  /** Raw RiskIndex points this weakness contributes. */
  impact: number;
  pillar: string;
}

/** Top risk drivers (biggest open weaknesses), highest-impact first. */
export function weakestLinks(state: FactorState, limit = 5): WeakLink[] {
  return recommendationsFor(state)
    .slice(0, limit)
    .map((r) => ({
      factorId: r.factorId,
      title: r.title,
      detail: r.detail,
      impact: r.impact,
      pillar: r.pillar,
    }));
}

export interface Defense {
  factorId: string;
  title: string;
  detail: string;
  pillar: string;
}

/** What the user is already doing well, strongest first. */
export function strongestDefenses(state: FactorState, limit = 5): Defense[] {
  return strengthsFor(state)
    .slice(0, limit)
    .map((s) => ({
      factorId: s.factorId,
      title: s.title,
      detail: s.detail,
      pillar: s.pillar,
    }));
}

/* ------------------------------------------------------------------ */
/* Attack likelihoods                                                  */
/* ------------------------------------------------------------------ */

export type AttackId =
  | 'credential-stuffing'
  | 'phishing'
  | 'sim-swap'
  | 'session-hijacking'
  | 'social-engineering'
  | 'recovery-abuse';

export interface AttackLikelihood {
  id: AttackId;
  label: string;
  /** One-line description of the attack. */
  blurb: string;
  /** Estimated success likelihood, 0..1. */
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  /** Human-readable factors currently driving this likelihood up. */
  drivers: string[];
}

/**
 * Each attack is modeled as a small weighted sum of the factors that
 * realistically feed it. A factor "fires" when it is in its dangerous
 * state (threat present, or protective missing). Weights are in 0..1 and
 * the result is clamped — transparent and easy to defend in a viva.
 */
interface AttackModel {
  id: AttackId;
  label: string;
  blurb: string;
  base: number;
  /** factorId → { weight, dangerousWhenOn, driver } */
  inputs: Array<{ factorId: string; weight: number; driver: string }>;
}

const ATTACK_MODELS: AttackModel[] = [
  {
    id: 'credential-stuffing',
    label: 'Credential stuffing',
    blurb: 'Reused logins replayed from breach dumps across your accounts.',
    base: 0.08,
    inputs: [
      { factorId: 'reused-password', weight: 0.55, driver: 'Password reuse' },
      { factorId: 'unique-passwords', weight: 0.25, driver: 'No unique passwords' },
      { factorId: 'password-manager', weight: 0.18, driver: 'No password manager' },
      { factorId: 'public-email', weight: 0.08, driver: 'Email is easy to find' },
    ],
  },
  {
    id: 'phishing',
    label: 'Phishing',
    blurb: 'A convincing fake login page or message harvests your credentials.',
    base: 0.12,
    inputs: [
      { factorId: 'hardware-key', weight: 0.4, driver: 'No phishing-resistant key' },
      { factorId: 'mfa-fatigue', weight: 0.22, driver: 'Approves unexpected prompts' },
      { factorId: 'public-email', weight: 0.16, driver: 'Public email = target list' },
      { factorId: 'oversharing', weight: 0.12, driver: 'Public details enable lures' },
    ],
  },
  {
    id: 'sim-swap',
    label: 'SIM swap',
    blurb: 'Your number is ported away, intercepting SMS codes and resets.',
    base: 0.05,
    inputs: [
      { factorId: 'sms-2fa-only', weight: 0.5, driver: 'SMS-only 2FA' },
      { factorId: 'weak-recovery', weight: 0.3, driver: 'Weak recovery channel' },
      { factorId: 'oversharing', weight: 0.12, driver: 'Personal info exposed' },
    ],
  },
  {
    id: 'session-hijacking',
    label: 'Session hijacking',
    blurb: 'A token or cookie is captured on an untrusted network or device.',
    base: 0.06,
    inputs: [
      { factorId: 'public-wifi', weight: 0.45, driver: 'Unsecured public Wi-Fi' },
      { factorId: 'device-encryption', weight: 0.25, driver: 'Device not encrypted' },
      { factorId: 'hardware-key', weight: 0.14, driver: 'No hardware-bound session' },
    ],
  },
  {
    id: 'social-engineering',
    label: 'Social engineering',
    blurb: 'A human is talked into granting access or approving a request.',
    base: 0.1,
    inputs: [
      { factorId: 'mfa-fatigue', weight: 0.32, driver: 'Approves prompts under pressure' },
      { factorId: 'oversharing', weight: 0.28, driver: 'Oversharing seeds pretexts' },
      { factorId: 'weak-recovery', weight: 0.2, driver: 'Support-line recovery weak' },
      { factorId: 'public-email', weight: 0.1, driver: 'Reachable contact point' },
    ],
  },
  {
    id: 'recovery-abuse',
    label: 'Account recovery abuse',
    blurb: 'The attacker walks in the back door: your reset / recovery flow.',
    base: 0.06,
    inputs: [
      { factorId: 'weak-recovery', weight: 0.45, driver: 'Weak recovery email/phone' },
      { factorId: 'sms-2fa-only', weight: 0.25, driver: 'SMS reset codes' },
      { factorId: 'backup-codes', weight: 0.18, driver: 'No safe backup codes' },
      { factorId: 'oversharing', weight: 0.12, driver: 'Security-question answers public' },
    ],
  },
];

/** Is this factor currently in its *dangerous* state? */
function factorIsDangerous(factorId: string, state: FactorState): boolean {
  const f = factorById(factorId);
  const on = !!state[factorId];
  return f.kind === 'protective' ? !on : on;
}

function severityFor(p: number): AttackLikelihood['severity'] {
  if (p >= 0.66) return 'critical';
  if (p >= 0.45) return 'high';
  if (p >= 0.22) return 'medium';
  return 'low';
}

const SEVERITY_COLOR: Record<AttackLikelihood['severity'], string> = {
  low: '#27a644',
  medium: '#f79009',
  high: '#f04438',
  critical: '#d8341c',
};

export function attackLikelihoods(state: FactorState): AttackLikelihood[] {
  return ATTACK_MODELS.map((m) => {
    let p = m.base;
    const drivers: string[] = [];
    for (const input of m.inputs) {
      if (factorIsDangerous(input.factorId, state)) {
        p += input.weight;
        drivers.push(input.driver);
      }
    }
    p = Math.max(0, Math.min(1, p));
    const severity = severityFor(p);
    return {
      id: m.id,
      label: m.label,
      blurb: m.blurb,
      probability: p,
      severity,
      color: SEVERITY_COLOR[severity],
      drivers,
    };
  }).sort((a, b) => b.probability - a.probability);
}

/* ------------------------------------------------------------------ */
/* Priority recommendations                                            */
/* ------------------------------------------------------------------ */

export interface PriorityRecommendation {
  factorId: string;
  action: string;
  why: string;
  /** Actual composite-score reduction from applying just this fix (points). */
  scoreReduction: number;
  difficulty: Difficulty;
  pillar: string;
}

/**
 * Ranked fixes. The displayed "score reduction" is the REAL composite
 * delta from flipping this one factor — measured against the live engine,
 * not a static guess — so the number always matches the timeline.
 *
 * Ordering balances impact against effort: high-impact / low-effort wins
 * float to the top (impact divided by a small difficulty penalty).
 */
export function priorityRecommendations(state: FactorState, limit = 6): PriorityRecommendation[] {
  const baseScore = compositeScore(state);

  const recs = recommendationsFor(state).map((r) => {
    const fixed = applyFix(state, r.factorId);
    const scoreReduction = Math.max(0, Math.round(baseScore - compositeScore(fixed)));
    const difficulty = difficultyFor(r.factorId);
    return {
      factorId: r.factorId,
      action: r.title,
      why: r.detail,
      scoreReduction,
      difficulty,
      pillar: r.pillar,
    };
  });

  recs.sort((a, b) => {
    const penalty = (d: Difficulty) => 1 + DIFFICULTY_META[d].rank * 0.4;
    return b.scoreReduction / penalty(b.difficulty) - a.scoreReduction / penalty(a.difficulty);
  });

  return recs.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Risk reduction timeline                                             */
/* ------------------------------------------------------------------ */

export interface TimelineStep {
  /** Short label: 'Current' or the fix that was applied to reach this score. */
  label: string;
  factorId?: string;
  score: number;
  /** Points shed relative to the previous step (0 for the starting point). */
  delta: number;
}

/**
 * Greedy "if you fix these in order" curve. Starts at the live composite
 * score, then applies the highest-impact open fixes one at a time,
 * recomputing the real composite at each step. Produces a satisfying,
 * honest decline because it uses the same engine as everything else.
 */
export function riskTimeline(state: FactorState, maxSteps = 4): TimelineStep[] {
  let working: FactorState = { ...state };
  let prevScore = Math.round(compositeScore(working));

  const steps: TimelineStep[] = [{ label: 'Current', score: prevScore, delta: 0 }];

  // Re-rank after each fix so the curve always takes the next-best move.
  for (let i = 0; i < maxSteps; i++) {
    const next = priorityRecommendations(working, 1)[0];
    if (!next || next.scoreReduction <= 0) break;
    working = applyFix(working, next.factorId);
    const score = Math.round(compositeScore(working));
    steps.push({
      label: shortAction(next.action),
      factorId: next.factorId,
      score,
      delta: prevScore - score,
    });
    prevScore = score;
  }

  return steps;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Return a copy of `state` with `factorId` flipped into its safe state. */
function applyFix(state: FactorState, factorId: string): FactorState {
  const f = factorById(factorId);
  // Protective factors are good when ON; threats are good when OFF.
  return { ...state, [factorId]: f.kind === 'protective' };
}

/** Trim an action title for compact timeline / chart labels. */
function shortAction(action: string): string {
  return action.length > 26 ? `${action.slice(0, 24)}…` : action;
}

/** Convenience: does this state carry any open weakness at all? */
export function hasOpenWeaknesses(state: FactorState): boolean {
  return FACTORS.some((f) => factorIsDangerous(f.id, state));
}
