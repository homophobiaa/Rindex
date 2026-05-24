/**
 * Password Risk Analyzer — frontend-only analysis engine.
 *
 * Every function here is pure and runs entirely in the browser. No I/O,
 * no network, no storage. The analyzer never logs the raw password.
 */

import {
  COMMON_PASSWORDS,
  DICTIONARY_WORDS,
  KEYBOARD_SEQUENCES,
  LEET_MAP,
} from './dictionaries';

export type Classification = 'critical' | 'weak' | 'vulnerable' | 'safe' | 'hardened';

export type CharComposition = {
  length: number;
  lowercase: number;
  uppercase: number;
  digits: number;
  symbols: number;
  unique: number;
  charsetSize: number;
};

export type PatternFinding = {
  /** Stable identifier used for keys and styling. */
  id: string;
  /** Short human label. */
  label: string;
  /** One-sentence explanation shown in the UI. */
  detail: string;
  /** How harshly this pattern reduces entropy. */
  severity: 'low' | 'medium' | 'high';
  /** Entropy bits subtracted because of this finding. */
  penaltyBits: number;
};

export type AttackScenario = {
  id: string;
  label: string;
  /** Description of the attacker capability. */
  description: string;
  /** Guesses per second this scenario assumes. */
  guessesPerSecond: number;
  /** Human-formatted time to exhaust the search space. */
  timeText: string;
  /** Raw seconds (capped at Number.MAX_SAFE_INTEGER for very strong pws). */
  seconds: number;
  /** 0 → effectively instant, 1 → effectively impossible. */
  difficulty: number;
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  /** Approximate entropy bits this change would add if applied. */
  estimatedBitGain: number;
};

export type AnalysisResult = {
  /** Length of the input password. Never the password itself. */
  length: number;
  /** Character composition counts. */
  composition: CharComposition;
  /** Estimated effective entropy after pattern penalties. */
  effectiveEntropyBits: number;
  /** Raw entropy from charset^length, before penalties. */
  rawEntropyBits: number;
  /** 0–100 risk-adjusted strength score. */
  score: number;
  /** Bucketed strength classification. */
  classification: Classification;
  /** Detected weaknesses. */
  patterns: PatternFinding[];
  /** Attack-time estimates across capability tiers. */
  scenarios: AttackScenario[];
  /** Ordered improvement suggestions. */
  recommendations: Recommendation[];
  /** Approximate guesses-to-crack (= 2 ^ effectiveEntropyBits / 2). */
  guessesToCrack: number;
  /** Diversity score 0–1 (Shannon entropy of character distribution, normalized). */
  diversity: number;
};

const CHARSET_LOWER = 26;
const CHARSET_UPPER = 26;
const CHARSET_DIGITS = 10;
const CHARSET_SYMBOLS = 33;

/** Inspect character composition without ever storing the password. */
export function analyzeComposition(pw: string): CharComposition {
  let lowercase = 0;
  let uppercase = 0;
  let digits = 0;
  let symbols = 0;
  const seen = new Set<string>();

  for (const ch of pw) {
    seen.add(ch);
    if (/[a-z]/.test(ch)) lowercase++;
    else if (/[A-Z]/.test(ch)) uppercase++;
    else if (/[0-9]/.test(ch)) digits++;
    else symbols++;
  }

  let charsetSize = 0;
  if (lowercase) charsetSize += CHARSET_LOWER;
  if (uppercase) charsetSize += CHARSET_UPPER;
  if (digits) charsetSize += CHARSET_DIGITS;
  if (symbols) charsetSize += CHARSET_SYMBOLS;
  if (charsetSize === 0) charsetSize = 1;

  return {
    length: pw.length,
    lowercase,
    uppercase,
    digits,
    symbols,
    unique: seen.size,
    charsetSize,
  };
}

/** Shannon entropy of the character frequency distribution, normalized 0–1. */
function shannonDiversity(pw: string): number {
  if (!pw) return 0;
  const counts = new Map<string, number>();
  for (const ch of pw) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const total = pw.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / total;
    h -= p * Math.log2(p);
  }
  // Max possible for this length = log2(length)
  const maxH = Math.log2(Math.max(2, total));
  return Math.min(1, h / maxH);
}

/** Apply leet-speak substitutions to lowercase the password and reveal hidden words. */
function unleet(pw: string): string {
  return pw
    .toLowerCase()
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join('');
}

function detectPatterns(pw: string, composition: CharComposition): PatternFinding[] {
  const findings: PatternFinding[] = [];
  if (!pw) return findings;
  const lower = pw.toLowerCase();
  const unleeted = unleet(pw);

  // 1. Common password
  if (COMMON_PASSWORDS.has(lower)) {
    findings.push({
      id: 'common-password',
      label: 'Common password',
      detail: 'This appears in widely-circulated breach corpora and top password lists.',
      severity: 'high',
      penaltyBits: 28,
    });
  }

  // 2. Dictionary word embedded
  const dictHit = DICTIONARY_WORDS.find(
    (w) => w.length >= 4 && (lower.includes(w) || unleeted.includes(w)),
  );
  if (dictHit) {
    findings.push({
      id: 'dictionary-word',
      label: `Contains the word "${dictHit}"`,
      detail: 'Dictionary words drastically shrink the effective search space for attackers.',
      severity: 'high',
      penaltyBits: 12,
    });
  }

  // 3. Keyboard sequence
  const seqHit = KEYBOARD_SEQUENCES.find((s) => lower.includes(s.slice(0, 5)));
  if (seqHit) {
    findings.push({
      id: 'keyboard-sequence',
      label: 'Keyboard sequence detected',
      detail: 'Patterns like "qwerty", "asdfgh" or "12345" are the first thing crackers try.',
      severity: 'high',
      penaltyBits: 10,
    });
  }

  // 4. Pure digits
  if (/^\d+$/.test(pw)) {
    findings.push({
      id: 'digits-only',
      label: 'Digits only',
      detail: 'A digit-only password has only 10 possibilities per character.',
      severity: 'high',
      penaltyBits: 8,
    });
  }

  // 5. Pure letters
  if (/^[A-Za-z]+$/.test(pw)) {
    findings.push({
      id: 'letters-only',
      label: 'Letters only',
      detail: 'No digits or symbols means a significantly smaller charset.',
      severity: 'medium',
      penaltyBits: 4,
    });
  }

  // 6. Long repeated runs (aaaa, 1111)
  if (/(.)\1{2,}/.test(pw)) {
    findings.push({
      id: 'repeated-char',
      label: 'Repeated characters',
      detail: 'Long runs like "aaaa" or "1111" add length without adding entropy.',
      severity: 'medium',
      penaltyBits: 4,
    });
  }

  // 7. Trailing year
  const yearMatch = pw.match(/(19|20)\d{2}$/);
  if (yearMatch) {
    findings.push({
      id: 'trailing-year',
      label: `Ends with year (${yearMatch[0]})`,
      detail: 'Birth years and recent years are an extremely common suffix pattern.',
      severity: 'medium',
      penaltyBits: 5,
    });
  }

  // 8. Trailing digits (any 2+)
  if (!yearMatch && /\d{2,}$/.test(pw) && pw.length > 3) {
    findings.push({
      id: 'trailing-digits',
      label: 'Trailing digits',
      detail: 'Word + numbers is one of the most predictable structures attackers try first.',
      severity: 'low',
      penaltyBits: 2,
    });
  }

  // 9. Leet-speak transforms reveal a common word
  if (
    !findings.some((f) => f.id === 'dictionary-word') &&
    DICTIONARY_WORDS.some((w) => w.length >= 4 && unleeted.includes(w)) &&
    unleeted !== lower
  ) {
    findings.push({
      id: 'leet-speak',
      label: 'Predictable leet substitutions',
      detail: 'Replacing letters with digits (e→3, a→4) is the first transform crackers test.',
      severity: 'medium',
      penaltyBits: 6,
    });
  }

  // 10. Sequential characters (abc, 123)
  if (hasSequentialRun(pw, 4)) {
    findings.push({
      id: 'sequential',
      label: 'Sequential characters',
      detail: 'Sequences like "abcd", "1234" or "wxyz" are trivially enumerated.',
      severity: 'medium',
      penaltyBits: 5,
    });
  }

  // 11. Low character diversity
  const diversity = shannonDiversity(pw);
  if (pw.length >= 6 && diversity < 0.55) {
    findings.push({
      id: 'low-diversity',
      label: 'Low character diversity',
      detail: 'A few characters are reused too often, reducing real entropy.',
      severity: 'low',
      penaltyBits: 3,
    });
  }

  // 12. Capitalized word + suffix (Summer2024)
  if (/^[A-Z][a-z]{2,}\d{2,}[!@#$%^&*]?$/.test(pw)) {
    findings.push({
      id: 'capitalized-word-suffix',
      label: 'Word + numbers pattern',
      detail: 'Cracker rule sets generate millions of "Capitalized + digits" candidates per second.',
      severity: 'medium',
      penaltyBits: 8,
    });
  }

  // 13. Too short
  if (pw.length > 0 && pw.length < 8) {
    findings.push({
      id: 'too-short',
      label: 'Below safe length',
      detail: 'Passwords under 8 characters are brute-forceable in seconds regardless of charset.',
      severity: 'high',
      penaltyBits: 6,
    });
  }

  // No symbols
  if (composition.symbols === 0 && pw.length > 0) {
    findings.push({
      id: 'no-symbols',
      label: 'No symbols',
      detail: 'Adding symbols expands the charset from 62 to 95+ characters.',
      severity: 'low',
      penaltyBits: 1,
    });
  }

  return findings;
}

function hasSequentialRun(pw: string, minLen: number): boolean {
  const s = pw.toLowerCase();
  let runUp = 1;
  let runDown = 1;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d === 1) {
      runUp++;
      runDown = 1;
    } else if (d === -1) {
      runDown++;
      runUp = 1;
    } else {
      runUp = 1;
      runDown = 1;
    }
    if (runUp >= minLen || runDown >= minLen) return true;
  }
  return false;
}

function classify(score: number): Classification {
  if (score < 20) return 'critical';
  if (score < 45) return 'weak';
  if (score < 65) return 'vulnerable';
  if (score < 85) return 'safe';
  return 'hardened';
}

const SCENARIOS_BASE: ReadonlyArray<Omit<AttackScenario, 'timeText' | 'seconds' | 'difficulty'>> = [
  {
    id: 'online-throttled',
    label: 'Online attack · throttled',
    description: '~100 guesses / s against a rate-limited login endpoint.',
    guessesPerSecond: 1e2,
  },
  {
    id: 'online-unthrottled',
    label: 'Online attack · unthrottled',
    description: '~10K guesses / s against a poorly-protected API.',
    guessesPerSecond: 1e4,
  },
  {
    id: 'offline-slow-hash',
    label: 'Offline · slow hash (bcrypt)',
    description: '~10K guesses / s on consumer GPU against bcrypt / argon2.',
    guessesPerSecond: 1e4,
  },
  {
    id: 'offline-fast-hash',
    label: 'Offline · fast hash (SHA-256)',
    description: '~10B guesses / s on a single high-end GPU.',
    guessesPerSecond: 1e10,
  },
  {
    id: 'offline-cluster',
    label: 'Offline · GPU cluster',
    description: '~1T guesses / s on a dedicated cracking cluster.',
    guessesPerSecond: 1e12,
  },
];

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds > 1e25) return 'effectively forever';
  if (seconds < 1e-3) return 'instant';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} days`;
  const years = seconds / 31536000;
  if (years < 1000) return `${years.toFixed(1)} years`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)}K years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}M years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)}B years`;
  return `${years.toExponential(1)} years`;
}

function computeScenarios(guesses: number): AttackScenario[] {
  return SCENARIOS_BASE.map((s) => {
    const seconds = guesses / s.guessesPerSecond;
    // difficulty curve: 0 → instant, 1 → years
    const log = Math.log10(Math.max(1, seconds));
    const difficulty = Math.max(0, Math.min(1, log / 14)); // 10^14 s ≈ 3M years
    return {
      ...s,
      seconds,
      timeText: formatDuration(seconds),
      difficulty,
    };
  });
}

function generateRecommendations(
  pw: string,
  composition: CharComposition,
  patterns: PatternFinding[],
  effectiveBits: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const has = (id: string) => patterns.some((p) => p.id === id);

  if (pw.length < 12) {
    recs.push({
      id: 'longer',
      title: `Increase length to at least 16 characters`,
      description: 'Length is the single most impactful factor — each added character roughly doubles the search space.',
      impact: 'high',
      estimatedBitGain: Math.max(0, (16 - pw.length) * Math.log2(Math.max(26, composition.charsetSize))),
    });
  }

  if (composition.uppercase === 0) {
    recs.push({
      id: 'add-upper',
      title: 'Add uppercase letters',
      description: 'Mixing cases expands the charset and breaks lowercase-only mask attacks.',
      impact: 'medium',
      estimatedBitGain: pw.length ? Math.log2((composition.charsetSize + 26) / composition.charsetSize) * pw.length : 0,
    });
  }
  if (composition.digits === 0) {
    recs.push({
      id: 'add-digits',
      title: 'Add digits',
      description: 'Digits expand the charset to 62 characters with no memorability cost.',
      impact: 'medium',
      estimatedBitGain: pw.length ? Math.log2((composition.charsetSize + 10) / composition.charsetSize) * pw.length : 0,
    });
  }
  if (composition.symbols === 0) {
    recs.push({
      id: 'add-symbols',
      title: 'Add symbols',
      description: 'Symbols widen the charset to 95+ characters and defeat most default rule sets.',
      impact: 'medium',
      estimatedBitGain: pw.length ? Math.log2((composition.charsetSize + 33) / composition.charsetSize) * pw.length : 0,
    });
  }

  if (has('dictionary-word') || has('common-password') || has('leet-speak')) {
    recs.push({
      id: 'avoid-words',
      title: 'Avoid recognizable words',
      description: 'Prefer a random passphrase of 4–5 unrelated words, or a fully random string from a manager.',
      impact: 'high',
      estimatedBitGain: 20,
    });
  }
  if (has('trailing-year') || has('trailing-digits') || has('capitalized-word-suffix')) {
    recs.push({
      id: 'avoid-suffix',
      title: 'Avoid predictable suffixes',
      description: 'Years and trailing digits are the first transformations cracker rules apply.',
      impact: 'medium',
      estimatedBitGain: 10,
    });
  }
  if (has('keyboard-sequence') || has('sequential')) {
    recs.push({
      id: 'avoid-sequences',
      title: 'Avoid keyboard or alphabetical sequences',
      description: 'Cracking tools enumerate these sequences before any random guesses.',
      impact: 'high',
      estimatedBitGain: 12,
    });
  }
  if (has('repeated-char') || has('low-diversity')) {
    recs.push({
      id: 'increase-diversity',
      title: 'Increase character diversity',
      description: 'Avoid reusing the same character — distribute entropy across the full length.',
      impact: 'low',
      estimatedBitGain: 4,
    });
  }
  if (effectiveBits < 60) {
    recs.push({
      id: 'use-manager',
      title: 'Use a password manager',
      description: 'A manager lets you store fully-random 20+ character passwords without memorizing them.',
      impact: 'high',
      estimatedBitGain: 80 - effectiveBits,
    });
  }

  // Always: enable 2FA
  recs.push({
    id: 'enable-2fa',
    title: 'Pair this password with authenticator-based 2FA',
    description: 'Even a compromised password becomes useless against an attacker without your second factor.',
    impact: 'high',
    estimatedBitGain: 0,
  });

  return recs
    .sort((a, b) => impactWeight(b.impact) - impactWeight(a.impact))
    .slice(0, 6);
}

function impactWeight(i: Recommendation['impact']): number {
  return i === 'high' ? 3 : i === 'medium' ? 2 : 1;
}

/** Score 0–100 derived from effective entropy, calibrated to the classification buckets. */
function scoreFromBits(bits: number): number {
  // 0 bits → 0, 30 bits → ~25, 60 bits → ~65, 90+ bits → 95+
  const raw = (bits / 90) * 95;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Main entry point. Pure, idempotent, runs in microseconds.
 */
export function analyzePassword(pw: string): AnalysisResult {
  const composition = analyzeComposition(pw);
  const rawEntropyBits = pw.length > 0 ? pw.length * Math.log2(composition.charsetSize) : 0;
  const patterns = detectPatterns(pw, composition);
  const penalty = patterns.reduce((sum, p) => sum + p.penaltyBits, 0);
  const effectiveEntropyBits = Math.max(0, rawEntropyBits - penalty);
  const diversity = shannonDiversity(pw);

  // Average-case: attacker finds the password halfway through the keyspace.
  const guessesToCrack = Math.pow(2, effectiveEntropyBits) / 2;
  const scenarios = computeScenarios(guessesToCrack);

  const score = scoreFromBits(effectiveEntropyBits);
  const classification = classify(score);
  const recommendations = generateRecommendations(pw, composition, patterns, effectiveEntropyBits);

  return {
    length: pw.length,
    composition,
    rawEntropyBits,
    effectiveEntropyBits,
    score,
    classification,
    patterns,
    scenarios,
    recommendations,
    guessesToCrack,
    diversity,
  };
}

export const CLASSIFICATION_META: Record<
  Classification,
  { label: string; tone: string; color: string; description: string }
> = {
  critical: {
    label: 'Critical',
    tone: 'danger',
    color: '#f04438',
    description: 'Crackable in seconds. Replace immediately.',
  },
  weak: {
    label: 'Weak',
    tone: 'danger',
    color: '#f04438',
    description: 'Falls to common rule-based attacks within minutes to hours.',
  },
  vulnerable: {
    label: 'Vulnerable',
    tone: 'warning',
    color: '#f79009',
    description: 'Survives casual attacks but not targeted offline cracking.',
  },
  safe: {
    label: 'Safe',
    tone: 'success',
    color: '#27a644',
    description: 'Resistant to most realistic attacks. Good baseline.',
  },
  hardened: {
    label: 'Hardened',
    tone: 'primary',
    color: '#5e6ad2',
    description: 'Far beyond brute-force reach with current hardware.',
  },
};

/** Cryptographically-random password generator using Web Crypto. */
export function generateSecurePassword(length = 20): string {
  const charset =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()-_=+[]{}<>?';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}
