export interface OccupancyStore {
  readonly currentMask: Uint32Array;
  readonly previousMask: Uint32Array;
}

export function createOccupancyStore(capacity: number): OccupancyStore {
  const safeCapacity = Math.max(0, Math.floor(capacity));
  return {
    currentMask: new Uint32Array(safeCapacity),
    previousMask: new Uint32Array(safeCapacity),
  };
}

export function beginOccupancyFrame(store: OccupancyStore, count: number): void {
  for (let index = 0; index < count; index += 1) {
    store.previousMask[index] = store.currentMask[index] ?? 0;
    store.currentMask[index] = 0;
  }
}

export function readOccupancyMask(values: Uint32Array, index: number): number {
  return values[index] ?? 0;
}
