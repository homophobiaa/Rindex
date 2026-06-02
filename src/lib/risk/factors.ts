/**
 * Risk factors — Scoring Engine v2.
 *
 * Each factor is a discrete, toggleable condition that contributes to one
 * pillar's risk score.  Two kinds:
 *
 *   threat     — when active, this condition RAISES pillar risk.
 *   protective — when active, this condition LOWERS pillar risk.
 *
 * The `delta` is the raw contribution within the pillar's 0-100 band.
 * Per-pillar normalization in scoring.ts converts the raw sum to a
 * 0-100 score — meaning the score range is always meaningful and the
 * model is trivially explainable:
 *
 *   "password reuse (delta 28) out of a max possible threat load of 54
 *    puts your password pillar at 74% — here's what closes the gap."
 *
 * Weights were calibrated so:
 *   very secure user   →  composite  ~5–15
 *   average user       →  composite  ~45–60
 *   very risky user    →  composite  ~85–98
 */

import type { PillarId } from './pillars';

export type FactorKind = 'protective' | 'threat';

export interface Factor {
  id: string;
  label: string;
  description: string;
  pillar: PillarId;
  kind: FactorKind;
  /**
   * Raw contribution within the pillar's normalized band (not global score).
   * Threats add this to pillar raw when active.
   * Protectives subtract this from pillar raw when active.
   */
  delta: number;
}

/* ------------------------------------------------------------------ */
/* Password Security                                                   */
/* ------------------------------------------------------------------ */
// maxThreat = 28+8+18 = 54   maxProtect = 28+18 = 46   span = 100

export const FACTORS: Factor[] = [
  /* — Threats — */
  {
    id: 'pw-reuse',
    label: 'Reuses passwords',
    description: 'Same or very similar password used across multiple sites.',
    pillar: 'password',
    kind: 'threat',
    delta: 28,
  },
  {
    id: 'pw-browser-only',
    label: 'Browser-saved passwords only',
    description: 'Relies on browser autofill rather than a dedicated vault.',
    pillar: 'password',
    kind: 'threat',
    delta: 8,
  },
  {
    id: 'pw-weak',
    label: 'Consistently weak passwords',
    description: 'Short, simple, or predictable passwords on important accounts.',
    pillar: 'password',
    kind: 'threat',
    delta: 18,
  },

  /* — Protectives — */
  {
    id: 'pw-manager',
    label: 'Uses a password manager',
    description: 'Dedicated vault (Bitwarden, 1Password, KeePass, etc.) generates and stores credentials.',
    pillar: 'password',
    kind: 'protective',
    delta: 28,
  },
  {
    id: 'pw-unique',
    label: 'Unique passwords per account',
    description: 'No shared credentials — each service has its own password.',
    pillar: 'password',
    kind: 'protective',
    delta: 18,
  },

  /* ---------------------------------------------------------------- */
  /* Authentication Barriers                                          */
  /* maxThreat = 45+14 = 59   maxProtect = 16+28 = 44   span = 103   */
  /* ---------------------------------------------------------------- */

  /* — Threats — */
  {
    id: 'mfa-none',
    label: 'No second factor (password only)',
    description: 'Important accounts are protected by a password alone.',
    pillar: 'auth',
    kind: 'threat',
    delta: 45,
  },
  {
    id: 'mfa-sms',
    label: 'SMS-only 2FA',
    description: 'One-time codes sent by text — vulnerable to SIM-swap and SS7 interception.',
    pillar: 'auth',
    kind: 'threat',
    delta: 14,
  },

  /* — Protectives — */
  {
    id: 'mfa-app',
    label: 'Authenticator app (TOTP)',
    description: 'Google Authenticator, Authy, or 1Password TOTP — not interceptable by SIM-swap.',
    pillar: 'auth',
    kind: 'protective',
    delta: 16,
  },
  {
    id: 'mfa-hardware',
    label: 'Hardware security key / passkey',
    description: 'FIDO2/WebAuthn device — phishing-resistant and cryptographically bound to the real site.',
    pillar: 'auth',
    kind: 'protective',
    delta: 28,
  },

  /* ---------------------------------------------------------------- */
  /* Recovery Security                                                */
  /* maxThreat = 38+32+22 = 92   maxProtect = 18   span = 110        */
  /* ---------------------------------------------------------------- */

  /* — Threats — */
  {
    id: 'rec-weak-email',
    label: 'Weak or old recovery email',
    description: 'Recovery inbox is under-protected (old password, no MFA, or rarely checked).',
    pillar: 'recovery',
    kind: 'threat',
    delta: 38,
  },
  {
    id: 'rec-same-creds',
    label: 'Recovery uses same credentials',
    description: 'Recovery channel shares the same password as the primary account.',
    pillar: 'recovery',
    kind: 'threat',
    delta: 32,
  },
  {
    id: 'rec-exposed-phone',
    label: 'Recovery phone publicly visible',
    description: 'Phone number is public-facing and used as the primary 2FA / reset channel.',
    pillar: 'recovery',
    kind: 'threat',
    delta: 22,
  },

  /* — Protectives — */
  {
    id: 'rec-backup-codes',
    label: 'Backup codes stored safely',
    description: 'Recovery codes printed or saved in password manager — not in cloud notes or screenshots.',
    pillar: 'recovery',
    kind: 'protective',
    delta: 18,
  },

  /* ---------------------------------------------------------------- */
  /* Exposure Surface                                                 */
  /* maxThreat = 28+18+22+22 = 90   maxProtect = 0   span = 90       */
  /* ---------------------------------------------------------------- */

  /* — Threats — */
  {
    id: 'exp-public-email',
    label: 'Primary email publicly visible',
    description: 'Main email address on GitHub, social profiles, resume, or public directories.',
    pillar: 'exposure',
    kind: 'threat',
    delta: 28,
  },
  {
    id: 'exp-public-phone',
    label: 'Phone number publicly visible',
    description: 'Personal phone number on public-facing profiles or directories.',
    pillar: 'exposure',
    kind: 'threat',
    delta: 18,
  },
  {
    id: 'exp-public-info',
    label: 'Personal details on social media',
    description: 'Birthdays, location, employer, and family details visible on social profiles.',
    pillar: 'exposure',
    kind: 'threat',
    delta: 22,
  },
  {
    id: 'exp-creator',
    label: 'Public creator or business presence',
    description: 'Content creator, business owner, or public professional — a higher-value target.',
    pillar: 'exposure',
    kind: 'threat',
    delta: 22,
  },

  /* ---------------------------------------------------------------- */
  /* Human & Social Risk                                              */
  /* maxThreat = 32+38+22 = 92   maxProtect = 0   span = 92          */
  /* ---------------------------------------------------------------- */

  /* — Threats — */
  {
    id: 'bhv-mfa-fatigue',
    label: 'Approves unexpected MFA prompts',
    description: 'Tends to approve 2FA push notifications without verifying the source.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 32,
  },
  {
    id: 'bhv-phishing',
    label: 'Phishing susceptible',
    description: 'Likely to click verification/suspension links or follow urgent email instructions.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 38,
  },
  {
    id: 'bhv-oversharing',
    label: 'Oversharing on social media',
    description: 'Personal details visible online seed both phishing pretexts and security-question bypasses.',
    pillar: 'behavior',
    kind: 'threat',
    delta: 22,
  },

  /* ---------------------------------------------------------------- */
  /* Device & Network                                                 */
  /* maxThreat = 28+24+18 = 70   maxProtect = 22   span = 92         */
  /* ---------------------------------------------------------------- */

  /* — Threats — */
  {
    id: 'dev-no-lock',
    label: 'No device lock screen',
    description: 'Main device boots directly or has a weak/no PIN — physical access = full access.',
    pillar: 'device',
    kind: 'threat',
    delta: 28,
  },
  {
    id: 'dev-wifi-open',
    label: 'Uses public Wi-Fi unprotected',
    description: 'Connects to café/airport networks without a VPN or phone tether.',
    pillar: 'device',
    kind: 'threat',
    delta: 24,
  },
  {
    id: 'dev-outdated',
    label: 'Significantly delayed software updates',
    description: 'OS or apps routinely months behind on security patches.',
    pillar: 'device',
    kind: 'threat',
    delta: 18,
  },

  /* — Protectives — */
  {
    id: 'dev-encrypted',
    label: 'Device encryption enabled',
    description: 'Full-disk encryption active (FileVault, BitLocker, default on iOS/Android).',
    pillar: 'device',
    kind: 'protective',
    delta: 22,
  },
];

export function factorById(id: string): Factor {
  const f = FACTORS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown factor: ${id}`);
  return f;
}
