export interface ParticleStore {
  readonly capacity: number;
  count: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly age: Float32Array;
  readonly life: Float32Array;
  readonly radius: Float32Array;
  readonly alpha: Float32Array;
  readonly emissive: Float32Array;
  readonly noise: Float32Array;
  readonly trail: Float32Array;
  readonly colorR: Float32Array;
  readonly colorG: Float32Array;
  readonly colorB: Float32Array;
  readonly materialIndex: Uint16Array;
  readonly flags: Uint32Array;
  readonly alive: Uint8Array;
}

export interface ParticleSpawnOptions {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly life: number;
  readonly radius: number;
  readonly alpha: number;
  readonly emissive: number;
  readonly noise: number;
  readonly trail: number;
  readonly colorR: number;
  readonly colorG: number;
  readonly colorB: number;
  readonly materialIndex: number;
}

export function createParticleStore(capacity: number): ParticleStore {
  const safeCapacity = Math.max(0, Math.floor(capacity));

  return {
    capacity: safeCapacity,
    count: 0,
    x: new Float32Array(safeCapacity),
    y: new Float32Array(safeCapacity),
    vx: new Float32Array(safeCapacity),
    vy: new Float32Array(safeCapacity),
    age: new Float32Array(safeCapacity),
    life: new Float32Array(safeCapacity),
    radius: new Float32Array(safeCapacity),
    alpha: new Float32Array(safeCapacity),
    emissive: new Float32Array(safeCapacity),
    noise: new Float32Array(safeCapacity),
    trail: new Float32Array(safeCapacity),
    colorR: new Float32Array(safeCapacity),
    colorG: new Float32Array(safeCapacity),
    colorB: new Float32Array(safeCapacity),
    materialIndex: new Uint16Array(safeCapacity),
    flags: new Uint32Array(safeCapacity),
    alive: new Uint8Array(safeCapacity),
  };
}

export function spawnParticle(store: ParticleStore, options: ParticleSpawnOptions): number | undefined {
  const index = findFreeSlot(store);
  if (index === undefined) return undefined;

  store.x[index] = options.x;
  store.y[index] = options.y;
  store.vx[index] = options.vx;
  store.vy[index] = options.vy;
  store.age[index] = 0;
  store.life[index] = options.life;
  store.radius[index] = options.radius;
  store.alpha[index] = options.alpha;
  store.emissive[index] = options.emissive;
  store.noise[index] = options.noise;
  store.trail[index] = options.trail;
  store.colorR[index] = options.colorR;
  store.colorG[index] = options.colorG;
  store.colorB[index] = options.colorB;
  store.materialIndex[index] = options.materialIndex;
  store.flags[index] = 0;
  store.alive[index] = 1;
  store.count = Math.max(store.count, index + 1);

  return index;
}

export function killParticle(store: ParticleStore, index: number): void {
  if (index < 0 || index >= store.capacity) return;
  store.alive[index] = 0;

  while (store.count > 0 && readParticleByte(store.alive, store.count - 1) === 0) {
    store.count -= 1;
  }
}

export function readParticleFloat(values: Float32Array, index: number): number {
  return values[index] ?? 0;
}

export function readParticleFlag(values: Uint32Array, index: number): number {
  return values[index] ?? 0;
}

export function readParticleByte(values: Uint8Array, index: number): number {
  return values[index] ?? 0;
}

function findFreeSlot(store: ParticleStore): number | undefined {
  for (let index = 0; index < store.capacity; index += 1) {
    if (readParticleByte(store.alive, index) === 0) return index;
  }

  return undefined;
}
