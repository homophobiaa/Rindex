import { useState } from 'react';
import { motion } from 'framer-motion';
import { randomHex, generatePassphrase } from '@/lib/crypto-lab/cipher';
import { useMotionTransition } from '@/lib/motion';

interface Row {
  id: string;
  primitive: string;
  accent: string;
  usedFor: string;
  detail: string;
  /** Shown in the sample column — regenerated on demand where relevant. */
  sample: (seed: number) => string;
}

const ROWS: Row[] = [
  {
    id: 'hash',
    primitive: 'Password hashing',
    accent: '#f79009',
    usedFor: 'Account databases',
    detail:
      'A site stores a slow hash of your password. When a breach leaks the table, strong unique passwords stay unreadable — reused ones do not.',
    sample: () => 'argon2id$v=19$m=64MB…',
  },
  {
    id: 'aes',
    primitive: 'Symmetric encryption',
    accent: '#5e6ad2',
    usedFor: 'Messages, devices, backups',
    detail:
      'One key encrypts and decrypts. Your phone, your password vault, and your chat history all rely on it.',
    sample: () => 'AES-256-GCM',
  },
  {
    id: 'session',
    primitive: 'Session tokens',
    accent: '#4cc2ff',
    usedFor: 'Staying signed in',
    detail:
      'After login the site hands you a long random token instead of re-asking for your password. Stealing it is as good as stealing the password — which is why signing out of old devices matters.',
    sample: (s) => randomHex(16 + (s % 2)),
  },
  {
    id: 'sig',
    primitive: 'Digital signatures',
    accent: '#27a644',
    usedFor: 'Verifying software and sites',
    detail:
      'A private key signs, everyone else verifies with the public key. This is how your browser knows a certificate is genuine and your OS knows an update was not tampered with.',
    sample: () => 'ECDSA P-256 · verified',
  },
  {
    id: 'random',
    primitive: 'Secure randomness',
    accent: '#a9b1ff',
    usedFor: 'Recovery codes and keys',
    detail:
      'Every key, salt, nonce and recovery code starts as unpredictable bytes. Predictable randomness has broken more real systems than weak ciphers ever have.',
    sample: (s) => (s % 2 === 0 ? randomHex(5).toUpperCase() : generatePassphrase(2)),
  },
];

/**
 * Closing section: maps each primitive demonstrated above onto the place a
 * reader actually meets it. The randomness rows regenerate live so the
 * "unpredictable" claim is demonstrated rather than asserted.
 */
export function RealWorldMap() {
  const [seed, setSeed] = useState(0);
  const transition = useMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });

  return (
    <div className="space-y-3">
      {ROWS.map((row, i) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...transition, delay: i * 0.05 }}
          className="grid items-start gap-3 rounded-lg border border-hairline bg-surface-2/40 p-3.5 sm:grid-cols-[180px_1fr_auto]"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="h-6 w-0.5 shrink-0 rounded-full"
              style={{ background: row.accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="text-body-sm font-medium text-ink">{row.primitive}</div>
              <div className="text-micro uppercase tracking-wider" style={{ color: row.accent }}>
                {row.usedFor}
              </div>
            </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink-muted">{row.detail}</p>

          <div className="sm:text-right">
            <motion.code
              key={`${row.id}-${seed}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
              className="inline-block break-all rounded border border-hairline bg-surface-3/60 px-2 py-1 font-mono text-micro text-ink-subtle"
            >
              {row.sample(seed)}
            </motion.code>
          </div>
        </motion.div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3">
        <p className="text-caption text-ink-tertiary">
          The token and recovery-code samples come from{' '}
          <span className="font-mono text-ink-subtle">crypto.getRandomValues</span> — regenerate
          them and you will never see a repeat.
        </p>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="shrink-0 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-caption text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
        >
          Regenerate samples
        </button>
      </div>
    </div>
  );
}
