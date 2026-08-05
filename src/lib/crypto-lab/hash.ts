/**
 * Hashing utilities for the Cryptography Lab.
 *
 * Uses the browser's native Web Crypto API to compute a real SHA-256.
 * Nothing here is faked — the bytes you see are the genuine digest.
 *
 * Returned hex strings are lowercase, contiguous, no separators.
 */

/** Compute SHA-256 of a UTF-8 string and return its lowercase hex digest. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bufferToHex(digest);
}

function bufferToHex(buf: ArrayBuffer): string {
  const view = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

export interface HashDiff {
  /** Total nibbles (hex characters) — always 64 for SHA-256. */
  totalNibbles: number;
  /** Number of nibbles that differ. */
  diffNibbles: number;
  /** Total bits — always 256. */
  totalBits: number;
  /** Number of bits that differ (Hamming distance between digests). */
  diffBits: number;
  /** Per-nibble flag: true when that hex char changed. */
  changedMask: boolean[];
}

/**
 * Compare two hex digests (assumed equal length) and report how many
 * nibbles + bits differ.  Used to visualize the avalanche effect.
 */
export function diffHashes(a: string, b: string): HashDiff {
  const len = Math.min(a.length, b.length);
  const changedMask: boolean[] = new Array(len).fill(false);
  let diffNibbles = 0;
  let diffBits = 0;
  for (let i = 0; i < len; i++) {
    const av = parseInt(a[i], 16);
    const bv = parseInt(b[i], 16);
    if (av === bv) continue;
    changedMask[i] = true;
    diffNibbles++;
    diffBits += popcount4(av ^ bv);
  }
  return {
    totalNibbles: len,
    diffNibbles,
    totalBits: len * 4,
    diffBits,
    changedMask,
  };
}

function popcount4(n: number): number {
  let c = 0;
  for (let i = 0; i < 4; i++) if ((n >> i) & 1) c++;
  return c;
}

/**
 * Hash `salt + input`, the way a password database stores a salted digest.
 *
 * NOTE: plain salted SHA-256 is shown here because it is the simplest way
 * to demonstrate what a salt *does*. It is not adequate password storage on
 * its own — SHA-256 is built to be fast, which is exactly wrong for
 * passwords. Real systems use bcrypt / scrypt / Argon2.
 */
export async function sha256Salted(salt: string, input: string): Promise<string> {
  return sha256Hex(salt + input);
}

/** Random hex salt, from the browser CSPRNG. */
export function randomSalt(bytes = 8): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let out = '';
  for (let i = 0; i < buf.length; i++) out += buf[i].toString(16).padStart(2, '0');
  return out;
}

/**
 * Generate a deterministic but visually different "twin" input by flipping
 * the first character's case, or appending a space if no letters exist.
 * Used to demo avalanche with a minimal perturbation.
 */
export function tinyPerturbation(input: string): string {
  if (input.length === 0) return ' ';
  const ch = input[0];
  const flipped =
    ch === ch.toUpperCase() && ch !== ch.toLowerCase()
      ? ch.toLowerCase()
      : ch.toUpperCase();
  if (flipped !== ch) return flipped + input.slice(1);
  // Non-letter — append a trailing space instead.
  return input + ' ';
}
