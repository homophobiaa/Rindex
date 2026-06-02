/**
 * Sample profile used for the dashboard's demo / preview state.
 *
 * A deliberately "average" user: a couple of good habits, a few common
 * weaknesses. It exercises every dashboard section (weak links, defenses,
 * a non-trivial attack map, a satisfying timeline) so the preview looks
 * like a real result rather than an empty shell.
 *
 * This is illustrative only — it is never presented as the visitor's own
 * data, and the page makes that explicit.
 */

import { defaultFactorState, type FactorState } from '@/lib/risk';

export const SAMPLE_ANSWERED = 8;
export const SAMPLE_TOTAL = 8;

export function sampleProfile(): FactorState {
  return {
    ...defaultFactorState(),
    // Good habits
    'password-manager': true,
    'device-encryption': true,
    // Weaknesses an average user carries
    'reused-password': true,
    'unique-passwords': false,
    'hardware-key': false,
    'sms-2fa-only': true,
    'weak-recovery': true,
    'public-email': true,
    'public-wifi': true,
    'mfa-fatigue': false,
    oversharing: true,
    'backup-codes': false,
  };
}
