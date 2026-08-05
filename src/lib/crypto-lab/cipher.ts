/**
 * Real symmetric encryption for the Cryptography Lab.
 *
 * Uses the browser's Web Crypto API only — AES-GCM for the cipher and
 * PBKDF2-SHA256 to turn a human passphrase into a key. Nothing here is a
 * hand-rolled cipher and nothing is simulated.
 *
 * SCOPE: this exists to demonstrate how authenticated encryption behaves
 * (right key → plaintext, wrong key → hard failure). It is NOT a secure
 * messaging tool: the iteration count is tuned to stay responsive in a
 * demo rather than to resist offline cracking, and the output format is
 * ad-hoc. Use a real tool for real secrets.
 */

/** Deliberately low so the demo stays snappy. Real KDFs use far more. */
export const PBKDF2_ITERATIONS = 150_000;

const SALT_BYTES = 16;
const IV_BYTES = 12; // 96-bit nonce, the standard size for AES-GCM

export interface EncryptedPayload {
  /** Base64 of salt ‖ iv ‖ ciphertext — what the user copies around. */
  blob: string;
  /** Individual parts, surfaced so the UI can show the anatomy. */
  saltB64: string;
  ivB64: string;
  cipherB64: string;
  /** Bytes of ciphertext (includes the 16-byte GCM auth tag). */
  cipherBytes: number;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Derive an AES-GCM key from a passphrase + salt using PBKDF2-SHA256. */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a message with a passphrase. Salt and IV are freshly random. */
export async function encryptMessage(
  message: string,
  passphrase: string,
): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);

  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      new TextEncoder().encode(message),
    ),
  );

  const combined = new Uint8Array(salt.length + iv.length + cipher.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipher, salt.length + iv.length);

  return {
    blob: bytesToB64(combined),
    saltB64: bytesToB64(salt),
    ivB64: bytesToB64(iv),
    cipherB64: bytesToB64(cipher),
    cipherBytes: cipher.length,
  };
}

export type DecryptOutcome =
  | { ok: true; message: string }
  | { ok: false; reason: 'bad-key' | 'malformed' };

/**
 * Decrypt a payload produced by `encryptMessage`.
 *
 * A wrong passphrase does not yield garbage — AES-GCM verifies an
 * authentication tag and the operation throws instead. That distinction is
 * the whole point of the demo.
 */
export async function decryptMessage(
  blob: string,
  passphrase: string,
): Promise<DecryptOutcome> {
  let combined: Uint8Array;
  try {
    combined = b64ToBytes(blob.trim());
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (combined.length <= SALT_BYTES + IV_BYTES) {
    return { ok: false, reason: 'malformed' };
  }

  const salt = combined.slice(0, SALT_BYTES);
  const iv = combined.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const cipher = combined.slice(SALT_BYTES + IV_BYTES);

  try {
    const key = await deriveKey(passphrase, salt);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipher as unknown as BufferSource,
    );
    return { ok: true, message: new TextDecoder().decode(plain) };
  } catch {
    // GCM tag mismatch — wrong passphrase, or the blob was tampered with.
    return { ok: false, reason: 'bad-key' };
  }
}

/* ------------------------------------------------------------------ */
/* Secure randomness                                                    */
/* ------------------------------------------------------------------ */

const PASSPHRASE_WORDS = [
  'anchor', 'basalt', 'cinder', 'dorsal', 'ember', 'fathom', 'granite', 'harbor',
  'indigo', 'jasper', 'kelvin', 'lumen', 'marble', 'nectar', 'onyx', 'pivot',
  'quartz', 'ripple', 'summit', 'tundra', 'umber', 'vellum', 'willow', 'xenon',
  'yonder', 'zephyr', 'cobalt', 'drifter', 'echo', 'fjord', 'glacier', 'hollow',
];

/**
 * Generate a passphrase using `crypto.getRandomValues` — the same CSPRNG a
 * password manager or recovery-code generator would use.
 *
 * Rejection sampling keeps the word choice uniform; taking `value % length`
 * directly would bias toward the first words in the list.
 */
export function generatePassphrase(words = 4): string {
  const n = PASSPHRASE_WORDS.length;
  const limit = Math.floor(256 / n) * n; // largest unbiased multiple
  const picked: string[] = [];
  while (picked.length < words) {
    const buf = crypto.getRandomValues(new Uint8Array(words * 2));
    for (let i = 0; i < buf.length && picked.length < words; i++) {
      if (buf[i] < limit) picked.push(PASSPHRASE_WORDS[buf[i] % n]);
    }
  }
  return picked.join('-');
}

/** Bits of entropy in a generated passphrase, given the word list size. */
export function passphraseEntropyBits(words: number): number {
  return words * Math.log2(PASSPHRASE_WORDS.length);
}

/** Random hex token — the shape of a recovery code or session identifier. */
export function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let out = '';
  for (let i = 0; i < buf.length; i++) out += buf[i].toString(16).padStart(2, '0');
  return out;
}
