import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 7) throw new Error('Usage: node freeze-reader.mjs /corpus /units /unit-index-receipt /live-verification /live-capture-receipt');
const [corpusFile, unitFile, unitReceiptFile, liveFile, liveReceiptFile] = process.argv.slice(2).map(value => resolve(value));
const root = dirname(fileURLToPath(import.meta.url)); const sha = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const corpus = read(corpusFile); const units = read(unitFile); const build = read(unitReceiptFile); const live = read(liveFile); const capture = read(liveReceiptFile);
const cases = read(join(root, 'cases.json')).cases;
assert.equal(cases.length, 114); assert.equal(units.passages.length, 3980); assert.equal(build.cachedBatches, 0);
assert.equal(units.corpusSha256, sha(readFileSync(corpusFile))); assert.equal(build.passagesSha256, sha(readFileSync(unitFile)));
assert.equal(live.articles, 46); assert.equal(capture.results.length, 46); assert(capture.results.every(row => row.status === 200));
const save = (file, value) => writeFileSync(join(root, file), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
save('unit-manifest.json', { model: units.model, sourceCommit: corpus.sourceCommit, corpusSha256: units.corpusSha256, unitFileSha256: sha(readFileSync(unitFile)), vectorSha256: build.vectorSha256, vectorBytes: build.vectorBytes, coveredBodyNonWhitespaceCharacters: units.coveredBodyNonWhitespaceCharacters, splitBlocks: units.splitBlocks, maxInputTokens: Math.max(...units.passages.map(row => row.tokenCount)), units: units.passages.map(({ text, searchText, embeddingText, ...unit }) => ({ ...unit, textSha256: sha(text), searchTextSha256: sha(searchText) })) });
save('live-coverage.json', { capturedAt: capture.capturedAt, retries: capture.retries, concurrency: capture.concurrency, articleResponses: capture.results.map(({ elapsedMs, ...row }) => row), sourceCommit: live.sourceCommit, sourceBlocks: live.sourceBlocks, containedBlocks: live.containedBlocks, articlesWithMissingBlocks: live.articlesWithMissingBlocks, missingHeadingAnchors: live.missingHeadingAnchors, literalTopicMatches: live.literalTopicMatches, textComparisons: 'Whitespace-normalized eligible source blocks searched in captured article text. Mismatches retained; formatting differences do not prove missing content.', fullLocalVerificationSha256: sha(readFileSync(liveFile)) });
const files = ['protocol.md', 'intents.json', 'recollections.json', 'cases.json', 'query.mjs', 'navigation.mjs', 'ranking.mjs', 'prepare-cases.mjs', 'prepare-units.mjs', 'capture-live.mjs', 'verify-live.mjs', 'evaluate-reader.mjs', 'reader.test.mjs', 'freeze-reader.mjs', 'unit-manifest.json', 'live-coverage.json'];
save('input-freeze.json', { frozenAt: new Date().toISOString(), beforeNewReaderRankings: true,
  files: Object.fromEntries(files.map(file => [file, sha(readFileSync(join(root, file)))])),
  sourceInputs: { corpusSha256: sha(readFileSync(corpusFile)), unitFileSha256: sha(readFileSync(unitFile)), unitIndexReceiptSha256: sha(readFileSync(unitReceiptFile)), liveVerificationSha256: sha(readFileSync(liveFile)), liveCaptureReceiptSha256: sha(readFileSync(liveReceiptFile)), originalModelFreezeSha256: sha(readFileSync(join(root, '../passage-search/input-freeze.json'))) },
  counts: { articles: 46, originalPassages: 866, sourceBlockUnits: 3980, pairedProbes: 92, recollections: 12, noKnownAnswer: 10, totalCases: cases.length, developmentCases: cases.filter(row => row.split === 'development').length, validationCases: cases.filter(row => row.split === 'validation').length },
  build: { passages: build.passages, vectorBytes: build.vectorBytes, vectorSha256: build.vectorSha256, modelInitMs: build.modelInitMs, totalBuildMs: build.totalBuildMs, batchSize: build.batchSize, cachedBatches: build.cachedBatches, batches: build.batches.length, environment: build.environment },
  boundary: 'Initial engineering inputs. Any development amendment must preserve this snapshot and identify the code used before validation; UI/report files are not frozen here.' });
console.log(JSON.stringify({ frozen: true, cases: cases.length, units: units.passages.length }));
