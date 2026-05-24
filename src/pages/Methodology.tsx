import { motion } from 'framer-motion';
import { MethodSection } from '@/components/methodology/MethodSection';
import { PillarsGrid } from '@/components/methodology/PillarsGrid';
import { ScoreSimulator } from '@/components/methodology/ScoreSimulator';
import { WeakestLinkChain } from '@/components/methodology/WeakestLinkChain';
import { BruteForceCurve } from '@/components/methodology/BruteForceCurve';
import { AttackGraphMini } from '@/components/methodology/AttackGraphMini';
import { CryptoVisual } from '@/components/methodology/CryptoVisual';
import { Takeaways } from '@/components/methodology/Takeaways';

/**
 * Methodology page — "How RiskIndex calculates risk".
 *
 * A transparent, interactive walkthrough of the scoring engine,
 * probability model, and discrete-math/cryptography foundations that
 * power the rest of RIndex. The same scoring lib used here
 * (`@/lib/risk`) will be re-used by the upcoming Personal Risk Profiler.
 */
export default function Methodology() {
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
          <span className="eyebrow">Methodology</span>
          <h1 className="mt-2 text-display-md text-gradient">
            How RiskIndex calculates risk
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body text-ink-subtle">
            RiskIndex combines password analysis, attack-chain modeling,
            probability theory, cryptography, and human-behavior heuristics to
            estimate your digital exposure. Every formula is documented and
            runs locally in your browser.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Pill>Weighted scoring</Pill>
            <Pill>Probability theory</Pill>
            <Pill>Graph theory</Pill>
            <Pill>Cryptography</Pill>
            <Pill>Discrete math</Pill>
          </div>
        </motion.header>

        {/* Sections */}
        <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-20">
          <MethodSection
            index={1}
            eyebrow="Six pillars"
            title="What the score actually measures"
            description="RiskIndex is a weighted composite across six dimensions of digital risk. Each pillar has its own factor set and contributes a fixed weight to the final number."
            flush
            footnote="Weights sum to 1.0 and are the single source of truth for the composite score — both this visualization and the live engine read from the same constants."
          >
            <PillarsGrid />
          </MethodSection>

          <MethodSection
            index={2}
            eyebrow="Live scoring"
            title="Try the engine yourself"
            description="Toggle protective layers and threat conditions to watch the composite RiskIndex, per-pillar scores, and attacker-success probability recompute in real time."
            footnote="The toggles call the exact same scoring engine the upcoming Personal Risk Profiler will use. There is no demo-only math — what you see here is what runs in production."
          >
            <ScoreSimulator />
          </MethodSection>

          <MethodSection
            index={3}
            eyebrow="Weakest link"
            title="A chain breaks at its worst step"
            description="Security is a product of probabilities. The chance an attacker succeeds anywhere along the chain is 1 − ∏(1 − pᵢ) — and a single weak step dominates the entire result."
            footnote="This is conditional probability in plain sight. Strong password + weak recovery email still gives the attacker an easy door."
          >
            <WeakestLinkChain />
          </MethodSection>

          <MethodSection
            index={4}
            eyebrow="Brute force"
            title="Why exponential growth is your friend"
            description="The search space grows as charset^length. The exponent always wins: a long passphrase has more entropy than a short complex string, even though it looks simpler to a human."
          >
            <BruteForceCurve />
          </MethodSection>

          <MethodSection
            index={5}
            eyebrow="Graph theory"
            title="Attack paths as directed graphs"
            description="Real breaches don't happen at one step — they traverse. Hover any node to see how a single compromised credential cascades through pivots toward a high-value goal."
            footnote="The full interactive attack graph lives on the Attack Paths page. The graph here is the mini version that makes the math concrete."
          >
            <AttackGraphMini />
          </MethodSection>

          <MethodSection
            index={6}
            eyebrow="Cryptography"
            title="One-way functions in 64 hex characters"
            description="Hashing converts arbitrary input into a fixed-size fingerprint. Type below and watch the full SHA-256 output recompute — every keystroke produces a completely different result, which is what keeps password databases (relatively) safe."
            footnote="Open the Crypto Lab for the full hashing / encoding / Caesar / brute-force demonstrations."
          >
            <CryptoVisual />
          </MethodSection>

          <MethodSection
            index={7}
            eyebrow="Action plan"
            title="How to lower your RiskIndex"
            description="The single highest-leverage thing you can do is eliminate password reuse. After that, hardware-key MFA on critical accounts. Then recovery hardening. The rest compounds."
            flush
          >
            <Takeaways />
          </MethodSection>
        </div>

        {/* Footer note */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-24 max-w-2xl text-center"
        >
          <p className="text-[12px] leading-relaxed text-ink-tertiary">
            Every calculation on this page runs locally in your browser. No
            answers, toggles, or inputs are transmitted, stored, or logged.
          </p>
        </motion.footer>
      </div>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2/60 px-2.5 py-0.5 text-[11px] text-ink-muted">
      <span className="h-1 w-1 rounded-full bg-primary/80" />
      {children}
    </span>
  );
}
