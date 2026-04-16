/**
 * Animation pipeline — shared contracts.
 *
 * AnimationModule  — what an animation must implement
 * Signal<T>        — a time-varying input value (cursor, scroll, clock)
 * EntityStore<T>   — a mutable collection of spawnable persistent scene objects
 * Emitter          — a DOM event listener that writes to an EntityStore
 * Effect           — a composable transform in the point pipeline
 *
 * Flow per frame:
 *   store.tick()   →  advance entity ages
 *   module.tick()  →  AnimationPoint[]
 *   applyEffects() →  AnimationPoint[]   (each Effect transforms in order)
 *   module.draw()  →  canvas
 *   store.prune()  →  remove dead entities
 */

// ─── Points ──────────────────────────────────────────────────────────────────

/** A 2-D point in logical-pixel space (pre-DPR). */
export interface AnimationPoint {
  x: number;
  y: number;
}

/** Immutable context passed to every effect each frame. */
export interface EffectContext {
  w:  number;   // logical canvas width
  h:  number;   // logical canvas height
  t:  number;   // frame counter
  dt: number;   // ms since last frame (actual elapsed — use for frame-rate-independent physics)
}

// ─── Signals ─────────────────────────────────────────────────────────────────

/**
 * A time-varying input value. Pull model — read() is called once per frame.
 * The runner owns lifecycle: pause() on off-screen, resume() on visible, dispose() on cleanup.
 *
 * Implementations must be idempotent on pause/resume (no-op if already in that state).
 */
export interface Signal<T> {
  /** Return the current value. Called once per frame inside effect.apply(). */
  read(): T;
  /** Stop background work (own rAF loops, listeners). Called when canvas goes off-screen. */
  pause(): void;
  /** Restart background work. Called when canvas returns to view. */
  resume(): void;
  /** Release all resources permanently. Called on runner cleanup. */
  dispose(): void;
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export type EntityState = 'alive' | 'dying' | 'dead';

/** A typed, lifecycle-aware persistent object in the scene. */
export interface Entity<T> {
  readonly id:    number;
  readonly data:  T;
  state:          EntityState;
  /** Frames since spawn (for born animations and deterministic physics). */
  age:            number;
  /** Frames spent in 'dying' state. */
  dyingAge:       number;
}

/**
 * A mutable, observable collection of typed entities.
 *
 * Write side (Emitter): spawn / kill / destroy
 * Read side (Effect):   entities()
 * Runner side:          tick() before applyEffects, prune() after draw
 */
export interface EntityStore<T> {
  /** All alive + dying entities. Dead entities are excluded. */
  entities(): readonly Entity<T>[];
  /** Create a new entity. Returns its id. */
  spawn(data: T): number;
  /** Begin the dying transition (smooth fade-out over DEATH_FRAMES). */
  kill(id: number): void;
  /** Immediately remove without dying transition. */
  destroy(id: number): void;
  /** Advance entity ages. Runner calls this once per frame before applyEffects(). */
  tick(): void;
  /** Remove all dead entities. Runner calls this after draw(). */
  prune(): void;
  /** Release all entities and reset. */
  dispose(): void;
}

// ─── Emitters ─────────────────────────────────────────────────────────────────

/**
 * A DOM event listener that writes to an EntityStore.
 * Registered with the runner via .emit(). Runner owns lifecycle.
 */
export interface Emitter {
  pause():   void;
  resume():  void;
  dispose(): void;
}

// ─── Effects ─────────────────────────────────────────────────────────────────

/**
 * A composable pipeline stage. apply() must be a pure transform.
 *
 * Declare signal and store dependencies so the runner can manage their lifecycle
 * and deduplicate shared instances across effects.
 */
export interface Effect {
  apply(points: AnimationPoint[], ctx: EffectContext): AnimationPoint[];
  /** Signal dependencies — runner calls pause/resume/dispose, deduplicates by reference. */
  signals?: Signal<unknown>[];
  /** EntityStore dependencies — runner calls tick/prune/dispose, deduplicates by reference. */
  stores?:  EntityStore<unknown>[];
  dispose?(): void;
}

// ─── Module ───────────────────────────────────────────────────────────────────

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

// ─── Pipeline ─────────────────────────────────────────────────────────────────

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
