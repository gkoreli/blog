import type { ColorValue, PrimitiveId } from '../core/index.js';

export type EffectKind = 'glow' | 'pulse' | 'electric';
export type PipeTriggerKind = 'enter-zone';

export interface EffectDescriptor<TKind extends EffectKind = EffectKind, TOptions = unknown> {
  readonly kind: TKind;
  readonly options: TOptions;
}

export interface GlowEffectOptions {
  readonly color: ColorValue;
  readonly strength: number;
  readonly radius: number;
}

export interface PulseEffectOptions {
  readonly color: ColorValue;
  readonly strength: number;
  readonly periodMs: number;
}

export interface ElectricEffectOptions {
  readonly color: ColorValue;
  readonly strength: number;
  readonly jitter: number;
}

export interface EnterZonePipe {
  readonly trigger: PipeTriggerKind;
  readonly zoneId: PrimitiveId;
  readonly effect: EffectDescriptor;
}

export interface ScenePipe {
  readonly targetId: PrimitiveId;
  readonly pipe: EnterZonePipe;
}
