import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MethodSection } from '@/components/methodology/MethodSection';
import { KnowledgeLedger } from '@/components/methodology/KnowledgeLedger';
import { PillarsGrid } from '@/components/methodology/PillarsGrid';
import { ScoreFlow } from '@/components/methodology/ScoreFlow';
import { ScoreSimulator } from '@/components/methodology/ScoreSimulator';
import { WeakestLinkChain } from '@/components/methodology/WeakestLinkChain';
import { ModeledNumbers } from '@/components/methodology/ModeledNumbers';
import { RecommendationLogic } from '@/components/methodology/RecommendationLogic';
import { PrivacyReality, Limitations } from '@/components/methodology/LimitsAndPrivacy';
import { QUESTION_FACTS, FACTOR_FACTS, SCORE_RANGE } from '@/lib/methodology/facts';
import { useMotionTransition } from '@/lib/motion';

const REPO = 'https://github.com/homophobiaa/Rindex';

/**
 * Methodology — the page that shows its work.
 *
 * Structure follows the reader's actual questions: what is this thing,
 * what does it know, how does a click become a number, what do the
 * confident-looking percentages mean, and what is it not.
 *
 * Every figure quoted about the engine is derived in
 * `@/lib/methodology/facts` from the real scoring source, so the copy
 * cannot drift away from the implementation.
 */
export default function Methodology() {
  const heroTransition = useMotionTransition({ duration: 0.55, ease: [0.16, 1, 0.3, 1] });

  return (
    <main className="relative pt-28 pb-section">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-radial-fade opacity-70 blur-3xl" />
        <div className="absolute inset-0 bg-grid-fade opacity-[0.08] [background-size:48px_48px] mask-fade-edges" />
      </div>

      <div className="container-rindex">
        {/* Opening */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={heroTransition}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="eyebrow">Methodology</span>
          <h1 className="mt-2 text-balance text-display-md text-gradient">
            Trust the score, or don&rsquo;t.
            <br />
            <span className="text-gradient-primary">Here is the whole recipe.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body text-ink-subtle">
            No AI reads your answers. No server scans your accounts. Nothing is looked up
            anywhere. Your RiskIndex is roughly {QUESTION_FACTS.typical} multiple-choice answers
            run through {FACTOR_FACTS.total} named switches and six fixed weights — arithmetic
            you can check by hand, on this page, right now.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <Denial title="No hidden model">
              Every weight is a constant in a file you can open.
            </Denial>
            <Denial title="No account access">
              It never signs in anywhere, because there is nowhere to sign in.
            </Denial>
            <Denial title="No oracle">
              It cannot tell you whether you will be attacked. Nothing can.
            </Denial>
          </div>
        </motion.header>

        <div className="mx-auto mt-20 flex max-w-5xl flex-col gap-20">
          <MethodSection
            index={1}
            eyebrow="Inputs"
            title="What it actually has to work with"
            description="Most security tools are vague about this, which is how a questionnaire ends up sounding like a background check. Here is the complete inventory, both columns."
            flush
          >
            <KnowledgeLedger />
          </MethodSection>

          <MethodSection
            index={2}
            eyebrow="Questions & pillars"
            title="Six pillars, unequal on purpose"
            description={`The bank holds ${QUESTION_FACTS.total} questions across ${QUESTION_FACTS.steps} steps, of which ${QUESTION_FACTS.conditional} only appear when an earlier answer makes them relevant — asking about backup codes after you said you have no MFA would be rude. Most people see about ${QUESTION_FACTS.typical}.`}
            flush
            footnote="Weights are considered judgement, tuned so a careful profile lands low and a careless one lands high. They are not fitted to breach data, because no such dataset was used. The bars above compare weights to each other, not to 100%."
          >
            <PillarsGrid />
          </MethodSection>

          <MethodSection
            index={3}
            eyebrow="The arithmetic"
            title="One click, followed all the way down"
            description="This is the entire pipeline: an answer flips a switch, the switch moves a pillar, the pillar gets multiplied by its weight, the six results are added. Toggle the example and every number below recomputes using the same functions the real assessment calls."
            flush
          >
            <ScoreFlow />
          </MethodSection>

          <MethodSection
            index={4}
            eyebrow="Try it"
            title="The whole engine, exposed"
            description={`Every switch in the model, with nothing hidden behind an average. Turn everything protective on and the composite bottoms out at ${SCORE_RANGE.best}; turn every threat on and it tops out at ${SCORE_RANGE.worst}. There is no scoring path here that the assessment does not also use.`}
          >
            <ScoreSimulator />
          </MethodSection>

          <MethodSection
            index={5}
            eyebrow="Weak links"
            title="The easiest door decides the outcome"
            description="An attacker needs one way in, not all of them. If each route independently has a chance pᵢ of working, the chance at least one succeeds is 1 − ∏(1 − pᵢ). Drag the sliders and watch the total refuse to care about your strong routes."
            footnote="Worth being precise: this models independent alternative routes into the same account, which is why the formula is 1 − ∏(1 − pᵢ). A strictly sequential chain, where every step must succeed in order, would be ∏ pᵢ instead — a different question with a different answer."
          >
            <WeakestLinkChain />
          </MethodSection>

          <MethodSection
            index={6}
            eyebrow="Modeled numbers"
            title="Very scientific-looking percentages, explained"
            description="Some outputs are calculated from your answers. Others are curves somebody chose because they felt proportionate. Both render as confident percentages, so here is which is which."
            flush
          >
            <ModeledNumbers />
          </MethodSection>

          <MethodSection
            index={7}
            eyebrow="Recommendations"
            title="How the fix list gets its order"
            description="Not by severity, and not by whatever sounds most frightening. By how many points a fix removes, divided by how much of a nuisance it is."
            flush
          >
            <RecommendationLogic />
          </MethodSection>

          <MethodSection
            index={8}
            eyebrow="Passwords"
            title="The one number that is not from the questionnaire"
            description="If you use the Password Lab, that score comes from a separate calculation: entropy estimated as length × log₂(charset), minus penalties for patterns a real cracker would exploit first — dictionary words, keyboard runs, a year on the end."
            footnote="Crack times are modeled from an assumed guessing rate, stated next to each tier, and assume a randomly chosen password. Real attacks start from leaked password lists and predictable mutations, which is faster than brute force by an enormous margin."
          >
            <PasswordPointer />
          </MethodSection>

          <MethodSection
            index={9}
            eyebrow="Privacy"
            title="Where your answers go, precisely"
            description="Short version: nowhere. Longer version, because “nowhere” is the kind of claim that deserves specifics."
            flush
          >
            <PrivacyReality />
          </MethodSection>

          <MethodSection
            index={10}
            eyebrow="Limitations"
            title="The parts a less honest tool would bury"
            description="This is a model built from ten answers and some hand-tuned constants. It is genuinely useful for working out what to fix first, and genuinely unable to do most of what people expect from a security score."
            flush
          >
            <Limitations />
          </MethodSection>

          <MethodSection
            index={11}
            eyebrow="Verify"
            title="Do not take our word for it"
            description="Everything described above is a few hundred lines of TypeScript. If a number here looks wrong, the file that produced it is one click away."
            flush
          >
            <InspectIt />
          </MethodSection>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-24 max-w-2xl text-center"
        >
          <p className="text-caption leading-relaxed text-ink-tertiary">
            Every calculation on this page ran in your browser while you read it. Nothing you
            typed or toggled was sent anywhere or saved. This is a model, not a crystal ball —
            treat the number as a to-do list, not a verdict.
          </p>
        </motion.footer>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Denial({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1/60 px-3.5 py-3 text-left">
      <div className="flex items-center gap-2">
        <span className="text-danger" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-body-sm font-medium text-ink">{title}</span>
      </div>
      <p className="mt-1 text-caption leading-snug text-ink-tertiary">{children}</p>
    </div>
  );
}

function PasswordPointer() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-surface-2/40 p-4">
        <div className="font-mono text-caption text-ink-muted">
          effective bits = length × log₂(charset) − Σ penalties
        </div>
        <p className="mt-2 text-body-sm leading-relaxed text-ink-subtle">
          The charset is inferred from which character types appear. Penalties subtract bits for
          things a cracker tries early — so a long password full of predictable structure can
          score below a shorter random one. That is the intended behaviour, not a bug.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Pointer
          to="/password-lab"
          title="Password Lab"
          body="Score a password locally and see the penalties itemized against it."
        />
        <Pointer
          to="/crypto-lab"
          title="Cryptography Lab"
          body="Where the entropy maths comes from, plus what a real hashing and encryption round-trip looks like."
        />
      </div>
    </div>
  );
}

function Pointer({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm font-medium text-ink">{title}</span>
        <span className="text-primary transition-transform group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </div>
      <p className="mt-0.5 text-caption leading-snug text-ink-tertiary">{body}</p>
    </Link>
  );
}

const SOURCE_FILES = [
  { path: 'src/lib/risk/factors.ts', what: 'Every switch, and what each one is worth.' },
  { path: 'src/lib/risk/pillars.ts', what: 'The six weights. They sum to 1.00.' },
  { path: 'src/lib/risk/scoring.ts', what: 'Normalization, the composite, the exposure curve.' },
  { path: 'src/lib/profile/questions.ts', what: 'All questions and the skip conditions.' },
  { path: 'src/lib/dashboard/insights.ts', what: 'Recommendation ranking and projections.' },
  { path: 'CLAIMS_AUDIT.md', what: 'A running list of our own claims we think deserve scrutiny.' },
];

function InspectIt() {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {SOURCE_FILES.map((f) => (
          <a
            key={f.path}
            href={`${REPO}/blob/main/${f.path}`}
            target="_blank"
            rel="noreferrer noopener"
            className="group rounded-lg border border-hairline bg-surface-2/40 px-3.5 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
          >
            <div className="flex items-center justify-between gap-2">
              <code className="min-w-0 break-all font-mono text-caption text-ink">{f.path}</code>
              <span
                className="shrink-0 text-ink-tertiary transition-colors group-hover:text-primary"
                aria-hidden
              >
                ↗
              </span>
            </div>
            <p className="mt-0.5 text-caption text-ink-tertiary">{f.what}</p>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-1/60 px-4 py-3.5">
        <p className="text-body-sm text-ink-muted">
          Read it, disagree with a weight, and change it. That is the entire point of publishing
          the numbers.
        </p>
        <div className="flex gap-2">
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-caption font-medium text-ink transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
          >
            Source on GitHub
          </a>
          <a
            href={`${REPO}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-hairline bg-surface-2 px-4 py-2 text-caption text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/60"
          >
            License
          </a>
        </div>
      </div>
    </div>
  );
}
