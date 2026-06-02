/**
 * Personalized attack-map generator — v2.
 *
 * Uses v2 factor IDs from `@/lib/risk/factors.ts`.
 * See original file comments for the full architecture description.
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
  entryCount: number;
  defenseCount: number;
}

const X = { entry: 0, pivot: 320, goal: 640 };
const ROW_H = 120;

/* ------------------------------------------------------------------ */
/* Entry-weakness catalog (v2 factor IDs)                             */
/* ------------------------------------------------------------------ */

interface EntrySpec {
  factorId: string;
  title: string;
  short: string;
  detail: string;
  why: string;
  mitigation: string[];
  severity: Severity;
  hook: string;
  kind: AttackNode['data']['kind'];
}

const ENTRY_SPECS: EntrySpec[] = [
  {
    factorId: 'pw-reuse',
    title: 'Password reuse',
    short: 'One credential unlocks many accounts.',
    detail: 'A single breached site hands the attacker a username/password pair replayed everywhere else you used it.',
    why: 'Credential reuse is the #1 driver of cascading account takeover.',
    mitigation: ['Adopt a password manager', 'Make email + finance unique first'],
    severity: 'high',
    hook: 'replay creds',
    kind: 'mistake',
  },
  {
    factorId: 'mfa-none',
    title: 'No second factor',
    short: 'Password is the only barrier to every account.',
    detail: 'Without MFA, a single stolen or guessed password gives complete account access.',
    why: 'Any MFA is better than none — it eliminates the most common remote takeover vector.',
    mitigation: ['Enable an authenticator app immediately', 'Hardware key for critical accounts'],
    severity: 'critical',
    hook: 'password only',
    kind: 'vulnerability',
  },
  {
    factorId: 'rec-weak-email',
    title: 'Weak recovery path',
    short: 'A back door softer than the front.',
    detail: 'An old or under-protected recovery email/phone lets an attacker reset the account without cracking it.',
    why: 'Attackers always pick the easiest door — recovery is usually it.',
    mitigation: ['Harden the recovery channel', 'Give it stronger MFA than the main account'],
    severity: 'high',
    hook: 'reset flow',
    kind: 'vulnerability',
  },
  {
    factorId: 'bhv-mfa-fatigue',
    title: 'MFA fatigue',
    short: 'Approving prompts you did not trigger.',
    detail: 'Repeated push prompts pressure users into tapping "approve" — exactly how Uber, Cisco, and Microsoft 365 were breached.',
    why: 'A working second factor still fails if you approve the attacker.',
    mitigation: ['Never approve an unexpected prompt', 'Investigate device + location first'],
    severity: 'high',
    hook: 'push approve',
    kind: 'mistake',
  },
  {
    factorId: 'mfa-sms',
    title: 'SMS-only 2FA',
    short: 'Codes interceptable via SIM-swap.',
    detail: 'SMS second factors can be redirected via SIM-swap or SS7 abuse, so a stolen password is often enough.',
    why: 'SMS is the weakest widely-deployed second factor.',
    mitigation: ['Switch to authenticator app', 'Hardware key for critical accounts'],
    severity: 'medium',
    hook: 'SIM-swap',
    kind: 'vulnerability',
  },
  {
    factorId: 'dev-wifi-open',
    title: 'Unsecured Wi-Fi',
    short: 'Traffic exposed on untrusted networks.',
    detail: 'On an open network an attacker can capture session tokens and cookies, side-stepping passwords entirely.',
    why: 'A stolen session needs no password and often no MFA.',
    mitigation: ['Use a VPN or phone tether', 'Treat café/airport Wi-Fi as hostile'],
    severity: 'medium',
    hook: 'steal session',
    kind: 'mistake',
  },
  {
    factorId: 'exp-public-email',
    title: 'Exposed email',
    short: 'Primary address easy to find.',
    detail: 'A public primary email is the anchor attackers use to map accounts and target phishing.',
    why: 'Knowing the email is step zero of most account-takeover chains.',
    mitigation: ['Use aliases for public contact', 'Keep the primary address private'],
    severity: 'low',
    hook: 'target inbox',
    kind: 'vulnerability',
  },
  {
    factorId: 'bhv-oversharing',
    title: 'Public personal info',
    short: 'Birthdays, locations, employers on display.',
    detail: 'Public personal details answer security questions and make phishing pretexts dramatically more convincing.',
    why: 'These details seed both phishing and recovery bypass.',
    mitigation: ['Tighten social privacy', 'Use random security-question answers'],
    severity: 'low',
    hook: 'craft pretext',
    kind: 'mistake',
  },
];

/* ------------------------------------------------------------------ */
/* Defense catalog (v2 factor IDs)                                    */
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
    factorId: 'mfa-hardware',
    title: 'Hardware security key',
    short: 'Phishing-resistant FIDO2 second factor.',
    detail: 'A hardware key cryptographically binds logins to the real site, defeating credential phishing.',
    why: 'Neutralizes the most common account-takeover technique.',
  },
  {
    factorId: 'pw-manager',
    title: 'Password manager',
    short: 'Unique high-entropy credentials everywhere.',
    detail: 'Generates and stores unique passwords so a single breach cannot cascade.',
    why: 'Removes reuse — the top driver of mass compromise.',
  },
  {
    factorId: 'pw-unique',
    title: 'Unique passwords',
    short: 'No shared credentials across sites.',
    detail: 'Each account stands alone, so one leaked password stays contained.',
    why: 'Stops credential stuffing at the door.',
  },
  {
    factorId: 'rec-backup-codes',
    title: 'Safe backup codes',
    short: 'Offline recovery without SMS.',
    detail: 'Recovery does not depend on a phone number an attacker can hijack.',
    why: 'Closes the recovery-abuse path.',
  },
  {
    factorId: 'dev-encrypted',
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
  try {
    const f = factorById(factorId);
    const on = !!state[factorId];
    return f.kind === 'protective' ? !on : on;
  } catch {
    return false;
  }
}

function isActiveDefense(factorId: string, state: FactorState): boolean {
  try {
    const f = factorById(factorId);
    const on = !!state[factorId];
    return f.kind === 'protective' ? on : !on;
  } catch {
    return false;
  }
}

function attackNode(id: string, x: number, y: number, data: AttackNode['data']): AttackNode {
  return { id, type: 'attack', position: { x, y }, data };
}

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
  const entriesHeight = (entries.length - 1) * ROW_H;
  const midY = entriesHeight / 2;

  entries.forEach((e, i) => {
    nodes.push(attackNode(`entry-${e.factorId}`, X.entry, i * ROW_H, {
      kind: e.kind, title: e.title, short: e.short, detail: e.detail,
      why: e.why, mitigation: e.mitigation, severity: e.severity, state: 'visited', phase: 'Entry',
    }));
    edges.push({
      id: `entry-${e.factorId}->pivot`,
      source: `entry-${e.factorId}`, target: 'pivot', type: 'attack',
      data: { variant: 'main', active: true, probability: severityProb(e.severity), label: e.hook },
    });
  });

  nodes.push(attackNode('pivot', X.pivot, midY, {
    kind: 'attacker',
    title: 'Account takeover',
    short: 'Attacker chains your weak points into access.',
    detail: 'Your open weaknesses combine here: a foothold on one account pivots toward your highest-value targets.',
    why: 'Single weaknesses are survivable; chained together they compound.',
    mitigation: ['Close the highest-impact entry first', 'Add a phishing-resistant second factor'],
    severity: score >= 65 ? 'critical' : score >= 50 ? 'high' : 'medium',
    successProb: goalProb,
    state: 'active',
    phase: 'Pivot',
  }));

  nodes.push(attackNode('goal', X.goal, midY, {
    kind: 'compromised',
    title: 'Accounts & funds',
    short: 'Email, identity, and financial access lost.',
    detail: 'With the primary inbox owned, password resets fan out to banking, identity, and social accounts.',
    why: 'The blast radius of one takeover is everything tied to that email.',
    mitigation: ['Protect the primary email above all else', 'Separate finance from daily accounts'],
    severity: 'critical',
    state: 'visited',
    phase: 'Impact',
  }));
  edges.push({
    id: 'pivot->goal', source: 'pivot', target: 'goal', type: 'attack',
    data: { variant: 'impact', active: true, probability: goalProb, label: 'cascade' },
  });

  defenses.forEach((d, i) => {
    const id = `defense-${d.factorId}`;
    nodes.push(attackNode(id, X.entry, entriesHeight + ROW_H + i * (ROW_H - 14), {
      kind: 'barrier', title: d.title, short: d.short, detail: d.detail, why: d.why,
      mitigation: ['Keep this control on', 'Extend it to any account that lacks it'],
      state: 'visited', phase: 'Defenses',
    }));
    edges.push({
      id: `${id}->pivot`, source: id, target: 'pivot', type: 'attack',
      data: { variant: 'blocked', probability: 0, label: 'defends' },
    });
  });

  return { nodes, edges, entryCount: entries.length, defenseCount: defenses.length };
}

function hardenedMap(defenses: DefenseSpec[], goalProb: number): AttackMap {
  const nodes: AttackNode[] = [];
  const edges: AttackEdge[] = [];
  const defenseCount = Math.max(defenses.length, 1);
  const midY = ((defenseCount - 1) * ROW_H) / 2;

  nodes.push(attackNode('attacker', X.entry, midY, {
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
  }));

  (defenses.length ? defenses : DEFENSE_SPECS.slice(0, 2)).forEach((d, i) => {
    const id = `defense-${d.factorId}`;
    nodes.push(attackNode(id, X.pivot, i * ROW_H, {
      kind: 'barrier', title: d.title, short: d.short, detail: d.detail, why: d.why,
      mitigation: ['Keep this control on'],
      state: 'visited', phase: 'Defenses',
    }));
    edges.push({
      id: `attacker->${id}`, source: 'attacker', target: id, type: 'attack',
      data: { variant: 'blocked', probability: 0, label: 'blocked' },
    });
  });

  nodes.push(attackNode('goal', X.goal, midY, {
    kind: 'recovery',
    title: 'No viable path',
    short: 'Defenses hold — the chain never starts.',
    detail: 'Every cheap entry point is closed, so the attacker has no foothold to pivot from.',
    why: 'Hard targets get skipped for easier ones.',
    mitigation: ['Stay current on updates', 'Watch for new exposure as accounts change'],
    severity: 'low',
    state: 'idle',
    phase: 'Outcome',
  }));
  edges.push({
    id: 'attacker->goal', source: 'attacker', target: 'goal', type: 'attack',
    data: { variant: 'alt', probability: goalProb, label: 'no path' },
  });

  return { nodes, edges, entryCount: 0, defenseCount: defenses.length };
}

function severityProb(sev: Severity): number {
  switch (sev) {
    case 'critical': return 0.85;
    case 'high':     return 0.70;
    case 'medium':   return 0.50;
    case 'low':      return 0.30;
  }
}
