import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  STEPS,
  APPROX_QUESTIONS,
  type Question,
  type QuestionOption,
} from '@/lib/profile';
import { defaultFactorState, type FactorState } from '@/lib/risk';
import { useProfile } from '@/store/profile';
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

/* ------------------------------------------------------------------ */
/* Adaptive helpers                                                    */
/* ------------------------------------------------------------------ */

/** Is this question visible given the current factor state? */
function isVisible(q: Question, state: FactorState): boolean {
  return !q.condition || q.condition(state);
}

/**
 * Find the next visible {step, question} after the given cursor.
 * Returns 'done' when past the last visible question.
 *
 * NOTE: evaluates conditions against `state` (the NEW state produced
 * by the most recent answer) so skips are always current.
 */
function findNext(cursor: Cursor, state: FactorState): Cursor | 'done' {
  let step = cursor.step;
  let q = cursor.question + 1;

  while (step < STEPS.length) {
    const currentStep = STEPS[step];
    if (q < currentStep.questions.length) {
      if (isVisible(currentStep.questions[q], state)) {
        return { step, question: q };
      }
      q++;
    } else {
      step++;
      q = 0;
    }
  }
  return 'done';
}

/**
 * Count visible questions across all steps for dynamic progress display.
 * Re-evaluates whenever the state changes (some questions become skippable).
 */
function countVisibleQuestions(state: FactorState): number {
  return STEPS.reduce((acc, s) => acc + s.questions.filter((q) => isVisible(q, state)).length, 0);
}

/**
 * Count visible questions per step (for ProgressTrack).
 */
function visiblePerStep(state: FactorState): number[] {
  return STEPS.map((s) => s.questions.filter((q) => isVisible(q, state)).length);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Personal Risk Profiler — top-level state machine.
 *
 * Manages:
 *   • phase (intro / flow / result)
 *   • factorState — shared `@/lib/risk` shape
 *   • cursor — current step/question position
 *   • answers — records which option was selected per question
 *   • adaptive skip logic — conditions evaluated after each answer
 */
export function ProfilerFlow() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [factorState, setFactorState] = useState<FactorState>(() => defaultFactorState());
  const [cursor, setCursor] = useState<Cursor>({ step: 0, question: 0 });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { setResult } = useProfile();

  const answeredCount = Object.keys(answers).length;

  /** How many questions are visible (adaptive, changes per answer). */
  const visibleTotal = useMemo(() => countVisibleQuestions(factorState), [factorState]);

  /** Per-step visible count for ProgressTrack. */
  const visibleByStep = useMemo(() => visiblePerStep(factorState), [factorState]);

  /** Answered questions per step — for the progress bar fill. */
  const answeredByStep = useMemo(
    () => STEPS.map((step) => step.questions.reduce((n, q) => n + (answers[q.id] ? 1 : 0), 0)),
    [answers],
  );

  // Persist completed profile to the shared in-memory store.
  useEffect(() => {
    if (phase !== 'result') return;
    setResult({ state: factorState, answeredCount, totalQuestions: visibleTotal });
  }, [phase, factorState, answeredCount, visibleTotal, setResult]);

  /** Apply a selected option, record the answer, then advance (with skip). */
  const handleSelect = (question: Question, opt: QuestionOption) => {
    const newState = { ...factorState, ...opt.patch } as FactorState;
    setFactorState(newState);
    setAnswers((prev) => ({ ...prev, [question.id]: opt.id }));

    // Brief delay so the selection animation settles before transition.
    window.setTimeout(() => {
      const next = findNext(cursor, newState);
      if (next === 'done') {
        setPhase('result');
      } else {
        setCursor(next);
      }
    }, 400);
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
        <IntroScene onStart={() => setPhase('flow')} totalQuestions={APPROX_QUESTIONS} />
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
        <ProgressTrack
          currentStep={cursor.step}
          answeredByStep={answeredByStep}
          visibleByStep={visibleByStep}
        />

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
                className="text-micro font-medium uppercase tracking-[0.18em]"
                style={{ color: step.accent }}
              >
                {step.eyebrow}
              </span>
              <h1 className="mt-0.5 text-card-title font-medium text-ink">{step.title}</h1>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-ink-tertiary">
              {answeredCount + 1} / {visibleTotal}
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

          {/* Mobile insights */}
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
