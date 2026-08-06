import { useSyncExternalStore } from 'react';

/**
 * Detection for dark-mode browser extensions that restyle the page.
 *
 * We only look for DOM signatures the extension itself writes — never at
 * computed colors, brightness or `prefers-color-scheme`, which would fire on
 * plain OS dark mode and on RIndex's own palette.
 *
 * Detection is driven by a MutationObserver, not a timer, so it reacts to the
 * extension being switched on or off (globally or just for this site) while
 * the page is open.
 */

export interface DarkExtensionDetector {
  id: string;
  /** Human-readable name used in the banner copy. */
  label: string;
  /** True only when the extension is actively restyling this page. */
  isActive: () => boolean;
  /** Extra attribute names to watch on <html> for this detector. */
  htmlAttributes: string[];
}

/**
 * Dark Reader writes `data-darkreader-*` attributes onto <html> and injects
 * <style class="darkreader ..."> nodes. Both disappear when it is disabled,
 * including when disabled only for this domain.
 */
const darkReader: DarkExtensionDetector = {
  id: 'dark-reader',
  label: 'Dark Reader',
  htmlAttributes: ['data-darkreader-mode', 'data-darkreader-scheme'],
  isActive: () => {
    const html = document.documentElement;
    if (
      html.hasAttribute('data-darkreader-mode') ||
      html.hasAttribute('data-darkreader-scheme')
    ) {
      return true;
    }
    // Injected stylesheets are the second signature. `darkreader--fallback`
    // can linger empty, so require a node that is not fallback-only.
    return !!document.querySelector(
      'style.darkreader--sync, style.darkreader--dynamic, style.darkreader--override, style.darkreader--inline',
    );
  },
};

/**
 * Add further detectors here only when the signature is documented and
 * stable. This is deliberately not an attempt at universal detection —
 * unknown extensions simply go unnoticed, which is the safe failure mode.
 */
const DETECTORS: DarkExtensionDetector[] = [darkReader];

const WATCHED_HTML_ATTRIBUTES = [...new Set(DETECTORS.flatMap((d) => d.htmlAttributes))];

export interface DarkExtensionState {
  active: boolean;
  /** Label of the first detector currently matching, if any. */
  label: string | null;
}

const INACTIVE: DarkExtensionState = { active: false, label: null };

function read(): DarkExtensionState {
  if (typeof document === 'undefined') return INACTIVE;
  for (const d of DETECTORS) {
    try {
      if (d.isActive()) return { active: true, label: d.label };
    } catch {
      // A detector must never be able to break the page.
    }
  }
  return INACTIVE;
}

/* ------------------------------------------------------------------ */
/* Store — one observer for the whole app, regardless of subscribers    */
/* ------------------------------------------------------------------ */

let state: DarkExtensionState = INACTIVE;
let started = false;
let observer: MutationObserver | null = null;
const listeners = new Set<() => void>();

function refresh() {
  const next = read();
  if (next.active === state.active && next.label === state.label) return;
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof document === 'undefined') return;
  started = true;
  state = read();

  observer = new MutationObserver(refresh);
  // <html> attributes: catches enable/disable and scheme switches.
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: WATCHED_HTML_ATTRIBUTES,
  });
  // <head> children: catches the injected stylesheets appearing/disappearing.
  if (document.head) {
    observer.observe(document.head, { childList: true });
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    // Keep the observer alive: it is a single cheap, app-lifetime observer,
    // and tearing it down on every unmount would lose state across routes.
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return INACTIVE;
}

/** Live state of any recognised dark-mode extension restyling this page. */
export function useDarkExtension(): DarkExtensionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test-only: force a re-read (the observer normally handles this). */
export function refreshDarkExtension() {
  refresh();
}
