import { motion } from 'framer-motion';
import { LabSection } from '@/components/crypto-lab/LabSection';
import { HashingDemo } from '@/components/crypto-lab/HashingDemo';
import { CaesarDemo } from '@/components/crypto-lab/CaesarDemo';
import { EncodingConverter } from '@/components/crypto-lab/EncodingConverter';
import { BruteForceSim } from '@/components/crypto-lab/BruteForceSim';

/**
 * Crypto Lab — third major RIndex module.
 *
 * Four interactive sections demonstrate cryptography, number systems, and
 * discrete-math concepts that quietly power the rest of the platform:
 *
 *   1. Real SHA-256 hashing + avalanche visualizer
 *   2. Caesar cipher with live substitution + 26-shift brute force
 *   3. Number-system converter (binary / hex / decimal / base64)
 *   4. Brute-force time estimator with exponential-growth chart
 *
 * Privacy: every calculation runs locally in the browser. No input ever
 * leaves the device.
 */
export default function CryptoLab() {
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
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="eyebrow">Crypto Lab</span>
          <h1 className="mt-2 text-display-md text-gradient">
            See the math behind security
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body text-ink-subtle">
            An interactive playground for the cryptography, number systems,
            and discrete math that quietly power RIndex. Every byte is
            computed locally in your browser — nothing is transmitted.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Pill>Cryptography</Pill>
            <Pill>Number systems</Pill>
            <Pill>Discrete math</Pill>
            <Pill>Brute-force theory</Pill>
          </div>
        </motion.header>

        {/* Lab sections */}
        <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-20">
          <LabSection
            index={1}
            eyebrow="Hashing"
            title="One-way functions & the avalanche effect"
            description="A cryptographic hash maps any input to a fixed-size fingerprint. Changing one tiny thing scrambles roughly half of every output bit — that's how password databases stay safe even after they leak."
            concept="Hashes are deterministic but irreversible: easy to compute, infeasible to invert. Real-world uses include password storage (bcrypt, argon2), file integrity, blockchain, and digital signatures."
            weakness="Same input always produces the same hash. Attackers exploit this with rainbow tables and dictionary attacks — which is why real systems also salt and stretch their hashes."
          >
            <HashingDemo />
          </LabSection>

          <LabSection
            index={2}
            eyebrow="Caesar cipher"
            title="Substitution cipher · the oldest crypto"
            description="Shift every letter by a fixed amount. It's the simplest symmetric cipher ever invented — and the easiest to break. Drag the shift slider to encrypt live."
            concept="Modern ciphers (AES, ChaCha20) generalize the same idea: invertible substitutions controlled by a secret key. Discrete math (modular arithmetic) is the underlying language."
            weakness="Only 25 possible keys. A brute-force attack tries every shift in milliseconds — open the panel below to see all 26 decryptions and spot the plaintext by eye."
          >
            <CaesarDemo />
          </LabSection>

          <LabSection
            index={3}
            eyebrow="Encoding"
            title="Number systems · how computers see text"
            description="Text is bytes. Bytes are numbers. Numbers can be written in many bases. Switch tabs to see the same input in binary, hex, decimal, and base64."
            concept="Every web protocol, file format, and crypto primitive moves bytes around. Reading a hex digest or a base64 token is a daily security skill — it makes invisible data visible."
            weakness="Encoding is not encryption. Base64 looks scrambled but anyone can decode it in two clicks — never use it to hide secrets."
          >
            <EncodingConverter />
          </LabSection>

          <LabSection
            index={4}
            eyebrow="Brute force"
            title="Why a long password beats a complex one"
            description="Pick a character set, a length, and an attacker. The simulator multiplies them out and shows what would actually happen if someone tried every combination."
            concept="Search space grows as charset^length. The exponent dominates: adding one character multiplies the work, while adding one symbol type only widens the base. This is the foundation of every entropy estimate in the Password Lab."
            weakness="Real attackers don't enumerate randomly — they start with leaked passwords, common patterns, and dictionary mutations. The math here is the upper bound, not the average case."
          >
            <BruteForceSim />
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
            Every computation in this lab runs in this page, using the browser&rsquo;s
            built-in Web Crypto API and plain JavaScript. What you type is never sent
            anywhere and is never saved.
          </p>
        </motion.footer>
      </div>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-hairline bg-surface-2/60 px-2.5 py-1 text-[11px] text-ink-subtle">
      {children}
    </span>
  );
}
