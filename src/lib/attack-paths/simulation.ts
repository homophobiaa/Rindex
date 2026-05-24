/**
 * Attack simulation engine.
 *
 * Drives a step-by-step traversal of a scenario's canonical attack path
 * with play / pause / step / reset controls.  Components subscribe via the
 * returned state and React Flow nodes/edges are mutated downstream.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Scenario } from './types';

export type SimStatus = 'idle' | 'running' | 'paused' | 'done';

export interface SimulationState {
  status: SimStatus;
  /** Index in `scenario.path` of the *next* node to activate. */
  stepIndex: number;
  /** Node ids already activated. */
  visited: Set<string>;
  /** Currently-active node id (the most recent step). */
  current: string | null;
  /** Edge ids currently lit on the attack path. */
  activeEdges: Set<string>;
}

const STEP_INTERVAL_MS = 900;

export function useAttackSimulation(scenario: Scenario) {
  const [state, setState] = useState<SimulationState>(() => initial());
  const timerRef = useRef<number | null>(null);

  // Reset whenever the scenario changes.
  useEffect(() => {
    clearTimer(timerRef);
    setState(initial());
  }, [scenario.id]);

  const stepOnce = useCallback(() => {
    setState((prev) => advance(prev, scenario));
  }, [scenario]);

  const play = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'running' }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) =>
      prev.status === 'running' ? { ...prev, status: 'paused' } : prev,
    );
  }, []);

  const reset = useCallback(() => {
    clearTimer(timerRef);
    setState(initial());
  }, []);

  // Driver loop — only ticks while running.
  useEffect(() => {
    clearTimer(timerRef);
    if (state.status !== 'running') return;
    if (state.stepIndex >= scenario.path.length) return;
    timerRef.current = window.setTimeout(stepOnce, STEP_INTERVAL_MS);
    return () => clearTimer(timerRef);
  }, [state.status, state.stepIndex, scenario.path.length, stepOnce]);

  // Cleanup on unmount.
  useEffect(() => () => clearTimer(timerRef), []);

  return { state, play, pause, reset, stepOnce };
}

function initial(): SimulationState {
  return {
    status: 'idle',
    stepIndex: 0,
    visited: new Set(),
    current: null,
    activeEdges: new Set(),
  };
}

function advance(prev: SimulationState, scenario: Scenario): SimulationState {
  if (prev.stepIndex >= scenario.path.length) {
    return { ...prev, status: 'done' };
  }

  const nextId = scenario.path[prev.stepIndex];
  const visited = new Set(prev.visited);
  visited.add(nextId);

  // Light the edge connecting the previous node to this one (if it exists
  // on the canonical path).
  const activeEdges = new Set(prev.activeEdges);
  if (prev.current) {
    const edge = scenario.edges.find(
      (e) => e.source === prev.current && e.target === nextId,
    );
    if (edge) activeEdges.add(edge.id);
  }

  const nextStep = prev.stepIndex + 1;
  const status: SimStatus =
    nextStep >= scenario.path.length ? 'done' : prev.status;

  return {
    status,
    stepIndex: nextStep,
    visited,
    current: nextId,
    activeEdges,
  };
}

function clearTimer(ref: React.MutableRefObject<number | null>) {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

/* ------------------------------------------------------------------ */
/* Probability helpers — used by the risk-breakdown panel.             */
/* ------------------------------------------------------------------ */

/**
 * Multiply all edge probabilities along the canonical attack path.
 * Represents the rough chance an unprotected target falls all the way.
 */
export function chainProbability(scenario: Scenario): number {
  let p = 1;
  for (let i = 0; i < scenario.path.length - 1; i++) {
    const src = scenario.path[i];
    const tgt = scenario.path[i + 1];
    const edge = scenario.edges.find((e) => e.source === src && e.target === tgt);
    if (edge?.data) p *= edge.data.probability;
  }
  return p;
}

/** Find the lowest-probability edge — i.e. the natural weakest link. */
export function weakestLink(scenario: Scenario):
  | { edgeId: string; source: string; target: string; probability: number }
  | null {
  let weakest: { edgeId: string; source: string; target: string; probability: number } | null =
    null;
  for (let i = 0; i < scenario.path.length - 1; i++) {
    const src = scenario.path[i];
    const tgt = scenario.path[i + 1];
    const edge = scenario.edges.find((e) => e.source === src && e.target === tgt);
    if (!edge?.data) continue;
    if (!weakest || edge.data.probability < weakest.probability) {
      weakest = {
        edgeId: edge.id,
        source: src,
        target: tgt,
        probability: edge.data.probability,
      };
    }
  }
  return weakest;
}

/** Used by the breakdown panel to render percentages succinctly. */
export function formatPct(p: number): string {
  if (p <= 0) return '0%';
  if (p < 0.005) return '<1%';
  if (p > 0.995) return '>99%';
  return `${Math.round(p * 100)}%`;
}

/** Stable list of unique nodes on the path (preserves order). */
export function usePathNodes(scenario: Scenario) {
  return useMemo(
    () =>
      scenario.path
        .map((id) => scenario.nodes.find((n) => n.id === id))
        .filter((n): n is NonNullable<typeof n> => !!n),
    [scenario],
  );
}
