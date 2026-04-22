import type { RuntimeEvent, RuntimePrimitive, RuntimeUpdateContext } from '../core/index.js';
import { createRuntimeEventQueue, createTextPrimitive } from '../core/index.js';
import type { EmitterDefinition, SceneDefinition, TextSourceDefinition, TimelineDefinition } from '../authoring/index.js';
import type { EffectApplyDefinition, EffectStageDefinition } from '../effects/index.js';
import {
  beginOccupancyFrame,
  compileZones,
  containsZonePoint,
  createEmitterRuntimeState,
  createOccupancyStore,
  createParticleStore,
  createTextSourcePointSampler,
  killParticle,
  readOccupancyMask,
  readParticleByte,
  readParticleFloat,
  sampleFieldVelocity,
  spawnFromEmitter,
} from '../sim/index.js';
import type { ParticleStore } from '../sim/index.js';
import { compilePipelines } from './compile-pipelines.js';
import type { CompiledRuntimeScene, ParticleRenderBatch, RuntimeParticleSystem, RuntimePlan } from './runtime-plan.js';

export function compileScene(definition: SceneDefinition): CompiledRuntimeScene {
  return new CompiledScene(definition);
}

class CompiledScene implements CompiledRuntimeScene {
  readonly plan: RuntimePlan;
  private readonly renderPrimitives: readonly RuntimePrimitive[];
  private readonly renderBatches: readonly ParticleRenderBatch[];
  private readonly timelineValues = new Map<string, number>();

  constructor(definition: SceneDefinition) {
    const fields = new Map(definition.fields.map(field => [field.id, field]));
    const materials = new Map(definition.materials.map(material => [material.id, material]));
    const emittersById = new Map(definition.emitters.map(emitter => [emitter.id, emitter]));
    const textSourcesById = new Map(definition.textSources.map(source => [source.id, source]));
    const zones = compileZones(definition.zones);
    const events = createRuntimeEventQueue();
    const systems: RuntimeParticleSystem[] = [];

    for (const system of definition.systems) {
      const emitter = emittersById.get(system.emitter);
      const material = materials.get(system.material);
      if (!emitter || !material) continue;
      const resolvedEmitter = resolveTextEmitter(emitter, textSourcesById);
      const pointSampler = createEmitterPointSampler(resolvedEmitter, textSourcesById);

      const pipelines = compilePipelines(system.pipes);
      systems.push({
        definition: system,
        emitter: resolvedEmitter,
        material,
        materialIndex: Math.max(0, definition.materials.findIndex(item => item.id === material.id)),
        store: createParticleStore(system.capacity),
        occupancy: createOccupancyStore(system.capacity),
        emitterState: createEmitterRuntimeState(hashString(system.id), pointSampler),
        transitionPipes: pipelines.transitionPipes,
        continuousPipes: pipelines.continuousPipes,
      });
    }

    this.plan = {
      sceneId: definition.id,
      fields,
      materials,
      textSources: definition.textSources,
      emitters: definition.emitters,
      zones,
      systems,
      timelines: definition.timelines,
      events,
      rendererBindings: {
        particleSystems: systems.map(system => ({
          systemId: system.definition.id,
          materialId: system.material.id,
        })),
      },
    };

    this.renderBatches = systems.map(system => ({
      systemId: system.definition.id,
      store: system.store,
      material: system.material,
    }));
    this.renderPrimitives = definition.textSources.map(source => createTextPrimitive(source.id, {
      sourceId: source.id,
      text: source.text,
      bounds: source.bounds,
      anchor: source.anchor,
      style: source.style,
      visible: source.visible,
      debugBounds: source.debugBounds,
    }));
  }

  get id(): string {
    return this.plan.sceneId;
  }

  update(context: RuntimeUpdateContext): void {
    const dtSeconds = Math.min(Math.max(context.time.deltaMs / 1_000, 0), 0.05);
    this.plan.events.clear();
    this.updateTimelines(context);

    for (const system of this.plan.systems) {
      spawnFromEmitter(system.store, system.emitter, system.material, system.materialIndex, system.emitterState, dtSeconds);
      this.applyFieldPipes(system, dtSeconds, context.time.elapsedMs / 1_000);
      integrate(system.store, dtSeconds);
      this.updateZoneOccupancy(system, context.time.elapsedMs);
      this.applyTransitionPipes(system, context.time.elapsedMs);
      this.applyContinuousPipes(system, context.time.elapsedMs, dtSeconds);
      decayDeadParticles(system.store);
    }
  }

  primitives(): readonly RuntimePrimitive[] {
    return this.renderPrimitives;
  }

  particleBatches(): readonly ParticleRenderBatch[] {
    return this.renderBatches;
  }

  dispose(): void {
    this.plan.events.clear();
  }

  private updateTimelines(context: RuntimeUpdateContext): void {
    for (const timeline of this.plan.timelines) {
      const raw = sampleTimelineSource(timeline, context);
      this.timelineValues.set(timeline.id, remap(raw, timeline.inputStart, timeline.inputEnd, timeline.outputStart, timeline.outputEnd));
    }
  }

  private applyFieldPipes(system: RuntimeParticleSystem, dtSeconds: number, timeSeconds: number): void {
    for (const pipe of system.continuousPipes) {
      for (const stage of pipe.stages) {
        if (stage.apply.op !== 'field-velocity') continue;
        const apply = stage.apply;
        const field = this.plan.fields.get(apply.fieldId);
        if (!field) continue;

        forEachAlive(system.store, index => {
          const velocity = sampleFieldVelocity(
            field,
            readParticleFloat(system.store.x, index),
            readParticleFloat(system.store.y, index),
            timeSeconds,
          );
          system.store.vx[index] = readParticleFloat(system.store.vx, index) + velocity[0] * apply.strength * dtSeconds;
          system.store.vy[index] = readParticleFloat(system.store.vy, index) + velocity[1] * apply.strength * dtSeconds;
        });
      }
    }
  }

  private updateZoneOccupancy(system: RuntimeParticleSystem, time: number): void {
    beginOccupancyFrame(system.occupancy, system.store.count);

    forEachAlive(system.store, index => {
      let mask = 0;
      const x = readParticleFloat(system.store.x, index);
      const y = readParticleFloat(system.store.y, index);

      for (const zone of this.plan.zones) {
        if (containsZonePoint(zone.definition.shape, x, y)) {
          mask |= zone.bit;
        }
      }

      system.occupancy.currentMask[index] = mask;
      const previous = readOccupancyMask(system.occupancy.previousMask, index);
      const entered = mask & ~previous;
      const exited = previous & ~mask;

      for (const zone of this.plan.zones) {
        if ((entered & zone.bit) !== 0) {
          this.plan.events.push({
            type: 'zone.enter',
            systemId: system.definition.id,
            particleIndex: index,
            zoneId: zone.definition.id,
            time,
          });
        }
        if ((exited & zone.bit) !== 0) {
          this.plan.events.push({
            type: 'zone.exit',
            systemId: system.definition.id,
            particleIndex: index,
            zoneId: zone.definition.id,
            time,
          });
        }
      }
    });
  }

  private applyTransitionPipes(system: RuntimeParticleSystem, time: number): void {
    for (const event of this.plan.events.events()) {
      if (!isSystemParticleEvent(event, system.definition.id)) continue;

      for (const pipe of system.transitionPipes) {
        for (const stage of pipe.stages) {
          if (!stageMatchesEvent(stage, event)) continue;
          applyEffect(system.store, event.particleIndex, stage.apply, 0, time, this.timelineValues);
        }
      }
    }
  }

  private applyContinuousPipes(system: RuntimeParticleSystem, time: number, dtSeconds: number): void {
    for (const pipe of system.continuousPipes) {
      for (const stage of pipe.stages) {
        if (stage.apply.op === 'field-velocity') continue;
        forEachAlive(system.store, index => {
          if (!stageMatchesParticle(stage, system, index, this.plan.zones, this.timelineValues)) return;
          applyEffect(system.store, index, stage.apply, dtSeconds, time, this.timelineValues);
        });
      }
    }
  }
}

function integrate(store: ParticleStore, dtSeconds: number): void {
  forEachAlive(store, index => {
    store.x[index] = readParticleFloat(store.x, index) + readParticleFloat(store.vx, index) * dtSeconds;
    store.y[index] = readParticleFloat(store.y, index) + readParticleFloat(store.vy, index) * dtSeconds;
    store.age[index] = readParticleFloat(store.age, index) + dtSeconds;
  });
}

function decayDeadParticles(store: ParticleStore): void {
  forEachAlive(store, index => {
    if (readParticleFloat(store.age, index) >= readParticleFloat(store.life, index) || readParticleFloat(store.alpha, index) <= 0) {
      killParticle(store, index);
    }
  });
}

function applyEffect(
  store: ParticleStore,
  index: number,
  apply: EffectApplyDefinition,
  dtSeconds: number,
  time: number,
  timelines: ReadonlyMap<string, number>,
): void {
  if (apply.op === 'add') {
    addChannel(store, index, apply.channel, apply.value);
  } else if (apply.op === 'multiply') {
    multiplyChannel(store, index, apply.channel, apply.value);
  } else if (apply.op === 'override') {
    overrideChannel(store, index, apply.channel, apply.value);
  } else if (apply.op === 'decay') {
    store.alpha[index] = Math.max(0, readParticleFloat(store.alpha, index) - apply.rate * dtSeconds);
  } else if (apply.op === 'timeline-pulse') {
    const amount = timelines.get(apply.timelineId) ?? 0;
    const pulse = apply.min + (apply.max - apply.min) * (0.5 + Math.sin(time * 0.004 + amount * Math.PI * 2) * 0.5);
    overrideChannel(store, index, apply.channel, pulse);
  }
}

function addChannel(store: ParticleStore, index: number, channel: string, value: number | readonly [number, number, number]): void {
  if (channel === 'velocity' && typeof value !== 'number') {
    store.vx[index] = readParticleFloat(store.vx, index) + readTuple(value, 0);
    store.vy[index] = readParticleFloat(store.vy, index) + readTuple(value, 1);
  } else if (channel === 'color' && typeof value !== 'number') {
    store.colorR[index] = readParticleFloat(store.colorR, index) + readTuple(value, 0);
    store.colorG[index] = readParticleFloat(store.colorG, index) + readTuple(value, 1);
    store.colorB[index] = readParticleFloat(store.colorB, index) + readTuple(value, 2);
  } else if (typeof value === 'number') {
    overrideScalarChannel(store, index, channel, readScalarChannel(store, index, channel) + value);
  }
}

function multiplyChannel(store: ParticleStore, index: number, channel: string, value: number): void {
  overrideScalarChannel(store, index, channel, readScalarChannel(store, index, channel) * value);
}

function overrideChannel(store: ParticleStore, index: number, channel: string, value: number | readonly [number, number, number]): void {
  if (channel === 'velocity' && typeof value !== 'number') {
    store.vx[index] = readTuple(value, 0);
    store.vy[index] = readTuple(value, 1);
  } else if (channel === 'color' && typeof value !== 'number') {
    store.colorR[index] = readTuple(value, 0);
    store.colorG[index] = readTuple(value, 1);
    store.colorB[index] = readTuple(value, 2);
  } else if (typeof value === 'number') {
    overrideScalarChannel(store, index, channel, value);
  }
}

function readScalarChannel(store: ParticleStore, index: number, channel: string): number {
  if (channel === 'alpha') return readParticleFloat(store.alpha, index);
  if (channel === 'radius') return readParticleFloat(store.radius, index);
  if (channel === 'emissive') return readParticleFloat(store.emissive, index);
  if (channel === 'noise') return readParticleFloat(store.noise, index);
  if (channel === 'trail') return readParticleFloat(store.trail, index);
  return 0;
}

function overrideScalarChannel(store: ParticleStore, index: number, channel: string, value: number): void {
  if (channel === 'alpha') store.alpha[index] = value;
  else if (channel === 'radius') store.radius[index] = value;
  else if (channel === 'emissive') store.emissive[index] = value;
  else if (channel === 'noise') store.noise[index] = value;
  else if (channel === 'trail') store.trail[index] = value;
}

function stageMatchesEvent(stage: EffectStageDefinition, event: RuntimeEvent): boolean {
  if (stage.when.kind === 'on-enter-zone') return event.type === 'zone.enter' && event.zoneId === stage.when.zoneId;
  if (stage.when.kind === 'on-exit-zone') return event.type === 'zone.exit' && event.zoneId === stage.when.zoneId;
  return false;
}

function stageMatchesParticle(
  stage: EffectStageDefinition,
  system: RuntimeParticleSystem,
  index: number,
  zones: RuntimePlan['zones'],
  timelines: ReadonlyMap<string, number>,
): boolean {
  if (stage.when.kind === 'always') return true;
  if (stage.when.kind === 'timeline-active') return (timelines.get(stage.when.timelineId) ?? 0) > 0;
  if (stage.when.kind !== 'inside-zone' && stage.when.kind !== 'outside-zone') return false;

  const condition = stage.when;
  const zone = zones.find(item => item.definition.id === condition.zoneId);
  if (!zone) return false;

  const inside = (readOccupancyMask(system.occupancy.currentMask, index) & zone.bit) !== 0;
  return condition.kind === 'inside-zone' ? inside : !inside;
}

function isSystemParticleEvent(
  event: RuntimeEvent,
  systemId: string,
): event is Extract<RuntimeEvent, { readonly systemId: string }> {
  return (event.type === 'zone.enter' || event.type === 'zone.exit') && event.systemId === systemId;
}

function forEachAlive(store: ParticleStore, visit: (index: number) => void): void {
  for (let index = 0; index < store.count; index += 1) {
    if (readParticleByte(store.alive, index) === 1) {
      visit(index);
    }
  }
}

function sampleTimelineSource(timeline: TimelineDefinition, context: RuntimeUpdateContext): number {
  if (timeline.source === 'time') return (context.time.elapsedMs / 1_000) % 1;
  if (timeline.source !== 'scroll') return 0;
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0;

  const root = document.documentElement;
  const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
  return window.scrollY / maxScroll;
}

function remap(value: number, inputStart: number, inputEnd: number, outputStart: number, outputEnd: number): number {
  if (inputStart === inputEnd) return outputStart;
  const amount = clamp01((value - inputStart) / (inputEnd - inputStart));
  return outputStart + (outputEnd - outputStart) * amount;
}

function readTuple(value: readonly [number, number, number], index: number): number {
  return value[index] ?? 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function resolveTextEmitter(
  emitter: EmitterDefinition,
  textSourcesById: ReadonlyMap<TextSourceDefinition['id'], TextSourceDefinition>,
): EmitterDefinition {
  if (emitter.shape.kind !== 'text-box') return emitter;
  if (emitter.shape.source === undefined) return emitter;

  const source = textSourcesById.get(emitter.shape.source);
  if (!source || source.bounds.coordinateSpace !== 'normalized') return emitter;

  return {
    ...emitter,
    shape: {
      kind: 'text-box',
      source: emitter.shape.source,
      x: source.bounds.x,
      y: source.bounds.y,
      width: source.bounds.width,
      height: source.bounds.height,
    },
  };
}

function createEmitterPointSampler(
  emitter: EmitterDefinition,
  textSourcesById: ReadonlyMap<TextSourceDefinition['id'], TextSourceDefinition>,
) {
  if (emitter.shape.kind !== 'text-box') return undefined;
  if (emitter.shape.source === undefined) return undefined;

  const source = textSourcesById.get(emitter.shape.source);
  if (!source) return undefined;

  return createTextSourcePointSampler(source);
}
