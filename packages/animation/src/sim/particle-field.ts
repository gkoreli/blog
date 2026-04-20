import type { ColorValue, PrimitiveId, RuntimePrimitive, RuntimeSize } from '../core/index.js';

export const PARTICLE_FIELD_KIND = 'particle-field';

export interface ParticleFieldOptions {
  readonly count: number;
  readonly seed?: number;
  readonly minSpeed?: number;
  readonly maxSpeed?: number;
  readonly minRadius?: number;
  readonly maxRadius?: number;
  readonly alpha?: number;
  readonly color?: ColorValue;
}

export interface ParticleFieldStyle {
  readonly color: ColorValue;
  readonly alpha: number;
  readonly radiusScale: number;
}

export interface ParticleSnapshot {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly alpha: number;
  readonly ageMs: number;
}

export interface ParticleFieldRenderData {
  readonly field: ParticleField;
  readonly style: ParticleFieldStyle;
}

export interface ParticleFieldPrimitive
  extends RuntimePrimitive<typeof PARTICLE_FIELD_KIND, ParticleFieldRenderData> {}

export interface ParticleFieldBlueprint {
  build(id: PrimitiveId): ParticleFieldPrimitive;
}

const DEFAULT_MIN_SPEED = 0.006;
const DEFAULT_MAX_SPEED = 0.018;
const DEFAULT_MIN_RADIUS = 1.5;
const DEFAULT_MAX_RADIUS = 3.5;
const DEFAULT_ALPHA = 0.72;
const DEFAULT_COLOR = '#6ec9a8';

export class ParticleField {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly radius: Float32Array;
  readonly alpha: Float32Array;
  readonly ageMs: Float32Array;

  private readonly countValue: number;

  constructor(options: ParticleFieldOptions) {
    const count = Math.max(0, Math.floor(options.count));
    const random = createRandom(options.seed ?? 1);
    const minSpeed = options.minSpeed ?? DEFAULT_MIN_SPEED;
    const maxSpeed = options.maxSpeed ?? DEFAULT_MAX_SPEED;
    const minRadius = options.minRadius ?? DEFAULT_MIN_RADIUS;
    const maxRadius = options.maxRadius ?? DEFAULT_MAX_RADIUS;
    const baseAlpha = options.alpha ?? DEFAULT_ALPHA;

    this.countValue = count;
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.radius = new Float32Array(count);
    this.alpha = new Float32Array(count);
    this.ageMs = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = lerp(minSpeed, maxSpeed, random());

      this.x[index] = random();
      this.y[index] = random();
      this.vx[index] = Math.cos(angle) * speed;
      this.vy[index] = Math.sin(angle) * speed;
      this.radius[index] = lerp(minRadius, maxRadius, random());
      this.alpha[index] = baseAlpha * lerp(0.55, 1, random());
      this.ageMs[index] = random() * 1_000;
    }
  }

  get count(): number {
    return this.countValue;
  }

  step(deltaMs: number): void {
    const dt = Math.min(Math.max(deltaMs, 0), 50) / 1_000;

    for (let index = 0; index < this.countValue; index += 1) {
      let nextVx = readFloat(this.vx, index);
      let nextVy = readFloat(this.vy, index);
      let nextX = readFloat(this.x, index) + nextVx * dt;
      let nextY = readFloat(this.y, index) + nextVy * dt;

      if (nextX < 0 || nextX > 1) {
        nextVx *= -1;
        nextX = clamp01(nextX);
      }

      if (nextY < 0 || nextY > 1) {
        nextVy *= -1;
        nextY = clamp01(nextY);
      }

      this.x[index] = nextX;
      this.y[index] = nextY;
      this.vx[index] = nextVx;
      this.vy[index] = nextVy;
      this.ageMs[index] = readFloat(this.ageMs, index) + deltaMs;
    }
  }

  forEachParticle(size: RuntimeSize, visit: (particle: ParticleSnapshot) => void): void {
    for (let index = 0; index < this.countValue; index += 1) {
      visit({
        index,
        x: readFloat(this.x, index) * size.width,
        y: readFloat(this.y, index) * size.height,
        radius: readFloat(this.radius, index),
        alpha: readFloat(this.alpha, index),
        ageMs: readFloat(this.ageMs, index),
      });
    }
  }
}

export function createParticleField(options: ParticleFieldOptions): ParticleField {
  return new ParticleField(options);
}

export function createParticleFieldPrimitive(
  id: PrimitiveId,
  field: ParticleField,
  style: Partial<ParticleFieldStyle> = {},
): ParticleFieldPrimitive {
  return {
    kind: PARTICLE_FIELD_KIND,
    id,
    data: {
      field,
      style: {
        color: style.color ?? DEFAULT_COLOR,
        alpha: style.alpha ?? DEFAULT_ALPHA,
        radiusScale: style.radiusScale ?? 1,
      },
    },
  };
}

export function graphParticles(options: ParticleFieldOptions): ParticleFieldBlueprint {
  return {
    build(id: PrimitiveId): ParticleFieldPrimitive {
      return createParticleFieldPrimitive(
        id,
        createParticleField(options),
        {
          color: options.color ?? DEFAULT_COLOR,
          alpha: options.alpha ?? DEFAULT_ALPHA,
          radiusScale: 1,
        },
      );
    },
  };
}

export function isParticleFieldPrimitive(primitive: RuntimePrimitive): primitive is ParticleFieldPrimitive {
  return primitive.kind === PARTICLE_FIELD_KIND && isParticleFieldRenderData(primitive.data);
}

function isParticleFieldRenderData(value: unknown): value is ParticleFieldRenderData {
  if (!isRecord(value)) return false;
  return value.field instanceof ParticleField && isParticleFieldStyle(value.style);
}

function isParticleFieldStyle(value: unknown): value is ParticleFieldStyle {
  if (!isRecord(value)) return false;
  const color = value.color;
  return (
    (typeof color === 'string' || typeof color === 'number') &&
    typeof value.alpha === 'number' &&
    typeof value.radiusScale === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function readFloat(values: Float32Array, index: number): number {
  return values[index] ?? 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}
