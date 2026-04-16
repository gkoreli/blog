/**
 * cursorRepulsion — velocity-based cursor force field effect.
 *
 * Receives a Signal<CursorValue> rather than owning cursor tracking.
 * The runner manages the signal's lifecycle (pause/resume/dispose).
 * This effect is pure domain logic: accumulate velocity, damp, return points.
 *
 * Physics:
 *   Force = magnitude * quadratic_falloff(dist, radius) * strength
 *   Quadratic falloff: t² where t = 1 - dist/r  (1 at cursor, 0 at boundary)
 *   Terminal displacement ≈ magnitude / (1 - damping)
 *   Default: 18 / (1 - 0.88) = 150px terminal displacement
 */
import type { Effect, AnimationPoint, EffectContext } from '../pipeline.js';
import type { Signal }                                from '../pipeline.js';
import type { CursorValue }                           from '../signals/cursor.js';

export interface CursorRepulsionOptions {
  signal:      Signal<CursorValue>;
  /** Repulsion radius as fraction of the shorter canvas side. Default 0.38. */
  radius?:     number;
  /**
   * Peak force in pixels/frame at the cursor's exact position.
   * Terminal displacement = magnitude / (1 - damping).
   * Default 18 → terminal ~150px at default damping.
   */
  magnitude?:  number;
  /** Velocity damping per frame (0–1). Higher = snappier return. Default 0.88. */
  damping?:    number;
}

export function cursorRepulsion(options: CursorRepulsionOptions): Effect {
  const { signal, radius = 0.38, magnitude = 18, damping = 0.88 } = options;

  // Per-point velocity — grows lazily to match however many points the animation has
  const vel: { vx: number; vy: number }[] = [];

  return {
    signals: [signal],   // declare dependency — runner owns lifecycle

    apply(points: AnimationPoint[], { w, h }: EffectContext): AnimationPoint[] {
      while (vel.length < points.length) vel.push({ vx: 0, vy: 0 });

      const { x, y, strength } = signal.read();

      if (strength < 0.005) {
        // Cursor absent — let velocity decay to zero naturally
        for (let i = 0; i < points.length; i++) {
          const v = vel[i]!;
          v.vx   *= damping;
          v.vy   *= damping;
        }
        return points.map(({ x: bx, y: by }, i) => ({
          x: bx + vel[i]!.vx,
          y: by + vel[i]!.vy,
        }));
      }

      const r  = Math.min(w, h) * radius;
      const cx = x * w;
      const cy = y * h;

      return points.map(({ x: bx, y: by }, i) => {
        const v = vel[i]!;

        // Displaced position = base + current velocity
        const px = bx + v.vx;
        const py = by + v.vy;

        let fx = 0;
        let fy = 0;

        const dx   = px - cx;
        const dy   = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r && dist > 0) {
          const t = 1 - dist / r;            // 1 at cursor, 0 at boundary
          const f = strength * magnitude * t * t;
          fx = (dx / dist) * f;
          fy = (dy / dist) * f;
        }

        v.vx = (v.vx + fx) * damping;
        v.vy = (v.vy + fy) * damping;

        return { x: bx + v.vx, y: by + v.vy };
      });
    },
    // No dispose — signal lifecycle managed by runner
  };
}
