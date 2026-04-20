import type { PrimitiveId } from '../core/index.js';

export interface ScrollTimeline {
  readonly kind: 'scroll';
  readonly targetId: PrimitiveId;
  readonly parameter: string;
  readonly inputStart: number;
  readonly inputEnd: number;
  readonly outputStart: number;
  readonly outputEnd: number;
}

export interface ScrollTimelineOptions {
  readonly inputStart?: number;
  readonly inputEnd?: number;
  readonly outputStart?: number;
  readonly outputEnd?: number;
}

export function scrollModulates(
  targetId: PrimitiveId,
  parameter: string,
  options: ScrollTimelineOptions = {},
): ScrollTimeline {
  return {
    kind: 'scroll',
    targetId,
    parameter,
    inputStart: options.inputStart ?? 0,
    inputEnd: options.inputEnd ?? 1,
    outputStart: options.outputStart ?? 0,
    outputEnd: options.outputEnd ?? 1,
  };
}

export function sampleScrollTimeline(timeline: ScrollTimeline, progress: number): number {
  const range = timeline.inputEnd - timeline.inputStart;
  if (range === 0) return timeline.outputEnd;

  const normalized = clamp01((progress - timeline.inputStart) / range);
  return timeline.outputStart + (timeline.outputEnd - timeline.outputStart) * normalized;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
