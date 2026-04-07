import { component, html, onMount } from '@nisli/core';

/**
 * <nisli-neural-canvas> — Biological neural network animation.
 *
 * Reusable across articles. The `mode` attribute controls behavior:
 *   - "threshold"  (default) — neurons mostly dormant, signals fizzle
 *       before reaching neighbors, then periodically a full cascade fires
 *       and dopamine (gold particles) floods the pathway. For procrastination.
 *   - "hyperfocus" — one pathway locked bright, rest dim
 *   - "flow"       — rhythmic synchronized waves across the network
 *
 * Renders on the nearest ancestor's <canvas>.
 */

interface Neuron {
  x: number; y: number;
  r: number;
  charge: number;       // 0..1, fires at 1
  firing: boolean;
  refractory: number;   // cooldown frames after firing
  connections: number[]; // indices of connected neurons
}

interface Signal {
  from: number; to: number;
  progress: number;     // 0..1 along the axon
  strength: number;     // dims as it travels (fizzle vs cascade)
  dopamine: boolean;    // gold particle trail
}

interface DopamineParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
}

function hexToRgba(hex: string, a: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(150,140,130,${a})`;
  return `rgba(${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)},${a})`;
}

function getTheme() {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return {
    bg: get('--color-bg', '#1a1a1a'),
    muted: get('--color-text-muted', '#9a9589'),
    warm: get('--color-accent-warm', '#e8c87a'),
    rust: get('--color-accent-rust', '#c05a2e'),
    blue: get('--color-accent-blue', '#5b8fa8'),
  };
}

function buildNetwork(W: number, H: number): Neuron[] {
  const neurons: Neuron[] = [];
  // Poisson-disc-ish placement
  const spacing = Math.min(W, H) * 0.11;
  const attempts = 45;

  for (let i = 0; i < attempts; i++) {
    const x = W * 0.08 + Math.random() * W * 0.84;
    const y = H * 0.12 + Math.random() * H * 0.76;

    // Reject if too close to existing
    let ok = true;
    for (const n of neurons) {
      const dx = n.x - x, dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < spacing * 0.7) { ok = false; break; }
    }
    if (ok) {
      neurons.push({ x, y, r: 3 + Math.random() * 3, charge: Math.random() * 0.3, firing: false, refractory: 0, connections: [] });
    }
  }

  // Connect nearby neurons (dendrites)
  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      const dx = neurons[i]!.x - neurons[j]!.x;
      const dy = neurons[i]!.y - neurons[j]!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < spacing * 1.6 && Math.random() < 0.5) {
        neurons[i]!.connections.push(j);
        neurons[j]!.connections.push(i);
      }
    }
  }

  return neurons;
}

function animateThreshold(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, container: HTMLElement) {
  let W = 0, H = 0, t = 0;
  let neurons: Neuron[] = [];
  let signals: Signal[] = [];
  let dopamine: DopamineParticle[] = [];
  let theme = getTheme();

  // Cascade state
  let cascadeTimer = 0;
  const CASCADE_INTERVAL = 360; // frames between full cascades

  function resize() {
    W = canvas.width = container.offsetWidth;
    H = canvas.height = container.offsetHeight;
    neurons = buildNetwork(W, H);
    signals = [];
    dopamine = [];
    theme = getTheme();
  }

  function triggerNeuron(idx: number, isCascade: boolean) {
    const n = neurons[idx]!;
    if (n.refractory > 0) return;
    n.firing = true;
    n.charge = 1;
    n.refractory = isCascade ? 40 : 80;

    for (const ci of n.connections) {
      signals.push({
        from: idx, to: ci,
        progress: 0,
        strength: isCascade ? 0.95 : 0.2 + Math.random() * 0.3,
        dopamine: isCascade,
      });
    }
  }

  function draw() {
    // Soft fade for trails
    ctx.fillStyle = hexToRgba(theme.bg, 0.12);
    ctx.fillRect(0, 0, W, H);
    t++;
    cascadeTimer++;

    // ── Random sub-threshold pokes ──
    if (t % 25 === 0 && neurons.length > 0) {
      const idx = Math.floor(Math.random() * neurons.length);
      const n = neurons[idx]!;
      if (n.refractory <= 0) {
        // Small charge bump — usually not enough to fire
        n.charge = Math.min(n.charge + 0.3 + Math.random() * 0.3, 1);
        if (n.charge >= 0.9) {
          triggerNeuron(idx, false); // fizzle fire
        }
      }
    }

    // ── Full cascade ──
    if (cascadeTimer >= CASCADE_INTERVAL) {
      cascadeTimer = 0;
      if (neurons.length > 0) {
        // Pick a random starter
        const starter = Math.floor(Math.random() * neurons.length);
        triggerNeuron(starter, true);
      }
    }

    // ── Update signals ──
    const newSignals: Signal[] = [];
    for (const s of signals) {
      s.progress += 0.025;
      // Fizzle: non-cascade signals lose strength
      if (!s.dopamine) s.strength *= 0.985;

      if (s.progress >= 1) {
        // Arrived — charge the target neuron
        const target = neurons[s.to]!;
        target.charge = Math.min(target.charge + s.strength * 0.6, 1);
        if (target.charge >= 0.85 && s.dopamine && target.refractory <= 0) {
          triggerNeuron(s.to, true); // cascade continues
        }
        // Spawn dopamine burst at arrival
        if (s.dopamine) {
          for (let i = 0; i < 4; i++) {
            dopamine.push({
              x: target.x, y: target.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              life: 50 + Math.random() * 30,
              maxLife: 80,
            });
          }
        }
      } else {
        newSignals.push(s);
      }
    }
    signals = newSignals;

    // ── Update neurons ──
    for (const n of neurons) {
      if (n.refractory > 0) { n.refractory--; n.firing = n.refractory > 30; }
      // Passive charge decay
      n.charge *= 0.992;
    }

    // ── Update dopamine particles ──
    dopamine = dopamine.filter(d => {
      d.x += d.vx; d.y += d.vy;
      d.vx *= 0.97; d.vy *= 0.97;
      d.life--;
      return d.life > 0;
    });

    // ── Draw connections (dendrites) ──
    for (let i = 0; i < neurons.length; i++) {
      const a = neurons[i]!;
      for (const j of a.connections) {
        if (j <= i) continue; // draw each edge once
        const b = neurons[j]!;
        const activity = Math.max(a.charge, b.charge);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(theme.muted, 0.04 + activity * 0.08);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // ── Draw signals traveling along axons ──
    for (const s of signals) {
      const a = neurons[s.from]!, b = neurons[s.to]!;
      const x = a.x + (b.x - a.x) * s.progress;
      const y = a.y + (b.y - a.y) * s.progress;
      const color = s.dopamine ? theme.warm : theme.muted;
      const size = s.dopamine ? 3 : 1.5;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, s.strength * 0.8);
      ctx.fill();

      // Dopamine signals leave a trail
      if (s.dopamine) {
        ctx.beginPath();
        ctx.moveTo(a.x + (b.x - a.x) * Math.max(0, s.progress - 0.15), a.y + (b.y - a.y) * Math.max(0, s.progress - 0.15));
        ctx.lineTo(x, y);
        ctx.strokeStyle = hexToRgba(theme.warm, s.strength * 0.25);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ── Draw dopamine particles ──
    for (const d of dopamine) {
      const alpha = (d.life / d.maxLife) * 0.6;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(theme.warm, alpha);
      ctx.fill();
    }

    // ── Draw neurons (soma) ──
    for (const n of neurons) {
      // Glow when charged
      if (n.charge > 0.3) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(n.firing ? theme.warm : theme.rust, (n.charge - 0.3) * 0.12);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      const baseAlpha = 0.15 + n.charge * 0.6;
      const color = n.firing ? theme.warm : theme.muted;
      ctx.fillStyle = hexToRgba(color, baseAlpha);
      ctx.fill();

      // Bright core when firing
      if (n.firing) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(theme.warm, 0.8);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  function refreshTheme() {
    theme = getTheme();
  }

  resize();
  window.addEventListener('resize', resize);
  const observer = new MutationObserver(refreshTheme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  draw();
  return () => { window.removeEventListener('resize', resize); observer.disconnect(); };
}

component('nisli-neural-canvas', (_props, host) => {
  onMount(() => {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mode = host.getAttribute('mode') ?? 'threshold';
    if (mode === 'threshold') return animateThreshold(canvas, ctx, host);
    return animateThreshold(canvas, ctx, host);
  });

  return html``;
});
