import type { ZoneDefinition, ZoneShape } from '../authoring/index.js';

export interface CompiledZone {
  readonly definition: ZoneDefinition;
  readonly bit: number;
}

export function compileZones(zones: readonly ZoneDefinition[]): readonly CompiledZone[] {
  return zones.slice(0, 32).map((definition, index) => ({
    definition,
    bit: 1 << index,
  }));
}

export function containsZonePoint(shape: ZoneShape, x: number, y: number): boolean {
  if (shape.kind === 'rect') {
    return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
  }

  const dx = x - shape.x;
  const dy = y - shape.y;
  return dx * dx + dy * dy <= shape.radius * shape.radius;
}
