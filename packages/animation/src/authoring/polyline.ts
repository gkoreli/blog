import type {
  ColorValue,
  PolylinePrimitiveGlow,
  PrimitiveCoordinateSpace,
  PrimitivePoint,
} from '../core/index.js';
import type { PolylineDefinition, PolylineTimelineDefinition } from './types.js';

export interface PolylineOptions {
  readonly points: readonly PrimitivePoint[];
  readonly coordinateSpace?: PrimitiveCoordinateSpace;
  readonly color?: ColorValue;
  readonly alpha?: number;
  readonly width?: number;
  readonly glow?: Partial<PolylinePrimitiveGlow>;
  readonly timeline?: PolylineTimelineDefinition;
}

export function polyline(options: PolylineOptions): Omit<PolylineDefinition, 'id'> {
  const glow = options.glow === undefined
    ? {}
    : {
        glow: {
          color: options.glow.color ?? options.color ?? '#93c5fd',
          alpha: options.glow.alpha ?? 0.18,
          width: options.glow.width ?? 5,
        },
      };

  return {
    points: options.points,
    coordinateSpace: options.coordinateSpace ?? 'normalized',
    color: options.color ?? '#93c5fd',
    alpha: options.alpha ?? 0.72,
    width: options.width ?? 1,
    ...glow,
    ...(options.timeline === undefined ? {} : { timeline: options.timeline }),
  };
}
