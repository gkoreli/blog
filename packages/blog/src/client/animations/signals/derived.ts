/**
 * derived / combinedSignal — signal composition without new infrastructure.
 *
 * derived()        — transform one signal's value each frame
 * combinedSignal() — merge multiple signals into one value
 *
 * Both forward pause/resume/dispose to their source(s) and are idempotent.
 * Deduplication note: if two derived signals share the same source, the runner
 * will call pause() on each, which each forward to the source. Sources must be
 * idempotent on pause/resume (all built-in signals satisfy this).
 */
import type { Signal } from '../pipeline.js';

export function derived<A, B>(
  source: Signal<A>,
  transform: (value: A) => B,
): Signal<B> {
  return {
    read:    () => transform(source.read()),
    pause:   () => source.pause(),
    resume:  () => source.resume(),
    dispose: () => source.dispose(),
  };
}

export function combinedSignal<T>(
  sources: Signal<unknown>[],
  combine: (...values: unknown[]) => T,
): Signal<T> & { readonly sources: Signal<unknown>[] } {
  return {
    sources,

    read() {
      return combine(...sources.map(s => s.read()));
    },

    pause() {
      for (const s of sources) s.pause();
    },

    resume() {
      for (const s of sources) s.resume();
    },

    dispose() {
      for (const s of sources) s.dispose();
    },
  };
}
