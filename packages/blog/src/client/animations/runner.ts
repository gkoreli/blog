/**
 * Animation runner — the standardized loop.
 *
 * Every animation goes through here. The runner owns:
 *   - devicePixelRatio scaling
 *   - 60fps cap (safe on 120Hz displays)
 *   - ResizeObserver (calls module.resize)
 *   - IntersectionObserver (pause when off-screen)
 *   - The rAF loop (store.tick → tick → applyEffects → draw → store.prune)
 *   - Signal lifecycle (pause/resume/dispose, deduplicated by reference)
 *   - Emitter lifecycle (pause/resume/dispose)
 *   - EntityStore lifecycle (tick/prune/dispose, deduplicated by reference)
 *   - Cleanup of module + all effects + signals + emitters + stores on stop
 *
 * Usage:
 *   const cursor = cursorSignal(host);
 *   const points = createEntityStore();
 *
 *   animate(caustic())
 *     .emit(clickForceEmitter(canvas, points))
 *     .pipe(forceFieldEffect({ store: points }))
 *     .pipe(cursorRepulsion({ signal: cursor }))
 *     .start(canvas, container)
 */
import { applyEffects }     from './pipeline.js';
import { clockSignal }      from './signals/clock.js';
import type { AnimationModule, Effect, Emitter, EntityStore, Signal } from './pipeline.js';

const TARGET_MS = 15; // cap at 60fps — 15ms threshold avoids dropping 16.67ms frames due to jitter
const FRAME_MS = 1000 / 60;

interface RunnerOptions {
  /** Render the ideal 60fps animation state at this millisecond and stop. */
  seekTimeMs?: number;
}

/** Deduplicate an array by reference identity. */
function dedup<T>(items: T[]): T[] {
  return [...new Set(items)];
}

class AnimationRunner {
  private readonly mod:      AnimationModule;
  private readonly effects:  Effect[]   = [];
  private readonly emitters: Emitter[]  = [];

  constructor(mod: AnimationModule) {
    this.mod = mod;
  }

  pipe(effect: Effect): this {
    this.effects.push(effect);
    return this;
  }

  emit(emitter: Emitter): this {
    this.emitters.push(emitter);
    return this;
  }

  start(canvas: HTMLCanvasElement, container: HTMLElement, options: RunnerOptions = {}): () => void {
    const ctx             = canvas.getContext('2d')!;
    const { mod, effects, emitters } = this;

    // Collect and deduplicate signals and stores from all effects
    const signals: Signal<unknown>[]        = dedup(effects.flatMap(e => e.signals ?? []));
    const stores:  EntityStore<unknown>[]   = dedup(effects.flatMap(e => e.stores  ?? []));

    // Internal clock — ticked each frame, injected into EffectContext
    const clock = clockSignal();

    let t             = 0;
    let w             = 0;
    let h             = 0;
    let raf           = 0;
    let running       = false;
    let lastFrameTime = 0;

    function applySize(newW: number, newH: number) {
      if (newW === 0 || newH === 0) return;
      w = newW;
      h = newH;
      canvas.width  = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      mod.resize(w, h);
      if (options.seekTimeMs !== undefined) renderSeekFrame(options.seekTimeMs);
    }

    // Size immediately — don't wait for ResizeObserver on first render
    applySize(canvas.offsetWidth, canvas.offsetHeight);

    const ro = new ResizeObserver(() => applySize(canvas.offsetWidth, canvas.offsetHeight));
    ro.observe(canvas);
    const themeObserver = options.seekTimeMs === undefined ? undefined : new MutationObserver(() => {
      applySize(canvas.offsetWidth, canvas.offsetHeight);
    });
    themeObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function render(tick: number, now: DOMHighResTimeStamp): void {
      clock.tick(now, tick);
      for (const s of stores) s.tick();

      const effectCtx = { w, h, t: tick, dt: clock.read().dt };
      const base = mod.tick(tick, w, h);
      const points = applyEffects(base, effects, effectCtx);

      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      mod.draw(ctx, points, tick, w, h);
      ctx.restore();

      for (const s of stores) s.prune();
    }

    function renderSeekFrame(timeMs: number): void {
      const targetTick = Math.max(0, timeMs) / FRAME_MS;
      const wholeTicks = Math.floor(targetTick);
      for (let tick = 0; tick < wholeTicks; tick++) render(tick, tick * FRAME_MS);
      render(targetTick, Math.max(0, timeMs));
    }

    function frame(now: DOMHighResTimeStamp) {
      // Re-request at the top so skipped frames don't break the chain
      if (running) raf = requestAnimationFrame(frame);

      // 60fps cap
      if (now - lastFrameTime < TARGET_MS) return;
      lastFrameTime = now;

      if (w === 0 || h === 0) return;

      render(t, now);
      t++;
    }

    function startAll() {
      for (const s of signals)  s.resume();
      for (const e of emitters) e.resume();
      running = true;
      raf     = requestAnimationFrame(frame);
    }

    function stopAll() {
      running = false;
      cancelAnimationFrame(raf);
      for (const s of signals)  s.pause();
      for (const e of emitters) e.pause();
      clock.pause();
    }

    // Start/stop based on visibility — no wasted work when scrolled away
    const io = options.seekTimeMs === undefined ? new IntersectionObserver(entries => {
      if (entries[0]!.isIntersecting) startAll();
      else                            stopAll();
    }, { threshold: 0.1 }) : undefined;
    io?.observe(container);

    return () => {
      stopAll();
      ro.disconnect();
      themeObserver?.disconnect();
      io?.disconnect();
      mod.dispose?.();
      for (const e of effects)  e.dispose?.();
      for (const s of signals)  s.dispose();
      for (const e of emitters) e.dispose();
      for (const s of stores)   s.dispose();
      clock.dispose();
    };
  }
}

export function animate(mod: AnimationModule): AnimationRunner {
  return new AnimationRunner(mod);
}
