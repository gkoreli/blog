/**
 * Neural network animation modules.
 *
 * Three modes, same AnimationModule contract:
 *   threshold()  — dormant network with periodic dopamine cascades
 *   flow()       — synchronized wave sweeping left-to-right
 *   split()      — flow network with a few links that quietly diverge
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

interface NeuralOptions {
  seed?: number;
}

interface TwinLink {
  from: number;
  to: number;
  normalX: number;
  normalY: number;
  peakOffset: number;
  residualOffset: number;
}

interface LinkCandidate {
  from: number;
  to: number;
  length: number;
  midX: number;
  midY: number;
}

interface FlowDrawOptions {
  twinLinks?: (TwinLink | undefined)[][];
  twinEnds?: (TwinLink | undefined)[];
  reducedMotion?: boolean;
}

type Theme = ReturnType<typeof getTheme>;
type RandomSource = () => number;

const FLOW_CYCLE_FRAMES = 300;
const FLOW_WAVE_WIDTH = 0.25;
const FRAME_MS = 1000 / 60;
const SPLIT_EASE_IN_MS = 600;
const SPLIT_HOLD_MS = 120;
const SPLIT_EASE_OUT_MS = 1400;

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

function seededRandom(seed: number): RandomSource {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSource(seed: number | undefined): RandomSource {
  return seed === undefined ? Math.random : seededRandom(seed);
}

function buildNetwork(w: number, h: number, random: RandomSource): Neuron[] {
  const neurons: Neuron[] = [];
  const spacing = Math.min(w, h) * 0.11;

  for (let i = 0; i < 45; i++) {
    const x = w * 0.08 + random() * w * 0.84;
    const y = h * 0.12 + random() * h * 0.76;
    let ok = true;
    for (const n of neurons) {
      const dx = n.x - x, dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < spacing * 0.7) { ok = false; break; }
    }
    if (ok) neurons.push({ x, y, r: 3 + random() * 3, charge: random() * 0.3, firing: false, refractory: 0, connections: [] });
  }

  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      const dx = neurons[i]!.x - neurons[j]!.x;
      const dy = neurons[i]!.y - neurons[j]!.y;
      if (Math.sqrt(dx * dx + dy * dy) < spacing * 1.6 && random() < 0.5) {
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

export function threshold(options: NeuralOptions = {}): AnimationModule {
  let neurons: Neuron[] = [];
  let signals: Signal[] = [];
  let dopamine: DopamineParticle[] = [];
  let theme = getTheme();
  let cascadeTimer = 0;
  let random = Math.random;
  const stopWatchingTheme = watchTheme(() => { theme = getTheme(); });

  function triggerNeuron(idx: number, isCascade: boolean) {
    const n = neurons[idx]!;
    if (n.refractory > 0) return;
    n.firing = true;
    n.charge = 1;
    n.refractory = isCascade ? 40 : 80;
    for (const ci of n.connections) {
      signals.push({ from: idx, to: ci, progress: 0, strength: isCascade ? 0.95 : 0.2 + random() * 0.3, dopamine: isCascade });
    }
  }

  return {
    resize(w, h) {
      random = randomSource(options.seed);
      neurons = buildNetwork(w, h, random);
      signals = [];
      dopamine = [];
      theme = getTheme();
    },

    tick(t): AnimationPoint[] {
      cascadeTimer++;

      if (t % 25 === 0 && neurons.length > 0) {
        const idx = Math.floor(random() * neurons.length);
        const n = neurons[idx]!;
        if (n.refractory <= 0) {
          n.charge = Math.min(n.charge + 0.3 + random() * 0.3, 1);
          if (n.charge >= 0.9) triggerNeuron(idx, false);
        }
      }

      if (cascadeTimer >= 360) {
        cascadeTimer = 0;
        if (neurons.length > 0) triggerNeuron(Math.floor(random() * neurons.length), true);
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
              dopamine.push({ x: target.x, y: target.y, vx: (random() - 0.5) * 1.5, vy: (random() - 0.5) * 1.5, life: 50 + random() * 30, maxLife: 80 });
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

// ── flow() and split() ───────────────────────────────────────────────────────

function flowWave(x: number, t: number, w: number): number {
  const waveX = (t % FLOW_CYCLE_FRAMES) / FLOW_CYCLE_FRAMES;
  return Math.max(0, 1 - Math.abs(x / w - waveX) / FLOW_WAVE_WIDTH);
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function splitOffset(twin: TwinLink, points: AnimationPoint[], t: number, w: number, reducedMotion: boolean): number {
  if (reducedMotion) return twin.residualOffset;

  const a = points[twin.from]!;
  const b = points[twin.to]!;
  const peakTime = (((a.x + b.x) / 2) / w) * FLOW_CYCLE_FRAMES * FRAME_MS;
  const time = t * FRAME_MS;

  if (time < peakTime) {
    const easeStart = Math.max(0, peakTime - SPLIT_EASE_IN_MS);
    if (time < easeStart) return 0;
    return twin.peakOffset * smoothstep((time - easeStart) / (peakTime - easeStart));
  }

  const cycleMs = FLOW_CYCLE_FRAMES * FRAME_MS;
  const sinceFirstPeak = time - peakTime;
  const sincePeak = sinceFirstPeak % cycleMs;
  const untilNextPeak = cycleMs - sincePeak;
  let envelope = 0;

  if (sincePeak <= SPLIT_HOLD_MS) {
    envelope = 1;
  } else if (sincePeak <= SPLIT_HOLD_MS + SPLIT_EASE_OUT_MS) {
    envelope = 1 - smoothstep((sincePeak - SPLIT_HOLD_MS) / SPLIT_EASE_OUT_MS);
  } else if (untilNextPeak <= SPLIT_EASE_IN_MS) {
    envelope = smoothstep(1 - untilNextPeak / SPLIT_EASE_IN_MS);
  }

  return twin.residualOffset + (twin.peakOffset - twin.residualOffset) * envelope;
}

function drawTwinStrands(
  ctx: CanvasRenderingContext2D,
  a: AnimationPoint,
  b: AnimationPoint,
  twin: TwinLink,
  offset: number,
  theme: Theme,
  alpha: number,
  lineWidth: number,
): void {
  const shadowX = b.x + twin.normalX * offset;
  const shadowY = b.y + twin.normalY * offset;

  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(shadowX, shadowY);
  ctx.strokeStyle = hexToRgba(theme.rust, alpha);
  ctx.lineWidth = lineWidth; ctx.stroke();

  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = hexToRgba(theme.blue, alpha);
  ctx.lineWidth = lineWidth; ctx.stroke();
}

function drawFlowNetwork(
  ctx: CanvasRenderingContext2D,
  points: AnimationPoint[],
  neurons: Neuron[],
  theme: Theme,
  t: number,
  w: number,
  h: number,
  options: FlowDrawOptions = {},
): void {
  const reducedMotion = options.reducedMotion === true;

  ctx.fillStyle = hexToRgba(theme.bg, 0.1);
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < neurons.length; i++) {
    const a = points[i]!;
    for (const j of neurons[i]!.connections) {
      if (j <= i) continue;
      const b = points[j]!;
      const wave = reducedMotion ? 0 : flowWave((a.x + b.x) / 2, t, w);
      const alpha = 0.03 + wave * 0.15;
      const lineWidth = 0.5 + wave;
      const twin = options.twinLinks?.[i]?.[j];

      if (twin) {
        drawTwinStrands(
          ctx,
          points[twin.from]!,
          points[twin.to]!,
          twin,
          splitOffset(twin, points, t, w, reducedMotion),
          theme,
          alpha,
          lineWidth,
        );
      } else {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(wave > 0.3 ? theme.blue : theme.muted, alpha);
        ctx.lineWidth = lineWidth; ctx.stroke();
      }
    }
  }

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i]!;
    const n = neurons[i]!;
    const wave = reducedMotion ? 0 : flowWave(x, t, w);
    const pulse = wave * wave;
    const twin = options.twinEnds?.[i];

    if (twin) {
      const offset = splitOffset(twin, points, t, w, reducedMotion);
      const shadowX = x + twin.normalX * offset;
      const shadowY = y + twin.normalY * offset;

      if (pulse > 0.2) {
        ctx.beginPath(); ctx.arc(shadowX, shadowY, n.r + 5 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(theme.rust, pulse * 0.08); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, n.r + 5 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(theme.blue, pulse * 0.08); ctx.fill();
      }

      ctx.beginPath(); ctx.arc(shadowX, shadowY, n.r + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(theme.rust, 0.15 + pulse * 0.65); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, n.r + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(theme.blue, 0.15 + pulse * 0.65); ctx.fill();
    } else {
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
  }
}

function linkCandidates(neurons: Neuron[]): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  for (let i = 0; i < neurons.length; i++) {
    for (const j of neurons[i]!.connections) {
      if (j <= i) continue;
      const first = neurons[i]!;
      const second = neurons[j]!;
      const from = first.x <= second.x ? i : j;
      const to = from === i ? j : i;
      const a = neurons[from]!;
      const b = neurons[to]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      candidates.push({
        from,
        to,
        length: Math.sqrt(dx * dx + dy * dy),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      });
    }
  }
  return candidates;
}

function shuffled<T>(items: T[], random: RandomSource): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const value = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = value;
  }
  return copy;
}

function chooseTwinLinks(neurons: Neuron[], w: number, h: number, random: RandomSource): TwinLink[] {
  const byLength = linkCandidates(neurons).sort((a, b) => a.length - b.length);
  const middle = byLength.slice(Math.floor(byLength.length * 0.25), Math.ceil(byLength.length * 0.75));
  const selected: LinkCandidate[] = [];
  const farNodes = new Set<number>();

  function addFirst(candidates: LinkCandidate[]): void {
    const candidate = candidates.find(item => !farNodes.has(item.to) && !selected.includes(item));
    if (!candidate) return;
    selected.push(candidate);
    farNodes.add(candidate.to);
  }

  addFirst([...middle].sort((a, b) => a.midX - b.midX));
  addFirst([...middle].sort((a, b) => b.midX - a.midX));
  addFirst([...middle].sort((a, b) => a.midY - b.midY));
  addFirst([...middle].sort((a, b) => b.midY - a.midY));

  for (const candidate of shuffled(middle, random)) {
    if (selected.length >= 5) break;
    if (farNodes.has(candidate.to) || selected.includes(candidate)) continue;
    selected.push(candidate);
    farNodes.add(candidate.to);
  }

  const scale = Math.max(0.55, Math.min(1.15, Math.min(w, h) / 900));
  return selected.slice(0, 5).map(candidate => {
    const a = neurons[candidate.from]!;
    const b = neurons[candidate.to]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const direction = random() < 0.5 ? -1 : 1;
    return {
      from: candidate.from,
      to: candidate.to,
      normalX: (-dy / candidate.length) * direction,
      normalY: (dx / candidate.length) * direction,
      peakOffset: (10 + random() * 4) * scale,
      residualOffset: 2 * scale,
    };
  });
}

function twinLookups(neuronCount: number, twins: TwinLink[]): {
  links: (TwinLink | undefined)[][];
  ends: (TwinLink | undefined)[];
} {
  const links = Array.from({ length: neuronCount }, () => Array<TwinLink | undefined>(neuronCount));
  const ends = Array<TwinLink | undefined>(neuronCount);
  for (const twin of twins) {
    const from = Math.min(twin.from, twin.to);
    const to = Math.max(twin.from, twin.to);
    links[from]![to] = twin;
    ends[twin.to] = twin;
  }
  return { links, ends };
}

export function flow(options: NeuralOptions = {}): AnimationModule {
  let neurons: Neuron[] = [];
  let theme = getTheme();
  const stopWatchingTheme = watchTheme(() => { theme = getTheme(); });

  return {
    resize(w, h) {
      neurons = buildNetwork(w, h, randomSource(options.seed));
      theme = getTheme();
    },

    tick(_t, _w, _h): AnimationPoint[] {
      return neurons.map(n => ({ x: n.x, y: n.y }));
    },

    draw(ctx, points, t, w, h) {
      drawFlowNetwork(ctx, points, neurons, theme, t, w, h);
    },

    dispose() {
      stopWatchingTheme();
    },
  };
}

export function split(options: NeuralOptions & { reducedMotion?: boolean } = {}): AnimationModule {
  let neurons: Neuron[] = [];
  let twinLinks: (TwinLink | undefined)[][] = [];
  let twinEnds: (TwinLink | undefined)[] = [];
  let theme = getTheme();
  const stopWatchingTheme = watchTheme(() => { theme = getTheme(); });

  return {
    resize(w, h) {
      const random = randomSource(options.seed);
      neurons = buildNetwork(w, h, random);
      const lookups = twinLookups(neurons.length, chooseTwinLinks(neurons, w, h, random));
      twinLinks = lookups.links;
      twinEnds = lookups.ends;
      theme = getTheme();
    },

    tick(_t, _w, _h): AnimationPoint[] {
      return neurons.map(n => ({ x: n.x, y: n.y }));
    },

    draw(ctx, points, t, w, h) {
      drawFlowNetwork(ctx, points, neurons, theme, t, w, h, {
        twinLinks,
        twinEnds,
        reducedMotion: options.reducedMotion === true,
      });
    },

    dispose() {
      stopWatchingTheme();
    },
  };
}
