import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';
import { readVectors } from '../passage-search/retrieval.mjs';
import { createReaderIndex } from './ranking.mjs';
import { focusQuery } from './query.mjs';

if (process.argv.length !== 11) throw new Error('Usage: node evaluate-reader.mjs /passages /passage-vectors /units /unit-vectors /runtime /model /cases development-or-validation /new-output');
const [passageFile, passageVectors, unitFile, unitVectors, runtime, model, caseFile] = process.argv.slice(2, 9).map(value => resolve(value));
const split = process.argv[9]; const output = resolve(process.argv[10]);
if (!['development', 'validation'].includes(split)) throw new Error('Choose one frozen split');
const sha = value => createHash('sha256').update(value).digest('hex');
const cases = JSON.parse(readFileSync(caseFile, 'utf8')).cases.filter(row => row.split === split);
writeFileSync(output + '.started.json', JSON.stringify({ startedAt: new Date().toISOString(), split, caseFileSha256: sha(readFileSync(caseFile)), cases: cases.length }, null, 2) + '\n', { flag: 'wx' });
const data = { passage: JSON.parse(readFileSync(passageFile, 'utf8')).passages, block: JSON.parse(readFileSync(unitFile, 'utf8')).passages };
const indexes = { passage: createReaderIndex(data.passage, readVectors(readFileSync(passageVectors))), block: createReaderIndex(data.block, readVectors(readFileSync(unitVectors))) };
const start = performance.now(); const encoder = await loadEncoder(runtime, model); const modelInitMs = performance.now() - start;
const results = [];
for (const query of cases) {
  const focused = focusQuery(query.query); const conditions = {};
  for (const [variant, text] of [['raw', focused.original], ['focus', focused.focused]]) {
    const before = performance.now(); const [vector] = await encoder.embed([modelConfig.queryPrefix + text]);
    const queryEncodingMs = performance.now() - before;
    for (const [indexName, index] of Object.entries(indexes)) {
      const ranked = index.rankings(text, vector);
      for (const [method, rows] of Object.entries(ranked.lists)) {
        const units = rows.slice(0, 10).map(index.metadata);
        const articles = index.group(rows).map(group => ({ article: group.article, score: group.score, matches: group.matches.map(unit => ({ id: unit.id, sourceBlocks: unit.sourceBlocks, score: unit.score })) }));
        const articleRank = articles.findIndex(row => row.article === query.article);
        const blockRank = units.findIndex(unit => unit.sourceBlocks.some(block => query.knownBlocks.includes(block)));
        conditions[`${indexName}-${variant}-${method}`] = { searchText: text, queryEncodingMs, timing: ranked.timing,
          fullRankingDigest: sha(JSON.stringify(rows.map(row => [row.id, row.score]))), rankedUnits: rows.length,
          missingLiteralTerms: index.missingTerms(text), units, articles,
          knownArticleAt1: articleRank === 0, knownArticleAt3: articleRank >= 0 && articleRank < 3,
          knownArticleRankThrough5: articleRank < 0 ? null : articleRank + 1, knownBlockRankThrough10: blockRank < 0 ? null : blockRank + 1 };
      }
    }
  }
  results.push({ id: query.id, article: query.article, form: query.form, knownBlocks: query.knownBlocks, conditions });
}
const inputs = { passageFile, passageVectors, unitFile, unitVectors, caseFile };
writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), split, model: modelConfig, modelInitMs, inputHashes: Object.fromEntries(Object.entries(inputs).map(([key, path]) => [key, sha(readFileSync(path))])), results }, null, 2) + '\n', { flag: 'wx' });
await encoder.dispose(); console.log(JSON.stringify({ completed: true, split, cases: results.length, output }));
