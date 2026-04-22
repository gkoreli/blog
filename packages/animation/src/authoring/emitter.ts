import type { EmitterDefinition, EmitterShape, Range } from './types.js';
import type { TextSourceId } from '../core/index.js';

export interface EmitterOptions {
  readonly rate: number;
  readonly material: string;
  readonly burst?: number;
  readonly direction?: Range;
  readonly speed?: Range;
  readonly lifetime?: Range;
  readonly tags?: readonly string[];
}

export interface PointEmitterOptions extends EmitterOptions {
  readonly x: number;
  readonly y: number;
}

export interface RectEmitterOptions extends EmitterOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TextBoxEmitterOptions extends RectEmitterOptions {
  readonly source?: TextSourceId;
}

export function pointEmitter(options: PointEmitterOptions): Omit<EmitterDefinition, 'id'> {
  return emitter({ kind: 'point', x: options.x, y: options.y }, options);
}

export function rectEmitter(options: RectEmitterOptions): Omit<EmitterDefinition, 'id'> {
  return emitter({ kind: 'rect', x: options.x, y: options.y, width: options.width, height: options.height }, options);
}

export function textBoxEmitter(options: TextBoxEmitterOptions): Omit<EmitterDefinition, 'id'> {
  const shape: EmitterShape = options.source === undefined
    ? { kind: 'text-box', x: options.x, y: options.y, width: options.width, height: options.height }
    : { kind: 'text-box', x: options.x, y: options.y, width: options.width, height: options.height, source: options.source };

  return emitter(shape, options);
}

function emitter(shape: EmitterShape, options: EmitterOptions): Omit<EmitterDefinition, 'id'> {
  return {
    shape,
    rate: options.rate,
    burst: options.burst ?? 0,
    direction: options.direction ?? { min: -Math.PI, max: Math.PI },
    speed: options.speed ?? { min: 0.015, max: 0.055 },
    lifetime: options.lifetime ?? { min: 2.5, max: 5.5 },
    material: options.material,
    tags: options.tags ?? [],
  };
}
