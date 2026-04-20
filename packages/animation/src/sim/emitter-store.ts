import type { EmitterDefinition, MaterialDefinition } from '../authoring/index.js';
import { spawnParticle } from './particle-store.js';
import type { ParticleStore } from './particle-store.js';

export interface EmitterRuntimeState {
  carry: number;
  random: () => number;
}

export function createEmitterRuntimeState(seed: number): EmitterRuntimeState {
  return {
    carry: 0,
    random: createRandom(seed),
  };
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
  const spawnCount = wholeCount + emitter.burst;
  const color = parseHexColor(material.color);

  for (let index = 0; index < spawnCount; index += 1) {
    const point = sampleEmitterPoint(emitter, state.random);
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

function sampleEmitterPoint(emitter: EmitterDefinition, random: () => number): { readonly x: number; readonly y: number } {
  const shape = emitter.shape;

  if (shape.kind === 'point') return { x: shape.x, y: shape.y };
  if (shape.kind === 'line') {
    const t = random();
    return { x: lerp(shape.x1, shape.x2, t), y: lerp(shape.y1, shape.y2, t) };
  }

  return {
    x: shape.x + shape.width * random(),
    y: shape.y + shape.height * random(),
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
