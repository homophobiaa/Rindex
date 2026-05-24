/**
 * Recommendation engine.
 *
 * Inspects the user's FactorState and produces an ordered list of
 * concrete, actionable suggestions. Each recommendation:
 *   • is keyed by the factor it targets
 *   • carries an impact estimate (in raw RiskIndex points)
 *   • is sorted highest-impact first so the user sees the best fix first
 *
 * Same shape will be re-used by the future "fix plan" view.
 */

import { FACTORS, type FactorState } from '@/lib/risk';

export interface Recommendation {
  /** Factor id this recommendation targets. */
  factorId: string;
  title: string;
  detail: string;
  /** Estimated RiskIndex points this fix would shed. */
  impact: number;
  pillar: string;
}

/**
 * Returns the recommendations that apply to the user's current state.
 *
 * A recommendation fires when the user is missing a protective factor
 * OR has an active threat factor. Both reduce to "this factor is in
 * its bad state — flip it".
 */
export function recommendationsFor(state: FactorState): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const f of FACTORS) {
    const isOn = !!state[f.id];
    const isBad = f.kind === 'protective' ? !isOn : isOn;
    if (!isBad) continue;

    recs.push({
      factorId: f.id,
      title: REC_COPY[f.id]?.title ?? f.label,
      detail: REC_COPY[f.id]?.detail ?? f.description,
      impact: f.delta,
      pillar: f.pillar,
    });
  }

  // Highest-impact first.
  recs.sort((a, b) => b.impact - a.impact);
  return recs;
}

/**
 * Returns the user's currently-active strengths.
 *
 * The mirror of `recommendationsFor` — used on the result screen to
 * make sure the experience rewards good habits, not just flags bad ones.
 */
export function strengthsFor(state: FactorState): Recommendation[] {
  const out: Recommendation[] = [];
  for (const f of FACTORS) {
    const isOn = !!state[f.id];
    const isGood = f.kind === 'protective' ? isOn : !isOn;
    if (!isGood) continue;
    out.push({
      factorId: f.id,
      title: STRENGTH_COPY[f.id]?.title ?? f.label,
      detail: STRENGTH_COPY[f.id]?.detail ?? f.description,
      impact: f.delta,
      pillar: f.pillar,
    });
  }
  out.sort((a, b) => b.impact - a.impact);
  return out;
}

/* ------------------------------------------------------------------ */
/* Friendly copy keyed by factor id.                                   */
/* ------------------------------------------------------------------ */

const REC_COPY: Record<string, { title: string; detail: string }> = {
  'reused-password': {
    title: 'Stop reusing passwords',
    detail: 'Move at least your email, bank, and identity logins to unique passwords. Reuse is the #1 driver of cascading breaches.',
  },
  'password-manager': {
    title: 'Adopt a password manager',
    detail: 'Bitwarden (free), 1Password, or Apple/Google built-in. Once set up, unique passwords cost zero effort.',
  },
  'unique-passwords': {
    title: 'Make every important account unique',
    detail: 'Start with email and finance. The rest can roll in over the next few weeks.',
  },
  'hardware-key': {
    title: 'Add a hardware security key',
    detail: 'A YubiKey or built-in passkey makes phishing-based account takeover essentially impossible.',
  },
  'sms-2fa-only': {
    title: 'Replace SMS 2FA',
    detail: 'Switch to an authenticator app or hardware key. SMS is vulnerable to SIM-swap attacks.',
  },
  'backup-codes': {
    title: 'Store backup codes safely',
    detail: 'Print them or save them in your password manager — never in cloud notes or screenshots.',
  },
  'weak-recovery': {
    title: 'Harden recovery channels',
    detail: 'Your recovery email should have stronger protection than your primary account, not weaker.',
  },
  'device-encryption': {
    title: 'Turn on device encryption',
    detail: 'FileVault on macOS, BitLocker on Windows, default on iOS/Android. Free, instant, no downside.',
  },
  'public-wifi': {
    title: 'Treat public Wi-Fi as untrusted',
    detail: 'Use a reputable VPN or tether to your phone. Coffee-shop networks are not your friend.',
  },
  'public-email': {
    title: 'Mask your primary email',
    detail: 'Use email aliases (Hide-My-Email, SimpleLogin, addy.io) for public-facing contact.',
  },
  'mfa-fatigue': {
    title: 'Slow down on MFA prompts',
    detail: 'Never approve a 2FA push you didn\'t personally trigger. Investigate the device and location first.',
  },
  oversharing: {
    title: 'Tighten social-profile privacy',
    detail: 'Birthdays, pet names, and locations seed both phishing scripts and security-question bypasses.',
  },
};

const STRENGTH_COPY: Record<string, { title: string; detail: string }> = {
  'password-manager': {
    title: 'Password manager in use',
    detail: 'Your credentials are generated and stored at a level individual humans can\'t match.',
  },
  'hardware-key': {
    title: 'Hardware MFA active',
    detail: 'You are immune to the most common phishing attacks targeting credentials.',
  },
  'unique-passwords': {
    title: 'Unique passwords per account',
    detail: 'Even if one site is breached, the blast radius stops there.',
  },
  'backup-codes': {
    title: 'Backup codes stored safely',
    detail: 'You can recover access without depending on SMS or a fragile second device.',
  },
  'device-encryption': {
    title: 'Device encryption on',
    detail: 'A lost or stolen device doesn\'t hand over your data.',
  },
};
