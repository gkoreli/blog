import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import assert from 'node:assert/strict';
import { loadEncoder, modelConfig } from './model.mjs';

if (process.argv.length !== 7) throw new Error('Usage: node build-index.mjs /passages.json /runtime /model /cache /new-output');
const [passageFile, runtime, modelDir, cache, output] = process.argv.slice(2).map(value => resolve(value));
const passages = JSON.parse(readFileSync(passageFile, 'utf8'));
const sha = input => createHash('sha256').update(input).digest('hex');
mkdirSync(output); mkdirSync(cache, { recursive: true });
const start = performance.now(); const encoder = await loadEncoder(runtime, modelDir);
const modelInitMs = performance.now() - start;
const vectors = []; const batches = []; let cachedBatches = 0;
for (let offset = 0; offset < passages.passages.length; offset += 8) {
  const slice = passages.passages.slice(offset, offset + 8);
  const texts = slice.map(row => row.embeddingText);
  const key = sha(JSON.stringify({ modelConfig, texts }));
  const path = join(cache, key + '.json'); const before = performance.now();
  let rows;
  if (existsSync(path)) { rows = JSON.parse(readFileSync(path, 'utf8')); cachedBatches++; }
  else {
    rows = await encoder.embed(texts);
    writeFileSync(path, JSON.stringify(rows), { flag: 'wx' });
  }
  assert.equal(rows.length, slice.length);
  for (const row of rows) { assert.equal(row.length, 384); assert(row.every(Number.isFinite)); vectors.push(...row); }
  batches.push({ offset, count: slice.length, elapsedMs: performance.now() - before, cacheKey: key });
  if (offset % 128 === 0) console.log(JSON.stringify({ embedded: offset + slice.length, total: passages.passages.length }));
}
const bytes = Buffer.alloc(vectors.length * 4);
for (let i = 0; i < vectors.length; i++) bytes.writeFloatLE(vectors[i], i * 4);
writeFileSync(join(output, 'document-vectors.f32'), bytes);
const receipt = { capturedAt: new Date().toISOString(), model: modelConfig, passagesSha256: sha(readFileSync(passageFile)), vectorSha256: sha(bytes), vectorBytes: bytes.length, passages: passages.passages.length, dimensions: 384, modelInitMs, totalBuildMs: performance.now() - start, batchSize: 8, cachedBatches, batches, environment: { node: process.version, cpu: os.cpus()[0]?.model, platform: process.platform, arch: process.arch }, cloudEmbeddingApiCalls: 0, networkDuringInference: 'Remote models disabled; fetch replaced with a throwing function.' };
writeFileSync(join(output, 'index-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
await encoder.dispose();
console.log(JSON.stringify({ output, passages: receipt.passages, vectorBytes: bytes.length, totalBuildMs: receipt.totalBuildMs, cachedBatches }));
