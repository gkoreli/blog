import type { ZoneBlendMode, ZoneDefinition, ZoneShape } from './types.js';

export interface ZoneOptions {
  readonly tags?: readonly string[];
  readonly priority?: number;
  readonly blendMode?: ZoneBlendMode;
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
  return {
    shape,
    tags: options.tags ?? [],
    priority: options.priority ?? 0,
    blendMode: options.blendMode ?? 'highest-priority',
  };
}
