/**
 * Animation runner — the standardized loop.
 *
 * Every animation goes through here. The runner owns:
 *   - devicePixelRatio scaling
 *   - 60fps cap (safe on 120Hz displays)
 *   - ResizeObserver (calls module.resize)
 *   - IntersectionObserver (pause when off-screen)
 *   - The rAF loop (tick → applyEffects → draw)
 *   - Cleanup of module + all effects on stop
 *
 * Usage:
 *   animate(caustic())
 *     .pipe(cursorRepulsion(host))
 *     .start(canvas, container)
 */
import { applyEffects } from './pipeline.js';
import type { AnimationModule, Effect } from './pipeline.js';

const TARGET_MS = 15; // cap at 60fps — 15ms threshold avoids dropping 16.67ms frames due to jitter

class AnimationRunner {
  private readonly mod: AnimationModule;
  private readonly effects: Effect[] = [];

  constructor(mod: AnimationModule) {
    this.mod = mod;
  }

  pipe(effect: Effect): this {
    this.effects.push(effect);
    return this;
  }

  start(canvas: HTMLCanvasElement, container: HTMLElement): () => void {
    const ctx = canvas.getContext('2d')!;
    const { mod, effects } = this;

    let t            = 0;
    let w            = 0;
    let h            = 0;
    let raf          = 0;
    let running      = false;
    let lastFrameTime = 0;

    function applySize(newW: number, newH: number) {
      if (newW === 0 || newH === 0) return;
      w = newW;
      h = newH;
      canvas.width  = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      mod.resize(w, h);
    }

    // Size immediately — don't wait for ResizeObserver on first render
    applySize(canvas.offsetWidth, canvas.offsetHeight);

    // Keep in sync when container resizes
    const ro = new ResizeObserver(() => {
      applySize(canvas.offsetWidth, canvas.offsetHeight);
    });
    ro.observe(canvas);

    function frame(now: DOMHighResTimeStamp) {
      // Re-request at the top so skipped frames don't break the chain
      if (running) raf = requestAnimationFrame(frame);

      // 60fps cap
      if (now - lastFrameTime < TARGET_MS) return;
      lastFrameTime = now;

      if (w === 0 || h === 0) return;

      const base   = mod.tick(t, w, h);
      const points = applyEffects(base, effects, { w, h, t });

      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      mod.draw(ctx, points, t, w, h);
      ctx.restore();

      t++;
    }

    // Start/stop loop based on visibility — no wasted work when scrolled away.
    // Also pause/resume effects so they can stop their own background work (e.g. cursor-force rAF).
    const io = new IntersectionObserver(entries => {
      if (entries[0]!.isIntersecting) {
        running = true;
        raf = requestAnimationFrame(frame);
        for (const e of effects) e.resume?.();
      } else {
        running = false;
        cancelAnimationFrame(raf);
        for (const e of effects) e.pause?.();
      }
    }, { threshold: 0.1 });
    io.observe(container);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mod.dispose?.();
      for (const e of effects) e.dispose?.();
    };
  }
}

export function animate(mod: AnimationModule): AnimationRunner {
  return new AnimationRunner(mod);
}
