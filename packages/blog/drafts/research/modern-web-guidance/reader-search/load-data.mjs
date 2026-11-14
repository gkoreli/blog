import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { modelConfig } from '../passage-search/model.mjs';
import { readVectors } from '../passage-search/retrieval.mjs';
import { createReaderIndex } from './ranking.mjs';

export function loadData(configFile) {
  const config = JSON.parse(readFileSync(configFile, 'utf8')); const directory = dirname(resolve(configFile));
  const required = ['passageFile', 'passageVectors', 'passageReceipt', 'blockFile', 'blockVectors', 'blockReceipt', 'liveFile', 'runtime', 'model'];
  for (const key of required) { assert.equal(typeof config[key], 'string', key); config[key] = resolve(directory, config[key]); }
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const modelFreeze = JSON.parse(readFileSync(new URL('../passage-search/input-freeze.json', import.meta.url), 'utf8'));
  for (const [file, expected] of Object.entries(modelFreeze.modelFiles)) assert.equal(sha(readFileSync(join(config.model, file))), expected.sha256, 'Wrong model asset: ' + file);
  assert.equal(JSON.parse(readFileSync(join(config.runtime, 'node_modules/@huggingface/transformers/package.json'), 'utf8')).version, '3.8.1');
  const inputHashes = {}; const indexes = {}; const sourceData = {};
  for (const kind of ['passage', 'block']) {
    const dataBytes = readFileSync(config[kind + 'File']); const data = JSON.parse(dataBytes.toString('utf8'));
    const vectorBytes = readFileSync(config[kind + 'Vectors']); const receipt = JSON.parse(readFileSync(config[kind + 'Receipt'], 'utf8'));
    assert.deepEqual(data.model, modelConfig, 'Document/query encoder settings differ'); assert.deepEqual(receipt.model, modelConfig);
    assert.equal(sha(dataBytes), receipt.passagesSha256, 'Vector receipt belongs to a different text index');
    assert.equal(sha(vectorBytes), receipt.vectorSha256, 'Vector checksum mismatch');
    const vectors = readVectors(vectorBytes); assert.equal(vectors.length, data.passages.length * modelConfig.dimensions);
    for (let offset = 0; offset < vectors.length; offset += modelConfig.dimensions) {
      let squared = 0;
      for (let i = 0; i < modelConfig.dimensions; i++) { const value = vectors[offset + i]; assert(Number.isFinite(value)); squared += value * value; }
      assert(Math.abs(Math.sqrt(squared) - 1) < 1e-4, 'Invalid document-vector norm');
    }
    inputHashes[kind + 'File'] = sha(dataBytes); inputHashes[kind + 'Vectors'] = sha(vectorBytes);
    indexes[kind] = createReaderIndex(data.passages, vectors); sourceData[kind] = data;
  }
  assert.equal(sourceData.passage.sourceCommit, sourceData.block.sourceCommit);
  const liveBytes = readFileSync(config.liveFile); const live = JSON.parse(liveBytes.toString('utf8'));
  const articles = [...new Set(sourceData.passage.passages.map(row => row.article))].sort();
  assert.deepEqual(articles, live.pages.map(row => row.slug).sort(), 'Live capture and index inventories differ');
  inputHashes.liveFile = sha(liveBytes);
  return { config, indexes, live: new Map(live.pages.map(page => [page.slug, page.visibleText])), inputHashes,
    catalog: { articles: articles.length, passages: sourceData.passage.passages.length, paragraphs: sourceData.block.passages.length, sourceCommit: sourceData.passage.sourceCommit, liveCapturedAt: live.capturedAt, model: modelConfig } };
}
