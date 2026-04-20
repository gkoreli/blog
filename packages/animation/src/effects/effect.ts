import type { EffectId, FieldId, TimelineId, ZoneId } from '../core/index.js';
import type { EffectChannel } from './channels.js';

export interface PipeDefinition {
  readonly id: string;
  readonly stages: readonly EffectStageDefinition[];
}

export interface EffectStageDefinition {
  readonly id: EffectId;
  readonly when: EffectCondition;
  readonly apply: EffectApplyDefinition;
}

export type EffectCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'inside-zone'; readonly zoneId: ZoneId }
  | { readonly kind: 'outside-zone'; readonly zoneId: ZoneId }
  | { readonly kind: 'on-enter-zone'; readonly zoneId: ZoneId }
  | { readonly kind: 'on-exit-zone'; readonly zoneId: ZoneId }
  | { readonly kind: 'timeline-active'; readonly timelineId: TimelineId };

export type EffectApplyDefinition =
  | {
      readonly op: 'add';
      readonly channel: EffectChannel;
      readonly value: number | readonly [number, number, number];
    }
  | {
      readonly op: 'multiply';
      readonly channel: EffectChannel;
      readonly value: number;
    }
  | {
      readonly op: 'override';
      readonly channel: EffectChannel;
      readonly value: number | readonly [number, number, number];
    }
  | {
      readonly op: 'field-velocity';
      readonly fieldId: FieldId;
      readonly strength: number;
    }
  | {
      readonly op: 'decay';
      readonly channel: Extract<EffectChannel, 'alpha'>;
      readonly rate: number;
    }
  | {
      readonly op: 'timeline-pulse';
      readonly timelineId: TimelineId;
      readonly channel: Extract<EffectChannel, 'alpha' | 'radius' | 'emissive'>;
      readonly min: number;
      readonly max: number;
    };

export function pipe(id: string, stages: readonly EffectStageDefinition[]): PipeDefinition {
  return { id, stages };
}

export function always(apply: EffectApplyDefinition, id = `always:${apply.op}`): EffectStageDefinition {
  return { id, when: { kind: 'always' }, apply };
}

export function insideZone(
  zoneId: ZoneId,
  apply: EffectApplyDefinition,
  id = `inside:${zoneId}:${apply.op}`,
): EffectStageDefinition {
  return { id, when: { kind: 'inside-zone', zoneId }, apply };
}

export function outsideZone(
  zoneId: ZoneId,
  apply: EffectApplyDefinition,
  id = `outside:${zoneId}:${apply.op}`,
): EffectStageDefinition {
  return { id, when: { kind: 'outside-zone', zoneId }, apply };
}

export function onEnterZone(
  zoneId: ZoneId,
  apply: EffectApplyDefinition,
  id = `enter:${zoneId}:${apply.op}`,
): EffectStageDefinition {
  return { id, when: { kind: 'on-enter-zone', zoneId }, apply };
}

export function onExitZone(
  zoneId: ZoneId,
  apply: EffectApplyDefinition,
  id = `exit:${zoneId}:${apply.op}`,
): EffectStageDefinition {
  return { id, when: { kind: 'on-exit-zone', zoneId }, apply };
}

export function timelineActive(
  timelineId: TimelineId,
  apply: EffectApplyDefinition,
  id = `timeline:${timelineId}:${apply.op}`,
): EffectStageDefinition {
  return { id, when: { kind: 'timeline-active', timelineId }, apply };
}
