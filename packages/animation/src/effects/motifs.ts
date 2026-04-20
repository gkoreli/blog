import type {
  EffectDescriptor,
  ElectricEffectOptions,
  GlowEffectOptions,
  PulseEffectOptions,
} from './types.js';

export function glow(options: Partial<GlowEffectOptions> = {}): EffectDescriptor<'glow', GlowEffectOptions> {
  return {
    kind: 'glow',
    options: {
      color: options.color ?? '#6ec9a8',
      strength: options.strength ?? 0.65,
      radius: options.radius ?? 18,
    },
  };
}

export function pulse(options: Partial<PulseEffectOptions> = {}): EffectDescriptor<'pulse', PulseEffectOptions> {
  return {
    kind: 'pulse',
    options: {
      color: options.color ?? '#93c5fd',
      strength: options.strength ?? 0.4,
      periodMs: options.periodMs ?? 1_800,
    },
  };
}

export function electric(
  options: Partial<ElectricEffectOptions> = {},
): EffectDescriptor<'electric', ElectricEffectOptions> {
  return {
    kind: 'electric',
    options: {
      color: options.color ?? '#93c5fd',
      strength: options.strength ?? 0.5,
      jitter: options.jitter ?? 0.18,
    },
  };
}
