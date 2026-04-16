import { component, html, onMount }                            from '@nisli/core';
import { animate }                                             from '../animations/runner.js';
import { caustic }                                             from '../animations/caustic.js';
import { flow, threshold }                                     from '../animations/neural.js';
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
 * threshold — neural network threshold animation
 *
 * Adding a new animation: implement AnimationModule, export from animations/,
 * add a case here. Signals, effects, and emitters compose without touching modules.
 */
component('nisli-neural-canvas', (_props, host) => {
  onMount(() => {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);

    const mode = host.getAttribute('mode') ?? 'threshold';

    if (mode === 'caustic') {
      const cursor      = cursorSignal(host);
      const forcePoints = createEntityStore<ForcePointData>();

      return animate(caustic())
        .emit(clickForceEmitter(canvas, forcePoints))
        .pipe(forceFieldEffect({ store: forcePoints }))
        .pipe(cursorRepulsion({ signal: cursor }))
        .start(canvas, host);
    }

    if (mode === 'flow') return animate(flow())
      .start(canvas, host);

    return animate(threshold())
      .start(canvas, host);
  });

  return html``;
});
