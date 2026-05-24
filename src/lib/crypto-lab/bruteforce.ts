/**
 * Brute-force math for the Crypto Lab.
 *
 * Given a charset size, password length, and guesses-per-second budget,
 * compute the search-space size, expected crack time, and pre-built
 * comparison rows that visualize how exponential growth dominates.
 *
 * All math uses JavaScript `number`.  For lengths beyond ~15 with large
 * charsets the values exceed Number.MAX_SAFE_INTEGER — that's OK for an
 * order-of-magnitude educational visualization, and we surface it as a
 * "≈10^X" reading rather than a precise count.
 */

export interface CharsetOption {
  id: string;
  label: string;
  size: number;
  description: string;
}

export const CHARSETS: CharsetOption[] = [
  {
    id: 'digits',
    label: 'Digits only',
    size: 10,
    description: '0-9 — a 4-digit PIN.',
  },
  {
    id: 'lower',
    label: 'Lowercase letters',
    size: 26,
    description: 'a-z — typical weak password.',
  },
  {
    id: 'alpha',
    label: 'Letters (mixed case)',
    size: 52,
    description: 'a-z + A-Z.',
  },
  {
    id: 'alphanum',
    label: 'Letters + digits',
    size: 62,
    description: 'a-z, A-Z, 0-9.',
  },
  {
    id: 'full',
    label: 'Full printable',
    size: 95,
    description: 'All keyboard symbols.',
  },
];

export interface AttackerOption {
  id: string;
  label: string;
  rate: number;
  description: string;
}

export const ATTACKERS: AttackerOption[] = [
  {
    id: 'online',
    label: 'Online (rate-limited)',
    rate: 10,
    description: '~10 guesses/sec against a login form.',
  },
  {
    id: 'slow-hash',
    label: 'Slow hash (bcrypt)',
    rate: 10_000,
    description: '~10k/sec on a single GPU.',
  },
  {
    id: 'fast-hash',
    label: 'Fast hash (MD5/SHA-1)',
    rate: 1e10,
    description: '~10 billion/sec on a modern GPU rig.',
  },
  {
    id: 'nation',
    label: 'Nation-state cluster',
    rate: 1e14,
    description: '~100 trillion/sec — a costly upper bound.',
  },
];

export interface BruteForceResult {
  /** Total possible passwords (may overflow Number safely above ~2^53). */
  combinations: number;
  /** Log10 of the search space — useful when `combinations` is huge. */
  log10: number;
  /** Average time to crack in seconds (half the keyspace). */
  secondsAvg: number;
  /** Human-readable crack-time string. */
  human: string;
  /** Order-of-magnitude readout ("≈10^14"). */
  scientific: string;
}

export function bruteForce({
  charsetSize,
  length,
  rate,
}: {
  charsetSize: number;
  length: number;
  rate: number;
}): BruteForceResult {
  const safeSize = Math.max(1, charsetSize);
  const safeLen = Math.max(0, Math.floor(length));
  const safeRate = Math.max(1, rate);

  // Combinations grow exponentially — use log10 to avoid losing precision.
  const log10 = safeLen * Math.log10(safeSize);
  const combinations = Math.pow(safeSize, safeLen);

  // Average attack time is half the keyspace.
  const seconds = combinations / (2 * safeRate);

  return {
    combinations,
    log10,
    secondsAvg: seconds,
    human: humanizeSeconds(seconds),
    scientific: `\u224810^${log10.toFixed(1)}`,
  };
}

const SECOND = 1;
const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;
const YEAR = 31_557_600; // 365.25 days
const KILO_YEAR = YEAR * 1e3;
const MEGA_YEAR = YEAR * 1e6;
const BILLION_YEAR = YEAR * 1e9;
const AGE_OF_UNIVERSE = YEAR * 1.38e10;

export function humanizeSeconds(s: number): string {
  if (!Number.isFinite(s)) return 'beyond cosmic timescales';
  if (s < 1e-3) return 'instant';
  if (s < SECOND) return `${(s * 1000).toFixed(0)} ms`;
  if (s < MINUTE) return `${s.toFixed(1)} sec`;
  if (s < HOUR) return `${(s / MINUTE).toFixed(1)} min`;
  if (s < DAY) return `${(s / HOUR).toFixed(1)} hr`;
  if (s < YEAR) return `${(s / DAY).toFixed(1)} days`;
  if (s < KILO_YEAR) return `${(s / YEAR).toFixed(1)} years`;
  if (s < MEGA_YEAR) return `${(s / KILO_YEAR).toFixed(1)}k years`;
  if (s < BILLION_YEAR) return `${(s / MEGA_YEAR).toFixed(1)}M years`;
  if (s < AGE_OF_UNIVERSE) return `${(s / BILLION_YEAR).toFixed(1)}B years`;
  return `${(s / AGE_OF_UNIVERSE).toFixed(1)}\u00d7 age of the universe`;
}

/**
 * Pre-compute a small length-vs-combinations table for the growth chart.
 * Lengths span 1..maxLen inclusive.  Returns log10 combinations and
 * crack-time seconds at the given rate.
 */
export function growthSeries(
  charsetSize: number,
  rate: number,
  maxLen = 16,
): { length: number; log10: number; seconds: number }[] {
  const rows: { length: number; log10: number; seconds: number }[] = [];
  for (let L = 1; L <= maxLen; L++) {
    const log10 = L * Math.log10(Math.max(1, charsetSize));
    const seconds = Math.pow(charsetSize, L) / (2 * Math.max(1, rate));
    rows.push({ length: L, log10, seconds });
  }
  return rows;
}
