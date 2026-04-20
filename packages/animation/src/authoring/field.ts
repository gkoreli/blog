import type { FieldDefinition } from './types.js';

export interface NoiseFieldOptions {
  readonly strength?: number;
  readonly scale?: number;
  readonly speed?: number;
  readonly seed?: number;
}

export function noiseField(options: NoiseFieldOptions = {}): Omit<FieldDefinition, 'id'> {
  return {
    kind: 'noise',
    strength: options.strength ?? 1,
    scale: options.scale ?? 1,
    speed: options.speed ?? 1,
    seed: options.seed ?? 1,
  };
}
