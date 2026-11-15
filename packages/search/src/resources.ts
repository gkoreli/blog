import type { EmbeddingEncoder, ManagedEncoder } from './contracts.js';

/** Serialize a model's work and release exactly once after all accepted calls settle. */
export function manageEncoder(encoder: EmbeddingEncoder, release: () => Promise<void>): ManagedEncoder {
  let tail = Promise.resolve(), closing: Promise<void> | undefined;
  return {
    space: encoder.space, dimensions: encoder.dimensions,
    encode(text, purpose, signal) {
      if (closing) return Promise.reject(new Error('The embedding model is closed.'));
      const result = tail.then(() => { signal?.throwIfAborted(); return encoder.encode(text, purpose, signal); });
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
    close() { closing ??= tail.then(release); return closing; },
  };
}
