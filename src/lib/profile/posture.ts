/**
 * Security-posture classification — v2.
 *
 * Thresholds calibrated for the v2 normalized scoring engine:
 *
 *   very secure  →  ~7–12   →  very-well-protected / resilient
 *   average      →  ~48–58  →  moderate
 *   very risky   →  ~88–98  →  highly-exposed
 */

export type Posture =
  | 'highly-exposed'
  | 'vulnerable'
  | 'moderate'
  | 'hardened'
  | 'resilient'
  | 'enterprise';

export interface PostureMeta {
  id: Posture;
  label: string;
  blurb: string;
  /** Hex accent used across the result screen. */
  accent: string;
  /** Score ceiling — first posture whose ceiling > score is used. */
  ceiling: number;
}

const ORDER: PostureMeta[] = [
  {
    id: 'enterprise',
    label: 'Very well protected',
    blurb: 'Hardware MFA, unique passwords and hardened recovery. Few easy ways in remain.',
    accent: '#27a644',
    ceiling: 18,
  },
  {
    id: 'resilient',
    label: 'Resilient',
    blurb: 'Strong defensive posture across the board. A few refinements would put you in the top tier.',
    accent: '#27a644',
    ceiling: 33,
  },
  {
    id: 'hardened',
    label: 'Moderately hardened',
    blurb: 'Solid fundamentals. A few weak links — usually recovery or behavior — are worth closing.',
    accent: '#5e6ad2',
    ceiling: 50,
  },
  {
    id: 'moderate',
    label: 'Moderate exposure',
    blurb: 'Mixed posture. Not an obvious target, but a determined attacker has options.',
    accent: '#f79009',
    ceiling: 65,
  },
  {
    id: 'vulnerable',
    label: 'Vulnerable',
    blurb: 'Several common attack paths are open. Each has a single concrete fix — start at the top.',
    accent: '#f79009',
    ceiling: 80,
  },
  {
    id: 'highly-exposed',
    label: 'Highly exposed',
    blurb: 'Multiple critical weaknesses compound on each other. Start with passwords and recovery today.',
    accent: '#f04438',
    ceiling: 101,
  },
];

export function posture(score: number): PostureMeta {
  for (const p of ORDER) {
    if (score < p.ceiling) return p;
  }
  return ORDER[ORDER.length - 1];
}
