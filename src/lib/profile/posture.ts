/**
 * Security-posture classification.
 *
 * Maps the composite RiskIndex (0..100) to a labeled posture with
 * descriptive copy. The bands are intentionally affirming at the top
 * end so the result screen rewards strong users rather than only
 * shaming weak ones.
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
  /** Numeric upper bound (exclusive) — sorted ascending by RiskIndex. */
  ceiling: number;
}

/**
 * Ordered from safest (lowest RiskIndex) to most-exposed.
 * The "ceiling" is the inclusive lower / exclusive upper boundary.
 */
const ORDER: PostureMeta[] = [
  {
    id: 'enterprise',
    label: 'Enterprise-grade habits',
    blurb: 'Hardware MFA, unique passwords, and disciplined recovery. You are a hard target.',
    accent: '#27a644',
    ceiling: 18,
  },
  {
    id: 'resilient',
    label: 'Resilient',
    blurb: 'Strong defensive posture across the board. A handful of refinements would put you in the top tier.',
    accent: '#27a644',
    ceiling: 32,
  },
  {
    id: 'hardened',
    label: 'Moderately hardened',
    blurb: 'Solid fundamentals. A few weak links — usually recovery or behavior — are worth closing.',
    accent: '#5e6ad2',
    ceiling: 48,
  },
  {
    id: 'moderate',
    label: 'Moderate exposure',
    blurb: 'Mixed posture. You are not an obvious target, but a determined attacker has options.',
    accent: '#f79009',
    ceiling: 64,
  },
  {
    id: 'vulnerable',
    label: 'Vulnerable',
    blurb: 'Several common attack paths are open. The good news: each one has a single, concrete fix.',
    accent: '#f79009',
    ceiling: 80,
  },
  {
    id: 'highly-exposed',
    label: 'Highly exposed',
    blurb: 'Multiple critical weaknesses compound on each other. Start with passwords + recovery — the rest follows.',
    accent: '#f04438',
    ceiling: 101, // catch-all
  },
];

export function posture(score: number): PostureMeta {
  for (const p of ORDER) {
    if (score < p.ceiling) return p;
  }
  return ORDER[ORDER.length - 1];
}
