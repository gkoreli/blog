/**
 * forceFieldEffect — persistent jittery repulsion fields from an EntityStore.
 *
 * Reads ForcePointData entities each frame. Each entity:
 *   - Jitters around its spawn position (deterministic sin/cos from age+phase)
 *   - Pulses its radius (oscillating ±25%)
 *   - Fades in over BORN_FRAMES, fades out over its dying window
 *
 * Multiple entities stack — a point inside overlapping fields gets both forces.
 * Per-point velocity accumulates across all entities and is damped each frame.
 *
 * Physics same as cursorRepulsion: quadratic falloff, px/frame magnitude,
 * terminal displacement ≈ magnitude / (1 - damping).
 */
import { DEATH_FRAMES }   from '../entities/store.js';
import type { Effect, AnimationPoint, EffectContext, EntityStore } from '../pipeline.js';
import type { ForcePointData }                                     from '../entities/emitters/click-force.js';

const BORN_FRAMES   = 20;   // frames to fade in on spawn
const JITTER_AMP    = 0.018; // normalized — ~16px on a 900px canvas
const PULSE_AMP     = 0.25;  // radius oscillates ±25%

export interface ForceFieldOptions {
  store:       EntityStore<ForcePointData>;
  /** Repulsion radius as fraction of min(w, h). Default 0.28. */
  radius?:     number;
  /**
   * Peak force in pixels/frame at entity center.
   * Terminal displacement ≈ magnitude / (1 - damping).
   * Default 22 → terminal ~183px.
   */
  magnitude?:  number;
  /** Velocity damping per frame (0–1). Default 0.88. */
  damping?:    number;
}

export function forceFieldEffect(options: ForceFieldOptions): Effect {
  const { store, radius = 0.28, magnitude = 22, damping = 0.88 } = options;

  // Per-point velocity — grows lazily
  const vel: { vx: number; vy: number }[] = [];

  return {
    stores: [store],   // declare dependency — runner calls tick/prune/dispose

    apply(points: AnimationPoint[], { w, h }: EffectContext): AnimationPoint[] {
      while (vel.length < points.length) vel.push({ vx: 0, vy: 0 });

      const entities = store.entities();

      if (entities.length === 0) {
        // No entities — decay velocity and return
        for (let i = 0; i < points.length; i++) {
          vel[i]!.vx *= damping;
          vel[i]!.vy *= damping;
        }
        return points.map(({ x, y }, i) => ({ x: x + vel[i]!.vx, y: y + vel[i]!.vy }));
      }

      const baseR = Math.min(w, h) * radius;

      // Accumulate forces from all entities into each point's velocity
      for (let i = 0; i < points.length; i++) {
        const v  = vel[i]!;
        const bx = points[i]!.x;
        const by = points[i]!.y;

        // Displaced position for force computation
        const px = bx + v.vx;
        const py = by + v.vy;

        let totalFx = 0;
        let totalFy = 0;

        for (const entity of entities) {
          const { data, age, state, dyingAge } = entity;

          // Strength envelope: born fade-in + dying fade-out
          const bornT  = Math.min(age / BORN_FRAMES, 1);
          const dyingT = state === 'dying'
            ? Math.max(1 - dyingAge / DEATH_FRAMES, 0)
            : 1;
          const envelope = bornT * dyingT;
          if (envelope < 0.005) continue;

          // Jitter: deterministic oscillation around spawn position
          const jx = data.x + Math.sin(age * 0.11 + data.phase)         * JITTER_AMP;
          const jy = data.y + Math.cos(age * 0.09 + data.phase * 1.31)  * JITTER_AMP;

          // Pulse: radius breathes ±PULSE_AMP
          const pulse = Math.sin(age * 0.07 + data.phase);
          const r     = baseR * (1 + pulse * PULSE_AMP);

          const cx   = jx * w;
          const cy   = jy * h;
          const dx   = px - cx;
          const dy   = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < r && dist > 0) {
            const t = 1 - dist / r;              // 1 at center, 0 at edge
            const f = envelope * magnitude * t * t;
            totalFx += (dx / dist) * f;
            totalFy += (dy / dist) * f;
          }
        }

        v.vx = (v.vx + totalFx) * damping;
        v.vy = (v.vy + totalFy) * damping;
      }

      return points.map(({ x, y }, i) => ({
        x: x + vel[i]!.vx,
        y: y + vel[i]!.vy,
      }));
    },
    // No dispose — store lifecycle managed by runner
  };
}
