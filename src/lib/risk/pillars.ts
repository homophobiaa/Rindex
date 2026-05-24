/**
 * Scoring pillars — the six dimensions RiskIndex evaluates.
 *
 * Each pillar is a category of risk. Individual factors (defined in
 * factors.ts) belong to exactly one pillar. The pillar list is also the
 * shared foundation for the future Personal Risk Profiler.
 */

export type PillarId =
  | 'password'
  | 'surface'
  | 'behavior'
  | 'recovery'
  | 'barriers'
  | 'exposure';

export interface Pillar {
  id: PillarId;
  label: string;
  blurb: string;
  /** How heavily this pillar contributes to the composite RiskIndex (0..1). */
  weight: number;
  /** A short list of what counts toward this pillar. */
  measures: string[];
  /** Plain-language "why it matters" copy. */
  rationale: string;
  /** Accent hex used in visualizations. */
  accent: string;
}

export const PILLARS: Pillar[] = [
  {
    id: 'password',
    label: 'Password strength',
    blurb: 'Entropy, length, reuse, predictability.',
    weight: 0.22,
    measures: ['Entropy', 'Length', 'Character variety', 'Reuse', 'Common-pattern detection'],
    rationale:
      'Credentials are the most-stolen asset on the internet. Strength is measured in bits of entropy, not just characters.',
    accent: '#5e6ad2',
  },
  {
    id: 'surface',
    label: 'Attack surface',
    blurb: 'How many doors an attacker can knock on.',
    weight: 0.15,
    measures: ['Account count', 'Service age', 'Public email exposure', 'Old breaches', 'Cross-linked logins'],
    rationale:
      'Every account is a potential entry point. Breached or forgotten accounts become persistent footholds.',
    accent: '#4cc2ff',
  },
  {
    id: 'behavior',
    label: 'Human behavior',
    blurb: 'Habits that attackers exploit psychologically.',
    weight: 0.20,
    measures: ['Phishing susceptibility', 'Credential reuse', 'Public Wi-Fi habits', 'MFA fatigue', 'Oversharing'],
    rationale:
      'Most modern breaches start with a human click. Behavior is a stronger predictor than technical posture.',
    accent: '#f79009',
  },
  {
    id: 'recovery',
    label: 'Recovery weaknesses',
    blurb: 'How an attacker takes over after they get close.',
    weight: 0.18,
    measures: ['SMS-only 2FA', 'Recovery phone reuse', 'Backup codes', 'Weak recovery email', 'Customer-support social engineering'],
    rationale:
      'Even strong accounts fall if the recovery path is weak — attackers always pick the easiest door.',
    accent: '#a78bfa',
  },
  {
    id: 'barriers',
    label: 'Security barriers',
    blurb: 'The protective layers you already have on.',
    weight: 0.15,
    measures: ['Hardware security key', 'Password manager', 'Unique passwords', 'Device encryption', 'Software updates'],
    rationale:
      'Barriers compound multiplicatively. One strong layer beats five weak ones at the same cost.',
    accent: '#27a644',
  },
  {
    id: 'exposure',
    label: 'Exposure multipliers',
    blurb: 'Context that scales the impact of a breach.',
    weight: 0.10,
    measures: ['Financial accounts linked', 'Identity documents online', 'Family/work overlap', 'Public role'],
    rationale:
      'A small mistake on a throwaway forum is fine. The same mistake on a primary email is catastrophic.',
    accent: '#f04438',
  },
];

export function pillarById(id: PillarId): Pillar {
  const p = PILLARS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pillar: ${id}`);
  return p;
}
