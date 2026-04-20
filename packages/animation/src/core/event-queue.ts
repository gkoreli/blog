import type { EmitterId, ParticleSystemId, TimelineId, ZoneId } from './types.js';

export type RuntimeEvent =
  | {
      readonly type: 'zone.enter';
      readonly systemId: ParticleSystemId;
      readonly particleIndex: number;
      readonly zoneId: ZoneId;
      readonly time: number;
    }
  | {
      readonly type: 'zone.exit';
      readonly systemId: ParticleSystemId;
      readonly particleIndex: number;
      readonly zoneId: ZoneId;
      readonly time: number;
    }
  | {
      readonly type: 'timeline.threshold';
      readonly timelineId: TimelineId;
      readonly threshold: string;
      readonly time: number;
    }
  | {
      readonly type: 'emitter.burst';
      readonly emitterId: EmitterId;
      readonly count: number;
      readonly time: number;
    };

export interface RuntimeEventQueue {
  readonly length: number;
  push(event: RuntimeEvent): void;
  at(index: number): RuntimeEvent | undefined;
  clear(): void;
  events(): readonly RuntimeEvent[];
}

export function createRuntimeEventQueue(): RuntimeEventQueue {
  return new ArrayRuntimeEventQueue();
}

class ArrayRuntimeEventQueue implements RuntimeEventQueue {
  private readonly eventList: RuntimeEvent[] = [];

  get length(): number {
    return this.eventList.length;
  }

  push(event: RuntimeEvent): void {
    this.eventList.push(event);
  }

  at(index: number): RuntimeEvent | undefined {
    return this.eventList[index];
  }

  clear(): void {
    this.eventList.length = 0;
  }

  events(): readonly RuntimeEvent[] {
    return this.eventList;
  }
}
