import type { ColorValue, PrimitiveId, RuntimePrimitive, RuntimeSize, TextSourceId } from './types.js';

export const TEXT_PRIMITIVE_KIND = 'text';

export type PrimitiveCoordinateSpace = 'normalized' | 'screen';
export type TextPrimitiveFontWeight =
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';
export type TextPrimitiveAlign = 'left' | 'center' | 'right' | 'justify';
export type TextPrimitiveFontSizeUnit = 'px' | 'bounds-height';

export interface PrimitiveRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace: PrimitiveCoordinateSpace;
}

export interface PrimitiveAnchor {
  readonly x: number;
  readonly y: number;
}

export interface TextPrimitiveGlow {
  readonly color: ColorValue;
  readonly alpha: number;
  readonly blur: number;
}

export interface TextPrimitiveStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontSizeUnit: TextPrimitiveFontSizeUnit;
  readonly fontWeight: TextPrimitiveFontWeight;
  readonly color: ColorValue;
  readonly alpha: number;
  readonly align: TextPrimitiveAlign;
  readonly letterSpacing: number;
  readonly lineHeight?: number;
  readonly glow?: TextPrimitiveGlow;
}

export interface TextPrimitiveData {
  readonly sourceId: TextSourceId;
  readonly text: string;
  readonly bounds: PrimitiveRect;
  readonly anchor: PrimitiveAnchor;
  readonly style: TextPrimitiveStyle;
  readonly visible: boolean;
  readonly debugBounds: boolean;
}

export interface TextPrimitive extends RuntimePrimitive<typeof TEXT_PRIMITIVE_KIND, TextPrimitiveData> {}

export function createTextPrimitive(id: PrimitiveId, data: TextPrimitiveData): TextPrimitive {
  return {
    kind: TEXT_PRIMITIVE_KIND,
    id,
    data,
  };
}

export function isTextPrimitive(primitive: RuntimePrimitive): primitive is TextPrimitive {
  return primitive.kind === TEXT_PRIMITIVE_KIND && isTextPrimitiveData(primitive.data);
}

export function toScreenPrimitiveRect(rect: PrimitiveRect, size: RuntimeSize): PrimitiveRect {
  if (rect.coordinateSpace === 'screen') return rect;

  return {
    x: rect.x * size.width,
    y: rect.y * size.height,
    width: rect.width * size.width,
    height: rect.height * size.height,
    coordinateSpace: 'screen',
  };
}

function isTextPrimitiveData(value: unknown): value is TextPrimitiveData {
  if (!isRecord(value)) return false;
  return (
    typeof value.sourceId === 'string' &&
    typeof value.text === 'string' &&
    isPrimitiveRect(value.bounds) &&
    isPrimitiveAnchor(value.anchor) &&
    isTextPrimitiveStyle(value.style) &&
    typeof value.visible === 'boolean' &&
    typeof value.debugBounds === 'boolean'
  );
}

function isPrimitiveRect(value: unknown): value is PrimitiveRect {
  if (!isRecord(value)) return false;
  return (
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    (value.coordinateSpace === 'normalized' || value.coordinateSpace === 'screen')
  );
}

function isPrimitiveAnchor(value: unknown): value is PrimitiveAnchor {
  if (!isRecord(value)) return false;
  return typeof value.x === 'number' && typeof value.y === 'number';
}

function isTextPrimitiveStyle(value: unknown): value is TextPrimitiveStyle {
  if (!isRecord(value)) return false;
  return (
    typeof value.fontFamily === 'string' &&
    typeof value.fontSize === 'number' &&
    (value.fontSizeUnit === 'px' || value.fontSizeUnit === 'bounds-height') &&
    typeof value.fontWeight === 'string' &&
    (typeof value.color === 'string' || typeof value.color === 'number') &&
    typeof value.alpha === 'number' &&
    typeof value.align === 'string' &&
    typeof value.letterSpacing === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
