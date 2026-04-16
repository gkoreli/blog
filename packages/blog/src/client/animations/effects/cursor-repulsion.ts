/**
 * Cursor repulsion effect — physically-motivated force field.
 *
 * Each point accumulates velocity from a continuous repulsion force.
 * Force uses inverse-distance falloff (like a real field — stronger near
 * the cursor, smoothly fading to zero at the radius boundary).
 * Velocity is damped each frame so points spring back to base positions
 * naturally when the cursor leaves.
 *
 * Generic: works on any AnimationPoint[]. Each animation decides what
 * those points represent and how to draw them.
 */
import { createCursorForce } from '../cursor-force.js';
import type { Effect, AnimationPoint, EffectContext } from '../pipeline.js';

export interface CursorRepulsionOptions {
  /** Repulsion radius as fraction of the shorter canvas side. Default 0.38. */
  radius?:    number;
  /**
   * Peak force in pixels/frame at the cursor's exact position.
   * Terminal displacement = magnitude / (1 - damping).
   * Default 18 → terminal ~150px at default damping.
   */
  magnitude?: number;
  /** Velocity damping per frame (0–1). Higher = snappier return. Default 0.88. */
  damping?:   number;
}

export function cursorRepulsion(
  container: HTMLElement,
  options: CursorRepulsionOptions = {},
): Effect {
  const {
    radius    = 0.38,
    magnitude = 18,   // px/frame — terminal velocity = magnitude / (1 - damping) ≈ 150px
    damping   = 0.88,
  } = options;

  const { force, pause: pauseForce, resume: resumeForce, cleanup } = createCursorForce(container);

  // Per-point velocity — grows lazily to match however many points the animation has
  const vel: { vx: number; vy: number }[] = [];

  return {
    apply(points: AnimationPoint[], { w, h }: EffectContext): AnimationPoint[] {
      // Grow velocity array on first call or if animation changes point count
      while (vel.length < points.length) vel.push({ vx: 0, vy: 0 });

      const r  = Math.min(w, h) * radius;
      const cx = force.x * w;
      const cy = force.y * h;

      return points.map(({ x: bx, y: by }, i) => {
        const v = vel[i]!;

        // Compute force from the point's current visual position (base + displacement)
        const px = bx + v.vx;
        const py = by + v.vy;

        let fx = 0;
        let fy = 0;

        if (force.strength > 0.005) {
          const dx   = px - cx;
          const dy   = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < r && dist > 0) {
            // Quadratic falloff: full magnitude at center, zero at radius boundary.
            // predictable and clearly visible at all canvas sizes.
            const t = 1 - dist / r;          // 1 at cursor, 0 at boundary
            const f = force.strength * magnitude * t * t;
            fx = (dx / dist) * f;
            fy = (dy / dist) * f;
          }
        }

        // Accumulate and damp — damping naturally returns points to base
        v.vx = (v.vx + fx) * damping;
        v.vy = (v.vy + fy) * damping;

        return { x: bx + v.vx, y: by + v.vy };
      });
    },

    pause()   { pauseForce(); },
    resume()  { resumeForce(); },
    dispose() { cleanup(); },
  };
}
