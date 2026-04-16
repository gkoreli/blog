/**
 * Cursor force field — smoothed cursor state relative to a container.
 *
 * Tracks mousemove on the document so the force works regardless of what
 * element is directly under the pointer (canvas, card, text — all covered).
 * Computes position relative to the container's bounding rect.
 *
 * strength rises when cursor is within the container's visual bounds,
 * fades out slowly when it leaves so the effect dissipates naturally.
 */

export interface CursorForce {
  /** Smoothed cursor X, normalized 0–1 within the container. */
  x: number;
  /** Smoothed cursor Y, normalized 0–1 within the container. */
  y: number;
  /**
   * 0 when cursor is outside or container is hidden.
   * Smoothly rises to 1 on enter, fades slowly on leave.
   */
  strength: number;
  /** Frame-over-frame velocity in normalized units. */
  vx: number;
  vy: number;
}

export function createCursorForce(container: HTMLElement): {
  force: CursorForce;
  pause(): void;
  resume(): void;
  cleanup(): void;
} {
  const force: CursorForce = { x: 0.5, y: 0.5, strength: 0, vx: 0, vy: 0 };

  let rawX = 0.5;
  let rawY = 0.5;
  let targetStrength = 0;
  let raf = 0;
  let active = false;

  function onMove(e: MouseEvent) {
    const r = container.getBoundingClientRect();

    const inBounds =
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top  && e.clientY <= r.bottom;

    if (inBounds) {
      rawX = (e.clientX - r.left) / r.width;
      rawY = (e.clientY - r.top)  / r.height;
      targetStrength = 1;
    } else {
      targetStrength = 0;
    }
  }

  // Document-level so pointer-events: none on the canvas doesn't block tracking
  document.addEventListener('mousemove', onMove, { passive: true });

  function smooth() {
    if (!active) return;

    const prevX = force.x;
    const prevY = force.y;

    force.x += (rawX - force.x) * 0.08;
    force.y += (rawY - force.y) * 0.08;

    force.vx = force.x - prevX;
    force.vy = force.y - prevY;

    const α = targetStrength > force.strength ? 0.07 : 0.035;
    force.strength += (targetStrength - force.strength) * α;

    raf = requestAnimationFrame(smooth);
  }

  return {
    force,
    resume() {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(smooth);
    },
    pause() {
      active = false;
      cancelAnimationFrame(raf);
      // Fade strength to zero so effects settle when off-screen
      force.strength = 0;
      targetStrength = 0;
    },
    cleanup() {
      active = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
    },
  };
}
