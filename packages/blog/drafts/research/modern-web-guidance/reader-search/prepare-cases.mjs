import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

if (process.argv.length !== 4) throw new Error('Usage: node prepare-cases.mjs /corpus /fresh-public-case-file');
const [corpusFile, output] = process.argv.slice(2).map(value => resolve(value));
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const intents = JSON.parse(readFileSync(new URL('./intents.json', import.meta.url), 'utf8'));
assert.equal(intents.intents.length, 46);
assert.deepEqual(intents.intents.map(row => row.article).sort(), corpus.articles.map(row => row.slug).sort());
const sha = value => createHash('sha256').update(value).digest('hex');
const development = new Set([...intents.intents].sort((a, b) => sha('reader-search-20261114:' + a.article).localeCompare(sha('reader-search-20261114:' + b.article))).slice(0, 14).map(row => row.article));
const wrappers = [topic => `Which article talks about ${topic}?`, topic => `Find the post about ${topic}.`, topic => `In which article did I write about ${topic}?`, topic => `Where did I discuss ${topic}?`, topic => `There was something about ${topic}. Which post was that?`, topic => `I can't remember the title, but it mentioned ${topic}.`, topic => `Which piece explained ${topic}?`, topic => `I am trying to find that write-up on ${topic}.`];
const cases = [];
for (const [index, intent] of intents.intents.entries()) {
  const article = corpus.articles.find(row => row.slug === intent.article);
  const block = article.blocks.find(row => !/^h[1-6]$/.test(row.kind) && row.text.toLocaleLowerCase('en').includes(intent.knownPattern.toLocaleLowerCase('en')));
  assert(block, `No known source block: ${intent.article}: ${intent.knownPattern}`);
  for (const [form, query] of [['topic', intent.topic], ['reader', wrappers[index % wrappers.length](intent.topic)]]) {
    cases.push({ id: `R${String(index + 1).padStart(2, '0')}-${form}`, article: intent.article, form, split: development.has(intent.article) ? 'development' : 'validation', query, knownBlocks: [block.id], sourceUrl: article.url + (block.anchor ? '#' + encodeURIComponent(block.anchor) : '') });
  }
}
const recollections = JSON.parse(readFileSync(new URL('./recollections.json', import.meta.url), 'utf8'));
for (const [i, row] of recollections.cases.entries()) {
  const original = cases.find(candidate => candidate.article === row.article);
  assert(original, row.article);
  cases.push({ id: 'V' + String(i + 1).padStart(2, '0'), article: row.article, form: 'recollection', split: original.split, query: row.query, knownBlocks: original.knownBlocks, sourceUrl: original.sourceUrl });
}
for (const [i, query] of intents.expectedNoKnownAnswer.entries()) cases.push({ id: 'N' + String(i + 1).padStart(2, '0'), article: null, form: 'no-known-answer', split: i < 4 ? 'development' : 'validation', query, knownBlocks: [] });
writeFileSync(output, JSON.stringify({ provenance: intents.provenance, queryForms: '92 topic/framing probes (eight fixed framing templates, including four not recognized by the normalizer); 12 separately authored recollections; ten prompts with no known answer label. Report forms separately.', splitMethod: '14 development and 32 validation articles chosen by sorted SHA256 of reader-search-20261114 plus article slug; all forms of an article stay together. Validation is a reserved engineering check, not independent unseen-reader research.', cases }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ cases: cases.length, sourceTopics: 46, developmentArticleTopics: development.size, validationArticleTopics: 32 }));
