/**
 * Caustic animation module — refracted light through a water surface.
 *
 * Implements AnimationModule:
 *   tick()  — returns 22 Lissajous focal points
 *   draw()  — renders each point as a radial gradient (screen blend)
 *
 * No knowledge of effects, cursor, or the run loop.
 * Compose with effects at the call site via animate(caustic()).pipe(...).
 */
import type { AnimationModule, AnimationPoint } from './pipeline.js';

export function caustic(): AnimationModule {
  return {
    resize() {
      // Orbital math adapts naturally to w/h — no rebuild needed.
    },

    tick(t, w, h): AnimationPoint[] {
      const ts = t * 0.004;
      return Array.from({ length: 22 }, (_, i) => {
        const φ = (i / 22) * Math.PI * 2;
        return {
          x: w * (0.5 + 0.44 * Math.cos(ts * 0.65 + φ      + Math.sin(ts * 0.28 + i * 0.55) * 0.45)),
          y: h * (0.5 + 0.44 * Math.sin(ts * 0.85 + φ * 1.4 + Math.cos(ts * 0.42 + i * 0.78) * 0.35)),
        };
      });
    },

    draw(ctx, points, t, w, h) {
      const ts    = t * 0.004;
      const scale = w / 460;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < points.length; i++) {
        const { x: px, y: py } = points[i]!;
        const r = (14 + 13 * Math.sin(ts * 1.1 + i * 0.85)) * scale;

        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0,   'rgba(100, 215, 165, 0.30)');
        g.addColorStop(0.5, 'rgba(70,  185, 140, 0.12)');
        g.addColorStop(1,   'transparent');

        ctx.fillStyle = g;
        // Fill only the gradient's bounding box — not the full canvas.
        // A full-canvas fill with screen blend reads/writes every pixel on every pass.
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }

      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
