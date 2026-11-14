import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadEncoder, modelConfig } from '../passage-search/model.mjs';
import { readVectors } from '../passage-search/retrieval.mjs';
import { createReaderIndex } from './ranking.mjs';
import { focusQuery } from './query.mjs';
import { paragraphLink } from './navigation.mjs';
import { rankHierarchy } from './hierarchy.mjs';

if (process.argv.length !== 12) throw new Error('Usage: node evaluate-hierarchy.mjs /passages /passage-vectors /units /unit-vectors /runtime /model /cases /live-verification development-or-validation /fresh-output');
const [passageFile, passageVectors, unitFile, unitVectors, runtime, model, caseFile, liveFile] = process.argv.slice(2, 10).map(value => resolve(value));
const split = process.argv[10]; const output = resolve(process.argv[11]);
if (!['development', 'validation'].includes(split)) throw new Error('Choose one fixed split');
const sha = value => createHash('sha256').update(value).digest('hex');
const cases = JSON.parse(readFileSync(caseFile, 'utf8')).cases.filter(row => row.split === split);
writeFileSync(output + '.started.json', JSON.stringify({ startedAt: new Date().toISOString(), split, caseFileSha256: sha(readFileSync(caseFile)), cases: cases.length }, null, 2) + '\n', { flag: 'wx' });
const passageIndex = createReaderIndex(JSON.parse(readFileSync(passageFile, 'utf8')).passages, readVectors(readFileSync(passageVectors)));
const blockIndex = createReaderIndex(JSON.parse(readFileSync(unitFile, 'utf8')).passages, readVectors(readFileSync(unitVectors)));
const live = new Map(JSON.parse(readFileSync(liveFile, 'utf8')).pages.map(page => [page.slug, page.visibleText]));
const encoder = await loadEncoder(runtime, model); const results = [];
for (const query of cases) {
  const focused = focusQuery(query.query); const conditions = {};
  for (const [variant, text] of [['raw', focused.original], ['focus', focused.focused]]) {
    const [vector] = await encoder.embed([modelConfig.queryPrefix + text]);
    for (const method of ['keyword', 'semantic', 'hybrid']) {
      const ranked = rankHierarchy(passageIndex, blockIndex, text, vector, method);
      const rank = ranked.articles.findIndex(article => article.article === query.article);
      const selected = ranked.articles.find(article => article.article === query.article);
      const knownBlockShown = !!selected?.matches.some(unit => unit.sourceBlocks.some(block => query.knownBlocks.includes(block)));
      const articles = ranked.articles.map(article => ({ article: article.article, articleScore: article.articleScore, matches: article.matches.map(unit => {
        const link = paragraphLink(unit, live.get(unit.article), text);
        return { id: unit.id, sourceBlocks: unit.sourceBlocks, score: unit.score, navigation: { label: link.label, urlSha256: sha(link.url), matchedTextSha256: link.verifiedText ? sha(link.verifiedText) : null } };
      }) }));
      conditions[`hierarchy-${variant}-${method}`] = { searchText: text, articles, missingLiteralTerms: ranked.missingLiteralTerms,
        knownArticleAt1: rank === 0, knownArticleAt3: rank >= 0 && rank < 3, knownArticleRankThrough5: rank < 0 ? null : rank + 1,
        knownBlockShownInTargetArticle: knownBlockShown, knownArticleAt3AndKnownBlockShown: rank >= 0 && rank < 3 && knownBlockShown };
    }
  }
  results.push({ id: query.id, article: query.article, form: query.form, knownBlocks: query.knownBlocks, conditions });
}
const paths = { passageFile, passageVectors, unitFile, unitVectors, caseFile, liveFile };
writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), split, model: modelConfig, inputHashes: Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, sha(readFileSync(path))])), results }, null, 2) + '\n', { flag: 'wx' });
await encoder.dispose(); console.log(JSON.stringify({ completed: true, split, cases: results.length, output }));
