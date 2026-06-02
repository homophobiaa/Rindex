/**
 * Sample profile for the dashboard demo/preview state — v2 factor IDs.
 *
 * A deliberately "average" user: a couple of good habits, several
 * common weaknesses. Scores approximately 50–58 with the v2 engine.
 */

import { defaultFactorState, type FactorState } from '@/lib/risk';

export const SAMPLE_ANSWERED = 11;
export const SAMPLE_TOTAL = 11;

export function sampleProfile(): FactorState {
  return {
    ...defaultFactorState(),
    // Good habits
    'pw-manager':       true,
    'dev-encrypted':    true,
    'mfa-app':          false,
    // Weaknesses an average user carries
    'pw-reuse':         true,
    'pw-unique':        false,
    'mfa-none':         false,
    'mfa-sms':          true,   // SMS MFA
    'mfa-hardware':     false,
    'rec-weak-email':   true,
    'rec-same-creds':   false,
    'rec-exposed-phone':true,
    'rec-backup-codes': false,
    'exp-public-email': true,
    'exp-public-info':  true,
    'bhv-oversharing':  true,
    'bhv-phishing':     false,
    'bhv-mfa-fatigue':  false,
    'dev-wifi-open':    true,
    'dev-outdated':     false,
  };
}
