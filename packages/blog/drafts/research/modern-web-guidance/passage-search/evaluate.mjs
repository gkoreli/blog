import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { loadEncoder, modelConfig } from './model.mjs';
import { createSearcher, readVectors } from './retrieval.mjs';

if (process.argv.length !== 9) throw new Error('Usage: node evaluate.mjs /passages /vectors /queries /runtime /model /fresh-output /seed');
const [passageFile, vectorFile, queryFile, runtime, modelDir, output] = process.argv.slice(2, 8).map(value => resolve(value));
let state = Number(process.argv[8]) >>> 0;
const passages = JSON.parse(readFileSync(passageFile, 'utf8'));
const questions = JSON.parse(readFileSync(queryFile, 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const before = performance.now(); const encoder = await loadEncoder(runtime, modelDir);
const modelInitMs = performance.now() - before;
const indexBefore = performance.now();
const searcher = createSearcher(passages.passages, readVectors(readFileSync(vectorFile)));
const searchIndexInitMs = performance.now() - indexBefore;
const order = [...questions.queries];
const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
const results = [];
for (const query of order) {
  const encodeBefore = performance.now();
  const [vector] = await encoder.embed([modelConfig.queryPrefix + query.query]);
  const queryEncodingMs = performance.now() - encodeBefore;
  const ranked = searcher.rankings(query.query, vector);
  const methods = {};
  for (const [name, rows] of Object.entries(ranked.lists)) {
    const returned = searcher.describe(rows, 10);
    const first = returned.findIndex(row => query.knownPassages.includes(row.id));
    methods[name] = { returned, targetRankThrough10: first < 0 ? null : first + 1,
      knownAnswerAt1: first === 0, knownAnswerAt3: first >= 0 && first < 3,
      knownAnswerAt5: first >= 0 && first < 5, knownAnswerAt10: first >= 0,
      reciprocalRankThrough10: first < 0 ? 0 : 1 / (first + 1),
      targetArticleAmongTop3Passages: returned.slice(0, 3).some(row => row.article === query.article),
    };
  }
  results.push({ id: query.id, query: query.query, stratum: query.stratum, article: query.article, knownPassages: query.knownPassages, timing: { queryEncodingMs, ...ranked.timing }, fullRankings: Object.fromEntries(Object.entries(ranked.lists).map(([name, rows]) => [name, rows.map(row => row.id)])), methods });
}
results.sort((a, b) => a.id.localeCompare(b.id));
const receipt = { capturedAt: new Date().toISOString(), seed: Number(process.argv[8]), model: modelConfig, passageFileSha256: hash(readFileSync(passageFile)), vectorFileSha256: hash(readFileSync(vectorFile)), queryFileSha256: hash(readFileSync(queryFile)), modelInitMs, searchIndexInitMs, results };
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
await encoder.dispose();
console.log(JSON.stringify({ output, observed: results.length }));
