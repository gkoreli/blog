import * as ort from 'onnxruntime-web/wasm';
import { createE5Encoder, e5Tokenizer, E5_DIMENSIONS, type E5WebFiles, type SearchAsset } from './e5.js';
import { digest } from './snapshot.js';
import type { ManagedEncoder } from './contracts.js';
import { manageEncoder } from './resources.js';

/** Explicit opt-in, self-hosted CPU/WASM inference, suitable for a dedicated browser worker. */
export async function createBrowserE5(files: E5WebFiles, options: { readonly baseUrl: string; readonly signal?: AbortSignal; readonly progress?: (loaded: number, total: number) => void }): Promise<ManagedEncoder> {
  let loaded = 0; const total = [...files.model, files.tokenizer, files.tokenizerConfig].reduce((sum, file) => sum + file.bytes, 0);
  async function fetchAsset(asset: SearchAsset): Promise<Uint8Array> {
    const response = await fetch(asset.url, { cache: 'force-cache', ...(options.signal ? { signal: options.signal } : {}) });
    if (!response.ok || !response.body) throw new Error('A related-search model file could not be loaded.');
    const chunks: Uint8Array[] = []; const reader = response.body.getReader(); let size = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength; if (size > asset.bytes) { await reader.cancel(); throw new Error('Unexpected model size.'); }
      chunks.push(chunk.value); loaded += chunk.value.byteLength; options.progress?.(loaded, total);
    }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    if (size !== asset.bytes || await digest(bytes) !== asset.sha256) throw new Error('Related-search model integrity check failed.');
    return bytes;
  }
  const [tokenizerBytes, configBytes, ...parts] = await Promise.all([fetchAsset(files.tokenizer), fetchAsset(files.tokenizerConfig), ...files.model.map(fetchAsset)]);
  if (!tokenizerBytes || !configBytes) throw new Error('Missing tokenizer.');
  const tokenizerJson: unknown = JSON.parse(new TextDecoder().decode(tokenizerBytes));
  const configJson: unknown = JSON.parse(new TextDecoder().decode(configBytes));
  const tokenizer = e5Tokenizer(tokenizerJson, configJson);
  const model = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0; for (const part of parts) { model.set(part, offset); offset += part.byteLength; }
  ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = { wasm: new URL(files.wasmUrl, options.baseUrl).href, mjs: new URL(files.moduleUrl, options.baseUrl).href };
  options.signal?.throwIfAborted();
  const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  const encoder = createE5Encoder({ tokenizer, async infer(_text, ids, signal) {
    signal?.throwIfAborted();
    const input = new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]);
    const mask = new ort.Tensor('int64', new BigInt64Array(ids.length).fill(1n), [1, ids.length]);
    const segments = new ort.Tensor('int64', new BigInt64Array(ids.length), [1, ids.length]);
    let outputs: Awaited<ReturnType<typeof session.run>> | undefined;
    try {
      outputs = await session.run({ input_ids: input, attention_mask: mask, token_type_ids: segments });
      const hidden = outputs['last_hidden_state'];
      if (!hidden || !(hidden.data instanceof Float32Array) || hidden.dims[0] !== 1 || hidden.dims[1] !== ids.length || hidden.dims[2] !== E5_DIMENSIONS) throw new Error('Unexpected E5 hidden-state output.');
      const result = new Float32Array(E5_DIMENSIONS);
      // Single unpadded sequence: every attention-mask entry is one, including CLS/SEP.
      for (let token = 0; token < ids.length; token++) for (let k = 0; k < E5_DIMENSIONS; k++) result[k] = (result[k] ?? 0) + (hidden.data[token * E5_DIMENSIONS + k] ?? 0) / ids.length;
      signal?.throwIfAborted(); return result;
    } finally {
      input.dispose(); mask.dispose(); segments.dispose();
      if (outputs) for (const output of Object.values(outputs)) output.dispose();
    }
  } });
  return manageEncoder(encoder, () => session.release());
}
