import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FactorState } from '@/lib/risk';

/**
 * In-memory Profile store.
 *
 * Holds the result of the most recent Personal Risk Profiler run so the
 * Unified Risk Dashboard can read it without re-asking the questions.
 *
 * IMPORTANT — privacy by design:
 *   This deliberately lives in React state ONLY. Nothing is written to
 *   localStorage / sessionStorage / cookies / the network. A page reload
 *   clears the profile, which matches the promise made everywhere else
 *   in the app: "reload this tab and your profile is gone."
 *
 * The stored shape is the SHARED `@/lib/risk` FactorState — the same
 * surface the scoring engine, methodology page, and profiler all use.
 * There is no parallel data model.
 */

export interface ProfileResult {
  /** Shared factor state produced by the profiler. */
  state: FactorState;
  /** How many questions the user answered (drives the confidence signal). */
  answeredCount: number;
  /** Total questions available when the profile was captured. */
  totalQuestions: number;
  /** Epoch ms the profile was captured — used for the "captured Xm ago" line. */
  capturedAt: number;
}

interface ProfileContextValue {
  result: ProfileResult | null;
  /** Persist a completed profiler run (in memory only). */
  setResult: (result: Omit<ProfileResult, 'capturedAt'>) => void;
  /** Forget the current profile (e.g. "clear my data"). */
  clear: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<ProfileResult | null>(null);

  const value = useMemo<ProfileContextValue>(
    () => ({
      result,
      setResult: (r) => setResultState({ ...r, capturedAt: Date.now() }),
      clear: () => setResultState(null),
    }),
    [result],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/** Access the in-memory profile store. Must be used under <ProfileProvider>. */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a <ProfileProvider>');
  }
  return ctx;
}
