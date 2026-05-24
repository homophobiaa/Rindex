/**
 * Attack-path scenarios.  Each one is a small directed graph designed to
 * teach a single security concept through visual chaining.
 *
 * Node positions are laid out manually so the graphs read cleanly without
 * a layout engine.  Use a roughly 260 px column / 150 px row grid.
 */
import type { Scenario } from './types';

const COL = (n: number) => n * 260;
const ROW = (n: number) => n * 150;

/* ============================================================
 * 1.  Weak / reused password
 * ============================================================ */
const weakPassword: Scenario = {
  id: 'weak-password',
  title: 'Weak & reused password',
  tagline: 'How one reused password unlocks every account.',
  description:
    'A breached password on a low-value site cascades through credential stuffing into your email — the master key to your digital life.',
  iconKey: 'lock',
  nodes: [
    {
      id: 'wp-mistake',
      type: 'attack',
      position: { x: COL(0), y: ROW(1) },
      data: {
        kind: 'mistake',
        title: 'Reuses one password',
        short: 'Same password across many sites.',
        detail:
          'Most people reuse a single password across dozens of accounts. Even one tiny site can leak it, and that single string becomes a master key.',
        why:
          'Attackers don\u2019t need to crack your password — they just have to find any site that lost it. Reuse is the silent multiplier behind almost every account takeover.',
        mitigation: [
          'Use a password manager to generate a unique password per site.',
          'Audit reused passwords with haveibeenpwned.com.',
          'Treat your email password as the most critical of all.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'wp-breach',
      type: 'attack',
      position: { x: COL(1), y: ROW(1) },
      data: {
        kind: 'vulnerability',
        title: 'Old data breach',
        short: 'Email + password sitting in a leaked dump.',
        detail:
          'Billions of credentials are circulated in public breach corpora (Collection #1, RockYou, etc.). If yours is in there, attackers already have it.',
        why:
          'Public breach data is the cheapest attack surface that exists. No hacking skill required — anyone can download it.',
        mitigation: [
          'Check haveibeenpwned for your accounts.',
          'Rotate any password ever used on a breached site.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'wp-barrier',
      type: 'attack',
      position: { x: COL(1), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'Unique-per-site passwords',
        short: 'Would have stopped the chain here.',
        detail:
          'If every site has its own password, a leak on one site never grants access to another. The chain is broken at the source.',
        why:
          'Password managers cost nothing and reduce your blast radius from "everything" to "one minor account".',
        mitigation: [
          'Adopt 1Password, Bitwarden, or KeePass.',
          'Import existing passwords and let the manager flag duplicates.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'wp-stuff',
      type: 'attack',
      position: { x: COL(2), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Credential stuffing',
        short: 'Bot replays the pair against major services.',
        detail:
          'Attackers automate logins to Gmail, Instagram, Steam, banks, etc. using leaked email+password pairs. Hit rate is small but the volume is massive.',
        why:
          'A single attacker can try millions of combos a day. Even a 0.1% success rate is thousands of takeovers.',
        mitigation: [
          'Enable rate limiting and bot detection on services you operate.',
          'Use a different password on your email than anywhere else.',
        ],
        severity: 'high',
        successProb: 0.7,
      },
    },
    {
      id: 'wp-mfa',
      type: 'attack',
      position: { x: COL(2), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'Email 2FA enabled',
        short: 'Stops stuffing even with the right password.',
        detail:
          'Two-factor authentication on email blocks credential stuffing in almost every case — the attacker has the password but cannot get the code.',
        why:
          'Email is the recovery hub for every other account. Protecting it is the single highest-leverage control you have.',
        mitigation: [
          'Enable TOTP (authenticator app) on your primary email today.',
          'Print backup codes and store them offline.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'wp-email',
      type: 'attack',
      position: { x: COL(3), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Email account taken over',
        short: 'Attacker controls your inbox.',
        detail:
          'With email access, the attacker can issue password resets on every linked account: bank, social, shopping, gaming, cloud storage.',
        why:
          'Your inbox is the keys to the kingdom. Most "forgot password" flows trust an email link absolutely.',
        mitigation: [
          'Add 2FA to email immediately.',
          'Review active sessions and logged-in devices.',
          'Set a separate, strong, memorized email password.',
        ],
        severity: 'critical',
      },
    },
    {
      id: 'wp-cascade',
      type: 'attack',
      position: { x: COL(4), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Password resets cascade',
        short: 'Every linked account falls.',
        detail:
          'Bank, Instagram, Steam, Discord — the attacker walks through your inbox issuing resets. Each "click to reset password" link works.',
        why:
          'This is why we call it a chain: one weak link multiplies. The damage from a single reused password can take weeks to fully unwind.',
        mitigation: [
          'After recovery, rotate every password.',
          'Enable 2FA on every account that supports it.',
          'Audit OAuth-connected apps tied to your email.',
        ],
        severity: 'critical',
      },
    },
    {
      id: 'wp-recovery',
      type: 'attack',
      position: { x: COL(4), y: ROW(2.2) },
      data: {
        kind: 'recovery',
        title: 'Recover & harden',
        short: 'Rotate, enable 2FA, audit sessions.',
        detail:
          'Standard recovery: regain inbox access, force-logout all sessions, rotate every password starting with email, and turn on 2FA everywhere.',
        why:
          'Recovery without hardening invites the next attack. Treat a takeover as a wake-up call, not a one-off.',
        mitigation: [
          'Use a password manager going forward.',
          'Enable phishing-resistant 2FA (FIDO2 / passkeys) where possible.',
          'Subscribe to breach alert services.',
        ],
        severity: 'low',
      },
    },
  ],
  edges: [
    edge('wp-mistake', 'wp-breach', { probability: 0.85, label: 'leak exposes pair' }),
    edge('wp-mistake', 'wp-barrier', { probability: 0.15, label: 'if unique' }),
    edge('wp-breach', 'wp-stuff', { probability: 0.9 }),
    edge('wp-breach', 'wp-mfa', { probability: 0.2, label: 'if 2FA on email' }),
    edge('wp-stuff', 'wp-email', { probability: 0.7 }),
    edge('wp-email', 'wp-cascade', { probability: 0.95 }),
    edge('wp-cascade', 'wp-recovery', { probability: 1, label: 'response' }),
  ],
  path: ['wp-mistake', 'wp-breach', 'wp-stuff', 'wp-email', 'wp-cascade'],
};

/* ============================================================
 * 2.  Social engineering / phishing
 * ============================================================ */
const phishing: Scenario = {
  id: 'phishing',
  title: 'Phishing & MFA fatigue',
  tagline: 'How a convincing email defeats even 2FA.',
  description:
    'Modern phishing skips the password entirely. It harvests a session token, then bombards you with MFA prompts until you tap "approve" out of habit.',
  iconKey: 'mail',
  nodes: [
    {
      id: 'ph-email',
      type: 'attack',
      position: { x: COL(0), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Targeted phishing email',
        short: '"Your account will be locked in 24 h."',
        detail:
          'A spoofed sender, urgent tone, and a believable login button. Modern kits clone real login pages pixel for pixel.',
        why:
          'Phishing remains the #1 initial-access vector across industry reports. Cheap, fast, and depends only on one click.',
        mitigation: [
          'Hover links before clicking. Check the real domain.',
          'Type sensitive URLs by hand or use bookmarks.',
        ],
        severity: 'high',
        successProb: 0.5,
      },
    },
    {
      id: 'ph-mistake',
      type: 'attack',
      position: { x: COL(1), y: ROW(1) },
      data: {
        kind: 'mistake',
        title: 'User clicks the link',
        short: 'Tired, distracted, looks legit.',
        detail:
          'Most phishing victims are not careless — they\u2019re busy. The brain pattern-matches on logo + tone and skips the URL bar.',
        why:
          'No amount of training removes this risk fully. Defense-in-depth (passkeys, hardware keys) is what actually works.',
        mitigation: [
          'Treat unexpected login links as suspicious by default.',
          'Use passkeys instead of passwords where supported.',
        ],
        severity: 'medium',
      },
    },
    {
      id: 'ph-page',
      type: 'attack',
      position: { x: COL(2), y: ROW(1) },
      data: {
        kind: 'vulnerability',
        title: 'Fake login page',
        short: 'Reverse-proxy steals credentials + cookie.',
        detail:
          'Tools like Evilginx proxy the real site through the attacker, harvesting the session cookie after a successful sign-in.',
        why:
          'This is "AiTM" (Adversary-in-the-Middle) phishing. It defeats one-time codes because the legitimate site issued them.',
        mitigation: [
          'Use FIDO2 / WebAuthn keys — bound to the real origin.',
          'Enable conditional-access policies if available.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'ph-mfa-fatigue',
      type: 'attack',
      position: { x: COL(3), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'MFA-fatigue spam',
        short: 'Dozens of push prompts until one is tapped.',
        detail:
          'Even when stolen credentials aren\u2019t enough, attackers spam push-notification 2FA hoping the victim taps "approve" out of confusion.',
        why:
          'This works far more often than you\u2019d expect. Several major breaches in recent years started exactly here.',
        mitigation: [
          'Use number-matching MFA, not blind approve / deny.',
          'Set a low daily push limit on your IdP.',
        ],
        severity: 'high',
        successProb: 0.4,
      },
    },
    {
      id: 'ph-key',
      type: 'attack',
      position: { x: COL(3), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'Hardware security key',
        short: 'Origin-bound — phishing page cannot use it.',
        detail:
          'A YubiKey / passkey is bound to the real domain. The fake page literally cannot complete the WebAuthn challenge.',
        why:
          'Phishing-resistant MFA is the single most effective control against credential phishing.',
        mitigation: [
          'Use passkeys on iCloud / Google.',
          'Use a hardware key for high-value accounts.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'ph-takeover',
      type: 'attack',
      position: { x: COL(4), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Account & device session stolen',
        short: 'Attacker is now logged in as you.',
        detail:
          'With the session cookie or an approved MFA prompt, the attacker rides your live session — no further auth needed.',
        why:
          'Once a session is hijacked, password rotation alone won\u2019t kick them out. You must revoke sessions explicitly.',
        mitigation: [
          'Revoke all sessions after suspected compromise.',
          'Rotate passwords + re-enroll MFA.',
        ],
        severity: 'critical',
      },
    },
  ],
  edges: [
    edge('ph-email', 'ph-mistake', { probability: 0.5 }),
    edge('ph-mistake', 'ph-page', { probability: 0.9 }),
    edge('ph-page', 'ph-mfa-fatigue', { probability: 0.6 }),
    edge('ph-page', 'ph-key', { probability: 0.05, label: 'if hardware key' }),
    edge('ph-mfa-fatigue', 'ph-takeover', { probability: 0.4 }),
  ],
  path: ['ph-email', 'ph-mistake', 'ph-page', 'ph-mfa-fatigue', 'ph-takeover'],
};

/* ============================================================
 * 3.  Public Wi-Fi
 * ============================================================ */
const publicWifi: Scenario = {
  id: 'public-wifi',
  title: 'Untrusted public Wi-Fi',
  tagline: 'When the network is the attacker.',
  description:
    'A rogue access point in a cafe / airport snoops cleartext traffic, intercepts cookies, and hijacks live sessions on misconfigured sites.',
  iconKey: 'wifi',
  nodes: [
    {
      id: 'wf-mistake',
      type: 'attack',
      position: { x: COL(0), y: ROW(1) },
      data: {
        kind: 'mistake',
        title: 'Connects to "Free Wi-Fi"',
        short: 'No password, no questions asked.',
        detail:
          'Open networks named after the venue ("Airport_Free_WiFi") are trivial to spoof. Your laptop will reconnect automatically next time.',
        why:
          'You don\u2019t see who else is on the network. Anyone running basic tooling can watch your traffic.',
        mitigation: [
          'Use mobile-hotspot tethering instead of open Wi-Fi.',
          'Disable auto-join on open networks.',
        ],
        severity: 'medium',
      },
    },
    {
      id: 'wf-rogue',
      type: 'attack',
      position: { x: COL(1), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Rogue access point',
        short: 'Attacker is now the network.',
        detail:
          'A $50 device can broadcast a fake SSID and route all traffic through itself. Everything you do flows through the attacker.',
        why:
          'You implicitly trust the network. The network does not deserve that trust.',
        mitigation: [
          'Treat every public network as hostile.',
          'Use a reputable VPN when traveling.',
        ],
        severity: 'high',
        successProb: 0.6,
      },
    },
    {
      id: 'wf-vpn',
      type: 'attack',
      position: { x: COL(1), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'VPN tunnel',
        short: 'Encrypts traffic end-to-end.',
        detail:
          'A trustworthy VPN encrypts all packets before they reach the local network, neutralizing snooping at the access point.',
        why:
          'VPNs don\u2019t protect against everything, but they reduce a hostile-network attack to noise.',
        mitigation: [
          'Use a paid, audited VPN — never a free one.',
          'Enable kill-switch so traffic stops if the tunnel drops.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'wf-sniff',
      type: 'attack',
      position: { x: COL(2), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Packet sniffing',
        short: 'Cleartext + cookies captured.',
        detail:
          'Any non-HTTPS traffic is plain text on the wire. Misconfigured sites and apps still leak cookies and tokens here.',
        why:
          'TLS is ubiquitous but not universal. Old apps, IoT firmware, and lazy services still skip it.',
        mitigation: [
          'Check that every site is HTTPS before logging in.',
          'Use modern browsers that enforce HTTPS by default.',
        ],
        severity: 'medium',
      },
    },
    {
      id: 'wf-https',
      type: 'attack',
      position: { x: COL(2), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'HTTPS-only enforcement',
        short: 'Browser refuses to load HTTP.',
        detail:
          'Modern browsers default to HTTPS and block downgrade attempts. Cookies marked Secure never leave the encrypted tunnel.',
        why:
          'Universal TLS is one of the great quiet wins of the last decade — it makes most cafe attacks pointless.',
        mitigation: [
          'Enable "HTTPS-only mode" in your browser settings.',
          'Use HSTS-preloaded sites where possible.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'wf-hijack',
      type: 'attack',
      position: { x: COL(3), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Session hijacked',
        short: 'Attacker rides your live login.',
        detail:
          'With a stolen cookie, the attacker pastes it into their browser and impersonates you — no password needed.',
        why:
          'Session theft sidesteps password and MFA entirely. Only revocation kicks the attacker out.',
        mitigation: [
          'Revoke active sessions if you suspect interception.',
          'Use short-lived tokens / refresh policies.',
        ],
        severity: 'critical',
      },
    },
  ],
  edges: [
    edge('wf-mistake', 'wf-rogue', { probability: 0.8 }),
    edge('wf-mistake', 'wf-vpn', { probability: 0.1, label: 'if VPN' }),
    edge('wf-rogue', 'wf-sniff', { probability: 0.85 }),
    edge('wf-rogue', 'wf-https', { probability: 0.05, label: 'if HTTPS-only' }),
    edge('wf-sniff', 'wf-hijack', { probability: 0.4 }),
  ],
  path: ['wf-mistake', 'wf-rogue', 'wf-sniff', 'wf-hijack'],
};

/* ============================================================
 * 4.  Creator / influencer SIM swap
 * ============================================================ */
const simSwap: Scenario = {
  id: 'sim-swap',
  title: 'Creator SIM swap',
  tagline: 'When SMS 2FA becomes the attack vector.',
  description:
    'A leaked email + a social-engineered telco rep is all it takes to seize a creator account worth six figures. SMS-based 2FA is the linchpin.',
  iconKey: 'star',
  nodes: [
    {
      id: 'ss-leak',
      type: 'attack',
      position: { x: COL(0), y: ROW(1) },
      data: {
        kind: 'vulnerability',
        title: 'Public email & phone',
        short: 'Listed in bio / contact / business records.',
        detail:
          'Creators advertise contact info by necessity. Attackers harvest it from bios, sponsor decks, and registrar records.',
        why:
          'High-follower accounts are profitable targets. Reconnaissance is trivial; the attacker can pick their moment.',
        mitigation: [
          'Use a dedicated business email separate from personal.',
          'Use a Google Voice / VOIP number publicly, not your carrier SIM.',
        ],
        severity: 'medium',
      },
    },
    {
      id: 'ss-social',
      type: 'attack',
      position: { x: COL(1), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Social-engineers telco',
        short: 'Calls support pretending to be you.',
        detail:
          'A confident attacker with a few personal details (DOB, last 4 of SSN, recent addresses) can convince a call-center rep to port the SIM.',
        why:
          'Carriers train reps to be helpful, not paranoid. Insider help and bribery make this even faster in some cases.',
        mitigation: [
          'Set a carrier-side PIN / passcode on your account.',
          'Enable port-out protection at your carrier.',
        ],
        severity: 'high',
        successProb: 0.45,
      },
    },
    {
      id: 'ss-pin',
      type: 'attack',
      position: { x: COL(1), y: ROW(2.2) },
      data: {
        kind: 'barrier',
        title: 'Carrier port-out PIN',
        short: 'No PIN, no port. Full stop.',
        detail:
          'Every major carrier supports a port-out PIN. Set it once and SIM swaps become drastically harder.',
        why:
          'This is the single most underused 5-minute fix in personal security.',
        mitigation: [
          'Call your carrier today and add a port-out PIN.',
          'Avoid reusing your bank PIN.',
        ],
        severity: 'low',
      },
    },
    {
      id: 'ss-swap',
      type: 'attack',
      position: { x: COL(2), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'SIM ported to attacker',
        short: 'They now receive your SMS.',
        detail:
          'Your phone shows "No Service". The attacker\u2019s phone now receives every text — including SMS 2FA codes.',
        why:
          'SMS 2FA is widely available but structurally weak. This is exactly why.',
        mitigation: [
          'Move 2FA off SMS to TOTP apps or hardware keys.',
          'Set up backup codes stored offline.',
        ],
        severity: 'critical',
      },
    },
    {
      id: 'ss-reset',
      type: 'attack',
      position: { x: COL(3), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Resets email password',
        short: 'SMS code arrives \u2014 to them.',
        detail:
          'With SMS in hand, the attacker triggers password resets on email and major platforms. Each verification text routes to them.',
        why:
          'This is the moment the chain "wins". Within minutes the attacker controls your primary identity.',
        mitigation: [
          'Use TOTP for email recovery, not SMS.',
        ],
        severity: 'critical',
      },
    },
    {
      id: 'ss-account',
      type: 'attack',
      position: { x: COL(4), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Social account hijacked',
        short: 'Channel monetized, audience scammed.',
        detail:
          'Twitter / YouTube / Instagram handle is now theirs. They livestream scams, DM followers, or sell the handle.',
        why:
          'Recovery from major platforms takes days to weeks. The damage to audience trust is permanent.',
        mitigation: [
          'Pre-register a recovery email & phone you control off-grid.',
          'Document creator-support paths in advance.',
        ],
        severity: 'critical',
      },
    },
    {
      id: 'ss-recovery',
      type: 'attack',
      position: { x: COL(4), y: ROW(2.2) },
      data: {
        kind: 'recovery',
        title: 'Creator support path',
        short: 'Escalate via partner / MCN channels.',
        detail:
          'Big platforms have priority recovery for verified / partner accounts. Knowing the path before you need it cuts hours off response time.',
        why:
          'Time is the enemy during a takeover. Pre-built playbooks dramatically shrink the damage window.',
        mitigation: [
          'Write a personal incident-response doc.',
          'Keep contact info for your MCN / partner manager handy.',
        ],
        severity: 'low',
      },
    },
  ],
  edges: [
    edge('ss-leak', 'ss-social', { probability: 0.7 }),
    edge('ss-social', 'ss-swap', { probability: 0.45 }),
    edge('ss-social', 'ss-pin', { probability: 0.1, label: 'if PIN set' }),
    edge('ss-swap', 'ss-reset', { probability: 0.9 }),
    edge('ss-reset', 'ss-account', { probability: 0.95 }),
    edge('ss-account', 'ss-recovery', { probability: 1, label: 'response' }),
  ],
  path: ['ss-leak', 'ss-social', 'ss-swap', 'ss-reset', 'ss-account'],
};

/* ============================================================
 * 5.  Basic personal — gamer chain
 * ============================================================ */
const gamerChain: Scenario = {
  id: 'gamer-chain',
  title: 'Steam → Discord → Email',
  tagline: 'How a small leak takes out your whole gaming life.',
  description:
    'A weak Steam password plus the same one on Discord turns into an inbox compromise — and from there, everything you ever signed up with that email.',
  iconKey: 'gamepad',
  nodes: [
    {
      id: 'g-weak',
      type: 'attack',
      position: { x: COL(0), y: ROW(1) },
      data: {
        kind: 'mistake',
        title: 'Weak Steam password',
        short: '"steam1234" \u2014 8 chars, predictable.',
        detail:
          'Short, common, dictionary-derived. Crackable offline in seconds; brute-forceable in days against rate-limited login.',
        why:
          'Gaming accounts often hold real value (skins, items, payment methods). They\u2019re high-traffic targets.',
        mitigation: [
          'Use a 16+ character generated password.',
          'Enable Steam Guard mobile authenticator.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'g-reuse',
      type: 'attack',
      position: { x: COL(1), y: ROW(1) },
      data: {
        kind: 'mistake',
        title: 'Same on Discord',
        short: 'Identical password reused.',
        detail:
          'Once Steam is breached or guessed, the same string unlocks Discord. Most people don\u2019t realize the link until it\u2019s too late.',
        why:
          'This is the textbook "weakest-link" pattern: one cracked credential, many open doors.',
        mitigation: [
          'Unique password per account — always.',
          'Use a password manager so this is effortless.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'g-breach',
      type: 'attack',
      position: { x: COL(2), y: ROW(1) },
      data: {
        kind: 'attacker',
        title: 'Account takeover',
        short: 'Steam + Discord both fall.',
        detail:
          'Attacker drains in-game items, scams your friends list on Discord, and pivots to find your email address.',
        why:
          'Friends-list scams are highly effective because the message comes from someone the victim already trusts.',
        mitigation: [
          'Enable Steam Guard + Discord 2FA right now.',
          'Warn friends if any account looks off.',
        ],
        severity: 'high',
        successProb: 0.65,
      },
    },
    {
      id: 'g-email',
      type: 'attack',
      position: { x: COL(3), y: ROW(1) },
      data: {
        kind: 'vulnerability',
        title: 'Email visible in profile',
        short: 'Same address used to register both.',
        detail:
          'With the email address now in hand, the attacker tries the same password on the inbox. Many people use it there too.',
        why:
          'Email reuse closes the loop. Now the attacker can issue resets on anything you ever signed up for.',
        mitigation: [
          'Use a different, stronger password on email than anywhere else.',
        ],
        severity: 'high',
      },
    },
    {
      id: 'g-takeover',
      type: 'attack',
      position: { x: COL(4), y: ROW(1) },
      data: {
        kind: 'compromised',
        title: 'Inbox + everything linked',
        short: 'Bank, social, shopping, more.',
        detail:
          'The chain culminates the same way every chain culminates: in the inbox. From here every connected service is reachable.',
        why:
          'No matter where the chain starts, the inbox is the prize. Protect it accordingly.',
        mitigation: [
          'Treat your primary email as the most critical account you have.',
          'Add 2FA, recovery codes, and a backup email.',
        ],
        severity: 'critical',
      },
    },
  ],
  edges: [
    edge('g-weak', 'g-reuse', { probability: 0.9 }),
    edge('g-reuse', 'g-breach', { probability: 0.7 }),
    edge('g-breach', 'g-email', { probability: 0.8 }),
    edge('g-email', 'g-takeover', { probability: 0.6 }),
  ],
  path: ['g-weak', 'g-reuse', 'g-breach', 'g-email', 'g-takeover'],
};

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

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */

function edge(
  source: string,
  target: string,
  data: { probability: number; label?: string },
) {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'attack',
    data,
  };
}
