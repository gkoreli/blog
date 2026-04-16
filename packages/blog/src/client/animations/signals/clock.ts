/**
 * clockSignal — frame counter + actual elapsed time.
 *
 * Unlike EffectContext.t (an integer frame count), ClockValue.dt is the real
 * elapsed milliseconds since the last drawn frame — use it for frame-rate-
 * independent physics (velocity in units/ms rather than units/frame).
 *
 * The runner ticks this signal before calling applyEffects() each frame.
 * Effects that need time read ctx.dt directly (injected into EffectContext).
 * This factory is provided for effects used outside the standard runner or
 * for testing with controlled time.
 */
import type { Signal } from '../pipeline.js';

export interface ClockValue {
  /** Frame counter — increments by 1 each drawn frame. */
  t:  number;
  /** Actual ms elapsed since the previous drawn frame. */
  dt: number;
}

export interface ClockSignal extends Signal<ClockValue> {
  /** Called by the runner each frame with the current rAF timestamp. */
  tick(now: DOMHighResTimeStamp, t: number): void;
}

export function clockSignal(): ClockSignal {
  const value: ClockValue = { t: 0, dt: 0 };
  let lastTime = 0;

  return {
    read: () => value,

    tick(now: DOMHighResTimeStamp, t: number) {
      value.dt   = lastTime === 0 ? 0 : now - lastTime;
      value.t    = t;
      lastTime   = now;
    },

    // Clock has no background work — pause/resume/dispose are no-ops.
    pause():   void { lastTime = 0; },   // reset so dt doesn't spike on resume
    resume():  void {},
    dispose(): void {},
  };
}
