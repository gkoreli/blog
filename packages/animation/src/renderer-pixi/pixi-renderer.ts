import { Application, Container, Graphics, Text } from 'pixi.js';
import type { BLEND_MODES, TextStyleOptions } from 'pixi.js';
import { isParticleRenderScene } from '../compile/index.js';
import type { ParticleRenderBatch } from '../compile/index.js';
import type { FrameTime, PrimitiveId, RendererAdapter, RuntimeScene, RuntimeSize } from '../core/index.js';
import { isPolylinePrimitive, isTextPrimitive, toScreenPrimitiveRect } from '../core/index.js';
import type { PolylinePrimitive, PolylinePrimitiveData, TextPrimitive } from '../core/index.js';
import { isRectZonePrimitive, toScreenRect } from '../sim/index.js';
import type { RectZonePrimitive } from '../sim/index.js';

export interface PixiRendererOptions {
  readonly antialias?: boolean;
  readonly backgroundAlpha?: number;
}

export class PixiRendererAdapter<TScene extends RuntimeScene = RuntimeScene> implements RendererAdapter<TScene> {
  private readonly root = new Container();
  private readonly graphicsByPrimitiveId = new Map<PrimitiveId, Graphics>();
  private readonly textByPrimitiveId = new Map<PrimitiveId, Text>();
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
      if (isTextPrimitive(primitive)) {
        this.renderTextPrimitive(primitive);
      } else if (isPolylinePrimitive(primitive)) {
        this.renderPolylinePrimitive(primitive);
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
    const app = this.app;
    this.app = undefined;

    for (const layer of this.graphicsByPrimitiveId.values()) {
      this.root.removeChild(layer);
      layer.destroy();
    }
    for (const layer of this.textByPrimitiveId.values()) {
      this.root.removeChild(layer);
      layer.destroy();
    }
    this.graphicsByPrimitiveId.clear();
    this.textByPrimitiveId.clear();
    this.seenPrimitiveIds.clear();

    app?.stage.removeChild(this.root);
    this.root.destroy({ children: false });
    app?.destroy(false, { children: false });
  }

  private renderPolylinePrimitive(primitive: PolylinePrimitive): void {
    const graphics = this.getGraphicsLayer(primitive.id);
    const data = primitive.data;
    graphics.clear();

    if (data.glow) {
      drawPolyline(
        graphics,
        data,
        this.size,
        toPixiColor(data.glow.color),
        data.glow.alpha,
        data.glow.width,
      );
    }

    drawPolyline(graphics, data, this.size, toPixiColor(data.color), data.alpha, data.width);
  }

  private renderRectZone(primitive: RectZonePrimitive): void {
    const graphics = this.getGraphicsLayer(primitive.id);
    const zone = toScreenRect(primitive.data, this.size);

    graphics
      .clear()
      .rect(zone.x, zone.y, zone.width, zone.height)
      .fill({ color: toPixiColor(zone.fillColor), alpha: zone.fillAlpha })
      .stroke({ color: toPixiColor(zone.color), alpha: zone.alpha, width: 1 });
  }

  private renderTextPrimitive(primitive: TextPrimitive): void {
    const text = this.getTextLayer(primitive.id);
    const data = primitive.data;
    const bounds = toScreenPrimitiveRect(data.bounds, this.size);
    const fontSize = data.style.fontSizeUnit === 'bounds-height'
      ? bounds.height * data.style.fontSize
      : data.style.fontSize;
    const lineHeight = data.style.lineHeight ?? fontSize * 1.08;

    const style: TextStyleOptions = {
      align: data.style.align,
      fill: data.style.color,
      fontFamily: data.style.fontFamily,
      fontSize,
      fontWeight: data.style.fontWeight,
      letterSpacing: data.style.letterSpacing,
      lineHeight,
      dropShadow: data.style.glow
        ? {
            alpha: data.style.glow.alpha,
            angle: 0,
            blur: data.style.glow.blur,
            color: data.style.glow.color,
            distance: 0,
          }
        : false,
    };

    text.text = data.text;
    text.style = style;
    text.anchor.set(data.anchor.x, data.anchor.y);
    text.alpha = data.style.alpha;
    text.visible = data.visible;
    text.x = bounds.x + bounds.width * data.anchor.x;
    text.y = bounds.y + bounds.height * data.anchor.y;

    if (data.debugBounds) {
      const debug = this.getGraphicsLayer(`${primitive.id}:debug-bounds`);
      debug
        .clear()
        .rect(bounds.x, bounds.y, bounds.width, bounds.height)
        .stroke({ color: toPixiColor('#93c5fd'), alpha: 0.42, width: 1 });
    }
  }

  private renderParticleBatch(batch: ParticleRenderBatch): void {
    const graphics = this.getGraphicsLayer(batch.systemId);
    const store = batch.store;

    graphics.blendMode = toPixiBlendMode(batch.material.blendHint);

    graphics.clear();
    for (let index = 0; index < store.count; index += 1) {
      if ((store.alive[index] ?? 0) !== 1) continue;

      const color = rgbToPixiColor(store.colorR[index] ?? 255, store.colorG[index] ?? 255, store.colorB[index] ?? 255);
      const alpha = Math.min(1, Math.max(0, store.alpha[index] ?? batch.material.alpha));
      const radius = Math.max(0.2, store.radius[index] ?? batch.material.radius);
      const x = (store.x[index] ?? 0) * this.size.width;
      const y = (store.y[index] ?? 0) * this.size.height;
      const trail = Math.max(0, store.trail[index] ?? batch.material.trail);
      const emissive = Math.min(1, Math.max(0, store.emissive[index] ?? batch.material.emissive));

      if (emissive > 0) {
        const glowAlpha = Math.min(0.24, alpha * emissive * 0.32);
        const glowExpansion = Math.min(12, radius * (0.45 + emissive * 0.75));

        graphics.circle(x, y, radius + glowExpansion).fill({ color, alpha: glowAlpha });
      }

      if (trail > 0) {
        const trailSeconds = 0.45 + trail * 2.2;
        const rawTrailX = (store.vx[index] ?? 0) * this.size.width * trailSeconds;
        const rawTrailY = (store.vy[index] ?? 0) * this.size.height * trailSeconds;
        const trailLength = Math.hypot(rawTrailX, rawTrailY);
        const maxTrailLength = 32 + Math.min(24, trail * 64);
        const trailScale = trailLength > maxTrailLength ? maxTrailLength / trailLength : 1;
        const tailX = x - rawTrailX * trailScale;
        const tailY = y - rawTrailY * trailScale;

        graphics
          .moveTo(tailX, tailY)
          .lineTo(x, y)
          .stroke({ color, alpha: alpha * Math.min(0.58, 0.16 + trail), width: Math.max(0.5, radius * 0.42) });
      }

      graphics
        .circle(x, y, radius)
        .fill({ color, alpha });
    }
  }

  private getGraphicsLayer(id: PrimitiveId): Graphics {
    this.seenPrimitiveIds.add(id);
    const existing = this.graphicsByPrimitiveId.get(id);
    if (existing) return existing;

    const layer = new Graphics();
    this.graphicsByPrimitiveId.set(id, layer);
    this.root.addChild(layer);
    return layer;
  }

  private getTextLayer(id: PrimitiveId): Text {
    this.seenPrimitiveIds.add(id);
    const existing = this.textByPrimitiveId.get(id);
    if (existing) return existing;

    const layer = new Text({ text: '' });
    this.textByPrimitiveId.set(id, layer);
    this.root.addChild(layer);
    return layer;
  }

  private removeStaleLayers(): void {
    for (const [id, layer] of this.graphicsByPrimitiveId) {
      if (this.seenPrimitiveIds.has(id)) continue;
      this.root.removeChild(layer);
      layer.destroy();
      this.graphicsByPrimitiveId.delete(id);
    }

    for (const [id, layer] of this.textByPrimitiveId) {
      if (this.seenPrimitiveIds.has(id)) continue;
      this.root.removeChild(layer);
      layer.destroy();
      this.textByPrimitiveId.delete(id);
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

function toPixiBlendMode(blendHint: ParticleRenderBatch['material']['blendHint']): BLEND_MODES {
  if (blendHint === 'additive') return 'add';
  if (blendHint === 'screen') return 'screen';
  return 'normal';
}

function rgbToPixiColor(red: number, green: number, blue: number): number {
  const r = Math.max(0, Math.min(255, Math.round(red)));
  const g = Math.max(0, Math.min(255, Math.round(green)));
  const b = Math.max(0, Math.min(255, Math.round(blue)));
  return (r << 16) | (g << 8) | b;
}

function drawPolyline(
  graphics: Graphics,
  data: PolylinePrimitiveData,
  size: RuntimeSize,
  color: number,
  alpha: number,
  width: number,
): void {
  const first = data.points[0];
  if (!first) return;
  const scaleX = data.coordinateSpace === 'normalized' ? size.width : 1;
  const scaleY = data.coordinateSpace === 'normalized' ? size.height : 1;

  graphics.moveTo(first.x * scaleX, first.y * scaleY);
  for (let index = 1; index < data.points.length; index += 1) {
    const point = data.points[index];
    if (!point) continue;
    graphics.lineTo(point.x * scaleX, point.y * scaleY);
  }
  graphics.stroke({ color, alpha: Math.min(1, Math.max(0, alpha)), width: Math.max(0.2, width) });
}
