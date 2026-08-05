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
 * power the rest of RIndex. The scoring lib used here (`@/lib/risk`) is
 * the same one the assessment and dashboard read from.
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
            Your RiskIndex is a weighted score built from the habits you report,
            combined with entropy math and a simple probability model. It is an
            educational estimate, not a security audit — and every formula behind
            it is on this page.
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
            description="Toggle protective layers and threat conditions to watch the composite RiskIndex, per-pillar scores, and modeled attacker-success probability recompute as you go."
            footnote="These toggles call the same scoring engine as the assessment and the dashboard. There is no separate demo math."
          >
            <ScoreSimulator />
          </MethodSection>

          <MethodSection
            index={3}
            eyebrow="Weakest link"
            title="Your easiest door decides your risk"
            description="An attacker only needs one way in. If each route has an independent chance pᵢ of working, the chance at least one succeeds is 1 − ∏(1 − pᵢ) — a number the weakest route dominates."
            footnote="This is why a strong password and a weak recovery inbox still add up to an easy account takeover."
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
          <p className="text-caption leading-relaxed text-ink-tertiary">
            Every calculation on this page runs in your browser. Nothing you type or
            toggle is sent anywhere or saved.
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
