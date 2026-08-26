import type { RuntimeEventQueue, RuntimeScene, RuntimeUpdateContext, SceneId } from '../core/index.js';
import type {
  EmitterDefinition,
  FieldDefinition,
  MaterialDefinition,
  ParticleSystemDefinition,
  TextSourceDefinition,
  TimelineDefinition,
} from '../authoring/index.js';
import type { PipeDefinition } from '../effects/index.js';
import type { CompiledZone, EmitterRuntimeState, OccupancyStore, ParticleStore } from '../sim/index.js';
import type { SceneManifestV1 } from './scene-contract.js';

export interface RendererBindings {
  readonly particleSystems: readonly ParticleSystemIdBinding[];
}

export interface ParticleSystemIdBinding {
  readonly systemId: ParticleSystemDefinition['id'];
  readonly materialId: MaterialDefinition['id'];
}

export interface RuntimeParticleSystem {
  readonly definition: ParticleSystemDefinition;
  readonly emitter: EmitterDefinition;
  readonly material: MaterialDefinition;
  readonly materialIndex: number;
  readonly store: ParticleStore;
  readonly occupancy: OccupancyStore;
  readonly emitterState: EmitterRuntimeState;
  readonly transitionPipes: readonly PipeDefinition[];
  readonly continuousPipes: readonly PipeDefinition[];
}

export interface RuntimePlan {
  readonly manifest: SceneManifestV1;
  readonly sceneId: SceneId;
  readonly fields: ReadonlyMap<FieldDefinition['id'], FieldDefinition>;
  readonly materials: ReadonlyMap<MaterialDefinition['id'], MaterialDefinition>;
  readonly textSources: readonly TextSourceDefinition[];
  readonly emitters: readonly EmitterDefinition[];
  readonly zones: readonly CompiledZone[];
  readonly systems: readonly RuntimeParticleSystem[];
  readonly timelines: readonly TimelineDefinition[];
  readonly events: RuntimeEventQueue;
  readonly rendererBindings: RendererBindings;
}

export interface ParticleRenderBatch {
  readonly systemId: ParticleSystemDefinition['id'];
  readonly store: ParticleStore;
  readonly material: MaterialDefinition;
}

export interface ParticleRenderScene extends RuntimeScene {
  particleBatches(): readonly ParticleRenderBatch[];
}

export interface RuntimeSystem {
  readonly id: string;
  run(context: RuntimeFrameContext): void;
}

export interface RuntimeFrameContext {
  readonly dt: number;
  readonly time: number;
  readonly scene: RuntimeScene;
}

export interface CompiledRuntimeScene extends ParticleRenderScene {
  readonly plan: RuntimePlan;
}

export function isParticleRenderScene(scene: RuntimeScene): scene is ParticleRenderScene {
  if (!('particleBatches' in scene)) return false;
  return typeof scene.particleBatches === 'function';
}

export type RuntimeSceneExecutor = (context: RuntimeUpdateContext) => void;
