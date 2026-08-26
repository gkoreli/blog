import type { ColorValue, PrimitiveId, RuntimePrimitive } from './types.js';
import type { PrimitiveCoordinateSpace } from './primitives.js';

export const POLYLINE_PRIMITIVE_KIND = 'polyline';

export interface PrimitivePoint {
  readonly x: number;
  readonly y: number;
}

export interface PolylinePrimitiveGlow {
  readonly color: ColorValue;
  readonly alpha: number;
  readonly width: number;
}

export interface PolylinePrimitiveData {
  readonly points: readonly PrimitivePoint[];
  readonly coordinateSpace: PrimitiveCoordinateSpace;
  readonly color: ColorValue;
  readonly alpha: number;
  readonly width: number;
  readonly glow?: PolylinePrimitiveGlow;
}

export interface PolylinePrimitive extends RuntimePrimitive<typeof POLYLINE_PRIMITIVE_KIND, PolylinePrimitiveData> {}

export function createPolylinePrimitive(id: PrimitiveId, data: PolylinePrimitiveData): PolylinePrimitive {
  return { kind: POLYLINE_PRIMITIVE_KIND, id, data };
}

export function isPolylinePrimitive(primitive: RuntimePrimitive): primitive is PolylinePrimitive {
  return primitive.kind === POLYLINE_PRIMITIVE_KIND && isPolylinePrimitiveData(primitive.data);
}

function isPolylinePrimitiveData(value: unknown): value is PolylinePrimitiveData {
  if (typeof value !== 'object' || value === null || !('points' in value) || !Array.isArray(value.points)) return false;
  return (
    value.points.length >= 2 &&
    value.points.every(isPrimitivePoint) &&
    'coordinateSpace' in value &&
    (value.coordinateSpace === 'normalized' || value.coordinateSpace === 'screen') &&
    'color' in value &&
    (typeof value.color === 'string' || typeof value.color === 'number') &&
    'alpha' in value &&
    typeof value.alpha === 'number' &&
    'width' in value &&
    typeof value.width === 'number'
  );
}

function isPrimitivePoint(value: unknown): value is PrimitivePoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    typeof value.x === 'number' &&
    'y' in value &&
    typeof value.y === 'number'
  );
}
