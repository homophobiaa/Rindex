/**
 * Attack-path scenarios — v2.
 *
 * Ten scenarios covering the most common real-world attack patterns.
 * Each scenario:
 *   • has a canonical simulation path
 *   • includes at least one barrier, one impact, and a recovery node
 *   • carries dashboard-integration metadata (recommendedFor, userTags)
 *   • maps clearly to v2 profiler factor IDs for personalized surfacing
 *
 * Layout grid: each lane is COL_W wide; NODE_X/NODE_Y give precise positions.
 */
import type { AttackEdge, AttackNode, EdgeVariant, Scenario, ScenarioPhase } from './types';

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

const COL_W = 300;
const COL_X = (i: number) => i * COL_W;
const NODE_X = (i: number) => COL_X(i) + 24;
const NODE_Y = (row: number) => row * 140;

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
  const phases = phasesFrom(['Habit', 'Exposure', 'Credential abuse', 'Inbox pivot', 'Impact fan-out', 'Recovery']);

  const nodes: AttackNode[] = [
    node('wp-mistake', 0, 1, 'Habit', {
      kind: 'mistake',
      title: 'Reuses one password',
      short: 'Same string across many sites.',
      detail: 'Most people reuse one password across dozens of accounts. A single leak turns it into a master key.',
      why: 'Attackers don’t need to crack you — they only need any site that lost your password.',
      mitigation: ['Use a password manager so every site gets a unique password.', 'Audit reuse with haveibeenpwned.com.'],
      severity: 'high',
    }),
    node('wp-breach', 1, 1, 'Exposure', {
      kind: 'vulnerability',
      title: 'Old data breach',
      short: 'Email + password in a public dump.',
      detail: 'Billions of credentials circulate in public corpora. If yours is in there, the attacker already has it.',
      why: 'Public breach data is the cheapest attack surface that exists.',
      mitigation: ['Check haveibeenpwned for every email you use.', 'Rotate any password used on a breached site.'],
      severity: 'high',
    }),
    node('wp-unique', 1, 2.4, 'Exposure', {
      kind: 'barrier',
      title: 'Unique passwords per site',
      short: 'Stops the chain at the source.',
      detail: 'If every account has its own password, a leak on one site never reaches another.',
      why: 'A password manager reduces blast radius from "everything" to "one minor account".',
      mitigation: ['Adopt 1Password, Bitwarden, or KeePass.'],
      severity: 'low',
    }),
    node('wp-stuff', 2, 1, 'Credential abuse', {
      kind: 'attacker',
      title: 'Credential stuffing',
      short: 'Bot replays the pair against major services.',
      detail: 'Attackers automate logins to Gmail, Instagram, Steam, banks using leaked pairs.',
      why: 'Even a 0.1% hit rate across millions of pairs = thousands of takeovers.',
      mitigation: ['Use a different password on email than anywhere else.'],
      severity: 'high',
      successProb: 0.7,
    }),
    node('wp-mfa', 2, 2.4, 'Credential abuse', {
      kind: 'barrier',
      title: 'Email 2FA enabled',
      short: 'Blocks stuffing even with the right password.',
      detail: '2FA on email stops credential stuffing — the attacker has the password but cannot produce the code.',
      why: 'Email is the recovery hub. Protecting it is the single highest-leverage control you have.',
      mitigation: ['Enable TOTP on email today.', 'Print backup codes and store them offline.'],
      severity: 'low',
    }),
    node('wp-email', 3, 1.7, 'Inbox pivot', {
      kind: 'compromised',
      title: 'Inbox access',
      short: 'Attacker is now logged in as you.',
      detail: 'With email access, the attacker can issue password resets on every linked account.',
      why: 'Your inbox is the keys to the kingdom.',
      mitigation: ['Add 2FA to email immediately.', 'Review active sessions and logged-in devices.'],
      severity: 'critical',
    }),
    node('wp-impact-reset', 4, 0.3, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Password reset hub',
      short: 'Every "forgot password" link works.',
      detail: 'The attacker walks through your inbox triggering resets on every service you ever signed up with.',
      why: 'A reset email is an unauthenticated identity proof.',
      mitigation: ['Use a separate recovery email for high-value accounts.'],
      severity: 'critical',
    }),
    node('wp-impact-social', 4, 1.5, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Social accounts pivoted',
      short: 'Instagram, X, TikTok — all reset.',
      detail: 'Your contacts get scam DMs from "you". Reputation damage stacks fast.',
      why: 'Friends-list scams are devastatingly effective — the message comes from a trusted sender.',
      mitigation: ['Warn followers via a second channel.'],
      severity: 'high',
    }),
    node('wp-impact-bank', 4, 2.7, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Banking & payment alerts',
      short: 'Card alerts, statements, transfers visible.',
      detail: 'Even read-only access reveals account numbers, balances, and timing for fraud.',
      why: 'You can’t un-leak this data.',
      mitigation: ['Route bank alerts to a dedicated, isolated email.'],
      severity: 'critical',
    }),
    node('wp-impact-cloud', 4, 3.9, 'Impact fan-out', {
      kind: 'compromised',
      title: 'Cloud storage access',
      short: 'Drive / iCloud / OneDrive open.',
      detail: 'Tax docs, ID scans, screenshots of recovery codes — anything you ever uploaded.',
      why: 'Cloud sync turns a single inbox into a filesystem-wide leak.',
      mitigation: ['Don’t store recovery codes or vault exports in cloud drives.'],
      severity: 'critical',
    }),
    node('wp-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Rotate, revoke, harden',
      short: 'Treat the takeover as a wake-up call.',
      detail: 'Regain access, force-logout every session, rotate all passwords, enable 2FA everywhere.',
      why: 'Recovery without hardening invites the next attack.',
      mitigation: ['Adopt a password manager.', 'Use phishing-resistant 2FA on high-value accounts.'],
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
    description: 'A breached password on a low-value site cascades through credential stuffing into your email — the master key that resets every other account.',
    iconKey: 'lock',
    nodes, edges, phases,
    path: ['wp-mistake', 'wp-breach', 'wp-stuff', 'wp-email', 'wp-impact-reset'],
    stageLabels: ['Bad habit forms', 'Credentials leak', 'Bot replays them', 'Inbox falls', 'Cascade begins'],
    recommendedFor: ['pw-reuse', 'pw-unique', 'pw-manager', 'mfa-none'],
    userTags: ['general'],
    recommendReason: 'Recommended because your profile shows password reuse or no dedicated password manager.',
  };
})();

/* ============================================================
 * 2.  Phishing & MFA fatigue
 * ============================================================ */
const phishing: Scenario = (() => {
  const phases = phasesFrom(['Bait', 'Click', 'Harvest', 'MFA bypass', 'Compromise', 'Recovery']);

  const nodes: AttackNode[] = [
    node('ph-email', 0, 1.5, 'Bait', {
      kind: 'attacker',
      title: 'Targeted phishing email',
      short: '"Your account will be locked in 24 h."',
      detail: 'A spoofed sender, urgent tone, and a believable login button. Modern kits clone real pages pixel-for-pixel.',
      why: 'Phishing remains the #1 initial-access vector.',
      mitigation: ['Hover links before clicking.', 'Type sensitive URLs by hand or use bookmarks.'],
      severity: 'high',
      successProb: 0.5,
    }),
    node('ph-mistake', 1, 1.5, 'Click', {
      kind: 'mistake',
      title: 'User clicks the link',
      short: 'Tired, distracted, looks legit.',
      detail: 'Most phishing victims aren’t careless — they’re busy. The brain pattern-matches on logo + tone.',
      why: 'No amount of training removes this risk fully. Passkeys and hardware keys are what actually work.',
      mitigation: ['Treat unexpected login links as suspicious by default.'],
      severity: 'medium',
    }),
    node('ph-page', 2, 1.5, 'Harvest', {
      kind: 'vulnerability',
      title: 'AiTM phishing page',
      short: 'Reverse-proxy steals credentials + session cookie.',
      detail: 'Tools like Evilginx proxy the real site, harvesting the live session cookie after sign-in.',
      why: 'Adversary-in-the-Middle defeats one-time codes because the legitimate site issued them.',
      mitigation: ['Use FIDO2 keys — bound to the real origin.'],
      severity: 'high',
    }),
    node('ph-mfa-fatigue', 3, 0.7, 'MFA bypass', {
      kind: 'attacker',
      title: 'MFA-fatigue spam',
      short: 'Dozens of push prompts until one is tapped.',
      detail: 'Attackers spam push-notification 2FA hoping the victim taps "approve" out of confusion.',
      why: 'This works far more often than expected. Several major breaches started exactly here.',
      mitigation: ['Use number-matching MFA, not blind approve/deny.'],
      severity: 'high',
      successProb: 0.4,
    }),
    node('ph-key', 3, 2.3, 'MFA bypass', {
      kind: 'barrier',
      title: 'Hardware security key',
      short: 'Origin-bound. Phishing page can’t use it.',
      detail: 'A YubiKey/passkey is bound to the real domain. The fake page cannot complete the WebAuthn challenge.',
      why: 'Phishing-resistant MFA is the single most effective control against credential phishing.',
      mitigation: ['Use passkeys on iCloud / Google.', 'Hardware key for high-value accounts.'],
      severity: 'low',
    }),
    node('ph-takeover', 4, 0.7, 'Compromise', {
      kind: 'compromised',
      title: 'Session cookie stolen',
      short: 'Attacker is now logged in as you.',
      detail: 'With the session cookie or an approved MFA prompt, the attacker rides your live session.',
      why: 'Session theft sidesteps password and MFA entirely.',
      mitigation: ['Revoke all sessions after suspected compromise.'],
      severity: 'critical',
    }),
    node('ph-impact-inbox', 4, 1.8, 'Compromise', {
      kind: 'compromised',
      title: 'Inbox & contacts',
      short: 'Coworkers/clients phished from your name.',
      detail: 'The attacker uses your real mailbox to phish your network.',
      why: 'Lateral phishing is one of the highest-conversion attack patterns.',
      mitigation: ['Notify contacts immediately.'],
      severity: 'critical',
    }),
    node('ph-impact-docs', 4, 3, 'Compromise', {
      kind: 'compromised',
      title: 'Shared docs exfiltrated',
      short: 'SharePoint / Drive / Notion exposed.',
      detail: 'A logged-in session can quietly download every doc the account has access to.',
      why: 'Most users have access to far more shared content than they realize.',
      mitigation: ['Apply least-privilege defaults to shared drives.'],
      severity: 'high',
    }),
    node('ph-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Revoke + rebuild trust',
      short: 'Sessions out, MFA re-enrolled, contacts warned.',
      detail: 'Force-revoke every session, rotate the password, re-enroll MFA on hardware, notify everyone.',
      why: 'Trust recovery takes longer than technical recovery.',
      mitigation: ['Move to passkeys before the next attack.'],
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
    description: 'Modern phishing skips the password entirely. It harvests a session token, then bombards you with MFA prompts until you tap "approve" out of habit.',
    iconKey: 'mail',
    nodes, edges, phases,
    path: ['ph-email', 'ph-mistake', 'ph-page', 'ph-mfa-fatigue', 'ph-takeover'],
    stageLabels: ['Bait arrives', 'Victim clicks', 'Credentials harvested', 'MFA approved', 'Session stolen'],
    recommendedFor: ['bhv-phishing', 'bhv-mfa-fatigue', 'mfa-hardware', 'mfa-none'],
    userTags: ['general', 'business', 'creator'],
    recommendReason: 'Recommended because your profile shows phishing susceptibility or no hardware-key MFA.',
  };
})();

/* ============================================================
 * 3.  Untrusted public Wi-Fi
 * ============================================================ */
const publicWifi: Scenario = (() => {
  const phases = phasesFrom(['Habit', 'Network', 'Interception', 'Compromise', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('wf-mistake', 0, 1.5, 'Habit', {
      kind: 'mistake',
      title: 'Connects to "Free Wi-Fi"',
      short: 'No password, no questions asked.',
      detail: 'Open networks named after the venue are trivial to spoof. Your laptop reconnects automatically next time.',
      why: 'You don’t see who else is on the network.',
      mitigation: ['Use mobile-hotspot tethering instead.', 'Disable auto-join on open networks.'],
      severity: 'medium',
    }),
    node('wf-rogue', 1, 1.5, 'Network', {
      kind: 'attacker',
      title: 'Rogue access point',
      short: 'Attacker is now the network.',
      detail: 'A $50 device broadcasts a fake SSID and routes all traffic through itself.',
      why: 'You implicitly trust the network. The network does not deserve that trust.',
      mitigation: ['Treat every public network as hostile.'],
      severity: 'high',
      successProb: 0.6,
    }),
    node('wf-vpn', 1, 3, 'Network', {
      kind: 'barrier',
      title: 'VPN tunnel',
      short: 'Encrypts traffic end-to-end.',
      detail: 'A trustworthy VPN encrypts all packets before they reach the local network.',
      why: 'VPNs reduce a hostile-network attack to noise.',
      mitigation: ['Use a paid, audited VPN.', 'Enable kill-switch.'],
      severity: 'low',
    }),
    node('wf-sniff', 2, 1.5, 'Interception', {
      kind: 'attacker',
      title: 'Packet sniffing',
      short: 'Cleartext + cookies captured.',
      detail: 'Non-HTTPS traffic is plain text. Misconfigured apps still leak cookies and tokens here.',
      why: 'Old apps and lazy services still skip TLS.',
      mitigation: ['Check every site is HTTPS before logging in.'],
      severity: 'medium',
    }),
    node('wf-https', 2, 3, 'Interception', {
      kind: 'barrier',
      title: 'HTTPS-only enforcement',
      short: 'Browser refuses to load HTTP.',
      detail: 'Modern browsers default to HTTPS and block downgrade attempts.',
      why: 'Universal TLS makes most café attacks pointless.',
      mitigation: ['Enable "HTTPS-only mode" in your browser.'],
      severity: 'low',
    }),
    node('wf-hijack', 3, 1.5, 'Compromise', {
      kind: 'compromised',
      title: 'Session hijacked',
      short: 'Attacker rides your live login.',
      detail: 'With a stolen cookie, the attacker impersonates you — no password needed.',
      why: 'Session theft sidesteps password and MFA entirely.',
      mitigation: ['Revoke active sessions if you suspect interception.'],
      severity: 'critical',
    }),
    node('wf-impact-mail', 4, 0.7, 'Impact', {
      kind: 'compromised',
      title: 'Webmail open',
      short: 'Inbox readable from the cookie.',
      detail: 'Most webmail services keep sessions alive for weeks.',
      why: 'Email access is the gateway to every reset flow.',
      mitigation: ['Force log-out across all devices after travel.'],
      severity: 'critical',
    }),
    node('wf-impact-work', 4, 2.3, 'Impact', {
      kind: 'compromised',
      title: 'Work SaaS access',
      short: 'Slack, Jira, Notion — all readable.',
      detail: 'A hijacked cookie often grants SSO access to every connected work tool.',
      why: 'SSO concentrates risk: one stolen session, dozens of apps.',
      mitigation: ['Enforce conditional access by device posture.'],
      severity: 'high',
    }),
    node('wf-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Revoke + change networks',
      short: 'Force re-auth and stop trusting cafés.',
      detail: 'Revoke sessions, rotate passwords, switch to tethering or VPN.',
      why: 'You can’t un-leak cookies — you can only invalidate them.',
      mitigation: ['Always-on VPN profile for travel.'],
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
    description: 'A rogue access point in a café or airport snoops cleartext traffic, intercepts cookies, and hijacks live sessions on misconfigured sites.',
    iconKey: 'wifi',
    nodes, edges, phases,
    path: ['wf-mistake', 'wf-rogue', 'wf-sniff', 'wf-hijack', 'wf-impact-mail'],
    stageLabels: ['Joins open Wi-Fi', 'Rogue AP intercepts', 'Traffic sniffed', 'Session stolen', 'Inbox readable'],
    recommendedFor: ['dev-wifi-open', 'dev-encrypted'],
    userTags: ['general', 'student', 'highExposure'],
    recommendReason: 'Recommended because your profile shows unprotected public Wi-Fi usage.',
  };
})();

/* ============================================================
 * 4.  Creator SIM swap
 * ============================================================ */
const simSwap: Scenario = (() => {
  const phases = phasesFrom(['Recon', 'Social engineer', 'SIM control', 'Account reset', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('ss-leak', 0, 1.5, 'Recon', {
      kind: 'vulnerability',
      title: 'Public email & phone',
      short: 'Listed in bio, contact, business records.',
      detail: 'Creators advertise contact info by necessity. Attackers harvest from bios and registrar records.',
      why: 'High-follower accounts are profitable targets. Recon is trivial.',
      mitigation: ['Use a dedicated business email.', 'Publish a VOIP number, not your carrier SIM.'],
      severity: 'medium',
    }),
    node('ss-social', 1, 1.5, 'Social engineer', {
      kind: 'attacker',
      title: 'Telco social engineering',
      short: 'Calls support pretending to be you.',
      detail: 'A confident attacker with a few personal details convinces a rep to port the SIM.',
      why: 'Carriers train reps to be helpful, not paranoid.',
      mitigation: ['Set a carrier-side PIN.', 'Enable port-out protection at your carrier.'],
      severity: 'high',
      successProb: 0.45,
    }),
    node('ss-pin', 1, 3, 'Social engineer', {
      kind: 'barrier',
      title: 'Carrier port-out PIN',
      short: 'No PIN, no port.',
      detail: 'Every major carrier supports a port-out PIN. SIM swaps become drastically harder.',
      why: 'The single most underused 5-minute fix in personal security.',
      mitigation: ['Call your carrier today and add a port-out PIN.'],
      severity: 'low',
    }),
    node('ss-swap', 2, 1.5, 'SIM control', {
      kind: 'compromised',
      title: 'SIM ported to attacker',
      short: 'Your phone shows "No Service".',
      detail: 'The attacker’s phone now receives every text — including SMS 2FA codes.',
      why: 'SMS 2FA is widely available but structurally weak.',
      mitigation: ['Move 2FA off SMS to TOTP apps or hardware keys.'],
      severity: 'critical',
    }),
    node('ss-reset', 3, 1.5, 'Account reset', {
      kind: 'attacker',
      title: 'Resets email password',
      short: 'SMS code arrives — to them.',
      detail: 'With SMS in hand, the attacker triggers password resets on email and major platforms.',
      why: 'Within minutes the attacker controls your primary identity.',
      mitigation: ['Use TOTP for email recovery, not SMS.'],
      severity: 'critical',
    }),
    node('ss-impact-channel', 4, 0.3, 'Impact', {
      kind: 'compromised',
      title: 'Channel hijacked',
      short: 'YouTube / Twitch / X taken over.',
      detail: 'The attacker livestreams a crypto scam to your audience.',
      why: 'Audience trust is the most valuable asset a creator owns.',
      mitigation: ['Pre-document creator-support paths for each platform.'],
      severity: 'critical',
    }),
    node('ss-impact-monetize', 4, 1.5, 'Impact', {
      kind: 'compromised',
      title: 'Payout account changed',
      short: 'AdSense / Stripe / Patreon redirected.',
      detail: 'Even a few hours of redirected payouts can drain a month of revenue.',
      why: 'Money in motion is hard to claw back.',
      mitigation: ['Require step-up auth to change payout details.'],
      severity: 'critical',
    }),
    node('ss-impact-sponsor', 4, 2.7, 'Impact', {
      kind: 'compromised',
      title: 'Sponsor relationships',
      short: 'Scam DMs sent to your partners.',
      detail: 'Partner managers receive fake invoices over established channels.',
      why: 'B2B fraud often succeeds on attacker confidence alone.',
      mitigation: ['Agree on a verification code with each sponsor.'],
      severity: 'high',
    }),
    node('ss-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Creator support path',
      short: 'Escalate via partner / MCN channels.',
      detail: 'Big platforms have priority recovery for verified accounts. Know the path before you need it.',
      why: 'Pre-built playbooks shrink the damage window.',
      mitigation: ['Write a personal incident-response doc.'],
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
    description: 'A leaked email + a social-engineered telco rep is all it takes to seize a creator account. SMS-based 2FA is the linchpin.',
    iconKey: 'star',
    nodes, edges, phases,
    path: ['ss-leak', 'ss-social', 'ss-swap', 'ss-reset', 'ss-impact-channel'],
    stageLabels: ['Contact info found', 'Telco tricked', 'SIM ported', 'Resets triggered', 'Channel hijacked'],
    recommendedFor: ['mfa-sms', 'rec-exposed-phone', 'exp-creator', 'exp-public-email'],
    userTags: ['creator', 'highExposure'],
    recommendReason: 'Recommended because your profile shows SMS-only 2FA or a publicly visible phone number.',
  };
})();

/* ============================================================
 * 5.  Gamer chain (Steam → Discord → email)
 * ============================================================ */
const gamerChain: Scenario = (() => {
  const phases = phasesFrom(['Weak credential', 'Reuse spread', 'Account takeover', 'Email pivot', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('g-weak', 0, 1.5, 'Weak credential', {
      kind: 'mistake',
      title: 'Weak Steam password',
      short: '"steam1234" — predictable, 8 chars.',
      detail: 'Short, common, dictionary-derived. Crackable offline in seconds.',
      why: 'Gaming accounts hold real money. They’re high-traffic targets.',
      mitigation: ['Use a 16+ character generated password.', 'Enable Steam Guard.'],
      severity: 'high',
    }),
    node('g-reuse', 1, 1.5, 'Reuse spread', {
      kind: 'mistake',
      title: 'Same on Discord',
      short: 'Identical password reused.',
      detail: 'Once Steam is breached, the same string unlocks Discord.',
      why: 'Textbook weakest-link pattern: one cracked credential, many open doors.',
      mitigation: ['Unique password per account — always.'],
      severity: 'high',
    }),
    node('g-2fa', 1, 3, 'Reuse spread', {
      kind: 'barrier',
      title: 'Steam Guard + Discord 2FA',
      short: 'Blocks both takeovers cold.',
      detail: 'Even with the right password, a second factor stops 99% of automated takeovers.',
      why: 'Both services support free TOTP.',
      mitigation: ['Turn on Steam Guard right now.', 'Add 2FA in Discord settings.'],
      severity: 'low',
    }),
    node('g-breach', 2, 1.5, 'Account takeover', {
      kind: 'attacker',
      title: 'Account takeover',
      short: 'Steam + Discord both fall.',
      detail: 'Attacker drains in-game items, scams your friends list, pivots to find your email.',
      why: 'Friends-list scams convert highly — the message comes from a trusted sender.',
      mitigation: ['Enable Steam Guard + Discord 2FA right now.'],
      severity: 'high',
      successProb: 0.65,
    }),
    node('g-email', 3, 1.5, 'Email pivot', {
      kind: 'vulnerability',
      title: 'Email visible in profile',
      short: 'Same address used to register both.',
      detail: 'With the email in hand, the attacker tries the same password on the inbox.',
      why: 'Email reuse closes the loop — resets work on anything you ever signed up for.',
      mitigation: ['Use a stronger, unique password on email than anywhere else.'],
      severity: 'high',
    }),
    node('g-takeover', 4, 0.7, 'Impact', {
      kind: 'compromised',
      title: 'Inbox + everything linked',
      short: 'Bank, social, shopping, more.',
      detail: 'No matter where the chain starts, the inbox is the prize.',
      why: 'Treat your primary email as the most critical account you have.',
      mitigation: ['Add 2FA, recovery codes, and a backup email.'],
      severity: 'critical',
    }),
    node('g-impact-payments', 4, 2.3, 'Impact', {
      kind: 'compromised',
      title: 'Stored payment methods',
      short: 'Saved cards used in-game and out.',
      detail: 'Steam, Discord Nitro, and linked merchants often keep cards on file.',
      why: 'Chargebacks help — but disputes take weeks.',
      mitigation: ['Remove stored cards from gaming accounts.'],
      severity: 'high',
    }),
    node('g-recovery', 5, 1.5, 'Recovery', {
      kind: 'recovery',
      title: 'Lock it down everywhere',
      short: 'Reset, 2FA, audit linked apps.',
      detail: 'Rotate every password, enable 2FA, revoke sessions, remove stored payment methods.',
      why: 'A gaming-account takeover almost always reveals worse hygiene underneath.',
      mitigation: ['Adopt a password manager.', 'Enable phishing-resistant 2FA.'],
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
    description: 'A weak Steam password plus the same one on Discord turns into an inbox compromise — and from there, everything you ever signed up with that email.',
    iconKey: 'gamepad',
    nodes, edges, phases,
    path: ['g-weak', 'g-reuse', 'g-breach', 'g-email', 'g-takeover'],
    stageLabels: ['Weak password set', 'Reused on Discord', 'Both accounts fall', 'Email targeted', 'Inbox compromised'],
    recommendedFor: ['pw-reuse', 'pw-weak', 'mfa-none', 'pw-manager'],
    userTags: ['gamer', 'student', 'general'],
    recommendReason: 'Recommended because your profile shows password reuse or weak passwords on gaming accounts.',
  };
})();

/* ============================================================
 * 6.  Creator / Instagram account takeover
 * ============================================================ */
const creatorTakeover: Scenario = (() => {
  const phases = phasesFrom(['Recon', 'Phish', 'Session steal', 'Account control', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('ct-profile', 0, 1.5, 'Recon', {
      kind: 'vulnerability',
      title: 'Public creator profile',
      short: 'Email in bio, DMs open, brand collab history visible.',
      detail: 'Creators publish contact details and partnership history publicly. Attackers craft personalised lures from this data.',
      why: 'A targeted lure is 3-5× more effective than a generic one.',
      mitigation: ['Use a business alias email for public contact.', 'Keep primary email off your bio.'],
      severity: 'medium',
    }),
    node('ct-lure', 1, 1.5, 'Phish', {
      kind: 'attacker',
      title: 'Fake brand collab email',
      short: '"We’d love to partner — sign the brief here."',
      detail: 'The email references your niche, mentions real brands, and includes a "brief" link — actually a fake Meta/Instagram login page.',
      why: 'Creators receive real collab pitches constantly. Spotting the fake requires extra vigilance.',
      mitigation: ['Verify sender domain carefully.', 'Never log into platforms via email links.'],
      severity: 'high',
      successProb: 0.55,
    }),
    node('ct-login', 2, 1.5, 'Session steal', {
      kind: 'attacker',
      title: 'Fake Meta login page',
      short: 'Cloned pixel-for-pixel from the real one.',
      detail: 'The phishing page proxies the real Meta login, capturing both credentials and the live session cookie simultaneously.',
      why: 'Session cookie theft bypasses 2FA — the attacker logs in without needing the code.',
      mitigation: ['Use a hardware key or passkey on Meta accounts.'],
      severity: 'high',
    }),
    node('ct-mfa-barrier', 2, 3, 'Session steal', {
      kind: 'barrier',
      title: 'Phishing-resistant MFA',
      short: 'Hardware key bound to the real origin.',
      detail: 'A FIDO2 key or passkey is cryptographically bound to the real meta.com domain. The phishing page cannot satisfy the challenge.',
      why: 'Origin-binding is the only reliable phishing defence.',
      mitigation: ['Enable passkeys on Instagram/Facebook.'],
      severity: 'low',
    }),
    node('ct-session', 3, 1.5, 'Account control', {
      kind: 'compromised',
      title: 'Session cookie stolen',
      short: 'Attacker is logged in as the creator.',
      detail: 'The attacker is now inside the creator’s account with full admin access — no further authentication needed.',
      why: 'Session theft is invisible to the victim until damage is done.',
      mitigation: ['Revoke all sessions via "Where you’re logged in".'],
      severity: 'critical',
    }),
    node('ct-email-change', 3, 3, 'Account control', {
      kind: 'attacker',
      title: 'Account email changed',
      short: 'Primary recovery email swapped out.',
      detail: 'First action inside: change the account email to the attacker’s — locking out the creator from recovery flows.',
      why: 'Changing the email is how attackers lock out the original owner permanently.',
      mitigation: ['Enable two-factor before any email-change request is processed.'],
      severity: 'critical',
    }),
    node('ct-impact-posts', 4, 0.5, 'Impact', {
      kind: 'compromised',
      title: 'Scam posts & stories',
      short: 'Crypto giveaway, fake affiliate links, malware.',
      detail: 'High-follower accounts become distribution channels for scams. Even 30 minutes of scam stories reaches thousands.',
      why: 'Followers trust the creator. Damage to the audience relationship is real and lasting.',
      mitigation: ['Warn followers via a separate channel immediately.'],
      severity: 'critical',
    }),
    node('ct-impact-audience', 4, 1.7, 'Impact', {
      kind: 'compromised',
      title: 'Followers targeted',
      short: 'DMs, tagged posts, fake giveaways.',
      detail: 'The attacker sends DMs to the followers list offering "prizes" that harvest their credentials or payments.',
      why: 'Trust from the creator relationship makes followers more likely to comply.',
      mitigation: ['Post publicly on other platforms to warn followers.'],
      severity: 'high',
    }),
    node('ct-impact-payout', 4, 2.9, 'Impact', {
      kind: 'compromised',
      title: 'Creator payout disrupted',
      short: 'Ad revenue, badges, brand deals at risk.',
      detail: 'Access to the creator dashboard lets the attacker redirect payout methods and exhaust brand-deal budgets.',
      why: 'Financial damage often exceeds reputational damage in creator attacks.',
      mitigation: ['Require step-up auth to change payout details.'],
      severity: 'critical',
    }),
    node('ct-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Meta support + rebranding',
      short: 'Escalate to verified-account support.',
      detail: 'Meta and Instagram have dedicated recovery for verified / high-follower accounts. Document everything — screenshot timestamps matter.',
      why: 'Platform support SLAs vary wildly. Having evidence accelerates recovery.',
      mitigation: ['Use passkeys before the next campaign.', 'Pre-save your platform support contact.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('ct-profile', 'ct-lure', { probability: 0.75, label: 'targeted lure' }),
    edge('ct-lure', 'ct-login', { probability: 0.55 }),
    edge('ct-login', 'ct-mfa-barrier', { probability: 0.05, label: 'if passkey', variant: 'blocked' }),
    edge('ct-login', 'ct-session', { probability: 0.85 }),
    edge('ct-session', 'ct-email-change', { probability: 0.9, variant: 'alt' }),
    edge('ct-session', 'ct-impact-posts', { probability: 0.95, variant: 'impact' }),
    edge('ct-session', 'ct-impact-audience', { probability: 0.85, variant: 'impact' }),
    edge('ct-session', 'ct-impact-payout', { probability: 0.7, variant: 'impact' }),
    edge('ct-impact-posts', 'ct-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'creator-takeover',
    title: 'Creator account takeover',
    tagline: 'Fake collab email → phishing page → locked out of your own channel.',
    description: 'Attackers target high-follower accounts with personalised brand-collab lures. A cloned Meta login page harvests the session cookie — no 2FA code needed.',
    iconKey: 'camera',
    nodes, edges, phases,
    path: ['ct-profile', 'ct-lure', 'ct-login', 'ct-session', 'ct-impact-posts'],
    stageLabels: ['Profile targeted', 'Fake collab sent', 'Login page cloned', 'Session stolen', 'Scam posted'],
    recommendedFor: ['exp-creator', 'exp-public-email', 'bhv-phishing', 'mfa-hardware'],
    userTags: ['creator', 'highExposure'],
    recommendReason: 'Recommended because your profile shows a public creator presence or public email address.',
  };
})();

/* ============================================================
 * 7.  E-commerce / small-business admin takeover
 * ============================================================ */
const ecommerceAdmin: Scenario = (() => {
  const phases = phasesFrom(['Credential exposure', 'Email access', 'Admin pivot', 'Customer data', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('ec-reuse', 0, 1.5, 'Credential exposure', {
      kind: 'mistake',
      title: 'Reused admin password',
      short: 'Same password on store + personal email.',
      detail: 'Store admin portals are high-value targets. Reusing the email password means a breach anywhere collapses the admin.',
      why: 'Admin credentials grant access to orders, customer data, and payment settings.',
      mitigation: ['Unique password on every admin console.', 'Use a password manager.'],
      severity: 'high',
    }),
    node('ec-breach', 0, 3, 'Credential exposure', {
      kind: 'vulnerability',
      title: 'Supplier / platform breach',
      short: 'Shopify app, dropshipping tool, or forum leaked.',
      detail: 'Third-party SaaS tools connected to the store often have weaker security than the store itself.',
      why: 'Supply-chain exposure is invisible until a breach surfaces in a dump.',
      mitigation: ['Audit connected apps regularly.', 'Rotate passwords when any connected service announces a breach.'],
      severity: 'medium',
    }),
    node('ec-barrier', 0, 4.5, 'Credential exposure', {
      kind: 'barrier',
      title: 'Unique admin password',
      short: 'Breach on one platform stays contained.',
      detail: 'If the admin password is unique, a leaked third-party credential cannot pivot to the store.',
      why: 'Containment starts with uniqueness.',
      mitigation: ['Generate a random 20+ character password for the admin login.'],
      severity: 'low',
    }),
    node('ec-email', 1, 1.5, 'Email access', {
      kind: 'compromised',
      title: 'Business inbox access',
      short: 'Orders, invoices, supplier comms visible.',
      detail: 'The business inbox contains every order confirmation, supplier relationship, and customer complaint — a goldmine for fraud.',
      why: 'Business email is even more valuable than personal because it carries financial authority.',
      mitigation: ['Add 2FA to the business email provider.'],
      severity: 'critical',
    }),
    node('ec-reset', 2, 1.5, 'Admin pivot', {
      kind: 'attacker',
      title: 'Password reset to store admin',
      short: 'Reset link lands in the compromised inbox.',
      detail: 'With email access, the attacker triggers a password reset for Shopify / WooCommerce / Stripe admin and walks straight in.',
      why: 'Email-based password reset is a single point of failure for most SaaS.',
      mitigation: ['Enable MFA on the store admin — not just email.'],
      severity: 'critical',
      successProb: 0.9,
    }),
    node('ec-admin', 3, 1.5, 'Admin pivot', {
      kind: 'compromised',
      title: 'Store admin panel',
      short: 'Full access: orders, customers, payouts.',
      detail: 'The attacker is inside the admin panel with owner-level permissions.',
      why: 'Admin access = read all customer data, change payout details, issue refunds, export lists.',
      mitigation: ['Enable IP allowlisting on admin access.'],
      severity: 'critical',
    }),
    node('ec-impact-orders', 4, 0.5, 'Customer data', {
      kind: 'compromised',
      title: 'Customer orders exposed',
      short: 'Names, addresses, purchase history.',
      detail: 'Every customer record — name, address, email, order history — is now in attacker hands.',
      why: 'Customer data exposure triggers GDPR/CCPA liability and notification requirements.',
      mitigation: ['Notify affected customers.', 'File a data-breach report if required.'],
      severity: 'critical',
    }),
    node('ec-impact-payout', 4, 1.8, 'Customer data', {
      kind: 'compromised',
      title: 'Payout details changed',
      short: 'Bank account / Stripe redirected to attacker.',
      detail: 'The attacker changes the store’s payout destination, draining revenue until the change is noticed.',
      why: 'Redirected payouts can continue for days before accounting catches it.',
      mitigation: ['Set bank-side alerts for any payout configuration change.'],
      severity: 'critical',
    }),
    node('ec-impact-fraud', 4, 3, 'Customer data', {
      kind: 'compromised',
      title: 'Fraudulent refunds / gift cards',
      short: 'Attacker issues refunds to their own payment method.',
      detail: 'Admin access lets the attacker issue refunds to an attacker-controlled card or generate gift codes.',
      why: 'Gift-card fraud is fast, hard to trace, and difficult to reverse.',
      mitigation: ['Enable step-up auth for refunds above a threshold.'],
      severity: 'high',
    }),
    node('ec-recovery', 5, 1.8, 'Recovery', {
      kind: 'recovery',
      title: 'Rotate, notify, rebuild access',
      short: 'New credentials, MFA, customer notifications.',
      detail: 'Rotate all admin passwords, enable MFA everywhere, notify affected customers, contact Stripe/bank to reverse fraudulent payouts.',
      why: 'Business recovery has legal components that personal recovery does not.',
      mitigation: ['MFA + IP allowlist on all admin consoles.', 'Quarterly access audits.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('ec-reuse', 'ec-breach', { probability: 0.7, label: 'reuse exploited' }),
    edge('ec-reuse', 'ec-barrier', { probability: 0.1, label: 'if unique', variant: 'blocked' }),
    edge('ec-breach', 'ec-email', { probability: 0.8 }),
    edge('ec-email', 'ec-reset', { probability: 0.9 }),
    edge('ec-reset', 'ec-admin', { probability: 0.9 }),
    edge('ec-admin', 'ec-impact-orders', { probability: 0.95, variant: 'impact' }),
    edge('ec-admin', 'ec-impact-payout', { probability: 0.85, variant: 'impact' }),
    edge('ec-admin', 'ec-impact-fraud', { probability: 0.7, variant: 'impact' }),
    edge('ec-impact-orders', 'ec-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'ecommerce-admin',
    title: 'E-commerce admin takeover',
    tagline: 'Reused admin password → inbox → store admin → customer data.',
    description: 'A reused password on a third-party tool leaks to an attacker who pivots through business email to the store admin, redirecting payouts and exporting customer records.',
    iconKey: 'store',
    nodes, edges, phases,
    path: ['ec-reuse', 'ec-breach', 'ec-email', 'ec-reset', 'ec-admin'],
    stageLabels: ['Password reused', 'Third-party breach', 'Inbox access', 'Admin reset', 'Full control'],
    recommendedFor: ['pw-reuse', 'rec-weak-email', 'exp-creator', 'mfa-none'],
    userTags: ['business', 'creator'],
    recommendReason: 'Recommended because your profile shows a business presence combined with password reuse or weak recovery.',
  };
})();

/* ============================================================
 * 8.  Stolen device / browser password dump
 * ============================================================ */
const browserPasswordDump: Scenario = (() => {
  const phases = phasesFrom(['Device habit', 'Physical access', 'Password harvest', 'Account access', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('bd-habit', 0, 1.5, 'Device habit', {
      kind: 'mistake',
      title: 'Browser-saved passwords + weak lock',
      short: 'Chrome profile open, PIN is "1234".',
      detail: 'Browser-saved credentials are accessible to anyone who can open the browser profile. A weak or absent device lock makes this trivial.',
      why: 'Browser saved passwords are only as secure as the device itself.',
      mitigation: ['Enable full-disk encryption.', 'Use a strong device passcode, not a 4-digit PIN.'],
      severity: 'high',
    }),
    node('bd-theft', 1, 1.5, 'Physical access', {
      kind: 'attacker',
      title: 'Device stolen or briefly unattended',
      short: 'Laptop left in a café, bag snatched.',
      detail: 'Physical access is all that’s needed. A thief doesn’t need to know your password — the browser remembers it for them.',
      why: 'Opportunistic theft is common. Most people underestimate how fast an attacker can act.',
      mitigation: ['Never leave your device unattended in public.'],
      severity: 'high',
      successProb: 0.7,
    }),
    node('bd-encryption', 1, 3.2, 'Physical access', {
      kind: 'barrier',
      title: 'Device encryption + strong passcode',
      short: 'Stolen device stays sealed.',
      detail: 'Full-disk encryption (FileVault, BitLocker) with a strong passcode means a stolen device is a paperweight.',
      why: 'Encryption + passcode is the most impactful device security control you can take.',
      mitigation: ['Enable FileVault (Mac), BitLocker (Windows), or verify default-on (iOS/Android).'],
      severity: 'low',
    }),
    node('bd-browser', 2, 1.5, 'Password harvest', {
      kind: 'attacker',
      title: 'Browser profile opened',
      short: 'Chrome, Safari, Edge — all synced.',
      detail: 'With the device unlocked, the attacker opens the browser and navigates to chrome://settings/passwords or uses export tools.',
      why: 'Browser password stores are plaintext-accessible to any logged-in user.',
      mitigation: ['Use a dedicated password manager with its own master password, not browser saves.'],
      severity: 'high',
    }),
    node('bd-passwords', 2, 3, 'Password harvest', {
      kind: 'compromised',
      title: 'Saved passwords extracted',
      short: 'Full list of sites + credentials downloaded.',
      detail: 'The attacker exports hundreds of saved credentials in seconds — email, banking, shopping, work tools.',
      why: 'Browser export is a feature, not a bug. It’s trivially fast.',
      mitigation: ['Switch to Bitwarden or 1Password — both require a master password on every device.'],
      severity: 'critical',
    }),
    node('bd-sessions', 3, 0.5, 'Account access', {
      kind: 'vulnerability',
      title: 'Active session cookies',
      short: 'Already logged in — no password needed.',
      detail: 'Active sessions on Gmail, Slack, banking — the browser is already authenticated.',
      why: 'Sessions bypass passwords entirely.',
      mitigation: ['Set short session timeouts on high-value apps.'],
      severity: 'critical',
    }),
    node('bd-email', 3, 2, 'Account access', {
      kind: 'compromised',
      title: 'Email account accessed',
      short: 'Inbox open via saved password or session.',
      detail: 'Email gives the attacker a password-reset hub for every connected service.',
      why: 'Every service trusts email-based reset. Email access = all access.',
      mitigation: ['Log out of email when leaving devices unattended.'],
      severity: 'critical',
    }),
    node('bd-impact-bank', 4, 0.5, 'Impact', {
      kind: 'compromised',
      title: 'Banking accounts opened',
      short: 'Saved passwords bypass the login page.',
      detail: 'Saved bank credentials give instant access without any phishing or social engineering.',
      why: 'Financial accounts are the highest-priority target for any attacker with device access.',
      mitigation: ['Never save banking passwords in the browser.'],
      severity: 'critical',
    }),
    node('bd-impact-work', 4, 1.8, 'Impact', {
      kind: 'compromised',
      title: 'Work accounts compromised',
      short: 'Slack, GitHub, internal tools.',
      detail: 'Saved work credentials — Slack, GitHub, cloud consoles — open lateral paths through the organisation.',
      why: 'Personal device access often means organisational access.',
      mitigation: ['Use company-managed credentials separate from browser saves.'],
      severity: 'high',
    }),
    node('bd-impact-identity', 4, 3, 'Impact', {
      kind: 'compromised',
      title: 'Identity documents uploaded',
      short: 'Passport, ID, tax files in Downloads.',
      detail: 'Device access reveals local files: ID scans, tax returns, contracts — material for identity fraud.',
      why: 'Identity fraud can persist for years after the initial incident.',
      mitigation: ['Encrypt sensitive local files.', 'Don’t leave ID scans in Downloads.'],
      severity: 'critical',
    }),
    node('bd-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Remote wipe + account rotation',
      short: 'Wipe device, rotate all passwords, check sessions.',
      detail: 'Trigger remote wipe immediately. Then rotate every saved password and revoke active sessions across all devices.',
      why: 'You cannot recover from credential exposure without rotating everything.',
      mitigation: ['Enable Find My / remote wipe before you need it.', 'Migrate to a dedicated password manager.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('bd-habit', 'bd-theft', { probability: 0.7, label: 'opportunistic' }),
    edge('bd-theft', 'bd-encryption', { probability: 0.08, label: 'if encrypted', variant: 'blocked' }),
    edge('bd-theft', 'bd-browser', { probability: 0.85 }),
    edge('bd-browser', 'bd-passwords', { probability: 0.9 }),
    edge('bd-browser', 'bd-sessions', { probability: 0.95, label: 'active sessions', variant: 'alt' }),
    edge('bd-passwords', 'bd-email', { probability: 0.85 }),
    edge('bd-sessions', 'bd-email', { probability: 0.9, variant: 'alt' }),
    edge('bd-email', 'bd-impact-bank', { probability: 0.8, variant: 'impact' }),
    edge('bd-email', 'bd-impact-work', { probability: 0.7, variant: 'impact' }),
    edge('bd-email', 'bd-impact-identity', { probability: 0.6, variant: 'impact' }),
    edge('bd-impact-bank', 'bd-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'browser-password-dump',
    title: 'Stolen device + browser passwords',
    tagline: 'An unlocked laptop is a full credential dump waiting to happen.',
    description: 'Physical access to a weakly-locked device with browser-saved passwords lets an attacker export hundreds of credentials in minutes — no phishing required.',
    iconKey: 'laptop',
    nodes, edges, phases,
    path: ['bd-habit', 'bd-theft', 'bd-browser', 'bd-passwords', 'bd-email'],
    stageLabels: ['Weak lock identified', 'Device accessed', 'Browser opened', 'Passwords exported', 'Accounts opened'],
    recommendedFor: ['pw-browser-only', 'dev-no-lock', 'dev-encrypted', 'mfa-none'],
    userTags: ['general', 'student', 'business'],
    recommendReason: 'Recommended because your profile shows browser-saved passwords or a device without strong encryption.',
  };
})();

/* ============================================================
 * 9.  AI voice / family emergency scam
 * ============================================================ */
const voiceScam: Scenario = (() => {
  const phases = phasesFrom(['Recon', 'Voice clone', 'Pressure', 'Compliance', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('vs-content', 0, 1.5, 'Recon', {
      kind: 'vulnerability',
      title: 'Public voice & video content',
      short: 'YouTube, TikTok, Instagram Reels — hours of audio.',
      detail: 'A few minutes of public video is enough for modern AI to clone a voice with high accuracy.',
      why: 'Voice cloning tools are free, fast, and convincing. The raw material is publicly available.',
      mitigation: ['Limit the public availability of long-form personal audio/video.'],
      severity: 'medium',
    }),
    node('vs-clone', 1, 1.5, 'Voice clone', {
      kind: 'attacker',
      title: 'AI voice cloning',
      short: 'Attacker generates a convincing voice clone.',
      detail: 'Using 30–60 seconds of target audio, tools like ElevenLabs produce a clone indistinguishable to family members.',
      why: 'Victims don’t need to be fooled into clicking — they need to be convinced audibly in real time.',
      mitigation: ['Establish a family code word for emergencies.'],
      severity: 'high',
      successProb: 0.6,
    }),
    node('vs-awareness', 1, 3, 'Voice clone', {
      kind: 'barrier',
      title: 'Family emergency code word',
      short: 'Pre-agreed signal that only real family knows.',
      detail: 'A secret phrase known only to trusted contacts is the single most effective defence against voice-based impersonation.',
      why: 'AI can clone voice and tone but cannot know an unpublished family code.',
      mitigation: ['Agree on a code word with immediate family today.'],
      severity: 'low',
    }),
    node('vs-call', 2, 1.5, 'Pressure', {
      kind: 'attacker',
      title: 'Fake emergency call',
      short: '"I’m in an accident — I need money NOW."',
      detail: 'The cloned-voice call combines urgency ("accident / arrested / hospital"), authority ("lawyer / police on the line"), and isolation ("don’t tell anyone").',
      why: 'Cognitive overload under emotional stress bypasses normal scepticism.',
      mitigation: ['Always hang up and call the real person back on their known number.'],
      severity: 'high',
    }),
    node('vs-pressure', 3, 1.5, 'Compliance', {
      kind: 'mistake',
      title: 'Victim acts under pressure',
      short: 'Fear + urgency = bypassed critical thinking.',
      detail: 'Victims know something feels off — but the emotional reality of hearing a loved one’s voice in distress overrides scepticism.',
      why: 'This is a psychological attack, not a technical one. Defences must be social too.',
      mitigation: ['Hang up. Call the real person directly. Always.', 'Establish family panic protocols before you need them.'],
      severity: 'medium',
    }),
    node('vs-payment', 4, 0.5, 'Impact', {
      kind: 'compromised',
      title: 'Wire transfer or gift cards sent',
      short: 'Funds sent to attacker-controlled account.',
      detail: 'Victims send money via wire, crypto, or gift-card codes. These are essentially irreversible.',
      why: 'Gift-card and wire fraud is the fastest-growing financial crime vector.',
      mitigation: ['Banks now verify large unusual transfers — cooperate with delay requests.'],
      severity: 'critical',
    }),
    node('vs-codes', 4, 1.8, 'Impact', {
      kind: 'compromised',
      title: 'Account codes handed over',
      short: 'OTP, verification code, or password shared by phone.',
      detail: 'Under pressure, victims may read aloud SMS codes or passwords the attacker requested "to verify their identity".',
      why: 'Account code extraction is a natural second objective once voice trust is established.',
      mitigation: ['Never share codes or passwords over the phone — no legitimate service asks for this.'],
      severity: 'high',
    }),
    node('vs-impact-financial', 4, 3, 'Impact', {
      kind: 'compromised',
      title: 'Financial loss',
      short: 'Wired or transferred funds unrecoverable.',
      detail: 'Average losses from AI voice scams are in the thousands. Older victims and business owners are disproportionately targeted.',
      why: 'There is no technical control that recovers sent funds. Prevention is the only option.',
      mitigation: ['Contact your bank immediately to initiate a recall.'],
      severity: 'critical',
    }),
    node('vs-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Report + freeze + code word',
      short: 'File reports, freeze accounts, set family protocol.',
      detail: 'Report to FTC/Action Fraud, freeze accounts if codes were shared, and establish the family code word to prevent recurrence.',
      why: 'Reporting creates a paper trail that helps banks recover funds faster.',
      mitigation: ['ftc.gov/reportfraud (US) / actionfraud.police.uk (UK).', 'Agree on a family code word today.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('vs-content', 'vs-clone', { probability: 0.7, label: 'audio harvested' }),
    edge('vs-clone', 'vs-awareness', { probability: 0.05, label: 'if code word', variant: 'blocked' }),
    edge('vs-clone', 'vs-call', { probability: 0.8 }),
    edge('vs-call', 'vs-pressure', { probability: 0.6 }),
    edge('vs-pressure', 'vs-payment', { probability: 0.55 }),
    edge('vs-pressure', 'vs-codes', { probability: 0.4, variant: 'alt' }),
    edge('vs-payment', 'vs-impact-financial', { probability: 0.95, variant: 'impact' }),
    edge('vs-codes', 'vs-impact-financial', { probability: 0.6, variant: 'impact' }),
    edge('vs-impact-financial', 'vs-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'voice-scam',
    title: 'AI voice emergency scam',
    tagline: '"I’m in an accident — send money" — except it wasn’t them.',
    description: 'Public video content feeds an AI voice clone. A fake emergency call combines the cloned voice with urgency pressure, extracting payments or account codes from a panicking family member.',
    iconKey: 'phone',
    nodes, edges, phases,
    path: ['vs-content', 'vs-clone', 'vs-call', 'vs-pressure', 'vs-payment'],
    stageLabels: ['Audio harvested', 'Voice cloned', 'Fake call made', 'Victim pressured', 'Funds sent'],
    recommendedFor: ['exp-public-info', 'exp-creator', 'bhv-oversharing', 'bhv-phishing'],
    userTags: ['creator', 'highExposure', 'general'],
    recommendReason: 'Recommended because your profile shows public personal content or social oversharing.',
  };
})();

/* ============================================================
 * 10.  Discord token / OAuth grabber
 * ============================================================ */
const discordTokenGrab: Scenario = (() => {
  const phases = phasesFrom(['Lure', 'Token theft', 'Account pivot', 'Friends network', 'Impact', 'Recovery']);

  const nodes: AttackNode[] = [
    node('dt-nitro', 0, 1.5, 'Lure', {
      kind: 'attacker',
      title: 'Fake Nitro / Steam trade offer',
      short: '"Free Nitro — claim here" or fake Steam trade link.',
      detail: 'High-conversion lures in gaming communities: fake Nitro giveaways, suspicious Steam trade offers, or "test my game" links that run a token grabber.',
      why: 'Gaming communities are high-trust environments where these links circulate constantly.',
      mitigation: ['Never click Nitro or Steam links from unknown senders.', 'Free Nitro does not exist.'],
      severity: 'high',
    }),
    node('dt-grabber', 1, 1.5, 'Token theft', {
      kind: 'attacker',
      title: 'Token grabber / malware',
      short: 'Discord auth token extracted from browser storage.',
      detail: 'Malicious links or executables silently extract the Discord user token from LocalStorage/app files — no password or 2FA needed.',
      why: 'Discord tokens provide full account access without any re-authentication.',
      mitigation: ['Run executables only from trusted, verified sources.', 'Use endpoint protection.'],
      severity: 'high',
      successProb: 0.75,
    }),
    node('dt-2fa-barrier', 1, 3.2, 'Token theft', {
      kind: 'barrier',
      title: '2FA on account change actions',
      short: 'Email changes require 2FA verification.',
      detail: 'Discord requires 2FA for sensitive account changes — but a stolen token still grants access to DMs and servers without triggering this.',
      why: '2FA is partial protection: it limits damage but doesn’t stop token-based takeover.',
      mitigation: ['Enable 2FA on Discord AND set email verification for account changes.'],
      severity: 'medium',
    }),
    node('dt-takeover', 2, 1.5, 'Account pivot', {
      kind: 'compromised',
      title: 'Discord account access',
      short: 'Attacker is logged in as you via token.',
      detail: 'The stolen token gives full account access: DMs, server memberships, connected apps, Nitro status.',
      why: 'Token-based access bypasses 2FA entirely — the attacker uses the token, not the password.',
      mitigation: ['Log out of Discord everywhere and re-login to invalidate the stolen token.'],
      severity: 'critical',
    }),
    node('dt-servers', 2, 3, 'Account pivot', {
      kind: 'compromised',
      title: 'Server memberships abused',
      short: 'Admin roles, private channels, communities.',
      detail: 'If the victim has moderator or admin roles in gaming servers, the attacker can ban users, delete channels, or post scam content.',
      why: 'Moderator trust is the most valuable social capital in a server.',
      mitigation: ['Immediately alert server owners to revoke roles.'],
      severity: 'high',
    }),
    node('dt-friends', 3, 1.5, 'Friends network', {
      kind: 'attacker',
      title: 'Friends list targeted',
      short: 'Same lure sent to every contact.',
      detail: 'The attacker blasts the same Nitro/trade link to the victim’s entire friends list. Trusted sender = high conversion.',
      why: 'Each compromised account becomes a new distribution node. The chain grows exponentially.',
      mitigation: ['Warn your friends immediately via another channel.'],
      severity: 'high',
    }),
    node('dt-steam', 3, 3, 'Friends network', {
      kind: 'vulnerability',
      title: 'Steam account linked',
      short: 'Discord + Steam linked via OAuth.',
      detail: 'If Steam is linked to the Discord account via OAuth, the attacker can access the connection and attempt a pivot to Steam trades or items.',
      why: 'OAuth connections silently expand the blast radius of a single token steal.',
      mitigation: ['Audit and revoke unnecessary OAuth connections in Discord settings.'],
      severity: 'medium',
    }),
    node('dt-impact-items', 4, 0.5, 'Impact', {
      kind: 'compromised',
      title: 'Game items / skins drained',
      short: 'Inventory traded away via Steam.',
      detail: 'The attacker executes fraudulent Steam trades using the OAuth-linked access and victim’s reputation.',
      why: 'Rare skins and items can be worth hundreds or thousands.',
      mitigation: ['Enable Steam trade confirmation via mobile app.'],
      severity: 'high',
    }),
    node('dt-impact-social', 4, 2, 'Impact', {
      kind: 'compromised',
      title: 'Social trust destroyed',
      short: 'Friends, servers, reputation damaged.',
      detail: 'Friends lose items or credentials because of the attacker using your identity. Rebuilding trust takes weeks.',
      why: 'The social cost of a Discord takeover often exceeds the financial cost.',
      mitigation: ['Communicate clearly and quickly on every shared channel.'],
      severity: 'high',
    }),
    node('dt-impact-payment', 4, 3.3, 'Impact', {
      kind: 'compromised',
      title: 'Saved payment methods',
      short: 'Nitro subscription or marketplace purchases.',
      detail: 'Payment methods saved for Nitro auto-renewal or Discord’s marketplace can be charged by the attacker.',
      why: 'Small recurring charges are often missed for months.',
      mitigation: ['Remove saved payment methods from Discord.'],
      severity: 'medium',
    }),
    node('dt-recovery', 5, 1.7, 'Recovery', {
      kind: 'recovery',
      title: 'Invalidate token + audit OAuth',
      short: 'Log out everywhere, revoke apps, warn friends.',
      detail: 'Log out on all devices (invalidates the token), enable 2FA, revoke all OAuth connections, and post a warning in your servers.',
      why: 'A token stays valid until the account password is changed or the user logs out everywhere.',
      mitigation: ['Change your password to invalidate all tokens.', 'Revoke unnecessary OAuth apps.'],
      severity: 'low',
    }),
  ];

  const edges: AttackEdge[] = [
    edge('dt-nitro', 'dt-grabber', { probability: 0.75 }),
    edge('dt-grabber', 'dt-2fa-barrier', { probability: 0.15, label: 'partial block', variant: 'blocked' }),
    edge('dt-grabber', 'dt-takeover', { probability: 0.75 }),
    edge('dt-takeover', 'dt-servers', { probability: 0.7, variant: 'alt' }),
    edge('dt-takeover', 'dt-friends', { probability: 0.9 }),
    edge('dt-takeover', 'dt-steam', { probability: 0.6, label: 'via OAuth', variant: 'alt' }),
    edge('dt-friends', 'dt-impact-social', { probability: 0.85, variant: 'impact' }),
    edge('dt-steam', 'dt-impact-items', { probability: 0.7, variant: 'impact' }),
    edge('dt-takeover', 'dt-impact-payment', { probability: 0.5, variant: 'impact' }),
    edge('dt-impact-social', 'dt-recovery', { probability: 1, variant: 'recovery' }),
  ];

  return {
    id: 'discord-token-grab',
    title: 'Discord token grabber',
    tagline: 'One fake Nitro link — your entire server network hijacked.',
    description: 'Malicious links in gaming communities silently extract the Discord auth token, giving the attacker full account access that bypasses 2FA. Every friend becomes the next target.',
    iconKey: 'gamepad',
    nodes, edges, phases,
    path: ['dt-nitro', 'dt-grabber', 'dt-takeover', 'dt-friends', 'dt-impact-social'],
    stageLabels: ['Fake link clicked', 'Token extracted', 'Account accessed', 'Friends targeted', 'Trust destroyed'],
    recommendedFor: ['bhv-phishing', 'pw-reuse', 'dev-outdated', 'mfa-none'],
    userTags: ['gamer', 'student', 'general'],
    recommendReason: 'Recommended because your profile shows phishing susceptibility or gaming account habits.',
  };
})();

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const SCENARIOS: Scenario[] = [
  weakPassword,
  phishing,
  publicWifi,
  simSwap,
  gamerChain,
  creatorTakeover,
  ecommerceAdmin,
  browserPasswordDump,
  voiceScam,
  discordTokenGrab,
];

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

/**
 * Return the scenarios most relevant for a given factor state.
 *
 * Scores each scenario by how many of its `recommendedFor` factors are
 * "dangerous" in the provided state (threat active or protective missing).
 * Returns the top N scenarios sorted by relevance score.
 */
export function recommendedScenarios(
  state: Record<string, boolean>,
  getFactorKind: (id: string) => 'threat' | 'protective' | null,
  limit = 3,
): Scenario[] {
  function isDangerous(factorId: string): boolean {
    const kind = getFactorKind(factorId);
    if (!kind) return false;
    const on = !!state[factorId];
    return kind === 'protective' ? !on : on;
  }

  const scored = SCENARIOS.map((s) => ({
    scenario: s,
    score: (s.recommendedFor ?? []).filter(isDangerous).length,
  }));

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.scenario);
}
