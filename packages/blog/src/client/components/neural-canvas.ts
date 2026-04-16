import { component, html, onMount } from '@nisli/core';
import { animate } from '../animations/runner.js';
import { caustic } from '../animations/caustic.js';
import { flow, threshold } from '../animations/neural.js';
import { cursorRepulsion } from '../animations/effects/cursor-repulsion.js';

/**
 * <nisli-neural-canvas mode="...">
 *
 * Thin web component. Creates a canvas, then declaratively composes
 * an animation module with any effects via the standard runner.
 *
 * Adding a new animation: implement AnimationModule, export from animations/,
 * add a case here. Effects are composed with .pipe() — no changes to the module.
 */
component('nisli-neural-canvas', (_props, host) => {
  onMount(() => {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);

    const mode = host.getAttribute('mode') ?? 'threshold';

    if (mode === 'caustic') return animate(caustic())
      .pipe(cursorRepulsion(host))
      .start(canvas, host);

    if (mode === 'flow') return animate(flow())
      .start(canvas, host);

    return animate(threshold())
      .start(canvas, host);
  });

  return html``;
});
