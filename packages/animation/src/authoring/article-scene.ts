import type { PrimitiveId, RuntimePrimitive, RuntimeScene, RuntimeUpdateContext, SceneId } from '../core/index.js';
import type { ScenePipe } from '../effects/index.js';
import type { ParticleFieldBlueprint } from '../sim/index.js';
import { createRectZonePrimitive, isParticleFieldPrimitive } from '../sim/index.js';
import type { RectZone } from '../sim/index.js';
import type { ScrollTimeline } from '../timeline/index.js';

export interface ArticleRuntimeScene extends RuntimeScene {
  pipes(): readonly ScenePipe[];
  timelines(): readonly ScrollTimeline[];
}

export class ArticleSceneBuilder {
  private readonly primitiveList: RuntimePrimitive[] = [];
  private readonly pipeList: ScenePipe[] = [];
  private readonly timelineList: ScrollTimeline[] = [];

  constructor(private readonly sceneId: SceneId) {}

  hero(configure: (section: ArticleSectionBuilder) => void): this {
    return this.section('hero', configure);
  }

  section(sectionId: string, configure: (section: ArticleSectionBuilder) => void): this {
    configure(new ArticleSectionBuilder(sectionId, this.primitiveList, this.pipeList, this.timelineList));
    return this;
  }

  build(): ArticleRuntimeScene {
    return new BuiltArticleRuntimeScene(
      this.sceneId,
      [...this.primitiveList],
      [...this.pipeList],
      [...this.timelineList],
    );
  }
}

export class ArticleSectionBuilder {
  constructor(
    readonly id: string,
    private readonly primitiveList: RuntimePrimitive[],
    private readonly pipeList: ScenePipe[],
    private readonly timelineList: ScrollTimeline[],
  ) {}

  addField(id: PrimitiveId, field: ParticleFieldBlueprint): this {
    this.primitiveList.push(field.build(id));
    return this;
  }

  addZone(id: PrimitiveId, zone: RectZone): this {
    this.primitiveList.push(createRectZonePrimitive(id, zone));
    return this;
  }

  pipe(targetId: PrimitiveId, pipe: ScenePipe['pipe']): this {
    this.pipeList.push({ targetId, pipe });
    return this;
  }

  timeline(timeline: ScrollTimeline): this {
    this.timelineList.push(timeline);
    return this;
  }
}

export function createArticleScene(sceneId: SceneId): ArticleSceneBuilder {
  return new ArticleSceneBuilder(sceneId);
}

class BuiltArticleRuntimeScene implements ArticleRuntimeScene {
  constructor(
    readonly id: SceneId,
    private readonly primitiveList: readonly RuntimePrimitive[],
    private readonly pipeList: readonly ScenePipe[],
    private readonly timelineList: readonly ScrollTimeline[],
  ) {}

  update(context: RuntimeUpdateContext): void {
    for (const primitive of this.primitiveList) {
      if (isParticleFieldPrimitive(primitive)) {
        primitive.data.field.step(context.time.deltaMs);
      }
    }
  }

  primitives(): readonly RuntimePrimitive[] {
    return this.primitiveList;
  }

  pipes(): readonly ScenePipe[] {
    return this.pipeList;
  }

  timelines(): readonly ScrollTimeline[] {
    return this.timelineList;
  }

  dispose(): void {
    // Current primitives are typed-array stores with no external handles.
  }
}
