import type {
  ColorValue,
  EmitterId,
  FieldId,
  MaterialId,
  ParticleSystemId,
  PrimitiveAnchor,
  PolylinePrimitiveData,
  PrimitiveRect,
  SceneId,
  TextPrimitiveStyle,
  TextSourceId,
  TimelineId,
  ZoneId,
} from '../core/index.js';
import type { PipeDefinition } from '../effects/index.js';
export const SCENE_DEFINITION_VERSION = 1;

export type ZoneBlendMode = 'highest-priority' | 'accumulate' | 'exclusive';

export type ZoneShape =
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | { readonly kind: 'circle'; readonly x: number; readonly y: number; readonly radius: number };
export interface ZoneVisualDefinition {
  readonly stroke: ColorValue;
  readonly strokeAlpha: number;
  readonly fill: ColorValue;
  readonly fillAlpha: number;
}

export interface ZoneDefinition {
  readonly id: ZoneId;
  readonly shape: ZoneShape;
  readonly tags: readonly string[];
  readonly priority: number;
  readonly blendMode: ZoneBlendMode;
  readonly visual?: ZoneVisualDefinition;
}
export interface PolylineTimelineDefinition {
  readonly timelineId: TimelineId;
  readonly revealStart: number;
  readonly revealEnd: number;
  readonly fadeStart: number;
  readonly fadeEnd: number;
}

export interface PolylineDefinition extends Omit<PolylinePrimitiveData, 'opacity' | 'progress'> {
  readonly id: string;
  readonly timeline?: PolylineTimelineDefinition;
}

export type EmitterShape =
  | { readonly kind: 'point'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | {
      readonly kind: 'text-box';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly source?: TextSourceId;
    };

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

export interface TextSourceDefinition {
  readonly id: TextSourceId;
  readonly text: string;
  readonly bounds: PrimitiveRect;
  readonly anchor: PrimitiveAnchor;
  readonly style: TextPrimitiveStyle;
  readonly visible: boolean;
  readonly debugBounds: boolean;
  readonly tags: readonly string[];
}

export type ParticleMarkDefinition =
  | { readonly kind: 'circle' }
  | { readonly kind: 'lozenge'; readonly aspect: number }
  | { readonly kind: 'frame'; readonly strokeWidth: number }
  | { readonly kind: 'bar'; readonly aspect: number };

export type MaterialKind = 'solid' | 'glow' | 'ember' | 'electric' | 'ghost';
export type BlendHint = 'normal' | 'additive' | 'screen';

export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly mark: ParticleMarkDefinition;
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
  readonly durationMs: number;
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
  readonly version: typeof SCENE_DEFINITION_VERSION;
  readonly id: SceneId;
  readonly seed: number;
  readonly textSources: readonly TextSourceDefinition[];
  readonly fields: readonly FieldDefinition[];
  readonly polylines: readonly PolylineDefinition[];
  readonly zones: readonly ZoneDefinition[];
  readonly emitters: readonly EmitterDefinition[];
  readonly materials: readonly MaterialDefinition[];
  readonly systems: readonly ParticleSystemDefinition[];
  readonly timelines: readonly TimelineDefinition[];
}
