import type { TextSourceDefinition } from '../authoring/index.js';
import type { EmitterPointSampler, EmitterSamplePoint } from './emitter-store.js';

interface TextSamplePoint {
  readonly x: number;
  readonly y: number;
}

const SAMPLE_WIDTH = 640;
const MIN_SAMPLE_HEIGHT = 96;
const MAX_SAMPLE_HEIGHT = 320;
const ALPHA_THRESHOLD = 32;
const SAMPLE_STRIDE = 2;

export function createTextSourcePointSampler(source: TextSourceDefinition): EmitterPointSampler | undefined {
  if (source.bounds.coordinateSpace !== 'normalized') return undefined;
  if (typeof document === 'undefined') return undefined;
  if (source.text.trim().length === 0) return undefined;
  if (source.bounds.width <= 0 || source.bounds.height <= 0) return undefined;

  const canvas = document.createElement('canvas');
  const sampleHeight = Math.min(
    MAX_SAMPLE_HEIGHT,
    Math.max(MIN_SAMPLE_HEIGHT, Math.round(SAMPLE_WIDTH * (source.bounds.height / source.bounds.width))),
  );

  canvas.width = SAMPLE_WIDTH;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return undefined;

  const fontSize = source.style.fontSizeUnit === 'bounds-height'
    ? sampleHeight * source.style.fontSize
    : source.style.fontSize;
  const baselineY = sampleHeight * source.anchor.y;

  context.clearRect(0, 0, SAMPLE_WIDTH, sampleHeight);
  context.fillStyle = '#ffffff';
  context.textAlign = toCanvasTextAlign(source.style.align);
  context.textBaseline = 'middle';
  context.font = `${source.style.fontWeight} ${fontSize}px ${source.style.fontFamily}`;
  context.fillText(source.text, SAMPLE_WIDTH * source.anchor.x, baselineY, SAMPLE_WIDTH * 0.96);

  const data = context.getImageData(0, 0, SAMPLE_WIDTH, sampleHeight).data;
  const points: TextSamplePoint[] = [];

  for (let y = 0; y < sampleHeight; y += SAMPLE_STRIDE) {
    for (let x = 0; x < SAMPLE_WIDTH; x += SAMPLE_STRIDE) {
      const alpha = data[(y * SAMPLE_WIDTH + x) * 4 + 3] ?? 0;
      if (alpha <= ALPHA_THRESHOLD) continue;

      points.push({
        x: (x + SAMPLE_STRIDE * 0.5) / SAMPLE_WIDTH,
        y: (y + SAMPLE_STRIDE * 0.5) / sampleHeight,
      });
    }
  }

  if (points.length === 0) return undefined;

  return {
    sample(random: () => number): EmitterSamplePoint | undefined {
      const point = points[Math.floor(random() * points.length)];
      if (!point) return undefined;

      const jitterX = (random() - 0.5) * (SAMPLE_STRIDE / SAMPLE_WIDTH);
      const jitterY = (random() - 0.5) * (SAMPLE_STRIDE / sampleHeight);

      return {
        x: source.bounds.x + source.bounds.width * clamp01(point.x + jitterX),
        y: source.bounds.y + source.bounds.height * clamp01(point.y + jitterY),
      };
    },
  };
}

function toCanvasTextAlign(align: TextSourceDefinition['style']['align']): CanvasTextAlign {
  if (align === 'right') return 'right';
  if (align === 'center') return 'center';
  if (align === 'justify') return 'center';
  return 'left';
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
