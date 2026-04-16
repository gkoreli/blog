import { animate } from './animations/runner.js';
import { caustic } from './animations/caustic.js';

/**
 * Page-level bootstrap for standalone caustic canvases (.cst-canvas).
 * Used by DispatchCaustic (experimental subscribe variant).
 * For preamble use, prefer <nisli-neural-canvas mode="caustic">.
 */
function initCaustics(): void {
  document.querySelectorAll<HTMLCanvasElement>('.cst-canvas').forEach(canvas => {
    const container = canvas.parentElement;
    if (!container) return;
    animate(caustic()).start(canvas, container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaustics);
} else {
  initCaustics();
}
