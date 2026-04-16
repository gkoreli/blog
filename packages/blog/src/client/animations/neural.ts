/**
 * Neural network animation modules.
 *
 * Two modes, same AnimationModule contract:
 *   threshold()  — dormant network with periodic dopamine cascades
 *   flow()       — synchronized wave sweeping left-to-right
 *
 * tick() returns neuron positions as AnimationPoint[].
 * draw() zips post-effect points[i] (position) with neurons[i] (charge/state),
 * so effects that move neurons (e.g. cursor repulsion) are reflected in
 * signal paths and connection rendering automatically.
 */
import type { AnimationModule, AnimationPoint } from './pipeline.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Neuron {
  x: number; y: number;
  r: number;
  charge: number;
  firing: boolean;
  refractory: number;
  connections: number[];
}

interface Signal {
  from: number; to: number;
  progress: number;
  strength: number;
  dopamine: boolean;
}

interface DopamineParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
}

// ── Shared utilities ──────────────────────────────────────────────────────────

function hexToRgba(hex: string, a: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(150,140,130,${a})`;
  return `rgba(${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)},${a})`;
}

function getTheme() {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return {
    bg:    get('--color-bg',           '#1a1a1a'),
    muted: get('--color-text-muted',   '#9a9589'),
    warm:  get('--color-accent-warm',  '#e8c87a'),
    rust:  get('--color-accent-rust',  '#c05a2e'),
    blue:  get('--color-accent-blue',  '#5b8fa8'),
  };
}

function buildNetwork(w: number, h: number): Neuron[] {
  const neurons: Neuron[] = [];
  const spacing = Math.min(w, h) * 0.11;

  for (let i = 0; i < 45; i++) {
    const x = w * 0.08 + Math.random() * w * 0.84;
    const y = h * 0.12 + Math.random() * h * 0.76;
    let ok = true;
    for (const n of neurons) {
      const dx = n.x - x, dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < spacing * 0.7) { ok = false; break; }
    }
    if (ok) neurons.push({ x, y, r: 3 + Math.random() * 3, charge: Math.random() * 0.3, firing: false, refractory: 0, connections: [] });
  }

  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      const dx = neurons[i]!.x - neurons[j]!.x;
      const dy = neurons[i]!.y - neurons[j]!.y;
      if (Math.sqrt(dx * dx + dy * dy) < spacing * 1.6 && Math.random() < 0.5) {
        neurons[i]!.connections.push(j);
        neurons[j]!.connections.push(i);
      }
    }
  }

  return neurons;
}

function watchTheme(cb: () => void): () => void {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}

// ── threshold() ──────────────────────────────────────────────────────────────

export function threshold(): AnimationModule {
  let neurons: Neuron[] = [];
  let signals: Signal[] = [];
  let dopamine: DopamineParticle[] = [];
  let theme = getTheme();
  let cascadeTimer = 0;
  const stopWatchingTheme = watchTheme(() => { theme = getTheme(); });

  function triggerNeuron(idx: number, isCascade: boolean) {
    const n = neurons[idx]!;
    if (n.refractory > 0) return;
    n.firing = true;
    n.charge = 1;
    n.refractory = isCascade ? 40 : 80;
    for (const ci of n.connections) {
      signals.push({ from: idx, to: ci, progress: 0, strength: isCascade ? 0.95 : 0.2 + Math.random() * 0.3, dopamine: isCascade });
    }
  }

  return {
    resize(w, h) {
      neurons = buildNetwork(w, h);
      signals = [];
      dopamine = [];
      theme = getTheme();
    },

    tick(t): AnimationPoint[] {
      cascadeTimer++;

      if (t % 25 === 0 && neurons.length > 0) {
        const idx = Math.floor(Math.random() * neurons.length);
        const n = neurons[idx]!;
        if (n.refractory <= 0) {
          n.charge = Math.min(n.charge + 0.3 + Math.random() * 0.3, 1);
          if (n.charge >= 0.9) triggerNeuron(idx, false);
        }
      }

      if (cascadeTimer >= 360) {
        cascadeTimer = 0;
        if (neurons.length > 0) triggerNeuron(Math.floor(Math.random() * neurons.length), true);
      }

      const next: Signal[] = [];
      for (const s of signals) {
        s.progress += 0.025;
        if (!s.dopamine) s.strength *= 0.985;
        if (s.progress >= 1) {
          const target = neurons[s.to]!;
          target.charge = Math.min(target.charge + s.strength * 0.6, 1);
          if (target.charge >= 0.85 && s.dopamine && target.refractory <= 0) triggerNeuron(s.to, true);
          if (s.dopamine) {
            for (let i = 0; i < 4; i++) {
              dopamine.push({ x: target.x, y: target.y, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, life: 50 + Math.random() * 30, maxLife: 80 });
            }
          }
        } else {
          next.push(s);
        }
      }
      signals = next;

      for (const n of neurons) {
        if (n.refractory > 0) { n.refractory--; n.firing = n.refractory > 30; }
        n.charge *= 0.992;
      }

      dopamine = dopamine.filter(d => { d.x += d.vx; d.y += d.vy; d.vx *= 0.97; d.vy *= 0.97; d.life--; return d.life > 0; });

      return neurons.map(n => ({ x: n.x, y: n.y }));
    },

    draw(ctx, points, _t, w, h) {
      ctx.fillStyle = hexToRgba(theme.bg, 0.12);
      ctx.fillRect(0, 0, w, h);

      // Connections — use post-effect positions
      for (let i = 0; i < neurons.length; i++) {
        const a = points[i]!;
        for (const j of neurons[i]!.connections) {
          if (j <= i) continue;
          const b = points[j]!;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(theme.muted, 0.04 + Math.max(neurons[i]!.charge, neurons[j]!.charge) * 0.08);
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }

      // Signals — lerp along post-effect neuron positions
      for (const s of signals) {
        const a = points[s.from]!, b = points[s.to]!;
        const x = a.x + (b.x - a.x) * s.progress;
        const y = a.y + (b.y - a.y) * s.progress;
        ctx.beginPath(); ctx.arc(x, y, s.dopamine ? 3 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.dopamine ? theme.warm : theme.muted, s.strength * 0.8);
        ctx.fill();
        if (s.dopamine) {
          ctx.beginPath();
          ctx.moveTo(a.x + (b.x - a.x) * Math.max(0, s.progress - 0.15), a.y + (b.y - a.y) * Math.max(0, s.progress - 0.15));
          ctx.lineTo(x, y);
          ctx.strokeStyle = hexToRgba(theme.warm, s.strength * 0.25);
          ctx.lineWidth = 1.5; ctx.stroke();
        }
      }

      // Dopamine particles
      for (const d of dopamine) {
        ctx.beginPath(); ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(theme.warm, (d.life / d.maxLife) * 0.6);
        ctx.fill();
      }

      // Neurons — use post-effect positions, internal state for color/glow
      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i]!;
        const n = neurons[i]!;
        if (n.charge > 0.3) {
          ctx.beginPath(); ctx.arc(x, y, n.r + 6, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(n.firing ? theme.warm : theme.rust, (n.charge - 0.3) * 0.12);
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(n.firing ? theme.warm : theme.muted, 0.15 + n.charge * 0.6);
        ctx.fill();
        if (n.firing) {
          ctx.beginPath(); ctx.arc(x, y, n.r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(theme.warm, 0.8); ctx.fill();
        }
      }
    },

    dispose() {
      stopWatchingTheme();
    },
  };
}

// ── flow() ────────────────────────────────────────────────────────────────────

export function flow(): AnimationModule {
  let neurons: Neuron[] = [];
  let theme = getTheme();
  const stopWatchingTheme = watchTheme(() => { theme = getTheme(); });

  return {
    resize(w, h) {
      neurons = buildNetwork(w, h);
      theme = getTheme();
    },

    tick(_t, _w, _h): AnimationPoint[] {
      return neurons.map(n => ({ x: n.x, y: n.y }));
    },

    draw(ctx, points, t, w, h) {
      ctx.fillStyle = hexToRgba(theme.bg, 0.1);
      ctx.fillRect(0, 0, w, h);

      const waveX    = (t % 300) / 300;
      const waveWidth = 0.25;

      for (let i = 0; i < neurons.length; i++) {
        const a = points[i]!;
        for (const j of neurons[i]!.connections) {
          if (j <= i) continue;
          const b = points[j]!;
          const wave = Math.max(0, 1 - Math.abs(((a.x + b.x) / 2) / w - waveX) / waveWidth);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = hexToRgba(wave > 0.3 ? theme.blue : theme.muted, 0.03 + wave * 0.15);
          ctx.lineWidth = 0.5 + wave; ctx.stroke();
        }
      }

      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i]!;
        const n = neurons[i]!;
        const wave  = Math.max(0, 1 - Math.abs(x / w - waveX) / waveWidth);
        const pulse = wave * wave;
        if (pulse > 0.2) {
          ctx.beginPath(); ctx.arc(x, y, n.r + 5 + pulse * 4, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(theme.blue, pulse * 0.1); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, n.r + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(pulse > 0.5 ? theme.warm : pulse > 0.2 ? theme.blue : theme.muted, 0.15 + pulse * 0.65);
        ctx.fill();
        if (pulse > 0.6) {
          ctx.beginPath(); ctx.arc(x, y, n.r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(theme.warm, pulse * 0.7); ctx.fill();
        }
      }
    },

    dispose() {
      stopWatchingTheme();
    },
  };
}
