/**
 * clickForceEmitter — pointerdown on a target spawns ForcePoint entities.
 *
 * Click empty space → spawn a jittery force field at that position.
 * Click near an existing point → kill it (begin dying transition).
 * Exceeding maxEntities → kills the oldest alive entity before spawning.
 *
 * Uses pointer events (not mouse) so it works on touch devices too.
 * Coordinates are normalized to 0–1 within the target's bounding rect.
 */
import { createEntityStore } from '../store.js';
import type { EntityStore, Emitter } from '../../pipeline.js';

export interface ForcePointData {
  /** Normalized 0–1 within the canvas. */
  x:     number;
  y:     number;
  /** Random initial phase [0, 2π] — prevents synchronized jitter across entities. */
  phase: number;
}

export interface ClickForceEmitterOptions {
  /**
   * Distance in px within which a click kills the nearest existing entity.
   * Default 48.
   */
  killRadius?:   number;
  /**
   * Maximum simultaneous alive entities. The oldest alive entity is killed
   * when this limit is reached. Default 8.
   */
  maxEntities?:  number;
}

export function clickForceEmitter(
  target: HTMLElement,
  store: EntityStore<ForcePointData>,
  options: ClickForceEmitterOptions = {},
): Emitter {
  const { killRadius = 48, maxEntities = 8 } = options;

  let active = false;

  function onPointerDown(e: PointerEvent) {
    // Only primary pointer (left-click / first touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const rect = target.getBoundingClientRect();
    const nx   = (e.clientX - rect.left) / rect.width;
    const ny   = (e.clientY - rect.top)  / rect.height;

    // Convert killRadius from px to normalized space
    const killNorm = killRadius / Math.min(rect.width, rect.height);

    // Check if click is near any alive entity
    const entities = store.entities();
    let   nearest  = -1;
    let   nearDist = Infinity;

    for (const entity of entities) {
      if (entity.state !== 'alive') continue;
      const dx   = entity.data.x - nx;
      const dy   = entity.data.y - ny;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < killNorm && dist < nearDist) {
        nearest  = entity.id;
        nearDist = dist;
      }
    }

    if (nearest !== -1) {
      // Click near existing — kill it
      store.kill(nearest);
      return;
    }

    // Enforce maxEntities — kill oldest alive entity
    const alive = entities.filter(e => e.state === 'alive');
    if (alive.length >= maxEntities) {
      // Oldest = smallest id (or smallest age, same thing since ids are monotonic)
      const oldest = alive.reduce((a, b) => (a.age > b.age ? a : b));
      store.kill(oldest.id);
    }

    store.spawn({ x: nx, y: ny, phase: Math.random() * Math.PI * 2 });
  }

  return {
    resume() {
      if (active) return;
      active = true;
      target.addEventListener('pointerdown', onPointerDown);
    },

    pause() {
      if (!active) return;
      active = false;
      target.removeEventListener('pointerdown', onPointerDown);
    },

    dispose() {
      active = false;
      target.removeEventListener('pointerdown', onPointerDown);
    },
  };
}

// Re-export so consumers only need to import from this file
export { createEntityStore };
