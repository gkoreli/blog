// Usage: node reproduce.mjs /absolute/package /absolute/source /absolute/output-dir
// Runs one measured process. Invoke three times sequentially, never through npm install.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import assert from 'node:assert/strict';
import { loadReference, permutation, rankDense, dot, median, tokens } from './reference.mjs';

assert.equal(process.argv.length, 5, 'Provide package, source and fresh output directory');
const [packageDir, sourceDir, outputDir] = process.argv.slice(2).map(value => resolve(value));
mkdirSync(outputDir); // Refuse accidental replacement of a measured run.
process.env.DISABLE_TELEMETRY = '1';
process.env.ENABLE_FILE_LOGGING = 'false';
const config = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
const skill = join(packageDir, 'skills/modern-web-guidance');
const gen = join(skill, 'gen');
const rag = join(sourceDir, 'src/rag');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = path => sha(readFileSync(path));
const identity = ['query-words.json', 'query-words.i8', 'query-words.scale.f32'].map(file => {
  const source = hashFile(join(rag, 'gen', file));
  const packaged = hashFile(join(gen, file));
  assert.equal(source, packaged, `Source/package mismatch: ${file}`);
  return { file, sha256: source };
});
const startedAt = new Date().toISOString();
const importStart = performance.now();
const { StaticEmbedder } = await import(pathToFileURL(join(rag, 'static-embedder.ts')));
const importMs = performance.now() - importStart;
const embedder = StaticEmbedder.getInstance();
const initStart = performance.now();
embedder.init();
const tableInitMs = performance.now() - initStart;
const firstStart = performance.now();
let checksum = embedder.embedSync(config.shortQueries[0])[0];
const firstEmbeddingMs = performance.now() - firstStart;
const reference = loadReference(gen);

for (let i = 0; i < config.warmupCalls; i++) checksum += embedder.embedSync(config.shortQueries[i % config.shortQueries.length])[0];
function batches(queries) {
  const measurements = [];
  for (let batch = 0; batch < config.batches; batch++) {
    const before = performance.now();
    for (let i = 0; i < config.callsPerBatch; i++) checksum += embedder.embedSync(queries[i % queries.length])[0];
    measurements.push((performance.now() - before) * 1000 / config.callsPerBatch);
  }
  return { batchMeanMicroseconds: measurements, medianBatchMeanMicroseconds: median(measurements) };
}
const shortTiming = batches(config.shortQueries);
const lengthTiming = config.lengths.map(length => {
  // Fixed vocabulary order is byte-pinned; choose distinct whole known tokens.
  const query = reference.words.filter(word => tokens(word).length === 1).slice(0, length).join(' ');
  assert.equal(reference.encode(query).length, length);
  for (let i = 0; i < config.warmupCalls; i++) checksum += embedder.embedSync(query)[0];
  return { tokens: length, query, ...batches([query]) };
});

const { loadVectors } = await import(pathToFileURL(join(rag, 'search.ts')));
const { buildBm25Index, rankBm25, reciprocalRankFusion } = await import(pathToFileURL(join(rag, 'bm25.ts')));
const chunks = loadVectors(skill);
const guides = new Set(chunks.map(row => row.id));
const bm25 = buildBm25Index(chunks.map(row => ({ id: row.id, text: `${row.description}\n\n${row.chunkContent}` })));
const shuffled = permutation(reference.words.length, config.permutationSeed);
const datasetDir = join(rag, 'benchmarks/data');
function jsonl(name) {
  return readFileSync(join(datasetDir, name), 'utf8').trim().split('\n').map(line => JSON.parse(line));
}
const agent = jsonl('agent-queries.jsonl').filter(row => row.split === 'test');
const oos = jsonl('oos-queries.jsonl');
const qrels = new Map(jsonl('agent-qrels.jsonl').map(row => [row.qid, row]));
const datasetHashes = ['agent-queries.jsonl', 'agent-qrels.jsonl', 'oos-queries.jsonl', 'oos-qrels.jsonl'].map(file => ({ file, sha256: hashFile(join(datasetDir, file)) }));

let vectorsCompared = 0;
let maxCoordinateDifference = 0;
function checkVector(query) {
  const original = embedder.embedSync(query);
  const replica = reference.embed(query);
  assert.equal(original.length, replica.length);
  for (let i = 0; i < original.length; i++) maxCoordinateDifference = Math.max(maxCoordinateDifference, Math.abs(original[i] - replica[i]));
  assert.deepEqual([...replica], original, `Vector reproduction mismatch: ${query}`);
  vectorsCompared++;
  return replica;
}
function rankings(query, vector) {
  const dense = rankDense(vector, chunks);
  const lexical = rankBm25(bm25, query);
  const permuted = rankDense(reference.embed(query, shuffled), chunks);
  const denseIds = dense[0]?.score >= 0.30 ? dense.map(row => row.id) : [];
  const permutedIds = permuted[0]?.score >= 0.30 ? permuted.map(row => row.id) : [];
  const hybrid = reciprocalRankFusion([denseIds, lexical.map(row => row.id)]).map(row => row.id);
  return {
    dense: denseIds.slice(0, config.k), bm25: lexical.slice(0, config.k).map(row => row.id),
    hybrid: hybrid.slice(0, config.k), permutedDense: permutedIds.slice(0, config.k),
  };
}
const controls = config.controls.map(item => {
  const left = checkVector(item.left); const right = checkVector(item.right);
  return {
    ...item, leftTokens: tokens(item.left), rightTokens: tokens(item.right),
    leftEncoded: reference.encode(item.left), rightEncoded: reference.encode(item.right),
    vectorsExactlyEqual: left.every((value, i) => value === right[i]),
    cosine: dot(left, right), leftNorm: Math.sqrt(dot(left, left)), rightNorm: Math.sqrt(dot(right, right)),
    hybridLeft: rankings(item.left, left).hybrid, hybridRight: rankings(item.right, right).hybrid,
  };
});
const qualityRows = [...agent.map(row => ({ ...row, dataset: 'agent-test' })), ...oos.map(row => ({ ...row, dataset: 'oos' }))].map(row => {
  const judged = qrels.get(row.qid);
  const direct = judged?.grades.filter(item => item.grade === 2).map(item => item.id) ?? [];
  return {
    qid: row.qid, query: row.query, dataset: row.dataset, stratum: row.stratum,
    scope: row.dataset === 'oos' ? 'out_of_domain' : judged?.scope,
    grade2Guides: direct, absentGrade2Guides: direct.filter(id => !guides.has(id)),
    judgedGuideIds: judged?.grades.map(item => item.id) ?? [],
    rankings: rankings(row.query, checkVector(row.query)),
  };
});
const answerable = qualityRows.filter(row => row.dataset === 'agent-test' && row.scope === 'in_domain' && row.grade2Guides.length);
const summaries = {};
for (const method of ['dense', 'bm25', 'hybrid', 'permutedDense']) {
  const scopeRows = qualityRows.filter(row => row.dataset === 'oos');
  const returned = answerable.flatMap(row => row.rankings[method].map(id => ({ id, judged: row.judgedGuideIds.includes(id) })));
  summaries[method] = {
    grade2HitAt10: answerable.filter(row => row.rankings[method].some(id => row.grade2Guides.includes(id))).length,
    answerableDenominator: answerable.length,
    unjudgedReturned: returned.filter(item => !item.judged).length, returnedCandidates: returned.length,
    oosAdmitted: scopeRows.filter(row => row.rankings[method].length).length, oosDenominator: scopeRows.length,
    oosByStratum: Object.fromEntries(['near', 'far'].map(stratum => {
      const rows = scopeRows.filter(row => row.stratum === stratum);
      return [stratum, { admitted: rows.filter(row => row.rankings[method].length).length, denominator: rows.length }];
    })),
  };
}

const cliCalls = [];
for (let i = 0; i < 12; i++) {
  const query = config.shortQueries[i % config.shortQueries.length];
  const before = performance.now();
  const child = spawnSync(process.execPath, [join(skill, 'modern-web.mjs'), 'search', query], { env: process.env, encoding: 'utf8', timeout: 30000 });
  const wallMs = performance.now() - before;
  assert.equal(child.status, 0, child.stderr);
  const ids = JSON.parse(child.stdout).map(row => row.id);
  const recreated = rankings(query, checkVector(query)).hybrid;
  assert.deepEqual(ids, recreated, `CLI ranking mismatch: ${query}`);
  cliCalls.push({ query, wallMs, ids });
}
const qualityText = JSON.stringify(qualityRows, null, 2) + '\n';
writeFileSync(join(outputDir, 'quality.json'), qualityText);
const git = spawnSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(git.status, 0);
const result = {
  startedAt, finishedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model, osRelease: os.release(), logicalCpuCount: os.cpus().length },
  sourceCommit: git.stdout.trim(), packageVersion: JSON.parse(readFileSync(join(packageDir, 'package.json'))).version,
  configSha256: hashFile(new URL('./cases.json', import.meta.url)), identity, datasetHashes,
  vocabulary: reference.words.length, dimensions: 256, chunks: chunks.length, guides: guides.size,
  reproduction: { vectorsCompared, maxCoordinateDifference, cliRankingCallsMatched: cliCalls.length, checksum },
  timing: { importMs, tableInitMs, firstEmbeddingMs, short: shortTiming, length: lengthTiming, cliCalls, medianCliMs: median(cliCalls.map(row => row.wallMs)), boundary: 'Fresh subprocess with potentially warm filesystem caches; warm embed excludes initialization, ranking and CLI.' },
  controls,
  quality: { metric: 'Any upstream grade-2 guide at K=10, including orientation guides; not upstream leaf-only Hit@K.', agentTestQueries: agent.length, answerable: answerable.length, excluded: qualityRows.filter(row => row.dataset === 'agent-test' && !answerable.includes(row)).map(row => ({ qid: row.qid, scope: row.scope, grade2Count: row.grade2Guides.length })), summaries, perQuerySha256: sha(qualityText) },
  telemetryDisabled: true,
};
writeFileSync(join(outputDir, 'measurement.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ outputDir, embeddingUs: shortTiming.medianBatchMeanMicroseconds, cliMs: result.timing.medianCliMs, vectorsCompared, summaries }));
