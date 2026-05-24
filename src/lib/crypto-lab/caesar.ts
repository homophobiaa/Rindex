/**
 * Caesar / shift cipher utilities.
 *
 * Pure functions — no React, no side effects.  The shift always wraps
 * within the 26-letter Latin alphabet and preserves case + non-letters.
 */

const A_UPPER = 65;
const A_LOWER = 97;

/** Encrypt/decrypt by shifting each Latin letter `shift` positions. */
export function shiftText(input: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26; // normalise to [0,25]
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      out += String.fromCharCode(((code - A_UPPER + s) % 26) + A_UPPER);
    } else if (code >= 97 && code <= 122) {
      out += String.fromCharCode(((code - A_LOWER + s) % 26) + A_LOWER);
    } else {
      out += input[i];
    }
  }
  return out;
}

/** Mapping pairs A→X, B→Y, … for the current shift. */
export interface AlphabetPair {
  plain: string;
  cipher: string;
}

export function alphabetMap(shift: number): AlphabetPair[] {
  const s = ((shift % 26) + 26) % 26;
  const pairs: AlphabetPair[] = [];
  for (let i = 0; i < 26; i++) {
    pairs.push({
      plain: String.fromCharCode(A_UPPER + i),
      cipher: String.fromCharCode(A_UPPER + ((i + s) % 26)),
    });
  }
  return pairs;
}

/** Every possible decryption — what a brute-force attacker would do. */
export interface BruteForceRow {
  shift: number;
  text: string;
}

export function bruteForceAllShifts(cipher: string): BruteForceRow[] {
  const rows: BruteForceRow[] = [];
  for (let i = 0; i < 26; i++) {
    rows.push({ shift: i, text: shiftText(cipher, -i) });
  }
  return rows;
}
