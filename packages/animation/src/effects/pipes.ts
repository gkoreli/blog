import type { PrimitiveId } from '../core/index.js';
import type { EffectDescriptor, EnterZonePipe } from './types.js';

export function enterZone(zoneId: PrimitiveId, effect: EffectDescriptor): EnterZonePipe {
  return {
    trigger: 'enter-zone',
    zoneId,
    effect,
  };
}
