/**
 * Personalized attack-map generator.
 *
 * Builds a React Flow graph that reflects THIS user's risk factors rather
 * than a fixed, pre-authored scenario. The same `AttackNodeData` /
 * `AttackEdgeData` model and the same custom node/edge renderers used by
 * the full Attack Paths page are reused here, so the visual language is
 * identical — only the topology is dynamic.
 *
 * Shape of the generated graph:
 *
 *   [ entry weaknesses ]  →  [ account takeover ]  →  [ accounts & funds ]
 *          (your active threats / gaps)   (attacker)        (impact)
 *                                ↑
 *                       [ active defenses ]  (green, blocking)
 *
 * If the user has no open weaknesses, a "hardened" variant is produced
 * showing the attacker bouncing off the defensive layer with no viable
 * path to the goal.
 */

import {
  attackProbability,
  compositeScore,
  factorById,
  type FactorState,
} from '@/lib/risk';
import type { AttackEdge, AttackNode, Severity } from '@/lib/attack-paths/types';

export interface AttackMap {
  nodes: AttackNode[];
  edges: AttackEdge[];
  /** Count of distinct weaknesses feeding the chain. */
  entryCount: number;
  /** Count of active protective layers. */
  defenseCount: number;
}

/* ------------------------------------------------------------------ */
/* Layout grid                                                         */
/* ------------------------------------------------------------------ */

const X = { entry: 0, pivot: 320, goal: 640 };
const ROW_H = 120;

/* ------------------------------------------------------------------ */
/* Entry-weakness catalog                                              */
/* ------------------------------------------------------------------ */

interface EntrySpec {
  factorId: string;
  title: string;
  short: string;
  detail: string;
  why: string;
  mitigation: string[];
  severity: Severity;
  /** Edge label into the pivot ("how this becomes access"). */
  hook: string;
  kind: AttackNode['data']['kind'];
}

/** Ordered by how attackers typically prioritize them. */
const ENTRY_SPECS: EntrySpec[] = [
  {
    factorId: 'reused-password',
    title: 'Password reuse',
    short: 'One credential unlocks many accounts.',
    detail:
      'A single breached site hands the attacker a username/password pair that they replay everywhere else you used it.',
    why: 'Credential reuse is the #1 driver of cascading account takeover.',
    mitigation: ['Adopt a password manager', 'Make email + finance unique first'],
    severity: 'high',
    hook: 'replay creds',
    kind: 'mistake',
  },
  {
    factorId: 'sms-2fa-only',
    title: 'SMS-only 2FA',
    short: 'Codes that can be intercepted or SIM-swapped.',
    detail:
      'SMS second factors can be redirected via SIM-swap or SS7 abuse, so a stolen password is often enough.',
    why: 'SMS is the weakest widely-deployed second factor.',
    mitigation: ['Switch to an authenticator app', 'Add a hardware key for critical accounts'],
    severity: 'high',
    hook: 'intercept OTP',
    kind: 'vulnerability',
  },
  {
    factorId: 'weak-recovery',
    title: 'Weak recovery path',
    short: 'A back door that is softer than the front.',
    detail:
      'An old or under-protected recovery email/phone lets an attacker reset the account without ever cracking it.',
    why: 'Attackers always pick the easiest door — recovery is usually it.',
    mitigation: ['Harden the recovery channel', 'Give it stronger MFA than the main account'],
    severity: 'high',
    hook: 'reset flow',
    kind: 'vulnerability',
  },
  {
    factorId: 'mfa-fatigue',
    title: 'MFA fatigue',
    short: 'Approving prompts you did not trigger.',
    detail:
      'Repeated push prompts pressure you into tapping "approve" — the exact technique behind several major breaches.',
    why: 'A working second factor still fails if you approve the attacker.',
    mitigation: ['Never approve an unexpected prompt', 'Verify device + location first'],
    severity: 'high',
    hook: 'push approve',
    kind: 'mistake',
  },
  {
    factorId: 'public-wifi',
    title: 'Unsecured Wi-Fi',
    short: 'Traffic exposed on untrusted networks.',
    detail:
      'On an open network an attacker can capture session tokens and cookies, side-stepping passwords entirely.',
    why: 'A stolen session needs no password and often no MFA.',
    mitigation: ['Use a VPN or phone tether', 'Treat café/airport Wi-Fi as hostile'],
    severity: 'medium',
    hook: 'steal session',
    kind: 'mistake',
  },
  {
    factorId: 'public-email',
    title: 'Exposed email',
    short: 'Your primary address is easy to find.',
    detail:
      'A public primary email is the anchor attackers use to map your accounts and target phishing.',
    why: 'Knowing the email is step zero of most account-takeover chains.',
    mitigation: ['Use aliases for public contact', 'Keep the primary address private'],
    severity: 'medium',
    hook: 'target inbox',
    kind: 'vulnerability',
  },
  {
    factorId: 'oversharing',
    title: 'Public personal info',
    short: 'Birthdays, pets, locations on display.',
    detail:
      'Public personal details answer security questions and make phishing pretexts dramatically more convincing.',
    why: 'These details are the seeds of both phishing and recovery bypass.',
    mitigation: ['Tighten social privacy', 'Use random security-question answers'],
    severity: 'low',
    hook: 'craft pretext',
    kind: 'mistake',
  },
];

/* ------------------------------------------------------------------ */
/* Defense catalog                                                     */
/* ------------------------------------------------------------------ */

interface DefenseSpec {
  factorId: string;
  title: string;
  short: string;
  detail: string;
  why: string;
}

const DEFENSE_SPECS: DefenseSpec[] = [
  {
    factorId: 'hardware-key',
    title: 'Hardware security key',
    short: 'Phishing-resistant FIDO2 second factor.',
    detail: 'A hardware key cryptographically binds logins to the real site, defeating credential phishing.',
    why: 'Neutralizes the most common account-takeover technique.',
  },
  {
    factorId: 'password-manager',
    title: 'Password manager',
    short: 'Unique high-entropy credentials everywhere.',
    detail: 'Generates and stores unique passwords so a single breach cannot cascade.',
    why: 'Removes reuse — the top driver of mass compromise.',
  },
  {
    factorId: 'unique-passwords',
    title: 'Unique passwords',
    short: 'No shared credentials across sites.',
    detail: 'Each account stands alone, so one leaked password stays contained.',
    why: 'Stops credential stuffing at the door.',
  },
  {
    factorId: 'backup-codes',
    title: 'Safe backup codes',
    short: 'Offline recovery without SMS.',
    detail: 'Recovery does not depend on a phone number an attacker can hijack.',
    why: 'Closes the recovery-abuse path.',
  },
  {
    factorId: 'device-encryption',
    title: 'Device encryption',
    short: 'Data stays sealed if hardware is lost.',
    detail: 'Full-disk encryption protects tokens and data on a stolen device.',
    why: 'A lost laptop no longer means a lost identity.',
  },
];

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function isDangerous(factorId: string, state: FactorState): boolean {
  const f = factorById(factorId);
  const on = !!state[factorId];
  return f.kind === 'protective' ? !on : on;
}

function isActiveDefense(factorId: string, state: FactorState): boolean {
  const f = factorById(factorId);
  const on = !!state[factorId];
  return f.kind === 'protective' ? on : !on;
}

function attackNode(
  id: string,
  x: number,
  y: number,
  data: AttackNode['data'],
): AttackNode {
  return { id, type: 'attack', position: { x, y }, data };
}

/**
 * Build the personalized attack map from a factor state.
 */
export function buildAttackMap(state: FactorState): AttackMap {
  const entries = ENTRY_SPECS.filter((e) => isDangerous(e.factorId, state));
  const defenses = DEFENSE_SPECS.filter((d) => isActiveDefense(d.factorId, state));
  const score = compositeScore(state);
  const goalProb = attackProbability(score);

  if (entries.length === 0) {
    return hardenedMap(defenses, goalProb);
  }

  const nodes: AttackNode[] = [];
  const edges: AttackEdge[] = [];

  // Vertical centering for the pivot / goal column.
  const entriesHeight = (entries.length - 1) * ROW_H;
  const midY = entriesHeight / 2;

  // Entry column — each active weakness, lit as "visited" so the chain reads
  // as a live path the user is currently exposed to.
  entries.forEach((e, i) => {
    nodes.push(
      attackNode(`entry-${e.factorId}`, X.entry, i * ROW_H, {
        kind: e.kind,
        title: e.title,
        short: e.short,
        detail: e.detail,
        why: e.why,
        mitigation: e.mitigation,
        severity: e.severity,
        state: 'visited',
        phase: 'Entry',
      }),
    );
    edges.push({
      id: `entry-${e.factorId}->pivot`,
      source: `entry-${e.factorId}`,
      target: 'pivot',
      type: 'attack',
      data: { variant: 'main', active: true, probability: severityProb(e.severity), label: e.hook },
    });
  });

  // Pivot — the takeover step. Success bar reflects the real composite.
  nodes.push(
    attackNode('pivot', X.pivot, midY, {
      kind: 'attacker',
      title: 'Account takeover',
      short: 'Attacker chains your weak points into access.',
      detail:
        'Your open weaknesses combine here: a foothold on one account is pivoted toward your highest-value targets.',
      why: 'Single weaknesses are survivable; chained together they compound.',
      mitigation: ['Close the highest-impact entry first', 'Add a phishing-resistant second factor'],
      severity: score >= 64 ? 'critical' : score >= 48 ? 'high' : 'medium',
      successProb: goalProb,
      state: 'active',
      phase: 'Pivot',
    }),
  );

  // Goal — the impact end-state.
  nodes.push(
    attackNode('goal', X.goal, midY, {
      kind: 'compromised',
      title: 'Accounts & funds',
      short: 'Email, identity, and financial access lost.',
      detail:
        'With the primary inbox owned, password resets fan out to banking, identity, and social accounts.',
      why: 'The blast radius of one takeover is everything tied to that email.',
      mitigation: ['Protect the primary email above all else', 'Separate finance from daily accounts'],
      severity: 'critical',
      state: 'visited',
      phase: 'Impact',
    }),
  );
  edges.push({
    id: 'pivot->goal',
    source: 'pivot',
    target: 'goal',
    type: 'attack',
    data: { variant: 'impact', active: true, probability: goalProb, label: 'cascade' },
  });

  // Defense column — active protective layers shown pushing back on the
  // pivot. Placed below the entry stack, connecting up into the attacker.
  defenses.forEach((d, i) => {
    const id = `defense-${d.factorId}`;
    nodes.push(
      attackNode(id, X.entry, entriesHeight + ROW_H + i * (ROW_H - 14), {
        kind: 'barrier',
        title: d.title,
        short: d.short,
        detail: d.detail,
        why: d.why,
        mitigation: ['Keep this control on', 'Extend it to any account that lacks it'],
        state: 'visited',
        phase: 'Defenses',
      }),
    );
    edges.push({
      id: `${id}->pivot`,
      source: id,
      target: 'pivot',
      type: 'attack',
      data: { variant: 'blocked', probability: 0, label: 'defends' },
    });
  });

  return { nodes, edges, entryCount: entries.length, defenseCount: defenses.length };
}

/**
 * "Hardened" variant — no open weaknesses. Shows the attacker meeting the
 * defensive layer with no viable route to the goal.
 */
function hardenedMap(defenses: DefenseSpec[], goalProb: number): AttackMap {
  const nodes: AttackNode[] = [];
  const edges: AttackEdge[] = [];

  const defenseCount = Math.max(defenses.length, 1);
  const midY = ((defenseCount - 1) * ROW_H) / 2;

  nodes.push(
    attackNode('attacker', X.entry, midY, {
      kind: 'attacker',
      title: 'Attacker attempt',
      short: 'Probes for a weak entry point.',
      detail: 'The attacker looks for reuse, weak recovery, or a soft second factor — and finds none.',
      why: 'With no open weakness, there is no cheap first move.',
      mitigation: ['Maintain current posture', 'Re-check after any new account or device'],
      severity: 'low',
      successProb: goalProb,
      state: 'active',
      phase: 'Attempt',
    }),
  );

  (defenses.length ? defenses : DEFENSE_SPECS.slice(0, 2)).forEach((d, i) => {
    const id = `defense-${d.factorId}`;
    nodes.push(
      attackNode(id, X.pivot, i * ROW_H, {
        kind: 'barrier',
        title: d.title,
        short: d.short,
        detail: d.detail,
        why: d.why,
        mitigation: ['Keep this control on'],
        state: 'visited',
        phase: 'Defenses',
      }),
    );
    edges.push({
      id: `attacker->${id}`,
      source: 'attacker',
      target: id,
      type: 'attack',
      data: { variant: 'blocked', probability: 0, label: 'blocked' },
    });
  });

  nodes.push(
    attackNode('goal', X.goal, midY, {
      kind: 'recovery',
      title: 'No viable path',
      short: 'Defenses hold — the chain never starts.',
      detail: 'Every cheap entry point is closed, so the attacker has no foothold to pivot from.',
      why: 'Hard targets get skipped for easier ones.',
      mitigation: ['Stay current on updates', 'Watch for new exposure as accounts change'],
      severity: 'low',
      state: 'idle',
      phase: 'Outcome',
    }),
  );
  edges.push({
    id: 'attacker->goal',
    source: 'attacker',
    target: 'goal',
    type: 'attack',
    data: { variant: 'alt', probability: goalProb, label: 'no path' },
  });

  return { nodes, edges, entryCount: 0, defenseCount: defenses.length };
}

function severityProb(sev: Severity): number {
  switch (sev) {
    case 'critical':
      return 0.85;
    case 'high':
      return 0.7;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.3;
  }
}
