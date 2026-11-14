import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 5) throw new Error('Usage: node verify-inputs.mjs /corpus /passages /model');
const [corpusFile, passageFile, model] = process.argv.slice(2).map(value => resolve(value));
const sha = input => createHash('sha256').update(input).digest('hex');
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const freeze = read(new URL('./input-freeze.json', import.meta.url));
const manifest = read(new URL('./corpus-manifest.json', import.meta.url));
for (const [file, expected] of Object.entries(freeze.files)) assert.equal(sha(readFileSync(new URL('./' + file, import.meta.url))), expected.sha256, file);
for (const [file, expected] of Object.entries(freeze.modelFiles)) assert.equal(sha(readFileSync(resolve(model, file))), expected.sha256, file);
const corpus = read(corpusFile); const passages = read(passageFile);
assert.equal(corpus.articles.length, manifest.articles.length);
assert.equal(passages.passages.length, manifest.passages.length);
for (const [i, article] of corpus.articles.entries()) {
  const expected = manifest.articles[i];
  for (const key of ['slug', 'sourceFile', 'sourceSha256', 'renderedHtmlSha256', 'eligibleNonWhitespaceCharacters']) assert.equal(article[key], expected[key], key);
}
for (const [i, passage] of passages.passages.entries()) {
  const expected = manifest.passages[i];
  for (const key of ['id', 'article', 'title', 'heading', 'url', 'tokenCount']) assert.equal(passage[key], expected[key], key);
  assert.deepEqual(passage.sourceBlocks, expected.sourceBlocks);
  assert.equal(sha(passage.searchText), expected.searchTextSha256);
}
console.log(JSON.stringify({ verified: true, articles: corpus.articles.length, passages: passages.passages.length, exactHistoricalCorpusFile: sha(readFileSync(corpusFile)) === freeze.corpusSha256, exactHistoricalPassageFile: sha(readFileSync(passageFile)) === freeze.passageFileSha256 }));
