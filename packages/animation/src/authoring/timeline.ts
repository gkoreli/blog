import type { TimelineDefinition, TimelineSource } from './types.js';

export interface TimelineOptions {
  readonly inputStart?: number;
  readonly inputEnd?: number;
  readonly outputStart?: number;
  readonly outputEnd?: number;
}

export function scrollTimeline(options: TimelineOptions = {}): Omit<TimelineDefinition, 'id'> {
  return timeline('scroll', options);
}

export function timeTimeline(options: TimelineOptions = {}): Omit<TimelineDefinition, 'id'> {
  return timeline('time', options);
}

function timeline(source: TimelineSource, options: TimelineOptions): Omit<TimelineDefinition, 'id'> {
  return {
    source,
    inputStart: options.inputStart ?? 0,
    inputEnd: options.inputEnd ?? 1,
    outputStart: options.outputStart ?? 0,
    outputEnd: options.outputEnd ?? 1,
  };
}
