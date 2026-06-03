/**
 * Personal Risk Profiler — question definitions v2.
 *
 * ── Adaptive design ─────────────────────────────────────────────────
 *
 * Each question has an optional `condition(state)` function.  If it
 * returns false the question is SKIPPED — the flow controller jumps to
 * the next visible question automatically.
 *
 * Examples:
 *   • Password manager selected → Q2 (unique passwords) is skipped,
 *     since the manager already patches pw-unique = true.
 *   • No MFA selected → MFA backup-codes question and MFA-fatigue
 *     behaviour question are skipped (pointless to ask).
 *
 * This keeps the effective question count at ~10–12 while the full
 * question bank contains all edge-case branches.
 *
 * ── Answer → FactorState ────────────────────────────────────────────
 *
 * Selecting an option applies its `patch` to the SHARED FactorState
 * used by `@/lib/risk`.  There is no parallel scoring engine here —
 * the same factors, pillars, and weights drive Methodology, Dashboard,
 * and the Profiler result screen.
 *
 * ── Calibrated ranges ───────────────────────────────────────────────
 *
 * For QA reference — expected composite scores after completion:
 *
 *   Very secure profile    (manager, hw-key, secure recovery, private)  →  ~7–12
 *   Average realistic      (reuse, SMS MFA, weak recovery, public email) → ~48–58
 *   Very risky             (reuse, no MFA, all threats)                  → ~88–98
 */

import type { FactorState } from '@/lib/risk';
import type { PillarId } from '@/lib/risk';

export type Patch = Partial<FactorState>;

export interface QuestionOption {
  id: string;
  label: string;
  /** Short clarifying line under the label. */
  detail: string;
  /** Patch applied to the shared FactorState when selected. */
  patch: Patch;
  /** Subjective danger weight for option ordering visuals (0..3). */
  risk: 0 | 1 | 2 | 3;
}

export interface Question {
  id: string;
  prompt: string;
  /** Short clarifying sentence below the prompt. */
  helper?: string;
  /** Pillar this question primarily influences — drives the side accent. */
  pillar: PillarId;
  options: QuestionOption[];
  /**
   * If provided, the question is only shown when this function returns true
   * for the current FactorState.  Evaluated AFTER the previous answer is
   * applied, so conditions can gate on earlier answers.
   */
  condition?: (state: FactorState) => boolean;
}

export interface ProfilerStep {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  accent: string;
  questions: Question[];
}

export const STEPS: ProfilerStep[] = [
  /* ================================================================ */
  /* Step 1 — Passwords                                               */
  /* ================================================================ */
  {
    id: 'password',
    label: 'Passwords',
    eyebrow: 'Step 01 · Passwords',
    title: 'How you handle credentials',
    accent: '#5e6ad2',
    questions: [
      {
        id: 'pw-strategy',
        prompt: 'How do you manage your passwords?',
        helper: 'Pick the closest description.',
        pillar: 'password',
        options: [
          {
            id: 'reuse',
            label: 'Same password (or small variations) everywhere',
            detail: 'One credential, many sites.',
            patch: { 'pw-reuse': true, 'pw-manager': false, 'pw-unique': false, 'pw-browser-only': false },
            risk: 3,
          },
          {
            id: 'memorize',
            label: 'A handful I memorize',
            detail: 'Different on important accounts, but not truly unique.',
            patch: { 'pw-reuse': true, 'pw-manager': false, 'pw-unique': false, 'pw-browser-only': false },
            risk: 2,
          },
          {
            id: 'browser',
            label: 'Browser autofill saves them',
            detail: 'Chrome, Safari, or Firefox generates and fills them.',
            patch: { 'pw-reuse': false, 'pw-manager': false, 'pw-unique': false, 'pw-browser-only': true },
            risk: 1,
          },
          {
            id: 'manager',
            label: 'A dedicated password manager',
            detail: '1Password, Bitwarden, KeePass, etc.',
            // Also sets pw-unique:true — a manager implies unique passwords
            patch: { 'pw-reuse': false, 'pw-manager': true, 'pw-unique': true, 'pw-browser-only': false },
            risk: 0,
          },
        ],
      },

      // Skipped when the user selected a password manager (pw-unique already set)
      {
        id: 'pw-uniqueness',
        prompt: 'Are your important account passwords actually different from each other?',
        helper: 'Email, bank, and social accounts in mind.',
        pillar: 'password',
        condition: (s) => !s['pw-manager'],
        options: [
          {
            id: 'all-same',
            label: 'Mostly the same — maybe a number changes',
            detail: 'One breach exposes everything.',
            patch: { 'pw-unique': false, 'pw-reuse': true },
            risk: 3,
          },
          {
            id: 'some-unique',
            label: 'Key accounts (email, bank) are unique',
            detail: 'The rest share a common base.',
            patch: { 'pw-unique': false, 'pw-reuse': true },
            risk: 2,
          },
          {
            id: 'fully-unique',
            label: 'Every important account has its own password',
            detail: 'No sharing, even minor variations.',
            patch: { 'pw-unique': true, 'pw-reuse': false },
            risk: 0,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Step 2 — Authentication                                          */
  /* ================================================================ */
  {
    id: 'mfa',
    label: 'MFA',
    eyebrow: 'Step 02 · Authentication',
    title: 'What protects your logins',
    accent: '#a78bfa',
    questions: [
      {
        id: 'mfa-kind',
        prompt: 'How do you protect your most important accounts?',
        helper: 'Think of your primary email, bank, and identity providers.',
        pillar: 'auth',
        options: [
          {
            id: 'none',
            label: 'Password only — no second factor',
            detail: 'One stolen credential = full access.',
            patch: { 'mfa-none': true, 'mfa-sms': false, 'mfa-app': false, 'mfa-hardware': false },
            risk: 3,
          },
          {
            id: 'sms',
            label: 'Text message (SMS) codes',
            detail: 'OTP sent by text.',
            patch: { 'mfa-none': false, 'mfa-sms': true, 'mfa-app': false, 'mfa-hardware': false },
            risk: 2,
          },
          {
            id: 'app',
            label: 'Authenticator app',
            detail: 'Google Auth, Authy, 1Password TOTP.',
            patch: { 'mfa-none': false, 'mfa-sms': false, 'mfa-app': true, 'mfa-hardware': false },
            risk: 1,
          },
          {
            id: 'key',
            label: 'Hardware key or passkey',
            detail: 'YubiKey, Titan, biometric passkey.',
            patch: { 'mfa-none': false, 'mfa-sms': false, 'mfa-app': false, 'mfa-hardware': true },
            risk: 0,
          },
        ],
      },

      // Only relevant if user has any form of MFA (backup codes are a recovery mechanism)
      {
        id: 'backup-codes',
        prompt: 'Where do your account backup / recovery codes live?',
        helper: 'These are the emergency codes services generate when you enable 2FA.',
        pillar: 'recovery',
        condition: (s) => !s['mfa-none'],
        options: [
          {
            id: 'none',
            label: "I don't have any / never generated them",
            detail: 'No fallback if your device is lost.',
            patch: { 'rec-backup-codes': false },
            risk: 3,
          },
          {
            id: 'cloud',
            label: 'Screenshot or cloud notes',
            detail: 'Google Keep, iCloud Notes, Photos…',
            patch: { 'rec-backup-codes': false },
            risk: 2,
          },
          {
            id: 'safe',
            label: 'Password manager or printed offline',
            detail: 'Encrypted vault or physical paper.',
            patch: { 'rec-backup-codes': true },
            risk: 0,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Step 3 — Recovery                                                */
  /* ================================================================ */
  {
    id: 'recovery',
    label: 'Recovery',
    eyebrow: 'Step 03 · Recovery',
    title: 'The back-door attackers try first',
    accent: '#f79009',
    questions: [
      {
        id: 'recovery-email',
        prompt: 'How is your recovery email or phone protected?',
        helper: 'This is what an attacker uses to reset your account — even if your password is strong.',
        pillar: 'recovery',
        options: [
          {
            id: 'same',
            label: 'Same password as my main account',
            detail: 'If the main falls, so does recovery.',
            patch: { 'rec-weak-email': true, 'rec-same-creds': true },
            risk: 3,
          },
          {
            id: 'old',
            label: 'An old, rarely-checked email',
            detail: 'Created years ago — probably weak and unmonitored.',
            patch: { 'rec-weak-email': true, 'rec-same-creds': false },
            risk: 3,
          },
          {
            id: 'separate',
            label: 'A separate, well-protected email with its own MFA',
            detail: 'Different password, different second factor.',
            patch: { 'rec-weak-email': false, 'rec-same-creds': false },
            risk: 0,
          },
        ],
      },

      {
        id: 'phone-visibility',
        prompt: 'Is your phone number publicly visible or your primary 2FA channel?',
        helper: 'SIM-swap attacks redirect calls and texts — useful to know if your number is targetable.',
        pillar: 'recovery',
        options: [
          {
            id: 'public-primary',
            label: 'Public and the main way I receive 2FA codes',
            detail: 'Easy to find and critical to hijack.',
            patch: { 'rec-exposed-phone': true },
            risk: 3,
          },
          {
            id: 'private-secondary',
            label: 'Private, and I also have a stronger 2FA method',
            detail: 'SIM-swap cannot fully bypass your MFA.',
            patch: { 'rec-exposed-phone': false },
            risk: 1,
          },
          {
            id: 'not-used',
            label: 'Not publicly visible and not used for 2FA',
            detail: 'Low exposure channel.',
            patch: { 'rec-exposed-phone': false },
            risk: 0,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Step 4 — Exposure                                                */
  /* ================================================================ */
  {
    id: 'social',
    label: 'Exposure',
    eyebrow: 'Step 04 · Exposure',
    title: 'What attackers can already see',
    accent: '#4cc2ff',
    questions: [
      {
        id: 'email-visibility',
        prompt: 'How visible is your primary email address?',
        pillar: 'exposure',
        options: [
          {
            id: 'public',
            label: "It's on GitHub, social profiles, or my resume",
            detail: 'Easy to find via a quick web search.',
            patch: { 'exp-public-email': true },
            risk: 2,
          },
          {
            id: 'limited',
            label: 'Only shared with trusted services — not public',
            detail: 'Not indexed or publicly searchable.',
            patch: { 'exp-public-email': false },
            risk: 1,
          },
          {
            id: 'alias',
            label: 'I use aliases — my primary is private',
            detail: 'Public contact uses a separate masked address.',
            patch: { 'exp-public-email': false },
            risk: 0,
          },
        ],
      },

      {
        id: 'personal-info',
        prompt: 'Do your social profiles show birthdays, location, employer, or family?',
        helper: 'These details seed phishing scripts and answer security questions.',
        pillar: 'exposure',
        options: [
          {
            id: 'open',
            label: 'Yes — default or mostly public',
            detail: 'Attacker can build a convincing pretext.',
            patch: { 'exp-public-info': true, 'bhv-oversharing': true },
            risk: 2,
          },
          {
            id: 'selective',
            label: 'Selective — some things are visible, some hidden',
            detail: 'Partial exposure.',
            patch: { 'exp-public-info': false, 'bhv-oversharing': false },
            risk: 1,
          },
          {
            id: 'private',
            label: 'Strictly private — locked down or no public profile',
            detail: 'Nothing to build a pretext from.',
            patch: { 'exp-public-info': false, 'bhv-oversharing': false },
            risk: 0,
          },
        ],
      },

      {
        id: 'creator-exposure',
        prompt: 'Are you a public creator, business owner, or professional with a public-facing presence?',
        helper: 'Higher visibility = higher targeting priority for phishing and social engineering.',
        pillar: 'exposure',
        options: [
          {
            id: 'yes',
            label: 'Yes — I have a meaningful public presence',
            detail: 'YouTube, a company, a blog, or professional profile.',
            patch: { 'exp-creator': true, 'exp-public-phone': false },
            risk: 2,
          },
          {
            id: 'no',
            label: 'No — private individual',
            detail: 'No significant public-facing identity.',
            patch: { 'exp-creator': false, 'exp-public-phone': false },
            risk: 0,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Step 5 — Behavior                                                */
  /* ================================================================ */
  {
    id: 'behavior',
    label: 'Habits',
    eyebrow: 'Step 05 · Behavior',
    title: 'Under attack pressure',
    accent: '#f04438',
    questions: [
      // Only relevant if user has MFA of some kind
      {
        id: 'mfa-fatigue',
        prompt: 'An unexpected MFA push notification arrives. You…',
        helper: "This exact scenario is how Uber, Cisco, and Microsoft 365 were breached.",
        pillar: 'behavior',
        condition: (s) => !s['mfa-none'],
        options: [
          {
            id: 'approve',
            label: "Tap approve — it's probably a glitch",
            detail: 'Or you want the notification to stop.',
            patch: { 'bhv-mfa-fatigue': true },
            risk: 3,
          },
          {
            id: 'investigate',
            label: 'Check device + location before deciding',
            detail: 'Never approve a prompt you did not trigger.',
            patch: { 'bhv-mfa-fatigue': false },
            risk: 0,
          },
        ],
      },

      {
        id: 'phishing-response',
        prompt: "An email arrives: 'Your account will be suspended — verify now →'",
        helper: "No context, some urgency, a convenient link.",
        pillar: 'behavior',
        options: [
          {
            id: 'click',
            label: 'Click the link to check',
            detail: 'Better safe than locked out.',
            patch: { 'bhv-phishing': true },
            risk: 3,
          },
          {
            id: 'navigate',
            label: 'Go directly to the website — never click the link',
            detail: 'Standard safe practice.',
            patch: { 'bhv-phishing': false },
            risk: 0,
          },
          {
            id: 'report',
            label: 'Report phishing and delete',
            detail: 'Recognised the pattern immediately.',
            patch: { 'bhv-phishing': false },
            risk: 0,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* Step 6 — Device & Network                                        */
  /* ================================================================ */
  {
    id: 'device',
    label: 'Devices',
    eyebrow: 'Step 06 · Devices & Network',
    title: 'Where your credentials physically live',
    accent: '#27a644',
    questions: [
      {
        id: 'device-security',
        prompt: 'Is your main device encrypted and protected by a strong passcode?',
        helper: 'FileVault, BitLocker, or device encryption + strong PIN = data sealed if stolen.',
        pillar: 'device',
        options: [
          {
            id: 'no-lock',
            label: 'No lock screen or just a basic 4-digit PIN',
            detail: 'Physical access = full access.',
            patch: { 'dev-no-lock': true, 'dev-encrypted': false },
            risk: 2,
          },
          {
            id: 'lock-no-encrypt',
            label: 'Strong passcode but encryption not explicitly set up',
            detail: 'Data may be readable from another OS.',
            patch: { 'dev-no-lock': false, 'dev-encrypted': false },
            risk: 1,
          },
          {
            id: 'full',
            label: 'Full encryption enabled (FileVault / BitLocker / default mobile)',
            detail: 'Lost device stays sealed.',
            patch: { 'dev-no-lock': false, 'dev-encrypted': true },
            risk: 0,
          },
        ],
      },

      {
        id: 'wifi-habits',
        prompt: 'When you use public Wi-Fi (café, airport, hotel)…',
        pillar: 'device',
        options: [
          {
            id: 'freely',
            label: 'Connect freely — no VPN',
            detail: 'Open networks, no protection.',
            patch: { 'dev-wifi-open': true },
            risk: 2,
          },
          {
            id: 'vpn',
            label: 'Use a VPN or tether to my phone',
            detail: 'Untrusted networks stay untrusted.',
            patch: { 'dev-wifi-open': false },
            risk: 0,
          },
          {
            id: 'avoid',
            label: 'Avoid public Wi-Fi entirely',
            detail: 'No public network exposure.',
            patch: { 'dev-wifi-open': false },
            risk: 0,
          },
        ],
      },

      {
        id: 'updates',
        prompt: 'How current is your operating system and apps?',
        pillar: 'device',
        options: [
          {
            id: 'delayed',
            label: 'Often weeks or months behind',
            detail: 'Known vulnerabilities stay open.',
            patch: { 'dev-outdated': true },
            risk: 2,
          },
          {
            id: 'eventually',
            label: 'I get around to it — maybe a few weeks late',
            detail: 'Minor exposure window.',
            patch: { 'dev-outdated': false },
            risk: 1,
          },
          {
            id: 'prompt',
            label: 'Auto-update or install immediately',
            detail: 'Patch window is minimal.',
            patch: { 'dev-outdated': false },
            risk: 0,
          },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Convenience exports                                                 */
/* ------------------------------------------------------------------ */

/** Flat list of every question — useful for total-count displays. */
export const ALL_QUESTIONS: {
  stepIndex: number;
  questionIndex: number;
  question: Question;
}[] = STEPS.flatMap((step, stepIndex) =>
  step.questions.map((q, questionIndex) => ({ stepIndex, questionIndex, question: q })),
);

/** Total question count (upper bound — adaptive skipping reduces the actual count). */
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

/**
 * Approximate visible question count used for the intro screen.
 * Reflects the typical adaptive path (password manager + no-MFA are the
 * most common skip triggers).
 */
export const APPROX_QUESTIONS = 10;
