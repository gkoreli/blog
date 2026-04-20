import type {
  EmitterId,
  FieldId,
  MaterialId,
  ParticleSystemId,
  SceneId,
  TimelineId,
  ZoneId,
} from '../core/index.js';
import type { PipeDefinition } from '../effects/index.js';

export type ZoneBlendMode = 'highest-priority' | 'accumulate' | 'exclusive';

export type ZoneShape =
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | { readonly kind: 'circle'; readonly x: number; readonly y: number; readonly radius: number };

export interface ZoneDefinition {
  readonly id: ZoneId;
  readonly shape: ZoneShape;
  readonly tags: readonly string[];
  readonly priority: number;
  readonly blendMode: ZoneBlendMode;
}

export type EmitterShape =
  | { readonly kind: 'point'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | { readonly kind: 'text-box'; readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export interface Range {
  readonly min: number;
  readonly max: number;
}

export interface EmitterDefinition {
  readonly id: EmitterId;
  readonly shape: EmitterShape;
  readonly rate: number;
  readonly burst: number;
  readonly direction: Range;
  readonly speed: Range;
  readonly lifetime: Range;
  readonly material: MaterialId;
  readonly tags: readonly string[];
}

export type MaterialKind = 'solid' | 'glow' | 'ember' | 'electric' | 'ghost';
export type BlendHint = 'normal' | 'additive' | 'screen';

export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly kind: MaterialKind;
  readonly color: string;
  readonly radius: number;
  readonly alpha: number;
  readonly emissive: number;
  readonly blur: number;
  readonly trail: number;
  readonly noise: number;
  readonly blendHint: BlendHint;
}

export type FieldDefinition =
  | {
      readonly id: FieldId;
      readonly kind: 'noise';
      readonly strength: number;
      readonly scale: number;
      readonly speed: number;
      readonly seed: number;
    };

export type TimelineSource = 'time' | 'scroll' | 'section' | 'viewport' | 'event-pulse';

export interface TimelineDefinition {
  readonly id: TimelineId;
  readonly source: TimelineSource;
  readonly inputStart: number;
  readonly inputEnd: number;
  readonly outputStart: number;
  readonly outputEnd: number;
}

export interface ParticleSystemDefinition {
  readonly id: ParticleSystemId;
  readonly emitter: EmitterId;
  readonly material: MaterialId;
  readonly capacity: number;
  readonly pipes: readonly PipeDefinition[];
  readonly tags: readonly string[];
}

export interface SceneDefinition {
  readonly id: SceneId;
  readonly fields: readonly FieldDefinition[];
  readonly zones: readonly ZoneDefinition[];
  readonly emitters: readonly EmitterDefinition[];
  readonly materials: readonly MaterialDefinition[];
  readonly systems: readonly ParticleSystemDefinition[];
  readonly timelines: readonly TimelineDefinition[];
}
