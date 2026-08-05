import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toBase64 } from '@/lib/crypto-lab/encoding';
import { sha256Hex } from '@/lib/crypto-lab/hash';
import { encryptMessage } from '@/lib/crypto-lab/cipher';
import { useMotionTransition } from '@/lib/motion';
import { CopyButton } from './CopyButton';

type LaneId = 'plain' | 'encode' | 'encrypt' | 'hash';

interface Lane {
  id: LaneId;
  label: string;
  tag: string;
  accent: string;
  reversible: string;
  needsSecret: boolean;
}

const LANES: Lane[] = [
  {
    id: 'plain',
    label: 'Plain text',
    tag: 'What you typed',
    accent: '#8a8f98',
    reversible: 'Readable by anyone',
    needsSecret: false,
  },
  {
    id: 'encode',
    label: 'Encoded',
    tag: 'Base64',
    accent: '#4cc2ff',
    reversible: 'Reversible by anyone',
    needsSecret: false,
  },
  {
    id: 'encrypt',
    label: 'Encrypted',
    tag: 'AES-256-GCM',
    accent: '#5e6ad2',
    reversible: 'Reversible with the key',
    needsSecret: true,
  },
  {
    id: 'hash',
    label: 'Hashed',
    tag: 'SHA-256',
    accent: '#f79009',
    reversible: 'Not reversible by design',
    needsSecret: false,
  },
];

/**
 * The page's anchor section: one input, four simultaneous transformations.
 *
 * Seeing Base64 sit next to AES output next to a SHA-256 digest is the
 * fastest way to make the point that the three are not interchangeable.
 */
export function TransformLab() {
  const [input, setInput] = useState('transfer $500 to Ana');
  const [key, setKey] = useState('correct-horse-battery');
  const [outputs, setOutputs] = useState<Record<LaneId, string>>({
    plain: '',
    encode: '',
    encrypt: '',
    hash: '',
  });
  const [busy, setBusy] = useState(false);
  const rowTransition = useMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    (async () => {
      const [hash, enc] = await Promise.all([
        sha256Hex(input),
        input ? encryptMessage(input, key || 'empty-key') : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setOutputs({
        plain: input,
        encode: input ? toBase64(input) : '',
        encrypt: enc ? enc.blob : '',
        hash: input ? hash : '',
      });
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [input, key]);

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <label className="block">
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Message
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a secret…"
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Encryption key
          </span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Any passphrase"
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
      </div>

      {/* Four lanes */}
      <div className="space-y-2.5">
        {LANES.map((lane, i) => (
          <motion.div
            key={lane.id}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...rowTransition, delay: i * 0.05 }}
            className="rounded-lg border border-hairline bg-surface-2/40 p-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: lane.accent }}
                  aria-hidden
                />
                <span className="text-body-sm font-medium text-ink">{lane.label}</span>
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-micro"
                  style={{
                    borderColor: `${lane.accent}44`,
                    background: `${lane.accent}14`,
                    color: lane.accent,
                  }}
                >
                  {lane.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-micro text-ink-tertiary">{lane.reversible}</span>
                {outputs[lane.id] && <CopyButton value={outputs[lane.id]} />}
              </div>
            </div>

            <div className="mt-2 break-all font-mono text-[12.5px] leading-relaxed text-ink-muted">
              {outputs[lane.id] ? (
                <span className={lane.id === 'plain' ? 'text-ink' : undefined}>
                  {truncate(outputs[lane.id], 180)}
                </span>
              ) : (
                <span className="text-ink-tertiary">{busy ? 'computing…' : '(empty)'}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* The lesson */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Point
          accent="#4cc2ff"
          title="Encoding is not security"
          body="Base64 changes how bytes are written, not who can read them. Anyone can decode it instantly — no key involved."
        />
        <Point
          accent="#5e6ad2"
          title="Encryption needs a key"
          body="Change the key above and the ciphertext changes completely. Without the right key there is no way back to the message."
        />
        <Point
          accent="#f79009"
          title="Hashing has no way back"
          body="A digest is a fixed-size fingerprint. You can check whether an input matches it, but you cannot read the input out of it."
        />
      </div>

      <p className="text-caption leading-relaxed text-ink-tertiary">
        Notice the encrypted line changes every time you retype the same message — a fresh
        random salt and nonce are generated per encryption, so identical input never produces
        identical ciphertext. The hash does the opposite: same input, same digest, always.
      </p>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function Point({ accent, title, body }: { accent: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3">
      <div className="text-micro font-medium uppercase tracking-wider" style={{ color: accent }}>
        {title}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
