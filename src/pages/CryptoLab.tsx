import { motion } from 'framer-motion';
import { LabSection } from '@/components/crypto-lab/LabSection';
import { TransformLab } from '@/components/crypto-lab/TransformLab';
import { PasswordHashingDemo } from '@/components/crypto-lab/PasswordHashingDemo';
import { EncryptionDemo } from '@/components/crypto-lab/EncryptionDemo';
import { BruteForceSim } from '@/components/crypto-lab/BruteForceSim';
import { CaesarDemo } from '@/components/crypto-lab/CaesarDemo';
import { RealWorldMap } from '@/components/crypto-lab/RealWorldMap';
import { useMotionTransition } from '@/lib/motion';

/**
 * Cryptography Lab.
 *
 * Interactive demonstrations of the primitives that protect everyday
 * accounts: what encoding/encryption/hashing actually differ on, how
 * password storage works, real AES-GCM round-trips, brute-force scale,
 * and where each piece shows up in practice.
 *
 * Route stays `/crypto-lab` for link compatibility.
 *
 * Everything runs on real browser APIs (Web Crypto) except where a panel
 * explicitly labels itself as illustrative.
 */
export default function CryptoLab() {
  const heroTransition = useMotionTransition({ duration: 0.55, ease: [0.16, 1, 0.3, 1] });

  return (
    <main className="relative pt-28 pb-section">
      {/* Ambient background — same language as the rest of RIndex */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <div className="container-rindex">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={heroTransition}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="eyebrow">Cryptography Lab</span>
          <h1 className="mt-2 text-display-md text-gradient">
            The machinery behind a locked account
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body text-ink-subtle">
            Cryptography is what keeps your passwords unreadable after a breach, your messages
            private in transit, and your phone useless to whoever finds it. Below are simplified,
            interactive demonstrations of each piece — running on real browser crypto, on your
            device, with nothing sent anywhere.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Pill tone="success">Real Web Crypto</Pill>
            <Pill>Runs in this page</Pill>
            <Pill tone="warning">Educational — not a security tool</Pill>
          </div>
        </motion.header>

        {/* Lab sections */}
        <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-20">
          <LabSection
            index={1}
            eyebrow="Foundations"
            title="Encoding, encryption and hashing are not the same thing"
            description="Three transformations that all turn readable text into gibberish — and are constantly confused for one another. Type once and watch all three happen side by side."
            concept="Pick the right tool: encoding for moving bytes around, encryption for keeping something secret you will need back, hashing for verifying something without storing it."
            weakness="Base64 fools people constantly. If you can decode it without a secret, it protects nothing — it is a formatting choice, not a lock."
          >
            <TransformLab />
          </LabSection>

          <LabSection
            index={2}
            eyebrow="Password storage"
            title="What a website should keep instead of your password"
            description="A site never needs your actual password — only proof you know it. Here is what that looks like, why one changed character rewrites everything, and what a salt is for."
            concept="When a breach leaks a properly hashed table, the passwords are not in it. Attackers have to guess each one, one at a time, against a deliberately slow function."
            weakness="Hashing alone is not enough. Without a salt, identical passwords produce identical rows and a precomputed table cracks them all at once."
          >
            <PasswordHashingDemo />
          </LabSection>

          <LabSection
            index={3}
            eyebrow="Encryption"
            title="Lock a message, then try to open it with the wrong key"
            description="Real AES-256-GCM with a key derived from your passphrase. Encrypt something, then attempt to decrypt it with a key you invent — and watch what a modern cipher does when the key is wrong."
            concept="This exact construction protects your password vault, your encrypted backups, your phone's storage, and every HTTPS connection you make."
            weakness="Encryption moves the problem to the key. Lose it and the data is gone; leak it and the encryption never happened. Key management is the hard part."
          >
            <EncryptionDemo />
          </LabSection>

          <LabSection
            index={4}
            eyebrow="Attack scale"
            title="How long a guessing attack actually takes"
            description="Choose a character set, a length and an attacker, and watch the search space grow. The exponent does the work: one more character multiplies the effort, one more symbol type only widens the base."
            concept="This is the reasoning behind every entropy figure in the Password Lab — and the reason a long passphrase beats a short jumble of symbols."
            weakness="These are modeled estimates for a randomly chosen password. Real attacks start from leaked lists and predictable patterns, where a 'strong-looking' password can fall in seconds."
          >
            <BruteForceSim />
          </LabSection>

          <LabSection
            index={5}
            eyebrow="Historical · optional"
            title="Why a small key is no key at all"
            description="The Caesar shift is two thousand years old and takes one screen to break completely. It is here for contrast — to show what modern ciphers had to fix."
            concept="Historical only. Trivially breakable, and never appropriate for protecting anything real. The lesson is about keyspace size, not about the cipher."
          >
            <CaesarDemo />
          </LabSection>

          <LabSection
            index={6}
            eyebrow="In practice"
            title="Where each piece shows up in your day"
            description="Every primitive above is already running somewhere in your accounts, usually invisibly."
            concept="Knowing which primitive protects what makes security advice concrete: why unique passwords matter after a breach, why signing out of old sessions helps, why recovery codes must be stored somewhere safe."
            flushFooter
          >
            <RealWorldMap />
          </LabSection>
        </div>

        {/* Footer note */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-24 max-w-2xl text-center"
        >
          <p className="text-caption leading-relaxed text-ink-tertiary">
            Hashes, ciphers and random values on this page come from the browser&rsquo;s built-in
            Web Crypto API and run in this tab. What you type is never sent anywhere and is never
            saved. These demos exist to explain how the primitives behave — they are not hardened
            tools, and nothing here should be used to protect real secrets.
          </p>
        </motion.footer>
      </div>
    </main>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-success/30 bg-success/10 text-success'
      : tone === 'warning'
        ? 'border-warning/30 bg-warning/10 text-warning'
        : 'border-hairline bg-surface-2/60 text-ink-subtle';
  return (
    <span className={`rounded-full border px-2.5 py-1 text-micro ${toneClass}`}>{children}</span>
  );
}
