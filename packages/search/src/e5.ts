/** Optional model adapter. Neither the search domain nor word search imports this module. */
import { BertTokenizer } from '@huggingface/transformers';
import type { EmbeddingEncoder } from './contracts.js';
import { digest, normalizedVector } from './snapshot.js';

export const E5_REVISION = '02af79985278377e65c724a76275707cb0333c70';
export const E5_SPACE = `Xenova/e5-small-v2@${E5_REVISION}:q8:mean:l2:query-passage:v1`;
export const E5_DIMENSIONS = 384;

export interface EmbeddingCache {
  get(key: string): Promise<Float32Array | undefined>;
  put(key: string, vector: Float32Array): Promise<void>;
}

export interface E5Tokenizer {
  encode(text: string, options?: { add_special_tokens?: boolean }): number[];
}

export function e5Tokenizer(json: unknown, config: unknown): E5Tokenizer {
  if (!json || typeof json !== 'object' || !config || typeof config !== 'object') throw new Error('Invalid E5 tokenizer files.');
  return new BertTokenizer(json, config);
}

/** Both adapters use identical prefixes and bounded, complete model inputs. */
export function createE5Encoder(options: {
  readonly tokenizer: E5Tokenizer;
  readonly infer: (prefixedText: string, ids: readonly number[], signal?: AbortSignal) => Promise<Float32Array>;
  readonly cache?: EmbeddingCache;
}): EmbeddingEncoder {
  return { space: E5_SPACE, dimensions: E5_DIMENSIONS,
    async encode(text, purpose, signal) {
      signal?.throwIfAborted();
      const prefix = purpose === 'query' ? 'query: ' : 'passage: ';
      const inputs: string[] = [];
      function split(value: string): void {
        const ids = options.tokenizer.encode(prefix + value);
        if (ids.length <= 480) { inputs.push(prefix + value); return; }
        if (purpose === 'query') throw new Error('This query exceeds the related-search token limit.');
        // Split original text, rather than decode/re-encode a lossy token stream.
        const middle = Math.floor(value.length / 2);
        const boundary = value.lastIndexOf(' ', middle);
        const cut = boundary > middle / 2 ? boundary : middle;
        if (cut < 1 || cut >= value.length) throw new Error('Unable to split a model input.');
        split(value.slice(0, cut)); split(value.slice(cut));
      }
      split(text);
      const output: Float32Array[] = [];
      for (const input of inputs) {
        signal?.throwIfAborted();
        const key = await digest(new TextEncoder().encode(E5_SPACE + '\n' + input));
        const cached = purpose === 'document' ? await options.cache?.get(key) : undefined;
        const vector = normalizedVector(cached ?? await options.infer(input, options.tokenizer.encode(input), signal), E5_DIMENSIONS);
        signal?.throwIfAborted();
        if (!cached && purpose === 'document') await options.cache?.put(key, vector);
        output.push(vector);
      }
      return output;
    },
  };
}

export interface SearchAsset { readonly url: string; readonly bytes: number; readonly sha256: string }
export interface E5WebFiles {
  readonly model: readonly SearchAsset[];
  readonly tokenizer: SearchAsset;
  readonly tokenizerConfig: SearchAsset;
  readonly wasmUrl: string;
  readonly moduleUrl: string;
}

export function readE5WebFiles(value: unknown): E5WebFiles {
  const object = (item: unknown): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item);
  function path(item: unknown): string { if (typeof item !== 'string' || !item.startsWith('/search-assets/') || item.includes('..') || item.includes('?') || item.includes('#')) throw new Error('Invalid model asset path.'); return item; }
  function asset(item: unknown): SearchAsset {
    if (!object(item) || typeof item['bytes'] !== 'number' || !Number.isInteger(item['bytes']) || item['bytes'] < 1 || typeof item['sha256'] !== 'string' || !/^[a-f0-9]{64}$/u.test(item['sha256'])) throw new Error('Invalid model asset.');
    return { url: path(item['url']), bytes: item['bytes'], sha256: item['sha256'] };
  }
  if (!object(value) || !Array.isArray(value['model']) || !value['model'].length) throw new Error('Invalid model manifest.');
  return { model: value['model'].map(asset), tokenizer: asset(value['tokenizer']), tokenizerConfig: asset(value['tokenizerConfig']), wasmUrl: path(value['wasmUrl']), moduleUrl: path(value['moduleUrl']) };
}
