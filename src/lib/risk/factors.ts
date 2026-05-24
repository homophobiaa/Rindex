/**
 * Risk factors — discrete toggleable conditions that move the RiskIndex.
 *
 * A factor is either:
 *   • protective  (kind: 'protective')  — being on reduces risk
 *   • threat      (kind: 'threat')      — being on increases risk
 *
 * Each factor declares a `delta` (in raw RiskIndex points, 0..100 scale)
 * and the pillar it influences. The scoring engine (scoring.ts) consumes
 * the same shape used by the future Personal Risk Profiler — there is no
 * page-local logic.
 */

import type { PillarId } from './pillars';

export type FactorKind = 'protective' | 'threat';

export interface Factor {
  id: string;
  label: string;
  description: string;
  pillar: PillarId;
  kind: FactorKind;
  /** Raw impact on the 0..100 RiskIndex. Threats add, protectives subtract. */
  delta: number;
  /** Optional default state used by the live demo. */
  defaultOn?: boolean;
}

export const FACTORS: Factor[] = [
  // Protective layers
  {
    id: 'hardware-key',
    label: 'Hardware security key',
    description: 'FIDO2/WebAuthn device for phishing-resistant 2FA.',
    pillar: 'barriers',
    kind: 'protective',
    delta: 14,
  },
  {
    id: 'password-manager',
    label: 'Uses a password manager',
    description: 'Generates and stores unique high-entropy passwords.',
    pillar: 'barriers',
    kind: 'protective',
    delta: 10,
    defaultOn: true,
  },
  {
    id: 'unique-passwords',
    label: 'Unique password per account',
    description: 'No credential reuse across services.',
    pillar: 'password',
    kind: 'protective',
    delta: 9,
  },
  {
    id: 'backup-codes',
    label: 'Backup codes stored safely',
    description: 'Offline recovery without relying on SMS.',
    pillar: 'recovery',
    kind: 'protective',
    delta: 5,
  },
  {
    id: 'device-encryption',
    label: 'Device encryption enabled',
    description: 'FileVault / BitLocker / LUKS active.',
    pillar: 'barriers',
    kind: 'protective',
    delta: 4,
  },

  // Threats
  {
    id: 'reused-password',
    label: 'Reuses passwords',
    description: 'Same password used on multiple sites.',
    pillar: 'password',
    kind: 'threat',
    delta: 16,
  },
  {
    id: 'sms-2fa-only',
    label: 'SMS-only 2FA',
    description: 'Vulnerable to SIM-swap attacks.',
    pillar: 'recovery',
    kind: 'threat',
    delta: 8,
  },
  {
    id: 'public-email',
    label: 'Primary email publicly visible',
    description: 'Posted on social profiles, GitHub, resume.',
    pillar: 'surface',
    kind: 'threat',
    delta: 6,
  },
  {
    id: 'public-wifi',
    label: 'Uses public Wi-Fi without VPN',
    description: 'Untrusted networks in cafés, airports, hotels.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 5,
  },
  {
    id: 'weak-recovery',
    label: 'Weak recovery phone/email',
    description: 'Recovery channel is older or less protected than the account.',
    pillar: 'recovery',
    kind: 'threat',
    delta: 9,
  },
  {
    id: 'mfa-fatigue',
    label: 'Approves unexpected MFA prompts',
    description: 'Pattern of confirming pushes without checking.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 7,
  },
  {
    id: 'oversharing',
    label: 'Oversharing on social media',
    description: 'Birthdays, locations, security-question answers visible.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 4,
  },
];

export function factorById(id: string): Factor {
  const f = FACTORS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown factor: ${id}`);
  return f;
}
