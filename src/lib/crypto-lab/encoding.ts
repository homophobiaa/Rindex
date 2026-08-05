/**
 * Encoding conversions for the Cryptography Lab.
 *
 * Every function takes the original UTF-8 text and returns the string
 * representation in the requested encoding.  We surface the *bytes*, not
 * code points, because that's what computers actually shuffle around.
 */

function utf8Bytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

/** "Hi" → "01001000 01101001" */
export function toBinary(input: string): string {
  const bytes = utf8Bytes(input);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(2).padStart(8, '0'));
  }
  return parts.join(' ');
}

/** "Hi" → "48 69" */
export function toHex(input: string): string {
  const bytes = utf8Bytes(input);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  return parts.join(' ');
}

/** "Hi" → "72 105" */
export function toDecimal(input: string): string {
  const bytes = utf8Bytes(input);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(10));
  }
  return parts.join(' ');
}

/** Standard base64 of the UTF-8 bytes. */
export function toBase64(input: string): string {
  const bytes = utf8Bytes(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa expects Latin-1; we just built it from raw byte codes so that's fine.
  return btoa(bin);
}

/** Number of raw UTF-8 bytes. */
export function byteCount(input: string): number {
  return utf8Bytes(input).length;
}

/** Number of bits — handy for the "X chars = N bits" callout. */
export function bitCount(input: string): number {
  return byteCount(input) * 8;
}
