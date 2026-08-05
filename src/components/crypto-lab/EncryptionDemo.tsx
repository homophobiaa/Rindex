import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  encryptMessage,
  decryptMessage,
  generatePassphrase,
  passphraseEntropyBits,
  PBKDF2_ITERATIONS,
  type EncryptedPayload,
} from '@/lib/crypto-lab/cipher';
import { useMotionTransition } from '@/lib/motion';
import { CopyButton } from './CopyButton';

type Stage = 'idle' | 'encrypted';
type DecryptState =
  | { kind: 'none' }
  | { kind: 'ok'; message: string }
  | { kind: 'bad-key' }
  | { kind: 'malformed' };

const PASSPHRASE_WORDS = 4;

/**
 * Round-trip AES-GCM demonstration.
 *
 * The interesting moment is the failure case: a wrong passphrase does not
 * produce garbage text, it produces a hard authentication error. That is
 * what separates authenticated encryption from a toy cipher.
 */
export function EncryptionDemo() {
  const [message, setMessage] = useState('My recovery codes are in the desk drawer.');
  const [key, setKey] = useState(() => generatePassphrase(PASSPHRASE_WORDS));
  const [payload, setPayload] = useState<EncryptedPayload | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [attemptKey, setAttemptKey] = useState('');
  const [decrypted, setDecrypted] = useState<DecryptState>({ kind: 'none' });
  const [working, setWorking] = useState(false);

  const transition = useMotionTransition({ duration: 0.28, ease: [0.16, 1, 0.3, 1] });
  const entropy = Math.round(passphraseEntropyBits(PASSPHRASE_WORDS));

  const handleEncrypt = async () => {
    if (!message || !key) return;
    setWorking(true);
    const p = await encryptMessage(message, key);
    setPayload(p);
    setStage('encrypted');
    setAttemptKey('');
    setDecrypted({ kind: 'none' });
    setWorking(false);
  };

  const handleDecrypt = async () => {
    if (!payload) return;
    setWorking(true);
    const res = await decryptMessage(payload.blob, attemptKey);
    setDecrypted(res.ok ? { kind: 'ok', message: res.message } : { kind: res.reason });
    setWorking(false);
  };

  const reset = () => {
    setPayload(null);
    setStage('idle');
    setAttemptKey('');
    setDecrypted({ kind: 'none' });
  };

  return (
    <div className="space-y-5">
      {/* Compose */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <label className="block">
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              reset();
            }}
            rows={3}
            className="w-full resize-none rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
              Passphrase
            </span>
            <span className="font-mono text-micro text-ink-tertiary">≈{entropy} bits</span>
          </div>
          <input
            type="text"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              reset();
            }}
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors focus:border-primary/60 focus:bg-surface-2"
          />
          <button
            type="button"
            onClick={() => {
              setKey(generatePassphrase(PASSPHRASE_WORDS));
              reset();
            }}
            className="mt-2 w-full rounded-lg border border-hairline bg-surface-2 py-2 text-caption text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
          >
            Generate random passphrase
          </button>
          <p className="mt-1.5 text-micro leading-snug text-ink-tertiary">
            Generated with <span className="font-mono">crypto.getRandomValues</span> — the same
            source a password manager uses.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleEncrypt}
        disabled={working || !message || !key}
        className="w-full rounded-lg border border-primary/40 bg-primary/15 py-2.5 text-body-sm font-medium text-ink transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
      >
        {working && stage === 'idle' ? 'Deriving key…' : 'Encrypt message'}
      </button>

      {/* Ciphertext + decrypt */}
      <AnimatePresence initial={false}>
        {stage === 'encrypted' && payload && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition}
            className="space-y-4"
          >
            <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-micro font-medium uppercase tracking-wider text-primary">
                  Ciphertext · AES-256-GCM
                </span>
                <CopyButton value={payload.blob} />
              </div>
              <div className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink-muted">
                {payload.blob}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-hairline pt-3 sm:grid-cols-4">
                <Part label="Salt" value="16 bytes" hint="Random per message" />
                <Part label="Nonce (IV)" value="12 bytes" hint="Never reused" />
                <Part label="Ciphertext" value={`${payload.cipherBytes} bytes`} hint="Includes auth tag" />
                <Part label="PBKDF2" value={`${(PBKDF2_ITERATIONS / 1000).toFixed(0)}k iters`} hint="Key derivation" />
              </div>
            </div>

            <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
              <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
                Try to decrypt it
              </span>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={attemptKey}
                  onChange={(e) => setAttemptKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDecrypt();
                  }}
                  placeholder="Enter a passphrase — right or wrong"
                  className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface-2 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={handleDecrypt}
                  disabled={working || !attemptKey}
                  className="shrink-0 rounded-lg border border-hairline bg-surface-3 px-4 py-2.5 text-body-sm text-ink transition-colors hover:border-hairline-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
                >
                  Decrypt
                </button>
                <button
                  type="button"
                  onClick={() => setAttemptKey(key)}
                  className="shrink-0 rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-caption text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
                >
                  Use correct key
                </button>
              </div>

              <AnimatePresence mode="wait">
                {decrypted.kind !== 'none' && (
                  <motion.div
                    key={decrypted.kind}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    className="mt-3"
                  >
                    {decrypted.kind === 'ok' ? (
                      <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2.5">
                        <div className="text-micro font-medium uppercase tracking-wider text-success">
                          Decrypted · authentication tag verified
                        </div>
                        <div className="mt-1 break-words font-mono text-body-sm text-ink">
                          {decrypted.message}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5">
                        <div className="text-micro font-medium uppercase tracking-wider text-danger">
                          {decrypted.kind === 'bad-key'
                            ? 'Decryption refused'
                            : 'Malformed ciphertext'}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                          {decrypted.kind === 'bad-key'
                            ? 'The authentication tag did not verify. AES-GCM returns nothing at all rather than partial or scrambled text — you cannot tell how close the guess was, which is why guessing gains an attacker no ground.'
                            : 'That input is not a valid payload from this demo.'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Where this shows up */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Use title="Encrypted messaging" body="Signal and WhatsApp encrypt on your device; the server relays bytes it cannot read." />
        <Use title="Password managers" body="Your vault is encrypted with a key derived from your master password, exactly like above." />
        <Use title="Device & backup encryption" body="FileVault, BitLocker and encrypted phone backups protect data when hardware is lost." />
        <Use title="HTTPS" body="Every page you load is encrypted in transit with a key negotiated per session." />
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/[0.07] px-3.5 py-3">
        <div className="text-micro font-medium uppercase tracking-wider text-warning">
          Educational demo, not a secure tool
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
          The cipher and key derivation are genuine browser primitives, but the iteration count
          is lowered to keep this page responsive and the payload format is ad-hoc. Do not use
          it to protect anything real.
        </p>
      </div>
    </div>
  );
}

function Part({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wider text-ink-tertiary">{label}</div>
      <div className="mt-0.5 font-mono text-[12.5px] text-ink">{value}</div>
      <div className="text-micro text-ink-tertiary">{hint}</div>
    </div>
  );
}

function Use({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-3 py-2.5">
      <div className="text-caption font-medium text-ink">{title}</div>
      <p className="mt-1 text-micro leading-snug text-ink-tertiary">{body}</p>
    </div>
  );
}
