import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import os from 'node:os';

// Usage: node retrieval-pilot.mjs /path/to/package /path/to/source /path/to/result.json
// No package installation, model API, external queries, or repository scanning.
if (process.argv.length !== 5) throw new Error('Three absolute paths required.');
const [packageDir, sourceDir, outputPath] = process.argv.slice(2).map(value => resolve(value));
const cases = JSON.parse(readFileSync(new URL('./queries.json', import.meta.url), 'utf8'));
const cli = join(packageDir, 'skills/modern-web-guidance/modern-web.mjs');
const source = join(sourceDir, 'src/rag/static-embedder.ts');
const { StaticEmbedder } = await import(pathToFileURL(source).href);
const { tokenize } = await import(pathToFileURL(join(sourceDir, 'src/rag/bm25.ts')).href);
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const queryTableHashes = ['query-words.json', 'query-words.i8', 'query-words.scale.f32'].map(file => {
  const sourceSha256 = sha256(join(sourceDir, 'src/rag/gen', file));
  const packageSha256 = sha256(join(packageDir, 'skills/modern-web-guidance/gen', file));
  if (sourceSha256 !== packageSha256) throw new Error(`Source/package query-table mismatch: ${file}`);
  return { file, sourceSha256, packageSha256 };
});
const env = { ...process.env, DISABLE_TELEMETRY: '1', ENABLE_FILE_LOGGING: 'false' };
const observations = [];
for (const item of cases) {
  const calls = [];
  for (let repetition = 0; repetition < 3; repetition++) {
    const before = performance.now();
    const result = spawnSync(process.execPath, [cli, 'search', item.query], {
      env, encoding: 'utf8', cwd: dirname(outputPath), timeout: 30000,
    });
    if (result.status !== 0) throw new Error(`${item.id}: ${result.stderr || result.error}`);
    const parsed = JSON.parse(result.stdout);
    if (!Array.isArray(parsed) || parsed.some(row => typeof row.id !== 'string')) {
      throw new Error(`Unexpected CLI response for ${item.id}`);
    }
    calls.push({ wallMs: performance.now() - before, ids: parsed.map(row => row.id) });
  }
  const ids = calls[0].ids;
  observations.push({
    ...item, count: ids.length, ids, calls,
    deterministicAcrossThreeCalls: calls.every(call => JSON.stringify(call.ids) === JSON.stringify(ids)),
    expectedGuideRank: item.expectedAny.length ? ids.findIndex(id => item.expectedAny.includes(id)) + 1 : null,
    subprocessMedianMs: median(calls.map(call => call.wallMs)),
  });
}

// Isolate warm embedding from subprocess startup, model loading, ranking, and CLI output.
const embedder = StaticEmbedder.getInstance();
const initBefore = performance.now();
embedder.init();
const tableLoadMs = performance.now() - initBefore;
const warmQueries = cases.filter(item => item.kind === 'in-domain').map(item => item.query);
for (let iteration = 0; iteration < 1000; iteration++) embedder.embedSync(warmQueries[iteration % warmQueries.length]);
const warmBatchMicrosecondsPerQuery = [];
let checksum = 0;
for (let batch = 0; batch < 30; batch++) {
  const before = performance.now();
  for (let iteration = 0; iteration < 1000; iteration++) {
    checksum += embedder.embedSync(warmQueries[iteration % warmQueries.length])[0];
  }
  warmBatchMicrosecondsPerQuery.push((performance.now() - before) * 1000 / 1000);
}
const positive = observations.find(item => item.id === 'positive-animation');
const negative = observations.find(item => item.id === 'negated-animation');
const positiveVector = embedder.embedSync(positive.query);
const negativeVector = embedder.embedSync(negative.query);
const git = spawnSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
if (git.status !== 0) throw new Error('Source baseline unavailable.');
const result = {
  capturedAt: new Date().toISOString(),
  method: 'Synthetic feasibility diagnostic; cases fixed before the first pilot search; no representative-sample or end-to-end agent claim.',
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model },
  package: { version: JSON.parse(readFileSync(join(packageDir, 'package.json'))).version, cliSha256: sha256(cli) },
  source: { commit: git.stdout.trim(), staticEmbedderSha256: sha256(source) },
  casesSha256: sha256(fileURLToPath(new URL('./queries.json', import.meta.url))),
  queryTableHashes,
  telemetryDisabled: true,
  observations,
  negation: {
    positiveTokens: tokenize(positive.query), negativeTokens: tokenize(negative.query),
    vectorsExactlyEqual: positiveVector.every((value, index) => value === negativeVector[index]),
    rankedIdsExactlyEqual: JSON.stringify(positive.ids) === JSON.stringify(negative.ids),
  },
  warmEmbedding: {
    queries: warmQueries, tableLoadMs, warmupQueries: 1000, measuredQueries: 30000,
    batchSize: 1000, batchCount: 30, medianMicrosecondsPerQuery: median(warmBatchMicrosecondsPerQuery),
    batchMicrosecondsPerQuery: warmBatchMicrosecondsPerQuery, checksum,
    boundary: 'Source embedSync only, same process, tables resident, JIT warmed; not CLI or end-to-end retrieval latency.',
  },
};
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output: outputPath, cases: observations.length, negation: result.negation, warmEmbeddingMedianUs: result.warmEmbedding.medianMicrosecondsPerQuery }));
