import type { FieldId, TimelineId } from '../core/index.js';
import type { EffectStageDefinition } from './effect.js';
import { always, timelineActive } from './effect.js';

export interface DecayAlphaOptions {
  readonly rate: number;
}

export interface TimelinePulseOptions {
  readonly min: number;
  readonly max: number;
}

export function applyFieldVelocity(fieldId: FieldId, strength = 1): EffectStageDefinition {
  return always({
    op: 'field-velocity',
    fieldId,
    strength,
  }, `field-velocity:${fieldId}`);
}

export function decayAlpha(options: DecayAlphaOptions): EffectStageDefinition {
  return always({
    op: 'decay',
    channel: 'alpha',
    rate: options.rate,
  }, 'decay-alpha');
}

export function timelinePulse(
  timelineId: TimelineId,
  channel: 'alpha' | 'radius' | 'emissive',
  options: TimelinePulseOptions,
): EffectStageDefinition {
  return timelineActive(timelineId, {
    op: 'timeline-pulse',
    timelineId,
    channel,
    min: options.min,
    max: options.max,
  }, `timeline-pulse:${timelineId}:${channel}`);
}
