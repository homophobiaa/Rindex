import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

let offlineReady = false;
const listeners = new Set<() => void>();

function setOfflineReady() {
  offlineReady = true;
  listeners.forEach((notify) => notify());
}

/** Registers the service worker. Updates apply silently on next load (no prompt). */
export function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onOfflineReady: setOfflineReady,
  });
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

function getSnapshot() {
  return offlineReady;
}

/** True once the app shell has been cached and is safe to use without a network connection. */
export function useOfflineReady() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
