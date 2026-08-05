import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  sha256Hex,
  sha256Salted,
  randomSalt,
  diffHashes,
  tinyPerturbation,
  type HashDiff,
} from '@/lib/crypto-lab/hash';
import { useMotionTransition } from '@/lib/motion';
import { CopyButton } from './CopyButton';

/**
 * Password-storage demonstration.
 *
 * Three lessons, one input:
 *   1. Deterministic — the same password always yields the same digest.
 *   2. Avalanche — a one-character change rewrites the whole digest.
 *   3. Salting — two users with the same password get different rows.
 *
 * The digests are genuine Web Crypto SHA-256. The "cracking" panel is
 * clearly labeled as a lookup demonstration, not a real attack.
 */

/** Passwords an attacker would try first — precomputed lookup demo. */
const COMMON = ['123456', 'password', 'qwerty', 'letmein', 'admin', 'iloveyou'];

export function PasswordHashingDemo() {
  const [password, setPassword] = useState('hunter2');
  const [salt, setSalt] = useState(() => randomSalt());
  const [unsalted, setUnsalted] = useState('');
  const [salted, setSalted] = useState('');
  const [twinHash, setTwinHash] = useState('');
  const [commonTable, setCommonTable] = useState<{ pw: string; hash: string }[]>([]);

  const twin = useMemo(() => tinyPerturbation(password), [password]);
  const readout = useMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      sha256Hex(password),
      sha256Salted(salt, password),
      sha256Hex(twin),
    ]).then(([u, s, t]) => {
      if (cancelled) return;
      setUnsalted(u);
      setSalted(s);
      setTwinHash(t);
    });
    return () => {
      cancelled = true;
    };
  }, [password, salt, twin]);

  // Precompute the "rainbow table" once — it never depends on user input.
  useEffect(() => {
    let cancelled = false;
    Promise.all(COMMON.map((pw) => sha256Hex(pw))).then((hashes) => {
      if (cancelled) return;
      setCommonTable(COMMON.map((pw, i) => ({ pw, hash: hashes[i] })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const diff: HashDiff | null = unsalted && twinHash ? diffHashes(unsalted, twinHash) : null;
  const cracked = commonTable.find((r) => r.hash === unsalted);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <label className="block">
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Password to store
          </span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            placeholder="Try a common one…"
            className="w-full rounded-lg border border-hairline bg-surface-2/60 px-3.5 py-2.5 font-mono text-body-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-primary/60 focus:bg-surface-2"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Per-user salt
          </span>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 truncate rounded-lg border border-hairline bg-surface-2/60 px-3 py-2.5 font-mono text-body-sm text-ink-muted">
              {salt}
            </div>
            <button
              type="button"
              onClick={() => setSalt(randomSalt())}
              className="shrink-0 rounded-lg border border-hairline bg-surface-2 px-3 text-caption text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
            >
              New
            </button>
          </div>
        </div>
      </div>

      {/* Stored rows */}
      <div className="space-y-2.5">
        <StoredRow
          label="Stored without salt"
          sub="sha256(password)"
          hash={unsalted}
          tone="#f79009"
        />
        <StoredRow
          label="Stored with salt"
          sub="sha256(salt + password)"
          hash={salted}
          tone="#27a644"
        />
        <StoredRow
          label="One character changed"
          sub={`sha256("${truncate(twin, 24)}")`}
          hash={twinHash}
          tone="#5e6ad2"
          changedMask={diff?.changedMask}
        />
      </div>

      {/* Avalanche readout */}
      {diff && (
        <motion.div
          key={diff.diffBits}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={readout}
          className="grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface-2/40 p-3.5 sm:grid-cols-3"
        >
          <Metric label="Bits changed" value={`${diff.diffBits} / ${diff.totalBits}`} />
          <Metric
            label="Proportion flipped"
            value={`${((diff.diffBits / diff.totalBits) * 100).toFixed(0)}%`}
            accent
          />
          <Metric label="Digest length" value="256 bits · 64 hex" />
        </motion.div>
      )}

      {/* Lookup demonstration */}
      <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
            Precomputed lookup — 6 common passwords
          </span>
          <span className="rounded-full border border-hairline bg-surface-3 px-2 py-0.5 text-micro text-ink-tertiary">
            Real SHA-256, tiny table
          </span>
        </div>
        <motion.p
          key={cracked ? 'hit' : 'miss'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={readout}
          className="mt-2 text-body-sm"
        >
          {cracked ? (
            <span className="text-danger">
              Match found — the unsalted digest is <strong>{cracked.pw}</strong>. No cracking
              needed; the answer was already in the table.
            </span>
          ) : (
            <span className="text-ink-subtle">
              Not in this six-entry table. Real attackers use lists of billions, so &ldquo;not
              found here&rdquo; means very little.
            </span>
          )}
        </motion.p>
        <p className="mt-2 text-caption leading-relaxed text-ink-tertiary">
          The salted row above cannot be looked up this way — the attacker would have to rebuild
          the entire table for every individual salt. That is exactly what salt is for.
        </p>
      </div>

      {/* Honest limitation */}
      <div className="rounded-lg border border-warning/30 bg-warning/[0.07] px-3.5 py-3">
        <div className="text-micro font-medium uppercase tracking-wider text-warning">
          Salted SHA-256 is still not password storage
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
          SHA-256 is designed to be fast, and speed is the enemy here — a GPU computes billions
          of these per second. Real systems use a deliberately slow algorithm such as{' '}
          <span className="font-mono text-ink">bcrypt</span>,{' '}
          <span className="font-mono text-ink">scrypt</span> or{' '}
          <span className="font-mono text-ink">Argon2</span>, tuned so each guess costs real
          time. This section demonstrates what hashing and salting <em>do</em>, not how to build
          a login system.
        </p>
      </div>

      <p className="text-caption text-ink-subtle">
        Want to know how long your own password would hold up?{' '}
        <Link to="/password-lab" className="text-primary underline-offset-2 hover:underline">
          Open the Password Lab
        </Link>{' '}
        — it scores entropy locally, and never stores what you type.
      </p>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function StoredRow({
  label,
  sub,
  hash,
  tone,
  changedMask,
}: {
  label: string;
  sub: string;
  hash: string;
  tone: string;
  changedMask?: boolean[];
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-body-sm font-medium text-ink">{label}</span>
          <span className="ml-2 font-mono text-micro text-ink-tertiary">{sub}</span>
        </div>
        {hash && <CopyButton value={hash} />}
      </div>
      <div className="mt-2 break-all font-mono text-[12px] leading-relaxed">
        {hash ? (
          hash.split('').map((ch, i) =>
            changedMask?.[i] ? (
              <span key={i} className="text-danger">
                {ch}
              </span>
            ) : (
              <span key={i} style={{ color: tone }}>
                {ch}
              </span>
            ),
          )
        ) : (
          <span className="text-ink-tertiary">hashing…</span>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-micro font-medium uppercase tracking-wider text-ink-tertiary">
        {label}
      </div>
      <div
        className={
          accent
            ? 'mt-0.5 font-mono text-[14px] tabular-nums text-danger'
            : 'mt-0.5 font-mono text-[13px] tabular-nums text-ink'
        }
      >
        {value}
      </div>
    </div>
  );
}
