import type {
  EmitterDefinition,
  ParticleSystemDefinition,
  SceneDefinition,
  TimelineDefinition,
} from '../authoring/index.js';
import type { EffectStageDefinition, PipeDefinition } from '../effects/index.js';

export type SceneDiagnosticSeverity = 'error' | 'warning';

export type SceneDiagnosticCode =
  | 'duplicate-id'
  | 'empty-id'
  | 'invalid-burst'
  | 'invalid-capacity'
  | 'invalid-effect-operator'
  | 'invalid-polyline'
  | 'invalid-range'
  | 'material-mismatch'
  | 'missing-reference'
  | 'render-primitive-id-collision'
  | 'unsupported-coordinate-space'
  | 'unsupported-timeline-source'
  | 'unsupported-zone-visual'
  | 'zone-capacity-exceeded';

export interface SceneDiagnostic {
  readonly severity: SceneDiagnosticSeverity;
  readonly code: SceneDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export type SceneStagePhase = 'transition' | 'continuous';

export interface SceneStageManifest {
  readonly pipeId: string;
  readonly pipeOrder: number;
  readonly stageId: string;
  readonly stageOrder: number;
  readonly phase: SceneStagePhase;
  readonly condition: EffectStageDefinition['when']['kind'];
  readonly operation: EffectStageDefinition['apply']['op'];
}

export interface SceneSystemManifest {
  readonly id: string;
  readonly emitter: string;
  readonly material: string;
  readonly capacity: number;
  readonly stages: readonly SceneStageManifest[];
}

export interface SceneManifestV1 {
  readonly version: 1;
  readonly id: string;
  readonly seed: number;
  readonly counts: {
    readonly textSources: number;
    readonly fields: number;
    readonly polylines: number;
    readonly zones: number;
    readonly emitters: number;
    readonly materials: number;
    readonly systems: number;
    readonly timelines: number;
  };
  readonly systems: readonly SceneSystemManifest[];
}

export interface SceneAnalysis {
  readonly ok: boolean;
  readonly manifest: SceneManifestV1;
  readonly diagnostics: readonly SceneDiagnostic[];
}

export class SceneCompilationError extends Error {
  readonly diagnostics: readonly SceneDiagnostic[];

  constructor(sceneId: string, diagnostics: readonly SceneDiagnostic[]) {
    super(`Scene "${sceneId}" failed validation with ${diagnostics.length} error(s)`);
    this.name = 'SceneCompilationError';
    this.diagnostics = diagnostics;
  }
}

export function analyzeScene(definition: SceneDefinition): SceneAnalysis {
  const diagnostics: SceneDiagnostic[] = [];
  const textSourceIds = validateIds('textSources', definition.textSources, diagnostics);
  validateIds('polylines', definition.polylines, diagnostics);
  const fieldIds = validateIds('fields', definition.fields, diagnostics);
  const zoneIds = validateIds('zones', definition.zones, diagnostics);
  const emitterIds = validateIds('emitters', definition.emitters, diagnostics);
  const materialIds = validateIds('materials', definition.materials, diagnostics);
  const systemIds = validateIds('systems', definition.systems, diagnostics);
  const timelineIds = validateIds('timelines', definition.timelines, diagnostics);

  if (definition.id.trim().length === 0) {
    diagnostics.push(error('empty-id', 'id', 'Scene ID must not be empty'));
  }

  if (definition.zones.length > 32) {
    diagnostics.push(error(
      'zone-capacity-exceeded',
      'zones',
      `Scene declares ${definition.zones.length} zones; the occupancy mask supports at most 32`,
    ));
  }
  for (let index = 0; index < definition.polylines.length; index += 1) {
    const line = definition.polylines[index];
    if (!line) continue;
    if (line.points.length < 2 || line.width <= 0 || !Number.isFinite(line.alpha)) {
      diagnostics.push(error(
        'invalid-polyline',
        `polylines[${index}]`,
        'Polyline requires at least two points, a positive width, and a finite alpha',
      ));
    }
    if (systemIds.has(line.id)) {
      diagnostics.push(error(
        'render-primitive-id-collision',
        `polylines[${index}].id`,
        `Polyline ID "${line.id}" collides with a particle system render layer`,
      ));
    }
  }

  for (let index = 0; index < definition.zones.length; index += 1) {
    const zone = definition.zones[index];
    if (!zone || zone.visual === undefined) continue;
    if (zone.shape.kind !== 'rect') {
      diagnostics.push(error(
        'unsupported-zone-visual',
        `zones[${index}].visual`,
        'Visible zone primitives currently support rectangle zones only',
      ));
    }
    if (systemIds.has(zone.id)) {
      diagnostics.push(error(
        'render-primitive-id-collision',
        `zones[${index}].id`,
        `Visible zone ID "${zone.id}" collides with a particle system render layer`,
      ));
    }
  }

  for (let index = 0; index < definition.emitters.length; index += 1) {
    const emitter = definition.emitters[index];
    if (!emitter) continue;
    validateEmitter(emitter, index, materialIds, textSourceIds, definition, diagnostics);
  }

  for (let index = 0; index < definition.timelines.length; index += 1) {
    const timeline = definition.timelines[index];
    if (!timeline) continue;
    validateTimeline(timeline, index, diagnostics);
  }

  for (let index = 0; index < definition.systems.length; index += 1) {
    const system = definition.systems[index];
    if (!system) continue;
    validateSystem(system, index, emitterIds, materialIds, fieldIds, zoneIds, timelineIds, definition, diagnostics);
  }

  const manifest: SceneManifestV1 = {
    version: 1,
    id: definition.id,
    seed: definition.seed,
    counts: {
      textSources: definition.textSources.length,
      fields: definition.fields.length,
      polylines: definition.polylines.length,
      zones: definition.zones.length,
      emitters: definition.emitters.length,
      materials: definition.materials.length,
      systems: definition.systems.length,
      timelines: definition.timelines.length,
    },
    systems: definition.systems.map(systemManifest),
  };

  return {
    ok: diagnostics.every(diagnostic => diagnostic.severity !== 'error'),
    manifest,
    diagnostics,
  };
}

function validateIds(
  path: string,
  values: readonly { readonly id: string }[],
  diagnostics: SceneDiagnostic[],
): ReadonlySet<string> {
  const ids = new Set<string>();

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value) continue;
    const itemPath = `${path}[${index}].id`;

    if (value.id.trim().length === 0) {
      diagnostics.push(error('empty-id', itemPath, `${path} ID must not be empty`));
      continue;
    }

    if (ids.has(value.id)) {
      diagnostics.push(error('duplicate-id', itemPath, `Duplicate ${path} ID "${value.id}"`));
      continue;
    }

    ids.add(value.id);
  }

  return ids;
}

function validateEmitter(
  emitter: EmitterDefinition,
  index: number,
  materialIds: ReadonlySet<string>,
  textSourceIds: ReadonlySet<string>,
  definition: SceneDefinition,
  diagnostics: SceneDiagnostic[],
): void {
  const path = `emitters[${index}]`;
  requireReference(materialIds, emitter.material, `${path}.material`, 'material', diagnostics);

  if (emitter.rate < 0 || emitter.burst < 0 || !Number.isInteger(emitter.burst)) {
    diagnostics.push(error('invalid-burst', path, 'Emitter rate must be non-negative and burst must be a non-negative integer'));
  }

  validateRange(emitter.direction.min, emitter.direction.max, `${path}.direction`, diagnostics);
  validateRange(emitter.speed.min, emitter.speed.max, `${path}.speed`, diagnostics);
  validateRange(emitter.lifetime.min, emitter.lifetime.max, `${path}.lifetime`, diagnostics);

  if (emitter.shape.kind !== 'text-box' || emitter.shape.source === undefined) return;
  const sourceId = emitter.shape.source;
  requireReference(textSourceIds, sourceId, `${path}.shape.source`, 'text source', diagnostics);
  const source = definition.textSources.find(candidate => candidate.id === sourceId);
  if (source?.bounds.coordinateSpace === 'screen') {
    diagnostics.push(error(
      'unsupported-coordinate-space',
      `${path}.shape.source`,
      'Compiled text emitters require a normalized text source',
    ));
  }
}

function validateTimeline(
  timeline: TimelineDefinition,
  index: number,
  diagnostics: SceneDiagnostic[],
): void {
  if (timeline.source !== 'time' && timeline.source !== 'scroll') {
    diagnostics.push(error(
      'unsupported-timeline-source',
      `timelines[${index}].source`,
      `Timeline source "${timeline.source}" is declared but has no runtime implementation`,
    ));
  }

  validateRange(timeline.inputStart, timeline.inputEnd, `timelines[${index}].input`, diagnostics);
}

function validateSystem(
  system: ParticleSystemDefinition,
  index: number,
  emitterIds: ReadonlySet<string>,
  materialIds: ReadonlySet<string>,
  fieldIds: ReadonlySet<string>,
  zoneIds: ReadonlySet<string>,
  timelineIds: ReadonlySet<string>,
  definition: SceneDefinition,
  diagnostics: SceneDiagnostic[],
): void {
  const path = `systems[${index}]`;
  requireReference(emitterIds, system.emitter, `${path}.emitter`, 'emitter', diagnostics);
  requireReference(materialIds, system.material, `${path}.material`, 'material', diagnostics);

  if (!Number.isInteger(system.capacity) || system.capacity <= 0) {
    diagnostics.push(error('invalid-capacity', `${path}.capacity`, 'Particle system capacity must be a positive integer'));
  }

  const emitter = definition.emitters.find(candidate => candidate.id === system.emitter);
  if (emitter && emitter.material !== system.material) {
    diagnostics.push(error(
      'material-mismatch',
      `${path}.material`,
      `System material "${system.material}" does not match emitter material "${emitter.material}"`,
    ));
  }

  const pipeIds = new Set<string>();
  const stageIds = new Set<string>();
  for (let pipeIndex = 0; pipeIndex < system.pipes.length; pipeIndex += 1) {
    const pipe = system.pipes[pipeIndex];
    if (!pipe) continue;
    validatePipeline(pipe, `${path}.pipes[${pipeIndex}]`, pipeIds, stageIds, fieldIds, zoneIds, timelineIds, diagnostics);
  }
}

function validatePipeline(
  pipe: PipeDefinition,
  path: string,
  pipeIds: Set<string>,
  stageIds: Set<string>,
  fieldIds: ReadonlySet<string>,
  zoneIds: ReadonlySet<string>,
  timelineIds: ReadonlySet<string>,
  diagnostics: SceneDiagnostic[],
): void {
  if (pipeIds.has(pipe.id)) {
    diagnostics.push(error('duplicate-id', `${path}.id`, `Duplicate pipe ID "${pipe.id}"`));
  } else {
    pipeIds.add(pipe.id);
  }

  for (let stageIndex = 0; stageIndex < pipe.stages.length; stageIndex += 1) {
    const stage = pipe.stages[stageIndex];
    if (!stage) continue;
    const stagePath = `${path}.stages[${stageIndex}]`;

    if (stageIds.has(stage.id)) {
      diagnostics.push(error('duplicate-id', `${stagePath}.id`, `Duplicate stage ID "${stage.id}"`));
    } else {
      stageIds.add(stage.id);
    }

    if (stage.when.kind === 'inside-zone'
      || stage.when.kind === 'outside-zone'
      || stage.when.kind === 'on-enter-zone'
      || stage.when.kind === 'on-exit-zone') {
      requireReference(zoneIds, stage.when.zoneId, `${stagePath}.when.zoneId`, 'zone', diagnostics);
    } else if (stage.when.kind === 'timeline-active') {
      requireReference(timelineIds, stage.when.timelineId, `${stagePath}.when.timelineId`, 'timeline', diagnostics);
    }

    if (stage.apply.op === 'field-velocity') {
      requireReference(fieldIds, stage.apply.fieldId, `${stagePath}.apply.fieldId`, 'field', diagnostics);
    } else if (stage.apply.op === 'timeline-pulse') {
      requireReference(timelineIds, stage.apply.timelineId, `${stagePath}.apply.timelineId`, 'timeline', diagnostics);
    }
    validateChannelOperation(stage, stagePath, diagnostics);
  }
}

function validateChannelOperation(
  stage: EffectStageDefinition,
  path: string,
  diagnostics: SceneDiagnostic[],
): void {
  const apply = stage.apply;
  if (apply.op !== 'add' && apply.op !== 'multiply' && apply.op !== 'override') return;
  const transition = stage.when.kind === 'on-enter-zone' || stage.when.kind === 'on-exit-zone';
  if ((apply.op === 'add' || apply.op === 'multiply') && !transition) {
    diagnostics.push(error(
      'invalid-effect-operator',
      `${path}.apply`,
      `${apply.op} is cumulative and may only run on transition stages; use override for continuous stages`,
    ));
    return;
  }

  const vectorChannel = apply.channel === 'velocity' || apply.channel === 'color';

  if (apply.op === 'multiply' && vectorChannel) {
    diagnostics.push(error(
      'invalid-effect-operator',
      `${path}.apply`,
      `Multiply is not implemented for the ${apply.channel} channel`,
    ));
    return;
  }

  if (apply.op === 'multiply') return;
  const tupleValue = typeof apply.value !== 'number';
  if (vectorChannel === tupleValue) return;

  diagnostics.push(error(
    'invalid-effect-operator',
    `${path}.apply`,
    vectorChannel
      ? `${apply.channel} requires a tuple value`
      : `${apply.channel} requires a scalar value`,
  ));
}

function validateRange(min: number, max: number, path: string, diagnostics: SceneDiagnostic[]): void {
  if (Number.isFinite(min) && Number.isFinite(max) && min <= max) return;
  diagnostics.push(error('invalid-range', path, 'Range values must be finite and min must not exceed max'));
}

function requireReference(
  ids: ReadonlySet<string>,
  id: string,
  path: string,
  kind: string,
  diagnostics: SceneDiagnostic[],
): void {
  if (ids.has(id)) return;
  diagnostics.push(error('missing-reference', path, `Unknown ${kind} ID "${id}"`));
}

function systemManifest(system: ParticleSystemDefinition): SceneSystemManifest {
  const stages: SceneStageManifest[] = [];

  for (let pipeOrder = 0; pipeOrder < system.pipes.length; pipeOrder += 1) {
    const pipe = system.pipes[pipeOrder];
    if (!pipe) continue;

    for (let stageOrder = 0; stageOrder < pipe.stages.length; stageOrder += 1) {
      const stage = pipe.stages[stageOrder];
      if (!stage) continue;
      const transition = stage.when.kind === 'on-enter-zone' || stage.when.kind === 'on-exit-zone';
      stages.push({
        pipeId: pipe.id,
        pipeOrder,
        stageId: stage.id,
        stageOrder,
        phase: transition ? 'transition' : 'continuous',
        condition: stage.when.kind,
        operation: stage.apply.op,
      });
    }
  }

  return {
    id: system.id,
    emitter: system.emitter,
    material: system.material,
    capacity: system.capacity,
    stages,
  };
}

function error(code: SceneDiagnosticCode, path: string, message: string): SceneDiagnostic {
  return { severity: 'error', code, path, message };
}
