/**
 * Recommendation and strength engine — v2.
 *
 * Reads the SHARED FactorState and produces ordered lists of:
 *   • open weaknesses → `recommendationsFor()` (highest-impact first)
 *   • active strengths → `strengthsFor()` (highest-delta first)
 *
 * All factor IDs reference the v2 schema in `@/lib/risk/factors.ts`.
 */

import { FACTORS, type FactorState } from '@/lib/risk';

export interface Recommendation {
  factorId: string;
  title: string;
  detail: string;
  /** Estimated RiskIndex points this fix would shed (pillar-level delta). */
  impact: number;
  pillar: string;
}

/**
 * Returns applicable recommendations for the current state.
 * A recommendation fires when a factor is in its "bad" state:
 *   threat active   → should be turned off
 *   protective off  → should be turned on
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
  recs.sort((a, b) => b.impact - a.impact);
  return recs;
}

/** Active strengths — the protective habits the user already has in place. */
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
/* Friendly copy keyed by factor id (v2 IDs)                          */
/* ------------------------------------------------------------------ */

const REC_COPY: Record<string, { title: string; detail: string }> = {
  // Password
  'pw-reuse': {
    title: 'Stop reusing passwords',
    detail: 'Move email, bank, and identity logins to unique passwords first. Reuse is the #1 driver of cascading breaches.',
  },
  'pw-manager': {
    title: 'Adopt a password manager',
    detail: 'Bitwarden (free), 1Password, or Apple/Google built-in. Once set up, unique passwords cost zero effort.',
  },
  'pw-unique': {
    title: 'Make every important account unique',
    detail: 'Start with email and finance — you can migrate the rest over the next few weeks.',
  },
  'pw-browser-only': {
    title: 'Move to a dedicated password manager',
    detail: 'Browser saves are convenient but lack cross-device sync, breach monitoring, and secure sharing.',
  },
  'pw-weak': {
    title: 'Strengthen your passwords',
    detail: 'Let a password manager generate 20+ character random strings. You never need to remember them.',
  },

  // Authentication
  'mfa-none': {
    title: 'Enable a second factor immediately',
    detail: 'Any MFA is better than none. Start with an authenticator app — it takes five minutes and eliminates the most common takeover vector.',
  },
  'mfa-sms': {
    title: 'Replace SMS 2FA with an authenticator app',
    detail: 'SMS is vulnerable to SIM-swap. Authy or Google Authenticator is a free, immediate upgrade.',
  },
  'mfa-app': {
    title: 'Add an authenticator app',
    detail: 'Google Authenticator, Authy, or 1Password TOTP. Eliminates SIM-swap as an attack vector.',
  },
  'mfa-hardware': {
    title: 'Add a hardware security key',
    detail: 'A YubiKey or built-in passkey makes phishing-based account takeover essentially impossible on supported sites.',
  },

  // Recovery
  'rec-backup-codes': {
    title: 'Generate and store backup codes safely',
    detail: 'Print them or save in your password manager — never in cloud notes, screenshots, or unencrypted files.',
  },
  'rec-weak-email': {
    title: 'Harden your recovery email',
    detail: 'Your recovery account should have STRONGER protection than your main account, not weaker.',
  },
  'rec-same-creds': {
    title: 'Use different credentials for recovery',
    detail: 'If the recovery channel shares your main password, one stolen credential hands the attacker everything.',
  },
  'rec-exposed-phone': {
    title: 'Reduce phone-based recovery exposure',
    detail: 'Switch important accounts to authenticator-app or hardware-key 2FA so a SIM-swap cannot reset them.',
  },

  // Exposure
  'exp-public-email': {
    title: 'Mask your primary email',
    detail: 'Use aliases (Hide-My-Email, SimpleLogin, addy.io) for public-facing contact.',
  },
  'exp-public-phone': {
    title: 'Keep your phone number private',
    detail: 'Remove it from public profiles and rely on app-based 2FA so it is not a useful target.',
  },
  'exp-public-info': {
    title: 'Tighten social-profile privacy',
    detail: 'Birthdays, locations, and employers seed both phishing scripts and security-question bypasses.',
  },
  'exp-creator': {
    title: 'Apply extra hardening as a public figure',
    detail: 'Higher profile = higher targeting. Hardware key + unique email per public channel is worth the effort.',
  },

  // Behavior
  'bhv-mfa-fatigue': {
    title: 'Never approve an MFA prompt you did not trigger',
    detail: 'If a push arrives unexpectedly: deny, change your password, and check the session list. This is how Uber was breached.',
  },
  'bhv-phishing': {
    title: 'Navigate directly — never click email links',
    detail: 'Suspicious email? Go to the site manually. Phishing links look identical to real ones.',
  },
  'bhv-oversharing': {
    title: 'Tighten social-media privacy settings',
    detail: 'Information you share publicly becomes the attacker\'s research notes.',
  },

  // Device
  'dev-no-lock': {
    title: 'Enable a strong device lock screen',
    detail: 'Biometric + PIN. Without it, a stolen device gives immediate access to everything.',
  },
  'dev-wifi-open': {
    title: 'Use a VPN or phone tether on public Wi-Fi',
    detail: 'Coffee-shop networks are not private. A reputable VPN or cellular data eliminates the risk.',
  },
  'dev-outdated': {
    title: 'Enable automatic software updates',
    detail: 'Most breaches exploit known vulnerabilities with published patches. Updates close them.',
  },
  'dev-encrypted': {
    title: 'Enable full-disk encryption',
    detail: 'FileVault (macOS), BitLocker (Windows), or default on iOS/Android. Free, immediate, no downside.',
  },
};

const STRENGTH_COPY: Record<string, { title: string; detail: string }> = {
  'pw-manager': {
    title: 'Password manager in use',
    detail: 'Your credentials are generated and stored at a level individual humans cannot match.',
  },
  'pw-unique': {
    title: 'Unique passwords per account',
    detail: 'Even if one site is breached, the blast radius stops there.',
  },
  'mfa-hardware': {
    title: 'Hardware MFA active',
    detail: 'You are immune to the most common phishing-based account takeover.',
  },
  'mfa-app': {
    title: 'Authenticator app in use',
    detail: 'SIM-swap cannot intercept TOTP codes — a meaningful step above SMS.',
  },
  'rec-backup-codes': {
    title: 'Backup codes stored safely',
    detail: 'You can recover access without depending on SMS or a fragile second device.',
  },
  'dev-encrypted': {
    title: 'Device encryption on',
    detail: 'A lost or stolen device does not hand over your data.',
  },
  'rec-weak-email': {
    title: 'Recovery email well-protected',
    detail: 'The back-door is as strong as the front — attackers will look elsewhere.',
  },
};
