import type {
  EmitterDefinition,
  FieldDefinition,
  MaterialDefinition,
  ParticleSystemDefinition,
  SceneDefinition,
  TextSourceDefinition,
  TimelineDefinition,
  ZoneDefinition,
} from './types.js';
import type {
  EmitterId,
  FieldId,
  MaterialId,
  ParticleSystemId,
  SceneId,
  TimelineId,
  ZoneId,
} from '../core/index.js';

export interface ParticlesOptions {
  readonly emitter: EmitterId;
  readonly material: MaterialId;
  readonly capacity?: number;
  readonly pipes?: ParticleSystemDefinition['pipes'];
  readonly tags?: readonly string[];
}

export class SceneDefinitionBuilder {
  private readonly fieldList: FieldDefinition[] = [];
  private readonly zoneList: ZoneDefinition[] = [];
  private readonly textSourceList: TextSourceDefinition[] = [];
  private readonly emitterList: EmitterDefinition[] = [];
  private readonly materialList: MaterialDefinition[] = [];
  private readonly systemList: ParticleSystemDefinition[] = [];
  private readonly timelineList: TimelineDefinition[] = [];

  constructor(private readonly sceneId: SceneId) {}

  field(id: FieldId, definition: Omit<FieldDefinition, 'id'>): this {
    this.fieldList.push({ id, ...definition });
    return this;
  }

  zone(id: ZoneId, definition: Omit<ZoneDefinition, 'id'>): this {
    this.zoneList.push({ id, ...definition });
    return this;
  }

  textSource(id: TextSourceDefinition['id'], definition: Omit<TextSourceDefinition, 'id'>): this {
    this.textSourceList.push({ id, ...definition });
    return this;
  }

  emitter(id: EmitterId, definition: Omit<EmitterDefinition, 'id'>): this {
    this.emitterList.push({ id, ...definition });
    return this;
  }

  material(id: MaterialId, definition: Omit<MaterialDefinition, 'id'>): this {
    this.materialList.push({ id, ...definition });
    return this;
  }

  timeline(id: TimelineId, definition: Omit<TimelineDefinition, 'id'>): this {
    this.timelineList.push({ id, ...definition });
    return this;
  }

  system(id: ParticleSystemId, definition: Omit<ParticleSystemDefinition, 'id'>): this {
    this.systemList.push({ id, ...definition });
    return this;
  }

  build(): SceneDefinition {
    return {
      id: this.sceneId,
      textSources: [...this.textSourceList],
      fields: [...this.fieldList],
      zones: [...this.zoneList],
      emitters: [...this.emitterList],
      materials: [...this.materialList],
      systems: [...this.systemList],
      timelines: [...this.timelineList],
    };
  }
}

export function createScene(sceneId: SceneId): SceneDefinitionBuilder {
  return new SceneDefinitionBuilder(sceneId);
}

export function particles(options: ParticlesOptions): Omit<ParticleSystemDefinition, 'id'> {
  return {
    emitter: options.emitter,
    material: options.material,
    capacity: options.capacity ?? 256,
    pipes: options.pipes ?? [],
    tags: options.tags ?? [],
  };
}
