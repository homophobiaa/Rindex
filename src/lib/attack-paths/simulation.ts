/**
 * Attack simulation engine.
 *
 * Drives a step-by-step traversal of a scenario's canonical attack path
 * with play / pause / step / reset controls and a speed multiplier.
 * Components subscribe to the returned `state`; the React Flow canvas
 * mutates node + edge styling downstream.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AttackNode, Scenario } from './types';

export type SimStatus = 'idle' | 'running' | 'paused' | 'done';
export type SimSpeed = 0.5 | 1 | 2;

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
  /** Playback speed multiplier. */
  speed: SimSpeed;
}

const BASE_INTERVAL_MS = 1100;

export function useAttackSimulation(scenario: Scenario) {
  const [state, setState] = useState<SimulationState>(() => initial());
  const timerRef = useRef<number | null>(null);

  // Reset whenever the scenario changes.
  useEffect(() => {
    clearTimer(timerRef);
    setState((prev) => ({ ...initial(), speed: prev.speed }));
  }, [scenario.id]);

  const stepOnce = useCallback(() => {
    setState((prev) => advance(prev, scenario));
  }, [scenario]);

  const play = useCallback(() => {
    setState((prev) =>
      prev.status === 'done' ? prev : { ...prev, status: 'running' },
    );
  }, []);

  const pause = useCallback(() => {
    setState((prev) =>
      prev.status === 'running' ? { ...prev, status: 'paused' } : prev,
    );
  }, []);

  const reset = useCallback(() => {
    clearTimer(timerRef);
    setState((prev) => ({ ...initial(), speed: prev.speed }));
  }, []);

  const setSpeed = useCallback((speed: SimSpeed) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  // Driver loop — only ticks while running.
  useEffect(() => {
    clearTimer(timerRef);
    if (state.status !== 'running') return;
    if (state.stepIndex >= scenario.path.length) return;
    const delay = Math.max(150, BASE_INTERVAL_MS / state.speed);
    timerRef.current = window.setTimeout(stepOnce, delay);
    return () => clearTimer(timerRef);
  }, [state.status, state.stepIndex, state.speed, scenario.path.length, stepOnce]);

  // Cleanup on unmount.
  useEffect(() => () => clearTimer(timerRef), []);

  return { state, play, pause, reset, stepOnce, setSpeed };
}

function initial(): SimulationState {
  return {
    status: 'idle',
    stepIndex: 0,
    visited: new Set(),
    current: null,
    activeEdges: new Set(),
    speed: 1,
  };
}

function advance(prev: SimulationState, scenario: Scenario): SimulationState {
  if (prev.stepIndex >= scenario.path.length) {
    return { ...prev, status: 'done' };
  }

  const nextId = scenario.path[prev.stepIndex];
  const visited = new Set(prev.visited);
  visited.add(nextId);

  // Light the edge from the previous step on the canonical path.
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
    ...prev,
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
/* Derived helpers — used by the UI rails.                             */
/* ------------------------------------------------------------------ */

export interface CurrentStepInfo {
  /** 1-based step number. */
  index: number;
  total: number;
  node: AttackNode | null;
  /** Optional friendly stage label from the scenario. */
  stageLabel?: string;
  /** Hint of the next node on the path (for "what comes next"). */
  next: AttackNode | null;
}

/** Compute live step info from sim state + scenario. */
export function useCurrentStep(
  scenario: Scenario,
  state: SimulationState,
): CurrentStepInfo {
  return useMemo(() => {
    const total = scenario.path.length;
    const currentIdx = state.current ? scenario.path.indexOf(state.current) : -1;
    const node = state.current
      ? scenario.nodes.find((n) => n.id === state.current) ?? null
      : null;
    const nextId =
      currentIdx >= 0 && currentIdx + 1 < total ? scenario.path[currentIdx + 1] : null;
    const next = nextId ? scenario.nodes.find((n) => n.id === nextId) ?? null : null;
    return {
      index: currentIdx + 1,
      total,
      node,
      stageLabel: currentIdx >= 0 ? scenario.stageLabels?.[currentIdx] : undefined,
      next,
    };
  }, [scenario, state.current]);
}

/* ------------------------------------------------------------------ */
/* Probability helpers — used by the risk-breakdown panel.             */
/* ------------------------------------------------------------------ */

/** Multiply all edge probabilities along the canonical attack path. */
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
  let weakest:
    | { edgeId: string; source: string; target: string; probability: number }
    | null = null;
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

/** Render percentages succinctly for the UI. */
export function formatPct(p: number): string {
  if (p <= 0) return '0%';
  if (p < 0.005) return '<1%';
  if (p > 0.995) return '>99%';
  return `${Math.round(p * 100)}%`;
}
