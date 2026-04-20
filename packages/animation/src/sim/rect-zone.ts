import type { ColorValue, PrimitiveId, RuntimePrimitive, RuntimeSize } from '../core/index.js';

export const RECT_ZONE_KIND = 'rect-zone';

export type ZoneCoordinateSpace = 'normalized' | 'screen';

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface RectZoneOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace?: ZoneCoordinateSpace;
  readonly color?: ColorValue;
  readonly alpha?: number;
}

export interface RectZone {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace: ZoneCoordinateSpace;
  readonly color: ColorValue;
  readonly alpha: number;
}

export interface RectZonePrimitive extends RuntimePrimitive<typeof RECT_ZONE_KIND, RectZone> {}

const DEFAULT_ZONE_COLOR = '#93c5fd';
const DEFAULT_ZONE_ALPHA = 0.22;

export function rectZone(options: RectZoneOptions): RectZone {
  return {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    coordinateSpace: options.coordinateSpace ?? 'normalized',
    color: options.color ?? DEFAULT_ZONE_COLOR,
    alpha: options.alpha ?? DEFAULT_ZONE_ALPHA,
  };
}

export function createRectZonePrimitive(id: PrimitiveId, zone: RectZone): RectZonePrimitive {
  return {
    kind: RECT_ZONE_KIND,
    id,
    data: zone,
  };
}

export function isRectZonePrimitive(primitive: RuntimePrimitive): primitive is RectZonePrimitive {
  return primitive.kind === RECT_ZONE_KIND && isRectZone(primitive.data);
}

export function containsPoint(zone: RectZone, point: Point2D, size: RuntimeSize): boolean {
  const bounds = toScreenRect(zone, size);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function toScreenRect(zone: RectZone, size: RuntimeSize): RectZone {
  if (zone.coordinateSpace === 'screen') return zone;

  return {
    ...zone,
    x: zone.x * size.width,
    y: zone.y * size.height,
    width: zone.width * size.width,
    height: zone.height * size.height,
    coordinateSpace: 'screen',
  };
}

function isRectZone(value: unknown): value is RectZone {
  if (!isRecord(value)) return false;
  return (
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    (value.coordinateSpace === 'normalized' || value.coordinateSpace === 'screen') &&
    (typeof value.color === 'string' || typeof value.color === 'number') &&
    typeof value.alpha === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
