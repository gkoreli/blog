import { component, html, onMount }                            from '@nisli/core';
import { animate }                                             from '../animations/runner.js';
import { caustic }                                             from '../animations/caustic.js';
import { flow, split, threshold }                              from '../animations/neural.js';
import { cursorSignal }                                        from '../animations/signals/cursor.js';
import { cursorRepulsion }                                     from '../animations/effects/cursor-repulsion.js';
import { forceFieldEffect }                                    from '../animations/effects/force-field.js';
import { createEntityStore }                                   from '../animations/entities/store.js';
import { clickForceEmitter }                                   from '../animations/entities/emitters/click-force.js';
import type { ForcePointData }                                 from '../animations/entities/emitters/click-force.js';

/**
 * <nisli-neural-canvas mode="...">
 *
 * Thin web component. Creates a canvas, then declaratively composes
 * an animation module with signals, effects, and emitters via the runner.
 *
 * caustic   — orbital focal points, cursor repulsion, click-to-place force fields
 * flow      — neural network flow animation
 * split     — flow network with a few twin links that diverge under the pulse
 * threshold — neural network threshold animation
 *
 * Optional capture controls:
 * data-seed — seed neural node/link placement with a deterministic PRNG
 * data-t    — seek to this ideal 60fps animation time in milliseconds and stop
 *
 * Both attributes are inert when absent. Split also renders a residual static
 * frame when the user prefers reduced motion.
 *
 * Adding a new animation: implement AnimationModule, export from animations/,
 * add a case here. Signals, effects, and emitters compose without touching modules.
 */
component('nisli-neural-canvas', (_props, host) => {
  onMount(() => {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);

    const mode = host.getAttribute('mode') ?? 'threshold';
    const seedValue = host.getAttribute('data-seed');
    const parsedSeed = seedValue === null ? undefined : Number(seedValue);
    const seed = parsedSeed !== undefined && Number.isFinite(parsedSeed) ? parsedSeed : undefined;
    const timeValue = host.getAttribute('data-t');
    const parsedTime = timeValue === null ? undefined : Number(timeValue);
    const captureTime = parsedTime !== undefined && Number.isFinite(parsedTime) ? Math.max(0, parsedTime) : undefined;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const neuralOptions = seed === undefined ? {} : { seed };
    const runnerOptions = captureTime === undefined ? {} : { seekTimeMs: captureTime };

    if (mode === 'caustic') {
      const cursor      = cursorSignal(host);
      const forcePoints = createEntityStore<ForcePointData>();

      return animate(caustic())
        .emit(clickForceEmitter(canvas, forcePoints))
        .pipe(forceFieldEffect({ store: forcePoints }))
        .pipe(cursorRepulsion({ signal: cursor }))
        .start(canvas, host, runnerOptions);
    }

    if (mode === 'flow') return animate(flow(neuralOptions))
      .start(canvas, host, runnerOptions);

    if (mode === 'split') {
      const splitRunnerOptions = captureTime === undefined && reducedMotion ? { seekTimeMs: 2000 } : runnerOptions;
      return animate(split({ ...neuralOptions, reducedMotion }))
        .start(canvas, host, splitRunnerOptions);
    }

    return animate(threshold(neuralOptions))
      .start(canvas, host, runnerOptions);
  });

  return html``;
});
