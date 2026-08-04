import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'rindex-reduce-motion';
const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

type Override = boolean | null; // null = follow system preference

function readOverride(): Override {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function readSystemPreference(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MEDIA_QUERY).matches;
}

let override: Override = readOverride();
let systemPrefers = readSystemPreference();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function applyToDocument() {
  const enabled = override ?? systemPrefers;
  document.documentElement.setAttribute('data-reduce-motion', String(enabled));
}

if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia(MEDIA_QUERY);
  const onChange = () => {
    systemPrefers = mql.matches;
    applyToDocument();
    notify();
  };
  mql.addEventListener('change', onChange);
  applyToDocument();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return override ?? systemPrefers;
}

function getServerSnapshot() {
  return false;
}

/** Effective reduce-motion state: manual override if set, else OS preference. */
export function useReduceMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Whether the user has manually chosen a value (vs. following the system). */
function subscribeOverride(listener: () => void) {
  return subscribe(listener);
}
function getOverrideSnapshot() {
  return override;
}
export function useReduceMotionOverride() {
  return useSyncExternalStore(subscribeOverride, getOverrideSnapshot, () => null);
}

export function setReduceMotionOverride(value: boolean) {
  override = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // localStorage unavailable — override still applies for this session
  }
  applyToDocument();
  notify();
}
