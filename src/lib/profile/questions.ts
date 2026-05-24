/**
 * Personal Risk Profiler — question definitions.
 *
 * Every option maps onto the SHARED FactorState used by `@/lib/risk`.
 * There is no separate scoring engine for the profiler — picking an
 * option just sets a slice of factor booleans, and the same composite
 * score / probability / weakest-link math powers every visualization.
 *
 * Questions are intentionally short, conversational, and visually
 * differentiated. The flow auto-advances on selection so the user
 * always feels momentum.
 */

import type { FactorState } from '@/lib/risk';
import type { PillarId } from '@/lib/risk';

export type Patch = Partial<FactorState>;

export interface QuestionOption {
  id: string;
  label: string;
  /** Short clarifying line under the label. */
  detail: string;
  /** Patch to apply to the shared factor state when selected. */
  patch: Patch;
  /** Subjective "danger weight" used for option ordering visuals (0..3). */
  risk: 0 | 1 | 2 | 3;
  /** Optional inline icon glyph (svg path d). */
  icon?: string;
}

export interface Question {
  id: string;
  prompt: string;
  /** Short clarifying sentence below the prompt. */
  helper?: string;
  /** Pillar this question primarily influences — drives the side accent. */
  pillar: PillarId;
  options: QuestionOption[];
}

export interface ProfilerStep {
  id: string;
  label: string;
  /** Eyebrow shown above the question card. */
  eyebrow: string;
  /** Heading used in the progress track + step transitions. */
  title: string;
  /** Visual accent for this step. */
  accent: string;
  questions: Question[];
}

export const STEPS: ProfilerStep[] = [
  {
    id: 'password',
    label: 'Passwords',
    eyebrow: 'Step 01 · Passwords',
    title: 'How you handle credentials',
    accent: '#5e6ad2',
    questions: [
      {
        id: 'pw-strategy',
        prompt: 'How do you usually manage your passwords?',
        helper: 'Pick the closest match. There are no wrong answers.',
        pillar: 'password',
        options: [
          {
            id: 'reuse',
            label: 'I reuse the same one',
            detail: 'Same (or very similar) password across multiple sites.',
            patch: { 'reused-password': true, 'unique-passwords': false, 'password-manager': false },
            risk: 3,
          },
          {
            id: 'memorize',
            label: 'I memorize a few',
            detail: 'A handful of different passwords I remember.',
            patch: { 'reused-password': true, 'unique-passwords': false, 'password-manager': false },
            risk: 2,
          },
          {
            id: 'browser',
            label: 'Browser autofill',
            detail: 'Chrome / Safari / Firefox saves them for me.',
            patch: { 'reused-password': false, 'unique-passwords': true, 'password-manager': false },
            risk: 1,
          },
          {
            id: 'manager',
            label: 'A dedicated password manager',
            detail: '1Password, Bitwarden, KeePass, etc.',
            patch: { 'reused-password': false, 'unique-passwords': true, 'password-manager': true },
            risk: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'mfa',
    label: 'MFA',
    eyebrow: 'Step 02 · Authentication',
    title: 'How you protect logins',
    accent: '#a78bfa',
    questions: [
      {
        id: 'mfa-kind',
        prompt: 'How do you typically protect your important accounts?',
        helper: 'Think of your email, bank, and primary identity logins.',
        pillar: 'recovery',
        options: [
          {
            id: 'none',
            label: 'Password only',
            detail: 'No second factor enabled.',
            patch: { 'sms-2fa-only': false, 'hardware-key': false },
            risk: 3,
          },
          {
            id: 'sms',
            label: 'SMS codes',
            detail: 'Texted one-time codes for 2FA.',
            patch: { 'sms-2fa-only': true, 'hardware-key': false },
            risk: 2,
          },
          {
            id: 'app',
            label: 'Authenticator app',
            detail: 'Google Authenticator, Authy, 1Password TOTP.',
            patch: { 'sms-2fa-only': false, 'hardware-key': false },
            risk: 1,
          },
          {
            id: 'key',
            label: 'Hardware security key',
            detail: 'YubiKey, Titan, Passkey via biometric.',
            patch: { 'sms-2fa-only': false, 'hardware-key': true },
            risk: 0,
          },
        ],
      },
      {
        id: 'backup-codes',
        prompt: 'Where do your backup / recovery codes live?',
        pillar: 'recovery',
        options: [
          {
            id: 'none',
            label: 'I don\'t have any',
            detail: 'Never generated them.',
            patch: { 'backup-codes': false },
            risk: 3,
          },
          {
            id: 'cloud',
            label: 'In cloud notes or a screenshot',
            detail: 'Google Keep, iCloud Notes, Photos…',
            patch: { 'backup-codes': false },
            risk: 2,
          },
          {
            id: 'safe',
            label: 'In my password manager or printed',
            detail: 'Stored offline or in an encrypted vault.',
            patch: { 'backup-codes': true },
            risk: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    eyebrow: 'Step 03 · Recovery paths',
    title: 'The back-door problem',
    accent: '#f79009',
    questions: [
      {
        id: 'recovery-strength',
        prompt: 'How is your recovery email or phone secured?',
        helper: 'Attackers always pick the easiest door.',
        pillar: 'recovery',
        options: [
          {
            id: 'shared',
            label: 'Same password as the main account',
            detail: 'Same credential protects both.',
            patch: { 'weak-recovery': true },
            risk: 3,
          },
          {
            id: 'old',
            label: 'An old, rarely-checked email',
            detail: 'Created years ago, no MFA, weak password.',
            patch: { 'weak-recovery': true },
            risk: 3,
          },
          {
            id: 'separate',
            label: 'A separate, MFA-protected channel',
            detail: 'Different password + hardware key or TOTP.',
            patch: { 'weak-recovery': false },
            risk: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'device',
    label: 'Devices',
    eyebrow: 'Step 04 · Devices & network',
    title: 'Where the keys live',
    accent: '#27a644',
    questions: [
      {
        id: 'encryption',
        prompt: 'Is your laptop / phone encrypted?',
        helper: 'FileVault, BitLocker, device PIN — anything that protects data if the device is stolen.',
        pillar: 'barriers',
        options: [
          {
            id: 'no',
            label: 'Not really',
            detail: 'Or I\'m not sure.',
            patch: { 'device-encryption': false },
            risk: 2,
          },
          {
            id: 'yes',
            label: 'Yes, fully encrypted',
            detail: 'OS-level encryption is on.',
            patch: { 'device-encryption': true },
            risk: 0,
          },
        ],
      },
      {
        id: 'wifi',
        prompt: 'When you connect to public Wi-Fi…',
        pillar: 'behavior',
        options: [
          {
            id: 'freely',
            label: 'I connect freely',
            detail: 'Cafés, airports, hotels — no VPN.',
            patch: { 'public-wifi': true },
            risk: 2,
          },
          {
            id: 'vpn',
            label: 'I use a VPN or tether instead',
            detail: 'Untrusted networks stay untrusted.',
            patch: { 'public-wifi': false },
            risk: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'social',
    label: 'Exposure',
    eyebrow: 'Step 05 · Public exposure',
    title: 'What attackers can already see',
    accent: '#4cc2ff',
    questions: [
      {
        id: 'email-visibility',
        prompt: 'How public is your primary email address?',
        pillar: 'surface',
        options: [
          {
            id: 'public',
            label: 'It\'s on profiles, GitHub, or my resume',
            detail: 'Easy to find via a quick search.',
            patch: { 'public-email': true },
            risk: 2,
          },
          {
            id: 'private',
            label: 'I only share it privately',
            detail: 'Public-facing contact uses a separate alias.',
            patch: { 'public-email': false },
            risk: 0,
          },
        ],
      },
      {
        id: 'oversharing',
        prompt: 'Do birthdays, pet names, or locations appear publicly on your profiles?',
        helper: 'These are the answers to security questions — and the seeds of phishing scripts.',
        pillar: 'behavior',
        options: [
          {
            id: 'yes',
            label: 'Yes, more or less openly',
            detail: 'Default privacy on social platforms.',
            patch: { oversharing: true },
            risk: 2,
          },
          {
            id: 'no',
            label: 'Mostly kept private',
            detail: 'Strict privacy settings or no public profile.',
            patch: { oversharing: false },
            risk: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'behavior',
    label: 'Habits',
    eyebrow: 'Step 06 · Behavior',
    title: 'Under attack pressure',
    accent: '#f04438',
    questions: [
      {
        id: 'mfa-fatigue',
        prompt: 'An unexpected MFA prompt arrives on your phone. You…',
        helper: 'This exact scenario is how Uber, Cisco, and Microsoft 365 were breached.',
        pillar: 'behavior',
        options: [
          {
            id: 'approve',
            label: 'Tap approve to make it stop',
            detail: 'Or assume the app is glitching.',
            patch: { 'mfa-fatigue': true },
            risk: 3,
          },
          {
            id: 'investigate',
            label: 'Investigate before approving',
            detail: 'Check the device, location, or time.',
            patch: { 'mfa-fatigue': false },
            risk: 0,
          },
        ],
      },
    ],
  },
];

/** Flat list of every question across steps, for total counting. */
export const ALL_QUESTIONS: { stepIndex: number; questionIndex: number; question: Question }[] =
  STEPS.flatMap((step, stepIndex) =>
    step.questions.map((q, questionIndex) => ({ stepIndex, questionIndex, question: q })),
  );

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;
