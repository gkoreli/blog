import type { EmitterDefinition, MaterialDefinition } from '../authoring/index.js';
import { spawnParticle } from './particle-store.js';
import type { ParticleStore } from './particle-store.js';

export interface EmitterRuntimeState {
  carry: number;
  pendingBurst: number;
  random: () => number;
  pointSampler?: EmitterPointSampler;
}

export interface EmitterSamplePoint {
  readonly x: number;
  readonly y: number;
}

export interface EmitterPointSampler {
  sample(random: () => number): EmitterSamplePoint | undefined;
}

export function createEmitterRuntimeState(
  seed: number,
  pointSampler?: EmitterPointSampler,
  initialBurst = 0,
): EmitterRuntimeState {
  const state: EmitterRuntimeState = {
    carry: 0,
    pendingBurst: Math.max(0, Math.floor(initialBurst)),
    random: createRandom(seed),
  };

  if (pointSampler) {
    state.pointSampler = pointSampler;
  }

  return state;
}

export function spawnFromEmitter(
  store: ParticleStore,
  emitter: EmitterDefinition,
  material: MaterialDefinition,
  materialIndex: number,
  state: EmitterRuntimeState,
  dtSeconds: number,
): void {
  state.carry += Math.max(0, emitter.rate) * dtSeconds;
  const wholeCount = Math.floor(state.carry);
  state.carry -= wholeCount;
  const spawnCount = wholeCount + state.pendingBurst;
  state.pendingBurst = 0;
  const color = parseHexColor(material.color);

  for (let index = 0; index < spawnCount; index += 1) {
    const point = sampleEmitterPoint(emitter, state);
    const direction = lerp(emitter.direction.min, emitter.direction.max, state.random());
    const speed = lerp(emitter.speed.min, emitter.speed.max, state.random());

    spawnParticle(store, {
      x: point.x,
      y: point.y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      life: lerp(emitter.lifetime.min, emitter.lifetime.max, state.random()),
      radius: material.radius,
      alpha: material.alpha,
      emissive: material.emissive,
      noise: material.noise,
      trail: material.trail,
      colorR: color.r,
      colorG: color.g,
      colorB: color.b,
      materialIndex,
    });
  }
}

function sampleEmitterPoint(emitter: EmitterDefinition, state: EmitterRuntimeState): EmitterSamplePoint {
  const shape = emitter.shape;
  const random = state.random;

  if (shape.kind === 'point') return { x: shape.x, y: shape.y };
  if (shape.kind === 'line') {
    const t = random();
    return { x: lerp(shape.x1, shape.x2, t), y: lerp(shape.y1, shape.y2, t) };
  }
  if (shape.kind === 'text-box') {
    const point = state.pointSampler?.sample(random);
    if (point) return point;
    return sampleTextBoxPoint(shape, random);
  }

  return {
    x: shape.x + shape.width * random(),
    y: shape.y + shape.height * random(),
  };
}

function sampleTextBoxPoint(
  shape: Extract<EmitterDefinition['shape'], { readonly kind: 'text-box' }>,
  random: () => number,
): { readonly x: number; readonly y: number } {
  const insetX = shape.width * 0.08;
  const textX = shape.x + insetX + (shape.width - insetX * 2) * random();
  const bandRoll = random();
  const bandCenter = bandRoll < 0.42 ? 0.34 : bandRoll < 0.76 ? 0.52 : 0.7;
  const jitter = (random() - 0.5) * 0.11;

  return {
    x: textX,
    y: shape.y + shape.height * Math.min(0.82, Math.max(0.22, bandCenter + jitter)),
  };
}

function parseHexColor(color: string): { readonly r: number; readonly g: number; readonly b: number } {
  if (!color.startsWith('#')) return { r: 255, g: 255, b: 255 };

  const parsed = Number.parseInt(color.slice(1), 16);
  if (Number.isNaN(parsed)) return { r: 255, g: 255, b: 255 };

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}
