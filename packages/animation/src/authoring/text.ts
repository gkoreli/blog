import type {
  ColorValue,
  PrimitiveAnchor,
  PrimitiveCoordinateSpace,
  TextPrimitiveAlign,
  TextPrimitiveFontSizeUnit,
  TextPrimitiveFontWeight,
  TextPrimitiveGlow,
  TextPrimitiveStyle,
} from '../core/index.js';
import type { TextSourceDefinition } from './types.js';

export interface TextSourceOptions {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace?: PrimitiveCoordinateSpace;
  readonly anchor?: PrimitiveAnchor;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontSizeUnit?: TextPrimitiveFontSizeUnit;
  readonly fontWeight?: TextPrimitiveFontWeight;
  readonly color?: ColorValue;
  readonly alpha?: number;
  readonly align?: TextPrimitiveAlign;
  readonly letterSpacing?: number;
  readonly lineHeight?: number;
  readonly glow?: Partial<TextPrimitiveGlow>;
  readonly visible?: boolean;
  readonly debugBounds?: boolean;
  readonly tags?: readonly string[];
}

export function textSource(options: TextSourceOptions): Omit<TextSourceDefinition, 'id'> {
  const glow = completeGlow(options.glow);
  const style: TextPrimitiveStyle = {
    fontFamily: options.fontFamily ?? 'Lora, Georgia, serif',
    fontSize: options.fontSize ?? 0.72,
    fontSizeUnit: options.fontSizeUnit ?? 'bounds-height',
    fontWeight: options.fontWeight ?? '700',
    color: options.color ?? '#faf8f5',
    alpha: options.alpha ?? 0.92,
    align: options.align ?? 'center',
    letterSpacing: options.letterSpacing ?? 0,
    ...(options.lineHeight === undefined ? {} : { lineHeight: options.lineHeight }),
    ...(glow === undefined ? {} : { glow }),
  };

  return {
    text: options.text,
    bounds: {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      coordinateSpace: options.coordinateSpace ?? 'normalized',
    },
    anchor: options.anchor ?? { x: 0.5, y: 0.5 },
    style,
    visible: options.visible ?? true,
    debugBounds: options.debugBounds ?? false,
    tags: options.tags ?? [],
  };
}

function completeGlow(glow: Partial<TextPrimitiveGlow> | undefined): TextPrimitiveGlow | undefined {
  if (!glow) return undefined;

  return {
    color: glow.color ?? '#93c5fd',
    alpha: glow.alpha ?? 0.42,
    blur: glow.blur ?? 18,
  };
}
