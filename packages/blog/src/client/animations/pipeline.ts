/**
 * Animation pipeline — shared contracts.
 *
 * AnimationModule  — what an animation must implement
 * Effect           — a composable transform in the point pipeline
 * AnimationRunner  — the standardized loop, built via animate()
 *
 * Flow per frame:
 *   module.tick()  →  AnimationPoint[]
 *   applyEffects() →  AnimationPoint[]   (each Effect transforms in order)
 *   module.draw()  →  canvas
 */

/** A 2-D point in logical-pixel space (pre-DPR). */
export interface AnimationPoint {
  x: number;
  y: number;
}

/** Immutable context passed to every effect each frame. */
export interface EffectContext {
  w: number;   // logical canvas width
  h: number;   // logical canvas height
  t: number;   // frame counter
}

/** A composable pipeline stage. apply() must be a pure transform. */
export interface Effect {
  apply(points: AnimationPoint[], ctx: EffectContext): AnimationPoint[];
  /** Called when the animation runner pauses (off-screen). Stop any background work. */
  pause?(): void;
  /** Called when the animation runner resumes (back on-screen). */
  resume?(): void;
  dispose?(): void;
}

/**
 * The contract every animation module must satisfy.
 *
 * resize()  — canvas dimensions changed; rebuild any size-dependent state
 * tick()    — advance internal state, return this frame's base points
 * draw()    — render from post-effects points; ctx is already DPR-scaled
 * dispose() — clean up timers, observers, listeners
 */
export interface AnimationModule {
  resize(w: number, h: number): void;
  tick(t: number, w: number, h: number): AnimationPoint[];
  draw(ctx: CanvasRenderingContext2D, points: AnimationPoint[], t: number, w: number, h: number): void;
  dispose?(): void;
}

/** Run a list of effects left-to-right over a point array. */
export function applyEffects(
  points: AnimationPoint[],
  effects: Effect[],
  ctx: EffectContext,
): AnimationPoint[] {
  let out = points;
  for (const e of effects) out = e.apply(out, ctx);
  return out;
}
