import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from '@huggingface/transformers';
import { createE5Encoder, e5Tokenizer, type EmbeddingCache } from './e5.js';
import type { EmbeddingEncoder } from './contracts.js';

/** Build-time CPU adapter. The caller supplies verified, pinned local model files. */
export async function createLocalE5(directory: string, cache?: EmbeddingCache): Promise<EmbeddingEncoder> {
  const json: unknown = JSON.parse(await readFile(join(directory, 'tokenizer.json'), 'utf8'));
  const config: unknown = JSON.parse(await readFile(join(directory, 'tokenizer_config.json'), 'utf8'));
  const tokenizer = e5Tokenizer(json, config);
  const model = await pipeline('feature-extraction', directory, { local_files_only: true, dtype: 'q8', device: 'cpu', session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } });
  return createE5Encoder({ tokenizer, ...(cache ? { cache } : {}), async infer(text, _ids, signal) {
    signal?.throwIfAborted();
    const result = await model(text, { pooling: 'mean', normalize: true });
    signal?.throwIfAborted();
    if (!(result.data instanceof Float32Array)) throw new Error('Unexpected E5 output type.');
    return Float32Array.from(result.data);
  } });
}
