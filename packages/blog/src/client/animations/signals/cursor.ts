/**
 * cursorSignal — document-level cursor tracking as a Signal<CursorValue>.
 *
 * Wraps the cursor-force smoothing loop. The runner owns lifecycle:
 * resume() starts the rAF loop, pause() stops it. Idempotent.
 *
 * Normalized position (0–1) within the container's bounding rect.
 * strength: 0 off-screen, smoothly rises to 1 on enter, fades on leave.
 */
import type { Signal } from '../pipeline.js';

export interface CursorValue {
  /** Smoothed cursor X, normalized 0–1 within the container. */
  x:        number;
  /** Smoothed cursor Y, normalized 0–1 within the container. */
  y:        number;
  /** 0 when outside/hidden, rises to 1 on enter, fades on leave. */
  strength: number;
  /** Frame-over-frame velocity in normalized units. */
  vx:       number;
  vy:       number;
}

export function cursorSignal(container: HTMLElement): Signal<CursorValue> {
  const value: CursorValue = { x: 0.5, y: 0.5, strength: 0, vx: 0, vy: 0 };

  let rawX           = 0.5;
  let rawY           = 0.5;
  let targetStrength = 0;
  let raf            = 0;
  let active         = false;

  function onMove(e: MouseEvent) {
    const r = container.getBoundingClientRect();
    const inBounds =
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top  && e.clientY <= r.bottom;

    if (inBounds) {
      rawX           = (e.clientX - r.left) / r.width;
      rawY           = (e.clientY - r.top)  / r.height;
      targetStrength = 1;
    } else {
      targetStrength = 0;
    }
  }

  // Document-level so pointer-events: none on canvas doesn't block tracking
  document.addEventListener('mousemove', onMove, { passive: true });

  function smooth() {
    if (!active) return;

    const prevX = value.x;
    const prevY = value.y;

    value.x += (rawX - value.x) * 0.08;
    value.y += (rawY - value.y) * 0.08;
    value.vx = value.x - prevX;
    value.vy = value.y - prevY;

    const α = targetStrength > value.strength ? 0.07 : 0.035;
    value.strength += (targetStrength - value.strength) * α;

    raf = requestAnimationFrame(smooth);
  }

  return {
    read:    () => value,

    resume() {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(smooth);
    },

    pause() {
      if (!active) return;
      active         = false;
      targetStrength = 0;
      value.strength = 0;
      cancelAnimationFrame(raf);
    },

    dispose() {
      active = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
    },
  };
}
