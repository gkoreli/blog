/**
 * scrollSignal — page scroll position and velocity.
 *
 * Velocity is a smoothed px/frame delta. Direction is +1 (down), -1 (up), 0 (still).
 * progress is scrollY normalized to [0, 1] over the full scrollable height.
 *
 * Passive listener — zero frame cost. pause/resume add/remove the listener.
 */
import type { Signal } from '../pipeline.js';

export interface ScrollValue {
  /** scrollY in pixels. */
  y:         number;
  /** 0 at top, 1 at bottom. */
  progress:  number;
  /** Smoothed px/frame. */
  velocity:  number;
  /** +1 scrolling down, -1 scrolling up, 0 still. */
  direction: 1 | -1 | 0;
}

export function scrollSignal(): Signal<ScrollValue> {
  const value: ScrollValue = {
    y:         window.scrollY,
    progress:  0,
    velocity:  0,
    direction: 0,
  };

  let lastY    = value.y;
  let rawDelta = 0;
  let active   = false;

  function onScroll() {
    const y     = window.scrollY;
    rawDelta    = y - lastY;
    lastY       = y;
    value.y     = y;

    const max          = document.documentElement.scrollHeight - window.innerHeight;
    value.progress     = max > 0 ? y / max : 0;
    value.velocity     = value.velocity * 0.8 + rawDelta * 0.2;
    value.direction    = rawDelta > 0.5 ? 1 : rawDelta < -0.5 ? -1 : 0;
  }

  return {
    read: () => value,

    resume() {
      if (active) return;
      active = true;
      window.addEventListener('scroll', onScroll, { passive: true });
    },

    pause() {
      if (!active) return;
      active         = false;
      value.velocity = 0;
      value.direction = 0;
      window.removeEventListener('scroll', onScroll);
    },

    dispose() {
      active = false;
      window.removeEventListener('scroll', onScroll);
    },
  };
}
