/**
 * mediaSignal — reactive MediaQueryList as a Signal<boolean>.
 *
 * Primary use: (prefers-reduced-motion: reduce) gate.
 * Effects that check motionSignal.read() before applying displacement
 * automatically respect the user's OS accessibility setting.
 *
 * pause/resume add/remove the change listener. The query itself is always
 * evaluated — read() reflects current match state regardless of pause.
 */
import type { Signal } from '../pipeline.js';

export function mediaSignal(query: string): Signal<boolean> {
  const mql    = window.matchMedia(query);
  let active   = false;
  let current  = mql.matches;

  function onChange(e: MediaQueryListEvent) {
    current = e.matches;
  }

  return {
    read: () => current,

    resume() {
      if (active) return;
      active  = true;
      current = mql.matches;   // re-read on resume in case it changed while paused
      mql.addEventListener('change', onChange);
    },

    pause() {
      if (!active) return;
      active = false;
      mql.removeEventListener('change', onChange);
    },

    dispose() {
      active = false;
      mql.removeEventListener('change', onChange);
    },
  };
}

/** Convenience: the standard reduced-motion preference signal. */
export const prefersReducedMotion = (): Signal<boolean> =>
  mediaSignal('(prefers-reduced-motion: reduce)');
