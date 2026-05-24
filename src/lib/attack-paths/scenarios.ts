/**
 * Attack-path scenarios.
 *
 * Each scenario is a small directed graph designed to teach a single
 * security concept through visual chaining.  Every scenario has:
 *   - a CANONICAL PATH (the main attack chain, simulated step-by-step)
 *   - ALT BRANCHES (less-likely deviations from the main path)
 *   - SECURITY BARRIERS (would block the chain if present)
 *   - IMPACT FAN-OUT (what falls once the main asset is compromised)
 *   - RECOVERY (how to respond and harden)
 *
 * Node positions live on a lane grid.  Lanes are exposed as `phases` so
 * the canvas can render column headers + faint background bands.
 */
import type { AttackEdge, AttackNode, EdgeVariant, Scenario, ScenarioPhase } from './types';

/* ------------------------------------------------------------------ */
/* Layout grid                                                         */
/* ------------------------------------------------------------------ */

const COL_W = 300; // lane width
const COL_X = (i: number) => i * COL_W; // left-edge x of lane i
const NODE_X = (i: number) => COL_X(i) + 24; // node x inside lane
const NODE_Y = (row: number) => row * 140;

/* ------------------------------------------------------------------ */
/* Authoring helpers                                                   */
/* ------------------------------------------------------------------ */

function node(
  id: string,
  laneIndex: number,
  row: number,
  phase: string,
  data: Omit<AttackNode['data'], 'phase'>,
): AttackNode {
  return {
    id,
    type: 'attack',
    position: { x: NODE_X(laneIndex), y: NODE_Y(row) },
    data: { ...data, phase },
  };
}

function edge(
  source: string,
  target: string,
  data: { probability: number; label?: string; variant?: EdgeVariant },
): AttackEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'attack',
    data: { variant: 'main', ...data },
  };
}

function phasesFrom(labels: string[]): ScenarioPhase[] {
  return labels.map((label, i) => ({
    id: `phase-${i}`,
    label,
    x: COL_X(i),
    width: COL_W,
  }));
}

/* ============================================================
 * 1.  Weak / reused password → full email cascade
 * ============================================================ */
const weakPassword: Scenario = (() => {
  const phases = phasesFrom([
    'Habit',
    'Exposure',
    'Credential abuse',
    'Inbox pivot',
    'Impact fan-out',
    'Recovery',
  ]);

  const nodes: AttackNode[] = [
    node('wp-mistake', 0, 1, 'Habit', {
      kind: 'mistake',
      title: 'Reuses one password',
      short: 'Same string across many sites.',
      detail:
        'Most people reuse one password across dozens of accounts. A single leak turns it into a master key.',
      why:
        'Attackers don\u2019t need to crack you — they only need any site that lost your password. Reuse is the silent multiplier behind most account takeovers.',
      mitigation: [
        'Use a password manager so every site gets a unique password.',
        'Audit reuse with haveibeenpwned.com.',
        'Treat your email password as the single most critical one.',
      ],
      severity: 'high',
    }),
    node('wp-breach', 1, 1, 'Exposure', {
      kind: 'vulnerability',
      title: 'Old data breach',
      short: 'Email + password sitting in a public dump.',
      detail:
        'Billions of credentials circulate in public corpora (Collection #1, RockYou, etc.). If yours is in there, the attacker already has it.',
      why:
        'Public breach data is the cheapest attack surface that exists. No skill required — anyone can download it.',
      mitigation: ['Check haveibeenpwned for every email you use.', 'Rotate any password ever used on a breached site.'],
      severity: 'high',
    }),
    node('wp-unique', 1, 2.4, 'Exposure', {
      kind: 'barrier',
      title: 'Unique passwords per site',
      short: 'Stops the chain at the source.',
      detail:
        'If every account has its own password, a leak on one site never reaches another. The chain is broken before it starts.',
      why: 'A password manager reduces blast radius from "everything" to "one minor account".',
      mitigation: ['Adopt 1Password, Bitwarden, or KeePass.', 'Let the manager flag duplicates and rotate them.'],
      severity: 'low',
    }),
    node('wp-stuff', 2, 1, 'Credential abuse', {
      kind: 'attacker',
      title: 'Credential stuffing',
      short: 'Bot replays the pair against major services.',
      detail:
        'Attackers automate logins to Gmail, Instagram, Steam, banks, etc. using leaked email+password pairs. Hit rate is small, volume is massive.',
      why: 'One attacker can try millions of combos a day. Even a 0.1% hit rate is thousands of takeovers.',
      mitigation: ['Use a different password on email than anywhere else.', 'Enable rate limiting + bot detection on services you run.'],
      severity: 'high',
      successProb: 0.7,
    }),
    node('wp-mfa', 2, 2.4, 'Credential abuse', {
      kind: 'barrier',
      title: 'Email 2FA enabled',
      short: 'Blocks stuffing even with the right password.',
      detail:
        '2FA on email stops credential stuffing in almost every case — the attacker has the password but cannot produce the code.',
      why: 'Email is the recovery hub for every other account. Protecting it is the single highest-leverage control you have.',
      mitigation: ['Enable TOTP (authenticator app) on email today.', 'Print backup codes and store them offline.'],
      severity: 'low',
    }),
    node('wp-email', 3, 1.7, 'Inbox pivot', {
      kind: 'compromised',
      title: 'Inbox access',
      short: 'Attacker is now logged in as you.',
      detail:
        'With email access, the attacker can issue password resets on every linked account: bank, social, shopping, gaming, cloud, work.',
      why: 'Your inbox is the keys to the kingdom. Most "forgot password" flows trust an email link absolutely.',
      mitigation: ['Add 2FA to email immediately.', 'Review active sessions and logged-in devices.', 'Use a separate, strong, memorized email password.'],
      severity: 'critical',
    }),
    node('wp-impact-reset', 4, 0.3, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Password reset hub',
      short: 'Every "forgot password" link works.',
      detail:
        'The attacker walks through your inbox triggering resets on every service you ever signed up with — bank, social, shopping, work.',
      why: 'A reset email is an unauthenticated identity proof. Owning the inbox owns every account that trusts it.',
      mitigation: ['Use a separate recovery email for high-value accounts.', 'Prefer passkeys over email-based reset where possible.'],
      severity: 'critical',
    }),
    node('wp-impact-social', 4, 1.5, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Social accounts pivoted',
      short: 'Instagram, X, TikTok — all reset.',
      detail:
        'Your contacts get scam DMs from "you". Reputation damage stacks fast and platform recovery takes days.',
      why: 'Friends-list scams are devastatingly effective — the message comes from a trusted sender.',
      mitigation: ['Warn followers via a second channel.', 'Enable per-app 2FA, not just email recovery.'],
      severity: 'high',
    }),
    node('wp-impact-bank', 4, 2.7, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Banking & payment alerts',
      short: 'Card alerts, statements, transfers visible.',
      detail:
        'Even read-only access to banking emails reveals account numbers, balances, vendors, and lets the attacker time fraud around your habits.',
      why: 'You can\u2019t un-leak this data. It enables targeted social engineering for months.',
      mitigation: ['Route bank alerts to a dedicated, isolated email.', 'Enable bank-side login alerts via SMS or app push.'],
      severity: 'critical',
    }),
    node('wp-impact-cloud', 4, 3.9, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Cloud storage access',
      short: 'Drive / iCloud / OneDrive open.',
      detail:
        'Tax docs, ID scans, screenshots of recovery codes, exported password vaults — anything you ever uploaded.',
      why: 'Cloud sync turns a single inbox into a filesystem-wide leak.',
      mitigation: ['Encrypt sensitive cloud files at rest.', 'Don\u2019t store recovery codes or vault exports in cloud drives.'],
      severity: 'critical',
    }),
    node('wp-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Rotate, revoke, harden',
      short: 'Treat the takeover as a wake-up call.',
      detail:
        'Regain inbox access, force-logout every session, rotate every password starting with email, enable 2FA everywhere, audit OAuth apps.',
      why: 'Recovery without hardening invites the next attack. Always upgrade your posture during cleanup.',
      mitigation: [
        'Adopt a password manager going forward.',
        'Use phishing-resistant 2FA (passkeys / FIDO2) on high-value accounts.',
        'Subscribe to breach alert services for every email you use.',
      ],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('wp-mistake', 'wp-breach', { probability: 0.85, label: 'leak exposes pair' }),
    edge('wp-mistake', 'wp-unique', { probability: 0.15, label: 'if unique', variant: 'blocked' }),
    edge('wp-breach', 'wp-stuff', { probability: 0.9 }),
    edge('wp-breach', 'wp-mfa', { probability: 0.2, label: 'if 2FA', variant: 'blocked' }),
    edge('wp-stuff', 'wp-email', { probability: 0.7 }),
    edge('wp-email', 'wp-impact-reset', { probability: 0.95, variant: 'impact' }),
    edge('wp-email', 'wp-impact-social', { probability: 0.8, variant: 'impact' }),
    edge('wp-email', 'wp-impact-bank', { probability: 0.7, variant: 'impact' }),
    edge('wp-email', 'wp-impact-cloud', { probability: 0.55, variant: 'impact' }),
    edge('wp-impact-reset', 'wp-recovery', { probability: 1, label: 'response', variant: 'recovery' }),
  ];

  return {
    id: 'weak-password',
    title: 'Weak & reused password',
    tagline: 'How one reused password unlocks your entire digital life.',
    description:
      'A breached password on a low-value site cascades through credential stuffing into your email — the master key that resets every other account.',
    iconKey: 'lock',
    nodes,
    edges,
    phases,
    path: ['wp-mistake', 'wp-breach', 'wp-stuff', 'wp-email', 'wp-impact-reset'],
    stageLabels: [
      'Bad habit forms',
      'Credentials leak',
      'Bot replays them',
      'Inbox falls',
      'Cascade begins',
    ],
  };
})();

/* ============================================================
 * 2.  Phishing & MFA fatigue
 * ============================================================ */
const phishing: Scenario = (() => {
  const phases = phasesFrom([
    'Bait',
    'Click',
    'Harvest',
    'MFA bypass',
    'Compromise',
    'Recovery',
  ]);

  const nodes: AttackNode[] = [
    node('ph-email', 0, 1.5, 'Bait', {
      kind: 'attacker',
      title: 'Targeted phishing email',
      short: '"Your account will be locked in 24 h."',
      detail:
        'A spoofed sender, urgent tone, and a believable login button. Modern kits clone real login pages pixel for pixel.',
      why: 'Phishing remains the #1 initial-access vector. Cheap, fast, depends only on one click.',
      mitigation: ['Hover links before clicking — check the real domain.', 'Type sensitive URLs by hand or use bookmarks.'],
      severity: 'high',
      successProb: 0.5,
    }),
    node('ph-mistake', 1, 1.5, 'Click', {
      kind: 'mistake',
      title: 'User clicks the link',
      short: 'Tired, distracted, looks legit.',
      detail:
        'Most phishing victims aren\u2019t careless — they\u2019re busy. The brain pattern-matches on logo + tone and skips the URL bar.',
      why: 'No amount of training removes this risk fully. Defense-in-depth (passkeys, hardware keys) is what actually works.',
      mitigation: ['Treat unexpected login links as suspicious by default.', 'Use passkeys instead of passwords where supported.'],
      severity: 'medium',
    }),
    node('ph-page', 2, 1.5, 'Harvest', {
      kind: 'vulnerability',
      title: 'AiTM phishing page',
      short: 'Reverse-proxy steals credentials + cookie.',
      detail:
        'Tools like Evilginx proxy the real site through the attacker, harvesting the live session cookie after a successful sign-in.',
      why: 'Adversary-in-the-Middle defeats one-time codes because the legitimate site issued them.',
      mitigation: ['Use FIDO2 / WebAuthn keys — bound to the real origin.', 'Enable conditional-access policies if available.'],
      severity: 'high',
    }),
    node('ph-mfa-fatigue', 3, 0.7, 'MFA bypass', {
      kind: 'attacker',
      title: 'MFA-fatigue spam',
      short: 'Dozens of push prompts until one is tapped.',
      detail:
        'Even when stolen credentials aren\u2019t enough, attackers spam push-notification 2FA hoping the victim taps "approve" out of confusion.',
      why: 'This works far more often than you\u2019d expect. Several major breaches in recent years started exactly here.',
      mitigation: ['Use number-matching MFA, not blind approve / deny.', 'Set a daily push limit on your IdP.'],
      severity: 'high',
      successProb: 0.4,
    }),
    node('ph-key', 3, 2.3, 'MFA bypass', {
      kind: 'barrier',
      title: 'Hardware security key',
      short: 'Origin-bound. Phishing page can\u2019t use it.',
      detail:
        'A YubiKey / passkey is bound to the real domain. The fake page literally cannot complete the WebAuthn challenge.',
      why: 'Phishing-resistant MFA is the single most effective control against credential phishing.',
      mitigation: ['Use passkeys on iCloud / Google.', 'Use a hardware key for high-value accounts.'],
      severity: 'low',
    }),
    node('ph-takeover', 4, 0.7, 'Compromise', {
      kind: 'compromised',
      title: 'Session cookie stolen',
      short: 'Attacker is now logged in as you.',
      detail:
        'With the session cookie or an approved MFA prompt, the attacker rides your live session — no further auth needed.',
      why: 'Session theft sidesteps password and MFA entirely. Only revocation kicks the attacker out.',
      mitigation: ['Revoke all sessions after suspected compromise.', 'Rotate passwords + re-enroll MFA.'],
      severity: 'critical',
    }),
    node('ph-impact-inbox', 5, 0, 'Recovery', {
      kind: 'compromised',
      title: 'Inbox & contacts',
      short: 'Coworkers / clients phished from your name.',
      detail:
        'The attacker uses your real mailbox to phish your network. These messages bypass filters because they come from a trusted sender.',
      why: 'Lateral phishing is one of the highest-conversion attack patterns in existence.',
      mitigation: ['Notify IT / your contacts immediately.', 'Enable DMARC + anti-impersonation rules at the org level.'],
      severity: 'critical',
    }),
    node('ph-impact-docs', 5, 1.2, 'Recovery', {
      kind: 'compromised',
      title: 'Shared docs exfiltrated',
      short: 'SharePoint / Drive / Notion exposed.',
      detail:
        'A logged-in session can quietly download every doc and link the account has access to.',
      why: 'Most users have access to far more shared content than they realize.',
      mitigation: ['Apply least-privilege defaults to shared drives.', 'Audit unusual download spikes.'],
      severity: 'high',
    }),
    node('ph-recovery', 5, 2.5, 'Recovery', {
      kind: 'recovery',
      title: 'Revoke + rebuild trust',
      short: 'Sessions out, MFA re-enrolled, contacts warned.',
      detail:
        'Force-revoke every session, rotate the password, re-enroll MFA on hardware, notify everyone who got phishing from you.',
      why: 'Trust recovery takes longer than technical recovery. Communicate clearly.',
      mitigation: ['Move to passkeys before the next attack.', 'Hold a short org-wide phishing debrief.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('ph-email', 'ph-mistake', { probability: 0.5 }),
    edge('ph-mistake', 'ph-page', { probability: 0.9 }),
    edge('ph-page', 'ph-mfa-fatigue', { probability: 0.6 }),
    edge('ph-page', 'ph-key', { probability: 0.05, label: 'if hardware key', variant: 'blocked' }),
    edge('ph-mfa-fatigue', 'ph-takeover', { probability: 0.4 }),
    edge('ph-takeover', 'ph-impact-inbox', { probability: 0.9, variant: 'impact' }),
    edge('ph-takeover', 'ph-impact-docs', { probability: 0.75, variant: 'impact' }),
    edge('ph-impact-inbox', 'ph-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'phishing',
    title: 'Phishing & MFA fatigue',
    tagline: 'How a convincing email defeats even 2FA.',
    description:
      'Modern phishing skips the password entirely. It harvests a session token, then bombards you with MFA prompts until you tap "approve" out of habit.',
    iconKey: 'mail',
    nodes,
    edges,
    phases,
    path: ['ph-email', 'ph-mistake', 'ph-page', 'ph-mfa-fatigue', 'ph-takeover'],
    stageLabels: [
      'Bait arrives',
      'Victim clicks',
      'Credentials harvested',
      'MFA approved',
      'Session stolen',
    ],
  };
})();

/* ============================================================
 * 3.  Untrusted public Wi-Fi
 * ============================================================ */
const publicWifi: Scenario = (() => {
  const phases = phasesFrom([
    'Habit',
    'Network',
    'Interception',
    'Compromise',
    'Impact',
    'Recovery',
  ]);

  const nodes: AttackNode[] = [
    node('wf-mistake', 0, 1.5, 'Habit', {
      kind: 'mistake',
      title: 'Connects to "Free Wi-Fi"',
      short: 'No password, no questions asked.',
      detail:
        'Open networks named after the venue ("Airport_Free_WiFi") are trivial to spoof. Your laptop reconnects automatically next time.',
      why: 'You don\u2019t see who else is on the network. Anyone running basic tooling can watch your traffic.',
      mitigation: ['Use mobile-hotspot tethering instead of open Wi-Fi.', 'Disable auto-join on open networks.'],
      severity: 'medium',
    }),
    node('wf-rogue', 1, 1.5, 'Network', {
      kind: 'attacker',
      title: 'Rogue access point',
      short: 'Attacker is now the network.',
      detail:
        'A $50 device broadcasts a fake SSID and routes all traffic through itself. Everything you do flows through the attacker.',
      why: 'You implicitly trust the network. The network does not deserve that trust.',
      mitigation: ['Treat every public network as hostile.', 'Use a reputable VPN when traveling.'],
      severity: 'high',
      successProb: 0.6,
    }),
    node('wf-vpn', 1, 3, 'Network', {
      kind: 'barrier',
      title: 'VPN tunnel',
      short: 'Encrypts traffic end-to-end.',
      detail:
        'A trustworthy VPN encrypts all packets before they reach the local network, neutralizing snooping at the access point.',
      why: 'VPNs don\u2019t protect against everything, but they reduce a hostile-network attack to noise.',
      mitigation: ['Use a paid, audited VPN — never a free one.', 'Enable kill-switch so traffic stops if the tunnel drops.'],
      severity: 'low',
    }),
    node('wf-sniff', 2, 1.5, 'Interception', {
      kind: 'attacker',
      title: 'Packet sniffing',
      short: 'Cleartext + cookies captured.',
      detail:
        'Any non-HTTPS traffic is plain text on the wire. Misconfigured sites and apps still leak cookies and tokens here.',
      why: 'TLS is ubiquitous but not universal. Old apps, IoT firmware, and lazy services still skip it.',
      mitigation: ['Check that every site is HTTPS before logging in.', 'Use modern browsers that enforce HTTPS by default.'],
      severity: 'medium',
    }),
    node('wf-https', 2, 3, 'Interception', {
      kind: 'barrier',
      title: 'HTTPS-only enforcement',
      short: 'Browser refuses to load HTTP.',
      detail:
        'Modern browsers default to HTTPS and block downgrade attempts. Cookies marked Secure never leave the encrypted tunnel.',
      why: 'Universal TLS is one of the great quiet wins of the last decade — it makes most cafe attacks pointless.',
      mitigation: ['Enable "HTTPS-only mode" in your browser.', 'Use HSTS-preloaded sites where possible.'],
      severity: 'low',
    }),
    node('wf-hijack', 3, 1.5, 'Compromise', {
      kind: 'compromised',
      title: 'Session hijacked',
      short: 'Attacker rides your live login.',
      detail:
        'With a stolen cookie, the attacker pastes it into their browser and impersonates you — no password needed.',
      why: 'Session theft sidesteps password and MFA entirely. Only revocation kicks the attacker out.',
      mitigation: ['Revoke active sessions if you suspect interception.', 'Use short-lived tokens / refresh policies.'],
      severity: 'critical',
    }),
    node('wf-impact-mail', 4, 0.7, 'Impact', {
      kind: 'compromised',
      title: 'Webmail open',
      short: 'Inbox readable from the cookie.',
      detail:
        'Most webmail services keep sessions alive for weeks. The attacker can read, search, and forward without re-auth.',
      why: 'Email access is the gateway to every reset flow.',
      mitigation: ['Force log-out across all devices after travel.', 'Shorten max session lifetime if your provider allows.'],
      severity: 'critical',
    }),
    node('wf-impact-work', 4, 2.3, 'Impact', {
      kind: 'compromised',
      title: 'Work SaaS access',
      short: 'Slack, Jira, Notion — all readable.',
      detail:
        'A hijacked browser cookie often grants single-sign-on access to every connected work tool.',
      why: 'SSO concentrates risk: one stolen session, dozens of apps.',
      mitigation: ['Require step-up auth for sensitive SaaS.', 'Enforce conditional access by location / device posture.'],
      severity: 'high',
    }),
    node('wf-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Revoke + change networks',
      short: 'Force re-auth and stop trusting cafes.',
      detail:
        'Revoke sessions, rotate passwords, switch to tethering or VPN. Treat the trip as compromised until proven otherwise.',
      why: 'You can\u2019t un-leak cookies — you can only invalidate them.',
      mitigation: ['Always-on VPN profile for travel.', 'Bookmark a "post-travel hygiene" checklist.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('wf-mistake', 'wf-rogue', { probability: 0.8 }),
    edge('wf-mistake', 'wf-vpn', { probability: 0.1, label: 'if VPN', variant: 'blocked' }),
    edge('wf-rogue', 'wf-sniff', { probability: 0.85 }),
    edge('wf-rogue', 'wf-https', { probability: 0.05, label: 'if HTTPS-only', variant: 'blocked' }),
    edge('wf-sniff', 'wf-hijack', { probability: 0.4 }),
    edge('wf-hijack', 'wf-impact-mail', { probability: 0.85, variant: 'impact' }),
    edge('wf-hijack', 'wf-impact-work', { probability: 0.7, variant: 'impact' }),
    edge('wf-impact-mail', 'wf-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'public-wifi',
    title: 'Untrusted public Wi-Fi',
    tagline: 'When the network is the attacker.',
    description:
      'A rogue access point in a cafe or airport snoops cleartext traffic, intercepts cookies, and hijacks live sessions on misconfigured sites.',
    iconKey: 'wifi',
    nodes,
    edges,
    phases,
    path: ['wf-mistake', 'wf-rogue', 'wf-sniff', 'wf-hijack', 'wf-impact-mail'],
    stageLabels: [
      'Joins open Wi-Fi',
      'Rogue AP intercepts',
      'Traffic sniffed',
      'Session stolen',
      'Inbox readable',
    ],
  };
})();

/* ============================================================
 * 4.  Creator SIM swap
 * ============================================================ */
const simSwap: Scenario = (() => {
  const phases = phasesFrom([
    'Recon',
    'Social engineer',
    'SIM control',
    'Account reset',
    'Impact',
    'Recovery',
  ]);

  const nodes: AttackNode[] = [
    node('ss-leak', 0, 1.5, 'Recon', {
      kind: 'vulnerability',
      title: 'Public email & phone',
      short: 'Listed in bio, contact, business records.',
      detail:
        'Creators advertise contact info by necessity. Attackers harvest it from bios, sponsor decks, and registrar records.',
      why: 'High-follower accounts are profitable targets. Recon is trivial; the attacker can pick their moment.',
      mitigation: ['Use a dedicated business email separate from personal.', 'Publish a VOIP number, not your carrier SIM.'],
      severity: 'medium',
    }),
    node('ss-social', 1, 1.5, 'Social engineer', {
      kind: 'attacker',
      title: 'Telco social engineering',
      short: 'Calls support pretending to be you.',
      detail:
        'A confident attacker with a few personal details (DOB, last 4 of SSN, recent addresses) can convince a call-center rep to port the SIM.',
      why: 'Carriers train reps to be helpful, not paranoid. Insider help and bribery accelerate this further.',
      mitigation: ['Set a carrier-side PIN / passcode.', 'Enable port-out protection at your carrier.'],
      severity: 'high',
      successProb: 0.45,
    }),
    node('ss-pin', 1, 3, 'Social engineer', {
      kind: 'barrier',
      title: 'Carrier port-out PIN',
      short: 'No PIN, no port. Full stop.',
      detail: 'Every major carrier supports a port-out PIN. Set it once and SIM swaps become drastically harder.',
      why: 'The single most underused 5-minute fix in personal security.',
      mitigation: ['Call your carrier today and add a port-out PIN.', 'Avoid reusing your bank PIN.'],
      severity: 'low',
    }),
    node('ss-swap', 2, 1.5, 'SIM control', {
      kind: 'compromised',
      title: 'SIM ported to attacker',
      short: 'Your phone shows "No Service".',
      detail:
        'The attacker\u2019s phone now receives every text — including SMS 2FA codes — while your phone goes dark.',
      why: 'SMS 2FA is widely available but structurally weak. This is exactly why.',
      mitigation: ['Move 2FA off SMS to TOTP apps or hardware keys.', 'Store backup codes offline.'],
      severity: 'critical',
    }),
    node('ss-reset', 3, 1.5, 'Account reset', {
      kind: 'attacker',
      title: 'Resets email password',
      short: 'SMS code arrives — to them.',
      detail:
        'With SMS in hand, the attacker triggers password resets on email and major platforms. Each verification text routes to them.',
      why: 'This is the moment the chain wins. Within minutes the attacker controls your primary identity.',
      mitigation: ['Use TOTP for email recovery, not SMS.'],
      severity: 'critical',
    }),
    node('ss-impact-channel', 4, 0.3, 'Impact', {
      kind: 'compromised',
      title: 'Channel hijacked',
      short: 'YouTube / Twitch / X taken over.',
      detail: 'The attacker livestreams a crypto scam to your audience, posts a pinned scam link, and changes the handle.',
      why: 'Audience trust is the most valuable asset a creator owns — and the hardest to rebuild.',
      mitigation: ['Pre-document creator-support paths for each platform.', 'Keep a recovery email separate from the public one.'],
      severity: 'critical',
    }),
    node('ss-impact-monetize', 4, 1.5, 'Impact', {
      kind: 'compromised',
      title: 'Payout account changed',
      short: 'AdSense / Stripe / Patreon redirected.',
      detail: 'Even a few hours of redirected payouts can drain a month of revenue before the bank reverses anything.',
      why: 'Money in motion is hard to claw back, especially across borders.',
      mitigation: ['Require step-up auth to change payout details.', 'Set bank-side alerts on any payout account.'],
      severity: 'critical',
    }),
    node('ss-impact-sponsor', 4, 2.7, 'Impact', {
      kind: 'compromised',
      title: 'Sponsor relationships',
      short: 'Scam DMs sent to your partners.',
      detail: 'Partner managers receive fake invoices and "urgent" payment requests over established channels.',
      why: 'B2B fraud often succeeds on attacker confidence alone — the relationship pre-exists.',
      mitigation: ['Agree on a verification code with each sponsor.', 'Use shared docs, not DMs, for sensitive details.'],
      severity: 'high',
    }),
    node('ss-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Creator support path',
      short: 'Escalate via partner / MCN channels.',
      detail:
        'Big platforms have priority recovery for verified / partner accounts. Knowing the path before you need it cuts hours off response time.',
      why: 'Time is the enemy during a takeover. Pre-built playbooks shrink the damage window.',
      mitigation: ['Write a personal incident-response doc.', 'Keep contact info for your MCN / partner manager handy.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('ss-leak', 'ss-social', { probability: 0.7 }),
    edge('ss-social', 'ss-swap', { probability: 0.45 }),
    edge('ss-social', 'ss-pin', { probability: 0.1, label: 'if PIN set', variant: 'blocked' }),
    edge('ss-swap', 'ss-reset', { probability: 0.9 }),
    edge('ss-reset', 'ss-impact-channel', { probability: 0.95, variant: 'impact' }),
    edge('ss-reset', 'ss-impact-monetize', { probability: 0.85, variant: 'impact' }),
    edge('ss-reset', 'ss-impact-sponsor', { probability: 0.7, variant: 'impact' }),
    edge('ss-impact-channel', 'ss-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'sim-swap',
    title: 'Creator SIM swap',
    tagline: 'When SMS 2FA becomes the attack vector.',
    description:
      'A leaked email + a social-engineered telco rep is all it takes to seize a creator account worth six figures. SMS-based 2FA is the linchpin.',
    iconKey: 'star',
    nodes,
    edges,
    phases,
    path: ['ss-leak', 'ss-social', 'ss-swap', 'ss-reset', 'ss-impact-channel'],
    stageLabels: [
      'Contact info found',
      'Telco tricked',
      'SIM ported',
      'Resets triggered',
      'Channel hijacked',
    ],
  };
})();

/* ============================================================
 * 5.  Gamer chain (Steam → Discord → email)
 * ============================================================ */
const gamerChain: Scenario = (() => {
  const phases = phasesFrom([
    'Weak credential',
    'Reuse spread',
    'Account takeover',
    'Email pivot',
    'Impact',
    'Recovery',
  ]);

  const nodes: AttackNode[] = [
    node('g-weak', 0, 1.5, 'Weak credential', {
      kind: 'mistake',
      title: 'Weak Steam password',
      short: '"steam1234" — predictable, 8 chars.',
      detail: 'Short, common, dictionary-derived. Crackable offline in seconds; brute-forceable in days against rate-limited login.',
      why: 'Gaming accounts hold real money (skins, items, payment methods). They\u2019re high-traffic targets.',
      mitigation: ['Use a 16+ character generated password.', 'Enable Steam Guard mobile authenticator.'],
      severity: 'high',
    }),
    node('g-reuse', 1, 1.5, 'Reuse spread', {
      kind: 'mistake',
      title: 'Same on Discord',
      short: 'Identical password reused.',
      detail: 'Once Steam is breached or guessed, the same string unlocks Discord. Most people don\u2019t realize the link until it\u2019s too late.',
      why: 'This is the textbook weakest-link pattern: one cracked credential, many open doors.',
      mitigation: ['Unique password per account — always.', 'Use a password manager.'],
      severity: 'high',
    }),
    node('g-2fa', 1, 3, 'Reuse spread', {
      kind: 'barrier',
      title: 'Steam Guard + Discord 2FA',
      short: 'Blocks both takeovers cold.',
      detail: 'Even with the right password, a second factor stops 99% of automated takeovers on gaming platforms.',
      why: 'Both services support free TOTP. There is no excuse to leave it off.',
      mitigation: ['Turn on Steam Guard right now.', 'Add 2FA in Discord settings.'],
      severity: 'low',
    }),
    node('g-breach', 2, 1.5, 'Account takeover', {
      kind: 'attacker',
      title: 'Account takeover',
      short: 'Steam + Discord both fall.',
      detail: 'Attacker drains in-game items, scams your friends list on Discord, pivots to find your email address.',
      why: 'Friends-list scams convert highly — the message comes from someone the victim already trusts.',
      mitigation: ['Enable Steam Guard + Discord 2FA right now.', 'Warn friends if any account looks off.'],
      severity: 'high',
      successProb: 0.65,
    }),
    node('g-email', 3, 1.5, 'Email pivot', {
      kind: 'vulnerability',
      title: 'Email visible in profile',
      short: 'Same address used to register both.',
      detail: 'With the email in hand, the attacker tries the same password on the inbox. Many people use it there too.',
      why: 'Email reuse closes the loop. Now resets work on anything you ever signed up for.',
      mitigation: ['Use a stronger, unique password on email than anywhere else.'],
      severity: 'high',
    }),
    node('g-takeover', 4, 0.7, 'Impact', {
      kind: 'compromised',
      title: 'Inbox + everything linked',
      short: 'Bank, social, shopping, more.',
      detail: 'No matter where the chain starts, the inbox is the prize. From here every connected service is reachable.',
      why: 'Treat your primary email as the most critical account you have.',
      mitigation: ['Add 2FA, recovery codes, and a backup email.', 'Audit OAuth-connected apps.'],
      severity: 'critical',
    }),
    node('g-impact-payments', 4, 2.3, 'Impact', {
      kind: 'compromised',
      title: 'Stored payment methods',
      short: 'Saved cards used in-game and out.',
      detail: 'Steam, Discord Nitro, and linked merchants often keep cards on file. The attacker spends them before you notice.',
      why: 'Chargebacks help — but disputes take weeks and not all platforms cooperate.',
      mitigation: ['Remove stored cards from gaming accounts.', 'Use prepaid / virtual cards for online purchases.'],
      severity: 'high',
    }),
    node('g-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Lock it down everywhere',
      short: 'Reset, 2FA, audit linked apps.',
      detail: 'Rotate every password, enable 2FA, revoke active sessions, audit linked OAuth apps, and remove stored payment methods.',
      why: 'A gaming-account takeover almost always reveals worse hygiene underneath. Fix it during cleanup.',
      mitigation: ['Adopt a password manager.', 'Enable phishing-resistant 2FA where supported.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('g-weak', 'g-reuse', { probability: 0.9 }),
    edge('g-reuse', 'g-breach', { probability: 0.7 }),
    edge('g-reuse', 'g-2fa', { probability: 0.05, label: 'if 2FA', variant: 'blocked' }),
    edge('g-breach', 'g-email', { probability: 0.8 }),
    edge('g-email', 'g-takeover', { probability: 0.6 }),
    edge('g-takeover', 'g-impact-payments', { probability: 0.8, variant: 'impact' }),
    edge('g-takeover', 'g-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'gamer-chain',
    title: 'Steam → Discord → Email',
    tagline: 'How a small leak takes out your whole gaming life.',
    description:
      'A weak Steam password plus the same one on Discord turns into an inbox compromise — and from there, everything you ever signed up with that email.',
    iconKey: 'gamepad',
    nodes,
    edges,
    phases,
    path: ['g-weak', 'g-reuse', 'g-breach', 'g-email', 'g-takeover'],
    stageLabels: [
      'Weak password set',
      'Reused on Discord',
      'Both accounts fall',
      'Email targeted',
      'Inbox compromised',
    ],
  };
})();

export const SCENARIOS: Scenario[] = [
  weakPassword,
  phishing,
  publicWifi,
  simSwap,
  gamerChain,
];

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}
