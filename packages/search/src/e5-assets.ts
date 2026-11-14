import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { E5_FILES } from './e5-files.js';
import { E5_REVISION, type E5WebFiles, type SearchAsset } from './e5.js';

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** Pin, verify, cache outside Git, and emit files below the host's individual-asset limit. */
export async function prepareE5Assets(cache: string, destination: string): Promise<{ readonly directory: string; readonly files: E5WebFiles; readonly notice: SearchAsset; readonly browserBytes: number }> {
  const directory = join(cache, 'model', E5_REVISION);
  const bytes = new Map<string, Uint8Array>();
  for (const [name, expected] of Object.entries(E5_FILES)) {
    const path = join(directory, name); let data: Uint8Array;
    try { data = await readFile(path); }
    catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
      const response = await fetch(`https://huggingface.co/Xenova/e5-small-v2/resolve/${E5_REVISION}/${name}`, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`E5 asset unavailable: ${name} (${response.status}).`);
      data = new Uint8Array(await response.arrayBuffer());
      if (data.byteLength !== expected.bytes || sha256(data) !== expected.sha256) throw new Error('Downloaded E5 file does not match its pin.');
      await mkdir(dirname(path), { recursive: true }); await writeFile(path, data);
    }
    if (data.byteLength !== expected.bytes || sha256(data) !== expected.sha256) throw new Error(`Cached E5 file does not match its pin: ${name}`);
    bytes.set(name, data);
  }
  async function emit(data: Uint8Array, name: string): Promise<SearchAsset> {
    const hash = sha256(data), url = `/search-assets/${hash.slice(0, 20)}/${name}`;
    if (data.byteLength > 25 * 1024 * 1024) throw new Error('A search asset exceeds the hosting limit.');
    const path = join(destination, url); await mkdir(dirname(path), { recursive: true }); await writeFile(path, data);
    return { url, bytes: data.byteLength, sha256: hash };
  }
  const tokenizer = bytes.get('tokenizer.json'), config = bytes.get('tokenizer_config.json'), model = bytes.get('onnx/model_quantized.onnx');
  if (!tokenizer || !config || !model) throw new Error('Missing pinned E5 bytes.');
  const half = Math.ceil(model.byteLength / 2);
  const tokenizerAsset = await emit(tokenizer, 'tokenizer.json'), configAsset = await emit(config, 'tokenizer-config.json');
  const modelAssets = await Promise.all([emit(model.slice(0, half), 'model-1.bin'), emit(model.slice(half), 'model-2.bin')]);
  const require = createRequire(import.meta.url), runtimeDirectory = dirname(require.resolve('onnxruntime-web'));
  const wasm = await emit(await readFile(join(runtimeDirectory, 'ort-wasm-simd-threaded.wasm')), 'ort-wasm-simd-threaded.wasm');
  const module = await emit(await readFile(join(runtimeDirectory, 'ort-wasm-simd-threaded.mjs')), 'ort-wasm-simd-threaded.mjs');
  const notices = await Promise.all([
    readFile(new URL('../THIRD_PARTY.md', import.meta.url), 'utf8'),
    readFile(join(dirname(require.resolve('@huggingface/transformers')), '..', 'LICENSE'), 'utf8'),
    readFile(join(dirname(require.resolve('minisearch')), '..', '..', 'LICENSE.txt'), 'utf8'),
  ]);
  const notice = await emit(new TextEncoder().encode(notices.join('\n\n')), 'THIRD-PARTY.txt');
  return { directory, files: { tokenizer: tokenizerAsset, tokenizerConfig: configAsset, model: modelAssets, wasmUrl: wasm.url, moduleUrl: module.url }, notice, browserBytes: tokenizerAsset.bytes + configAsset.bytes + modelAssets.reduce((sum, asset) => sum + asset.bytes, 0) + wasm.bytes + module.bytes };
}
