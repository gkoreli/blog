/**
 * EntityStore — a mutable, observable collection of typed scene entities.
 *
 * Write side (Emitter): spawn / kill / destroy
 * Read side (Effect):   entities() — returns alive + dying only
 * Runner side:          tick() before applyEffects, prune() after draw
 *
 * Entity lifecycle:
 *   spawn()  →  state: 'alive', age: 0
 *   tick()   →  age++ each frame
 *   kill(id) →  state: 'dying', dyingAge starts counting
 *   dying for DEATH_FRAMES  →  state: 'dead'
 *   prune()  →  removes 'dead' entities
 *
 * The dying window lets effects animate a smooth fade-out before the entity
 * disappears. Read dyingAge/DEATH_FRAMES to get a 0→1 completion ratio.
 */
import type { Entity, EntityState, EntityStore } from '../pipeline.js';

export { type Entity, type EntityState, type EntityStore };

/** Frames an entity spends in 'dying' before becoming 'dead'. */
export const DEATH_FRAMES = 30;

export function createEntityStore<T>(): EntityStore<T> {
  const all: Entity<T>[] = [];
  let nextId = 0;

  return {
    entities() {
      // Return only alive + dying — dead are invisible to effects
      return all.filter(e => e.state !== 'dead') as readonly Entity<T>[];
    },

    spawn(data: T): number {
      const id = nextId++;
      all.push({ id, data, state: 'alive', age: 0, dyingAge: 0 });
      return id;
    },

    kill(id: number): void {
      const e = all.find(e => e.id === id);
      if (e && e.state === 'alive') e.state = 'dying';
    },

    destroy(id: number): void {
      const i = all.findIndex(e => e.id === id);
      if (i !== -1) all.splice(i, 1);
    },

    tick(): void {
      for (const e of all) {
        if (e.state === 'dead') continue;
        e.age++;
        if (e.state === 'dying') {
          e.dyingAge++;
          if (e.dyingAge >= DEATH_FRAMES) e.state = 'dead';
        }
      }
    },

    prune(): void {
      // Iterate backwards so splice doesn't shift indices of unvisited entries
      for (let i = all.length - 1; i >= 0; i--) {
        if (all[i]!.state === 'dead') all.splice(i, 1);
      }
    },

    dispose(): void {
      all.length = 0;
      nextId     = 0;
    },
  };
}
