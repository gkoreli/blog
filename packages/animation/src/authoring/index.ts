export { createScene, particles } from './scene.js';
export type { ParticlesOptions, SceneDefinitionBuilder, SceneOptions } from './scene.js';
export { noiseField } from './field.js';
export type { NoiseFieldOptions } from './field.js';
export { polyline } from './polyline.js';
export type { PolylineOptions } from './polyline.js';
export { defineCircleZone, defineRectZone } from './zone.js';
export type {
  CircleZoneDefinitionOptions,
  RectZoneDefinitionOptions,
  ZoneOptions,
  ZoneVisualOptions,
} from './zone.js';
export { textSource } from './text.js';
export type { TextSourceOptions } from './text.js';
export { pointEmitter, rectEmitter, textBoxEmitter } from './emitter.js';
export type { EmitterOptions, PointEmitterOptions, RectEmitterOptions, TextBoxEmitterOptions } from './emitter.js';
export { electricMaterial, glowMaterial, solidMaterial } from './material.js';
export type { MaterialOptions } from './material.js';
export { scrollTimeline, timeTimeline } from './timeline.js';
export type { TimelineOptions } from './timeline.js';
export { SCENE_DEFINITION_VERSION } from './types.js';
export type {
  BlendHint,
  EmitterDefinition,
  EmitterShape,
  FieldDefinition,
  MaterialDefinition,
  MaterialKind,
  ParticleSystemDefinition,
  PolylineDefinition,
  ParticleMarkDefinition,
  PolylineTimelineDefinition,
  Range,
  SceneDefinition,
  TextSourceDefinition,
  TimelineDefinition,
  TimelineSource,
  ZoneBlendMode,
  ZoneDefinition,
  ZoneVisualDefinition,
  ZoneShape,
} from './types.js';
