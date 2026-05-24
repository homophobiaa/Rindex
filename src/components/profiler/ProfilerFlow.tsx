import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  STEPS,
  TOTAL_QUESTIONS,
  type ProfilerStep,
  type Question,
  type QuestionOption,
} from '@/lib/profile';
import { defaultFactorState, type FactorState } from '@/lib/risk';
import { ProgressTrack } from './ProgressTrack';
import { LiveScorePanel } from './LiveScorePanel';
import { LiveInsights } from './LiveInsights';
import { QuestionCard } from './QuestionCard';
import { IntroScene } from './IntroScene';
import { ResultDashboard } from './ResultDashboard';

type Phase = 'intro' | 'flow' | 'result';

interface Cursor {
  step: number;
  question: number;
}

/**
 * Personal Risk Profiler — top-level state machine.
 *
 * Owns:
 *   • phase (intro / flow / result)
 *   • factorState — the shared `@/lib/risk` shape; same engine used by
 *     Methodology and the future fix plan
 *   • cursor — which step/question is active
 *   • answers — id of the option selected per question (for resume UX
 *     when a user backs out and changes their mind)
 *
 * All rendering decisions live in `<QuestionCard>`, `<LiveScorePanel>`,
 * and `<ResultDashboard>` — this component is the controller only.
 */
export function ProfilerFlow() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [factorState, setFactorState] = useState<FactorState>(() => defaultFactorState());
  const [cursor, setCursor] = useState<Cursor>({ step: 0, question: 0 });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(answers).length;

  const answeredByStep = useMemo(() => {
    return STEPS.map((step) =>
      step.questions.reduce((n, q) => n + (answers[q.id] ? 1 : 0), 0),
    );
  }, [answers]);

  /** Advance to the next question or step. End -> result phase. */
  const advance = () => {
    setCursor((prev) => {
      const step: ProfilerStep = STEPS[prev.step];
      if (prev.question + 1 < step.questions.length) {
        return { step: prev.step, question: prev.question + 1 };
      }
      if (prev.step + 1 < STEPS.length) {
        return { step: prev.step + 1, question: 0 };
      }
      // Past the last step — show result.
      setPhase('result');
      return prev;
    });
  };

  /** Apply a selected option: patch the shared factor state, record
   *  the choice, schedule advancement on the next tick so the user
   *  sees the option settle into its "selected" state before moving on. */
  const handleSelect = (question: Question, opt: QuestionOption) => {
    setFactorState((prev) => ({ ...prev, ...opt.patch }) as FactorState);
    setAnswers((prev) => ({ ...prev, [question.id]: opt.id }));
    // Brief delay so the selection animation has time to play.
    window.setTimeout(advance, 420);
  };

  const restart = () => {
    setFactorState(defaultFactorState());
    setCursor({ step: 0, question: 0 });
    setAnswers({});
    setPhase('intro');
  };

  /* ---------------------------------------------------------------- */

  if (phase === 'intro') {
    return (
      <div className="container-rindex pt-28">
        <IntroScene onStart={() => setPhase('flow')} totalQuestions={TOTAL_QUESTIONS} />
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="container-rindex pt-28">
        <ResultDashboard state={factorState} onRestart={restart} />
      </div>
    );
  }

  /* Flow phase ------------------------------------------------------- */

  const step = STEPS[cursor.step];
  const question = step.questions[cursor.question];
  const selectedId = answers[question.id];

  return (
    <div className="container-rindex pt-24">
      {/* Top progress + step header */}
      <div className="mx-auto max-w-5xl">
        <ProgressTrack currentStep={cursor.step} answeredByStep={answeredByStep} />

        <AnimatePresence mode="wait">
          <motion.header
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex items-baseline justify-between"
          >
            <div>
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
                style={{ color: step.accent }}
              >
                {step.eyebrow}
              </span>
              <h1 className="mt-0.5 text-card-title font-medium text-ink">
                {step.title}
              </h1>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-ink-tertiary">
              {answeredCount + 1} / {TOTAL_QUESTIONS}
            </span>
          </motion.header>
        </AnimatePresence>
      </div>

      {/* Main split: question + live panel */}
      <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuestionCard
                question={question}
                selectedId={selectedId}
                onSelect={(opt) => handleSelect(question, opt)}
                accent={step.accent}
              />
            </motion.div>
          </AnimatePresence>

          {/* Mobile insights — folded under the question */}
          <div className="mt-6 lg:hidden">
            <LiveInsights state={factorState} />
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <LiveScorePanel state={factorState} />
          <div className="hidden lg:block">
            <LiveInsights state={factorState} />
          </div>
        </div>
      </div>
    </div>
  );
}
