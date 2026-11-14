import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { modelConfig } from './model.mjs';

if (process.argv.length !== 6) throw new Error('Usage: node freeze.mjs /corpus /passages /runtime /model');
const [corpusFile, passageFile, runtime, model] = process.argv.slice(2).map(value => resolve(value));
const root = dirname(fileURLToPath(import.meta.url));
const sha = input => createHash('sha256').update(input).digest('hex');
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const passages = JSON.parse(readFileSync(passageFile, 'utf8'));
const questions = JSON.parse(readFileSync(join(root, 'questions.json'), 'utf8'));
assert.equal(passages.corpusSha256, sha(readFileSync(corpusFile)));
assert.equal(corpus.articles.length, 46);
assert.equal(passages.passages.length, 866);
const queries = [];
for (const [groupIndex, group] of questions.groups.entries()) {
  const knownPassages = new Set();
  for (const block of group.knownBlocks) {
    const matching = passages.passages.filter(row => row.sourceBlocks.includes(block));
    assert.equal(matching.length, 1, `Known block must map to exactly one passage: ${block}`);
    assert.equal(matching[0].article, group.article);
    knownPassages.add(matching[0].id);
  }
  for (const [i, stratum] of ['short', 'question'].entries()) {
    queries.push({ id: 'Q' + String(groupIndex * 2 + i + 1).padStart(2, '0'), group: groupIndex + 1,
      query: group[stratum], stratum, article: group.article, knownBlocks: group.knownBlocks,
      knownPassages: [...knownPassages], answerSummary: group.answerSummary });
  }
}
for (const [i, query] of questions.expectedNoAnswer.entries()) queries.push({ id: 'N' + String(i + 1).padStart(2, '0'), group: null, query, stratum: 'expected-no-answer', article: null, knownBlocks: [], knownPassages: [] });
assert.equal(queries.length, 44);
const save = (file, data) => writeFileSync(join(root, file), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
save('queries.json', { provenance: questions.provenance, primaryMetric: 'knownAnswerAt3', queries });
save('corpus-manifest.json', {
  sourceCommit: corpus.sourceCommit, extraction: corpus.extraction, method: passages.method,
  corpusSha256: sha(readFileSync(corpusFile)), passageFileSha256: sha(readFileSync(passageFile)),
  eligibleNonWhitespaceCharacters: corpus.articles.reduce((sum, row) => sum + row.eligibleNonWhitespaceCharacters, 0),
  coveredBodyNonWhitespaceCharacters: passages.coveredBodyNonWhitespaceCharacters, splitBlocks: passages.splitBlocks,
  maxInputTokens: Math.max(...passages.passages.map(row => row.tokenCount)),
  articles: corpus.articles.map(({ blocks, description, tags, ...row }) => ({ ...row, blocks: blocks.length })),
  passages: passages.passages.map(({ text, searchText, embeddingText, ...row }) => ({ ...row, searchTextSha256: sha(searchText) })),
});
const files = [...readdirSync(root).filter(name => /\.(mjs|json|md)$/.test(name) && name !== 'input-freeze.json'), 'vendor/bm25.ts', 'vendor/LICENSE.upstream', 'vendor/README.md', 'runtime/package.json', 'runtime/package-lock.json'];
const describe = file => ({ sha256: sha(readFileSync(file)), bytes: statSync(file).size });
save('input-freeze.json', {
  frozenAt: new Date().toISOString(), beforeRetrievalRankings: true, model: modelConfig,
  corpusSha256: sha(readFileSync(corpusFile)), passageFileSha256: sha(readFileSync(passageFile)),
  files: Object.fromEntries(files.sort().map(file => [file, describe(join(root, file))])),
  runtimeLock: describe(join(runtime, 'package-lock.json')),
  modelFiles: Object.fromEntries(['config.json', 'tokenizer_config.json', 'tokenizer.json', 'onnx/model_quantized.onnx'].map(file => [file, describe(join(model, file))])),
  counts: { articles: corpus.articles.length, passages: passages.passages.length, answerableQuestions: 36, expectedNoAnswer: 8, articleGroups: questions.groups.length },
});
console.log(JSON.stringify({ frozen: true, articles: 46, passages: 866, queries: queries.length, output: root }));
