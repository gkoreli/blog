import type { EffectApplyDefinition } from './effect.js';
import type { EffectChannel } from './channels.js';

export function add(
  channel: EffectChannel,
  value: number | readonly [number, number, number],
): EffectApplyDefinition {
  return { op: 'add', channel, value };
}

export function multiply(channel: EffectChannel, value: number): EffectApplyDefinition {
  return { op: 'multiply', channel, value };
}

export function override(
  channel: EffectChannel,
  value: number | readonly [number, number, number],
): EffectApplyDefinition {
  return { op: 'override', channel, value };
}
