import type { ColorValue } from '../core/index.js';
import type { ZoneBlendMode, ZoneDefinition, ZoneShape } from './types.js';

export interface ZoneVisualOptions {
  readonly stroke?: ColorValue;
  readonly strokeAlpha?: number;
  readonly fill?: ColorValue;
  readonly fillAlpha?: number;
}

export interface ZoneOptions {
  readonly tags?: readonly string[];
  readonly priority?: number;
  readonly blendMode?: ZoneBlendMode;
  readonly visual?: ZoneVisualOptions;
}

export interface RectZoneDefinitionOptions extends ZoneOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CircleZoneDefinitionOptions extends ZoneOptions {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export function defineRectZone(options: RectZoneDefinitionOptions): Omit<ZoneDefinition, 'id'> {
  return zone({ kind: 'rect', x: options.x, y: options.y, width: options.width, height: options.height }, options);
}

export function defineCircleZone(options: CircleZoneDefinitionOptions): Omit<ZoneDefinition, 'id'> {
  return zone({ kind: 'circle', x: options.x, y: options.y, radius: options.radius }, options);
}

function zone(shape: ZoneShape, options: ZoneOptions): Omit<ZoneDefinition, 'id'> {
  const visual = options.visual === undefined
    ? {}
    : {
        visual: {
          stroke: options.visual.stroke ?? '#6ec9a8',
          strokeAlpha: options.visual.strokeAlpha ?? 0.42,
          fill: options.visual.fill ?? '#6ec9a8',
          fillAlpha: options.visual.fillAlpha ?? 0.06,
        },
      };

  return {
    shape,
    tags: options.tags ?? [],
    priority: options.priority ?? 0,
    blendMode: options.blendMode ?? 'highest-priority',
    ...visual,
  };
}
