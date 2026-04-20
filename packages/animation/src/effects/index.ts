export { electric, glow, pulse } from './motifs.js';
export { enterZone } from './pipes.js';
export { add, multiply, override } from './operators.js';
export {
  always,
  insideZone,
  onEnterZone,
  onExitZone,
  outsideZone,
  pipe,
  timelineActive,
} from './effect.js';
export { applyFieldVelocity, decayAlpha, timelinePulse } from './modules.js';
export type { EffectChannel } from './channels.js';
export type {
  EffectApplyDefinition,
  EffectCondition,
  EffectStageDefinition,
  PipeDefinition,
} from './effect.js';
export type { DecayAlphaOptions, TimelinePulseOptions } from './modules.js';
export type {
  EffectDescriptor,
  EffectKind,
  ElectricEffectOptions,
  EnterZonePipe,
  GlowEffectOptions,
  PipeTriggerKind,
  PulseEffectOptions,
  ScenePipe,
} from './types.js';
