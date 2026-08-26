import type { BlendHint, MaterialDefinition, MaterialKind, ParticleMarkDefinition } from './types.js';

export interface MaterialOptions {
  readonly color: string;
  readonly radius?: number;
  readonly alpha?: number;
  readonly emissive?: number;
  readonly blur?: number;
  readonly trail?: number;
  readonly noise?: number;
  readonly blendHint?: BlendHint;
  readonly mark?: ParticleMarkDefinition;
}

export function solidMaterial(options: MaterialOptions): Omit<MaterialDefinition, 'id'> {
  return material('solid', options);
}

export function glowMaterial(options: MaterialOptions): Omit<MaterialDefinition, 'id'> {
  return material('glow', { ...options, blendHint: options.blendHint ?? 'screen' });
}

export function electricMaterial(options: MaterialOptions): Omit<MaterialDefinition, 'id'> {
  return material('electric', { ...options, blendHint: options.blendHint ?? 'additive' });
}

function material(kind: MaterialKind, options: MaterialOptions): Omit<MaterialDefinition, 'id'> {
  return {
    kind,
    color: options.color,
    radius: options.radius ?? 2,
    alpha: options.alpha ?? 0.8,
    emissive: options.emissive ?? 0,
    blur: options.blur ?? 0,
    trail: options.trail ?? 0,
    noise: options.noise ?? 0,
    blendHint: options.blendHint ?? 'normal',
    mark: options.mark ?? { kind: 'circle' },
  };
}
