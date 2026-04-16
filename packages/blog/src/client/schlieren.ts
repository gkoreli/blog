/**
 * Schlieren heat field — canvas renderer.
 *
 * Mirrors caustic.ts architecture: each <canvas data-schlieren> is an
 * orbital heat field drawn as radial gradients at ~20fps.
 * One shared rAF + IntersectionObserver per canvas — nothing else.
 *
 * Palette driven by data-palette attribute: "heat" | "brand"
 * Focus convergence driven by focusin/focusout on [data-schlieren-host].
 */

interface Source {
  cx: number; cy: number;   // base centre (fraction of element size)
  rx: number; ry: number;   // orbital radii
  fx: number; fy: number;   // angular frequencies (rad/tick)
  px: number; py: number;   // phase offsets
}

const SOURCES: Source[] = [
  { cx: 0.50, cy: 1.15, rx: 0.32, ry: 0.20, fx: 0.0042, fy: 0.0031, px: 0.0, py: 0.8 },
  { cx: 0.82, cy: 0.12, rx: 0.28, ry: 0.22, fx: 0.0058, fy: 0.0044, px: 1.6, py: 0.4 },
  { cx: 0.50, cy: 0.55, rx: 0.38, ry: 0.30, fx: 0.0035, fy: 0.0052, px: 3.2, py: 2.1 },
];

// [inner stop, mid stop, edge stop]
const PALETTES = {
  heat: [
    ['rgba(195,118,28,0.52)', 'rgba(165,88,22,0.20)',  'transparent'],
    ['rgba(55,115,195,0.30)', 'rgba(40,90,165,0.10)',  'transparent'],
    ['rgba(185,108,26,0.36)', 'rgba(155,78,18,0.14)',  'transparent'],
  ],
  brand: [
    ['rgba(26,107,78,0.52)',   'rgba(18,80,58,0.18)',   'transparent'],
    ['rgba(147,197,253,0.36)', 'rgba(100,165,240,0.12)','transparent'],
    ['rgba(110,201,168,0.42)', 'rgba(80,175,145,0.16)', 'transparent'],
  ],
} as const;

type Palette = keyof typeof PALETTES;

interface CanvasState {
  canvas:  HTMLCanvasElement;
  ctx:     CanvasRenderingContext2D;
  palette: Palette;
  visible: boolean;
  phase:   number;  // offset so multiple instances don't move in lockstep
  focusX:  number;
  focusY:  number;
  focused: boolean;
}

const THROTTLE = 3; // update every 3rd rAF frame ≈ 20fps at 60Hz

function initSchlieren(): void {
  const states: CanvasState[] = [];

  document.querySelectorAll<HTMLCanvasElement>('[data-schlieren]').forEach((canvas, idx) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const raw = canvas.dataset['palette'] ?? 'heat';
    const palette: Palette = raw in PALETTES ? (raw as Palette) : 'heat';
    const state: CanvasState = {
      canvas, ctx, palette,
      visible: false,
      phase:   idx * 1.1,
      focusX:  0.5, focusY: 0.5, focused: false,
    };
    states.push(state);

    // Size canvas to its CSS box at device pixel ratio
    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      canvas.width  = r.width  * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
    });
    ro.observe(canvas);

    // Pause animation when off-screen
    const io = new IntersectionObserver(entries => {
      state.visible = entries[0]!.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(canvas);

    // Focus convergence — host wraps canvas + content
    const host = canvas.closest<HTMLElement>('[data-schlieren-host]');
    if (host) {
      host.addEventListener('focusin', (e) => {
        state.focused = true;
        const hr = host.getBoundingClientRect();
        const tr = (e.target as HTMLElement).getBoundingClientRect();
        state.focusX = (tr.left + tr.width  / 2 - hr.left) / hr.width;
        state.focusY = (tr.top  + tr.height / 2 - hr.top)  / hr.height;
      });
      host.addEventListener('focusout', () => {
        state.focused = false;
        state.focusX = 0.5;
        state.focusY = 0.5;
      });
    }
  });

  if (states.length === 0) return;

  let t = 0;
  let frame = 0;

  function tick() {
    requestAnimationFrame(tick);
    frame++;
    if (frame % THROTTLE !== 0) return;
    t++;

    for (const s of states) {
      if (!s.visible) continue;

      const { canvas, ctx, palette, phase } = s;
      const dpr = devicePixelRatio;
      const w = canvas.width  / dpr;
      const h = canvas.height / dpr;
      const pull = s.focused ? 0.55 : 0;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const scale = Math.max(w, h);
      const colors = PALETTES[palette];

      for (let i = 0; i < SOURCES.length; i++) {
        const src = SOURCES[i]!;

        // Lerp base centre toward focus point when focused
        const bx = src.cx + (s.focusX - src.cx) * pull * (0.6 + i * 0.2);
        const by = src.cy + (s.focusY - src.cy) * pull * (0.5 + i * 0.25);

        const px = w * (bx + Math.cos(t * src.fx + src.px + phase) * src.rx);
        const py = h * (by + Math.sin(t * src.fy + src.py + phase) * src.ry);
        const r  = scale * (0.55 + 0.08 * Math.sin(t * 0.003 + i * 1.3));

        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        const c = colors[i]!;
        g.addColorStop(0,   c[0]);
        g.addColorStop(0.4, c[1]);
        g.addColorStop(1,   c[2]);

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    }
  }

  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSchlieren);
} else {
  initSchlieren();
}
