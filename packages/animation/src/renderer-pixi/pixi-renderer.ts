import { Application, Container, Graphics } from 'pixi.js';
import { isParticleRenderScene } from '../compile/index.js';
import type { ParticleRenderBatch } from '../compile/index.js';
import type { FrameTime, PrimitiveId, RendererAdapter, RuntimeScene, RuntimeSize } from '../core/index.js';
import { isParticleFieldPrimitive, isRectZonePrimitive, toScreenRect } from '../sim/index.js';
import type { ParticleFieldPrimitive, RectZonePrimitive } from '../sim/index.js';

export interface PixiRendererOptions {
  readonly antialias?: boolean;
  readonly backgroundAlpha?: number;
}

export class PixiRendererAdapter<TScene extends RuntimeScene = RuntimeScene> implements RendererAdapter<TScene> {
  private readonly root = new Container();
  private readonly layerByPrimitiveId = new Map<PrimitiveId, Graphics>();
  private readonly seenPrimitiveIds = new Set<PrimitiveId>();
  private readonly options: PixiRendererOptions;
  private app: Application | undefined;
  private size: RuntimeSize = { width: 0, height: 0, dpr: 1 };

  constructor(options: PixiRendererOptions = {}) {
    this.options = options;
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    const app = new Application();
    await app.init({
      canvas,
      autoDensity: true,
      autoStart: false,
      antialias: this.options.antialias ?? true,
      backgroundAlpha: this.options.backgroundAlpha ?? 0,
      resolution: Math.max(1, window.devicePixelRatio || 1),
    });
    app.stage.addChild(this.root);
    this.app = app;
  }

  resize(width: number, height: number, dpr: number): void {
    this.size = { width, height, dpr };
    this.app?.renderer.resize(width, height);
  }

  beginFrame(_time: FrameTime): void {
    this.seenPrimitiveIds.clear();
  }

  render(scene: TScene, _time: FrameTime): void {
    if (isParticleRenderScene(scene)) {
      for (const batch of scene.particleBatches()) {
        this.renderParticleBatch(batch);
      }
    }

    for (const primitive of scene.primitives()) {
      if (isParticleFieldPrimitive(primitive)) {
        this.renderParticleField(primitive);
      } else if (isRectZonePrimitive(primitive)) {
        this.renderRectZone(primitive);
      }
    }
  }

  endFrame(_time: FrameTime): void {
    this.removeStaleLayers();
    this.app?.render();
  }

  dispose(): void {
    for (const layer of this.layerByPrimitiveId.values()) {
      layer.destroy();
    }
    this.layerByPrimitiveId.clear();
    this.seenPrimitiveIds.clear();
    this.root.destroy({ children: true });
    this.app?.destroy(true, { children: true });
    this.app = undefined;
  }

  private renderParticleField(primitive: ParticleFieldPrimitive): void {
    const graphics = this.getLayer(primitive.id);
    const style = primitive.data.style;
    const color = toPixiColor(style.color);

    graphics.clear();
    primitive.data.field.forEachParticle(this.size, particle => {
      graphics
        .circle(particle.x, particle.y, particle.radius * style.radiusScale)
        .fill({ color, alpha: particle.alpha * style.alpha });
    });
  }

  private renderRectZone(primitive: RectZonePrimitive): void {
    const graphics = this.getLayer(primitive.id);
    const zone = toScreenRect(primitive.data, this.size);

    graphics
      .clear()
      .rect(zone.x, zone.y, zone.width, zone.height)
      .stroke({ color: toPixiColor(zone.color), alpha: zone.alpha, width: 1 });
  }

  private renderParticleBatch(batch: ParticleRenderBatch): void {
    const graphics = this.getLayer(batch.systemId);
    const store = batch.store;

    graphics.clear();
    for (let index = 0; index < store.count; index += 1) {
      if ((store.alive[index] ?? 0) !== 1) continue;

      const color = rgbToPixiColor(store.colorR[index] ?? 255, store.colorG[index] ?? 255, store.colorB[index] ?? 255);
      const alpha = Math.min(1, Math.max(0, store.alpha[index] ?? batch.material.alpha));
      const radius = Math.max(0.2, store.radius[index] ?? batch.material.radius);

      graphics
        .circle((store.x[index] ?? 0) * this.size.width, (store.y[index] ?? 0) * this.size.height, radius)
        .fill({ color, alpha });
    }
  }

  private getLayer(id: PrimitiveId): Graphics {
    this.seenPrimitiveIds.add(id);
    const existing = this.layerByPrimitiveId.get(id);
    if (existing) return existing;

    const layer = new Graphics();
    this.layerByPrimitiveId.set(id, layer);
    this.root.addChild(layer);
    return layer;
  }

  private removeStaleLayers(): void {
    for (const [id, layer] of this.layerByPrimitiveId) {
      if (this.seenPrimitiveIds.has(id)) continue;
      this.root.removeChild(layer);
      layer.destroy();
      this.layerByPrimitiveId.delete(id);
    }
  }
}

export function createPixiRenderer<TScene extends RuntimeScene = RuntimeScene>(
  options: PixiRendererOptions = {},
): PixiRendererAdapter<TScene> {
  return new PixiRendererAdapter<TScene>(options);
}

function toPixiColor(color: number | string): number {
  if (typeof color === 'number') return color;
  if (!color.startsWith('#')) return 0xffffff;

  const parsed = Number.parseInt(color.slice(1), 16);
  if (Number.isNaN(parsed)) return 0xffffff;
  return parsed;
}

function rgbToPixiColor(red: number, green: number, blue: number): number {
  const r = Math.max(0, Math.min(255, Math.round(red)));
  const g = Math.max(0, Math.min(255, Math.round(green)));
  const b = Math.max(0, Math.min(255, Math.round(blue)));
  return (r << 16) | (g << 8) | b;
}
