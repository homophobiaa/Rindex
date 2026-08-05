/**
 * Unified Risk Dashboard — insight derivation (v2).
 *
 * Pure functions over the shared FactorState using v2 factor IDs.
 * Nothing here duplicates the scoring engine — all numbers derive from
 * `@/lib/risk` computations.
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
/* Difficulty                                                          */
/* ------------------------------------------------------------------ */

export type Difficulty = 'easy' | 'moderate' | 'involved';

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; rank: number }> = {
  easy:     { label: 'Easy',     color: '#27a644', rank: 0 },
  moderate: { label: 'Moderate', color: '#f79009', rank: 1 },
  involved: { label: 'Involved', color: '#a78bfa', rank: 2 },
};

const FACTOR_DIFFICULTY: Record<string, Difficulty> = {
  'pw-reuse':        'involved',
  'pw-manager':      'moderate',
  'pw-unique':       'involved',
  'pw-browser-only': 'easy',
  'pw-weak':         'moderate',
  'mfa-none':        'easy',
  'mfa-sms':         'easy',
  'mfa-app':         'easy',
  'mfa-hardware':    'moderate',
  'rec-backup-codes':'easy',
  'rec-weak-email':  'moderate',
  'rec-same-creds':  'moderate',
  'rec-exposed-phone':'easy',
  'exp-public-email':'moderate',
  'exp-public-phone':'easy',
  'exp-public-info': 'easy',
  'exp-creator':     'involved',
  'bhv-mfa-fatigue': 'easy',
  'bhv-phishing':    'easy',
  'bhv-oversharing': 'easy',
  'dev-no-lock':     'easy',
  'dev-wifi-open':   'easy',
  'dev-outdated':    'easy',
  'dev-encrypted':   'easy',
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
  attackProbability: number;
  verdict: string;
}

const VERDICT_BY_BAND: Record<ReturnType<typeof riskBand>, string> = {
  low:      'You are a hard target. A few refinements would make you nearly untouchable.',
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
  ratio: number;
  level: 'low' | 'medium' | 'high';
  label: string;
}

export function confidenceFor(answeredCount: number, totalQuestions: number): Confidence {
  const ratio = totalQuestions > 0 ? Math.min(1, answeredCount / totalQuestions) : 0;
  let level: Confidence['level'] = 'low';
  if (ratio >= 0.99) level = 'high';
  else if (ratio >= 0.6) level = 'medium';
  // This is completion, not statistical confidence — the label says so.
  const label =
    level === 'high' ? 'All answered' :
    level === 'medium' ? 'Partly answered' :
    'Barely answered';
  return { ratio, level, label };
}

/* ------------------------------------------------------------------ */
/* Weakest links & defenses                                            */
/* ------------------------------------------------------------------ */

export interface WeakLink {
  factorId: string;
  title: string;
  detail: string;
  impact: number;
  pillar: string;
}

export function weakestLinks(state: FactorState, limit = 5): WeakLink[] {
  return recommendationsFor(state).slice(0, limit).map((r) => ({
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

export function strongestDefenses(state: FactorState, limit = 5): Defense[] {
  return strengthsFor(state).slice(0, limit).map((s) => ({
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
  blurb: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  drivers: string[];
}

interface AttackModel {
  id: AttackId;
  label: string;
  blurb: string;
  base: number;
  inputs: Array<{ factorId: string; weight: number; driver: string }>;
}

const ATTACK_MODELS: AttackModel[] = [
  {
    id: 'credential-stuffing',
    label: 'Credential stuffing',
    blurb: 'Reused logins replayed from breach dumps.',
    base: 0.06,
    inputs: [
      { factorId: 'pw-reuse',        weight: 0.52, driver: 'Password reuse' },
      { factorId: 'pw-unique',       weight: 0.22, driver: 'Non-unique passwords' },  // protective absent
      { factorId: 'pw-manager',      weight: 0.15, driver: 'No password manager' },   // protective absent
      { factorId: 'exp-public-email',weight: 0.07, driver: 'Email findable' },
    ],
  },
  {
    id: 'phishing',
    label: 'Phishing',
    blurb: 'Fake login pages or urgent messages steal credentials.',
    base: 0.10,
    inputs: [
      { factorId: 'mfa-hardware',     weight: 0.36, driver: 'No phishing-resistant key' }, // absent
      { factorId: 'bhv-phishing',     weight: 0.28, driver: 'Clicks suspicious links' },
      { factorId: 'exp-public-email', weight: 0.14, driver: 'Email is targetable' },
      { factorId: 'bhv-oversharing',  weight: 0.12, driver: 'Personal details seed lures' },
    ],
  },
  {
    id: 'sim-swap',
    label: 'SIM swap',
    blurb: 'Phone number hijacked — SMS codes redirected.',
    base: 0.04,
    inputs: [
      { factorId: 'mfa-sms',          weight: 0.48, driver: 'SMS is the primary 2FA' },
      { factorId: 'rec-weak-email',   weight: 0.26, driver: 'Recovery channel is weak' },
      { factorId: 'rec-exposed-phone',weight: 0.20, driver: 'Phone number is public' },
      { factorId: 'bhv-oversharing',  weight: 0.06, driver: 'Personal info exposed' },
    ],
  },
  {
    id: 'session-hijacking',
    label: 'Session hijacking',
    blurb: 'Session token stolen on an untrusted network or device.',
    base: 0.05,
    inputs: [
      { factorId: 'dev-wifi-open',  weight: 0.44, driver: 'Unprotected public Wi-Fi' },
      { factorId: 'dev-encrypted',  weight: 0.24, driver: 'Device not encrypted' },    // absent
      { factorId: 'dev-no-lock',    weight: 0.20, driver: 'No device lock screen' },
      { factorId: 'mfa-hardware',   weight: 0.12, driver: 'No hardware-bound session' }, // absent
    ],
  },
  {
    id: 'social-engineering',
    label: 'Social engineering',
    blurb: 'A human is talked into granting access.',
    base: 0.09,
    inputs: [
      { factorId: 'bhv-mfa-fatigue', weight: 0.30, driver: 'Approves prompts under pressure' },
      { factorId: 'bhv-oversharing', weight: 0.26, driver: 'Personal details seed pretexts' },
      { factorId: 'rec-weak-email',  weight: 0.22, driver: 'Support-line recovery weak' },
      { factorId: 'exp-public-info', weight: 0.12, driver: 'Public profile visible' },
      { factorId: 'exp-creator',     weight: 0.10, driver: 'Higher-profile target' },
    ],
  },
  {
    id: 'recovery-abuse',
    label: 'Account recovery abuse',
    blurb: 'Attacker walks in through the password-reset back door.',
    base: 0.05,
    inputs: [
      { factorId: 'rec-weak-email',   weight: 0.40, driver: 'Weak recovery email' },
      { factorId: 'rec-same-creds',   weight: 0.28, driver: 'Recovery shares credentials' },
      { factorId: 'mfa-sms',          weight: 0.18, driver: 'SMS reset codes' },
      { factorId: 'rec-backup-codes', weight: 0.14, driver: 'No safe backup codes' },  // absent
    ],
  },
];

function factorIsDangerous(factorId: string, state: FactorState): boolean {
  try {
    const f = factorById(factorId);
    const on = !!state[factorId];
    return f.kind === 'protective' ? !on : on;
  } catch {
    return false;
  }
}

function severityFor(p: number): AttackLikelihood['severity'] {
  if (p >= 0.66) return 'critical';
  if (p >= 0.45) return 'high';
  if (p >= 0.22) return 'medium';
  return 'low';
}

const SEVERITY_COLOR: Record<AttackLikelihood['severity'], string> = {
  low:      '#27a644',
  medium:   '#f79009',
  high:     '#f04438',
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
      id: m.id, label: m.label, blurb: m.blurb,
      probability: p, severity, color: SEVERITY_COLOR[severity], drivers,
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
  scoreReduction: number;
  difficulty: Difficulty;
  pillar: string;
}

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
  label: string;
  factorId?: string;
  score: number;
  delta: number;
}

export function riskTimeline(state: FactorState, maxSteps = 4): TimelineStep[] {
  let working: FactorState = { ...state };
  let prevScore = Math.round(compositeScore(working));
  const steps: TimelineStep[] = [{ label: 'Current', score: prevScore, delta: 0 }];

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

function applyFix(state: FactorState, factorId: string): FactorState {
  try {
    const f = factorById(factorId);
    return { ...state, [factorId]: f.kind === 'protective' };
  } catch {
    return state;
  }
}

function shortAction(action: string): string {
  return action.length > 26 ? `${action.slice(0, 24)}…` : action;
}

export function hasOpenWeaknesses(state: FactorState): boolean {
  return FACTORS.some((f) => factorIsDangerous(f.id, state));
}
