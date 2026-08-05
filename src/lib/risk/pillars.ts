/**
 * Scoring pillars — Scoring Engine v2.
 *
 * Six risk dimensions. Each pillar owns a subset of factors (defined in
 * factors.ts) and contributes a fixed weight to the composite RiskIndex.
 *
 * Label design guidelines:
 *   • Short enough to never truncate in the side panel (≤ 16 chars)
 *   • Descriptive enough to be instantly understood
 *   • Full `blurb` + `rationale` carry the detail for methodology / tooltips
 *
 * Weight sum: 0.25 + 0.25 + 0.20 + 0.15 + 0.10 + 0.05 = 1.00
 */

export type PillarId =
  | 'password'
  | 'auth'
  | 'recovery'
  | 'exposure'
  | 'behavior'
  | 'device';

export interface Pillar {
  id: PillarId;
  /** Short label — used in constrained UI (score panel, bars). Max ~16 chars. */
  label: string;
  /** One-liner for card subheads and methodology descriptions. */
  blurb: string;
  /** Weight in the composite RiskIndex (0..1, all six sum to 1.0). */
  weight: number;
  /** What this pillar actually measures — shown in methodology cards. */
  measures: string[];
  /** "Why it matters" copy — shown in methodology and recommendation detail. */
  rationale: string;
  /** Hex accent used across all visualizations for this pillar. */
  accent: string;
}

export const PILLARS: Pillar[] = [
  {
    id: 'password',
    label: 'Password Security',
    blurb: 'Reuse, strength, and credential management.',
    weight: 0.25,
    measures: [
      'Password reuse',
      'Manager usage',
      'Password uniqueness',
      'Average strength',
      'Browser-only saving',
    ],
    rationale:
      'A reused password turns one company’s breach into a key for your other accounts. Uniqueness and length decide how far a leak spreads.',
    accent: '#5e6ad2',
  },
  {
    id: 'auth',
    label: 'Authentication',
    blurb: 'The second factor standing between attackers and access.',
    weight: 0.25,
    measures: [
      'No second factor',
      'SMS 2FA',
      'Authenticator app',
      'Hardware / passkey',
    ],
    rationale:
      'Even a compromised password is stopped by strong MFA. Authentication strength is the single highest-leverage control against remote account takeover.',
    accent: '#a78bfa',
  },
  {
    id: 'recovery',
    label: 'Recovery',
    blurb: 'The back-door attackers use when the front is locked.',
    weight: 0.20,
    measures: [
      'Recovery email protection',
      'Shared credentials',
      'Exposed recovery phone',
      'Backup codes',
    ],
    rationale:
      'Even the strongest primary account falls if the recovery path is weak. Attackers always pick the softest door.',
    accent: '#f79009',
  },
  {
    id: 'exposure',
    label: 'Exposure',
    blurb: 'How much of your identity is publicly searchable.',
    weight: 0.15,
    measures: [
      'Public email',
      'Public phone',
      'Social profile visibility',
      'Creator / business presence',
    ],
    rationale:
      'Exposure determines who the attacker can target and how convincing their pretexts can be. A private attack surface shrinks the entire risk surface.',
    accent: '#4cc2ff',
  },
  {
    id: 'behavior',
    label: 'Behavior',
    blurb: 'Human habits attackers exploit psychologically.',
    weight: 0.10,
    measures: [
      'MFA fatigue risk',
      'Phishing susceptibility',
      'Oversharing tendency',
    ],
    rationale:
      'Phishing and MFA-fatigue attacks target the person, not the software. Good habits here cover gaps that no setting can close.',
    accent: '#f04438',
  },
  {
    id: 'device',
    label: 'Device & Network',
    blurb: 'Physical and network controls on where credentials live.',
    weight: 0.05,
    measures: [
      'Device lock & encryption',
      'Public Wi-Fi habits',
      'Software update cadence',
    ],
    rationale:
      'An unencrypted stolen laptop or an open Wi-Fi session hands an attacker credentials directly. Physical controls are a last line of defense.',
    accent: '#27a644',
  },
];

export function pillarById(id: PillarId): Pillar {
  const p = PILLARS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pillar: ${id}`);
  return p;
}
