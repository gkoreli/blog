import { performance } from 'node:perf_hooks';
import { buildBm25Index, rankBm25, reciprocalRankFusion } from './vendor/bm25.ts';
import { modelConfig } from './model.mjs';

export function createSearcher(passages, vectors) {
  if (vectors.length !== passages.length * modelConfig.dimensions) throw new Error('Index shape mismatch');
  const byId = new Map(passages.map(row => [row.id, row]));
  const keywordIndex = buildBm25Index(passages.map(row => ({ id: row.id, text: row.searchText })));
  function rankings(query, queryVector) {
    const keywordStart = performance.now();
    const keyword = rankBm25(keywordIndex, query);
    const keywordMs = performance.now() - keywordStart;
    const denseStart = performance.now();
    const semantic = passages.map((row, index) => {
      let score = 0;
      const offset = index * modelConfig.dimensions;
      for (let i = 0; i < modelConfig.dimensions; i++) score += queryVector[i] * vectors[offset + i];
      return { id: row.id, score };
    }).sort((a, b) => b.score - a.score);
    const denseScanMs = performance.now() - denseStart;
    const fusionStart = performance.now();
    const hybrid = reciprocalRankFusion([semantic.map(row => row.id), keyword.map(row => row.id)], 60);
    const fusionMs = performance.now() - fusionStart;
    return { lists: { keyword, semantic, hybrid }, timing: { keywordMs, denseScanMs, fusionMs } };
  }
  function describe(rows, limit = 10, includeText = false) {
    return rows.slice(0, limit).map(row => {
      const passage = byId.get(row.id);
      return { id: row.id, score: row.score, article: passage.article, title: passage.title, heading: passage.heading, url: passage.url, ...(includeText ? { text: passage.text } : {}) };
    });
  }
  return { rankings, describe };
}

export function readVectors(buffer) {
  if (buffer.byteLength % 4) throw new Error('Corrupt float32 vector file');
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return Float32Array.from({ length: buffer.byteLength / 4 }, (_, i) => view.getFloat32(i * 4, true));
}
