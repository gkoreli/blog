// Normalize completed runs without reranking, replacing labels or discarding rows.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { focusQuery as originalFocus } from './query.mjs';
import { focusQuery } from './query-v2.mjs';
import { paragraphLink } from './navigation.mjs';

if (process.argv.length !== 3) throw new Error('Usage: node analyze-results.mjs /local-reader-run-directory');
const local = resolve(process.argv[2]); const root = dirname(fileURLToPath(import.meta.url));
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const save = (name, value, pretty = true) => writeFileSync(join(root, name), JSON.stringify(value, null, pretty ? 2 : undefined) + '\n', { flag: 'wx' });
const initial = read(join(root, 'input-freeze.json')); const amendment = read(join(root, 'amendment-01.json'));
for (const freeze of [initial, amendment]) for (const [file, expected] of Object.entries(freeze.files)) assert.equal(sha(readFileSync(join(root, file))), expected, file);
const cases = read(join(root, 'cases.json')).cases; const byCase = new Map(cases.map(row => [row.id, row]));
assert.equal(byCase.size, 114);
for (const row of cases) assert.deepEqual(focusQuery(row.query), originalFocus(row.query), row.id);
const config = read(join(local, 'runtime-config.json'));
const units = read(config.blockFile).passages; const passages = read(config.passageFile).passages;
const allUnits = new Map([...units, ...passages].map(row => [row.id, row]));
assert.equal(sha(readFileSync(config.blockFile)), initial.sourceInputs.unitFileSha256);
assert.equal(sha(readFileSync(config.liveFile)), initial.sourceInputs.liveVerificationSha256);
const sourceHashes = Object.fromEntries(Object.entries(config).filter(([key]) => ['passageFile', 'passageVectors', 'blockFile', 'blockVectors', 'liveFile'].includes(key)).map(([key, path]) => [key === 'blockFile' ? 'unitFile' : key === 'blockVectors' ? 'unitVectors' : key, sha(readFileSync(path))]));
sourceHashes.caseFile = sha(readFileSync(join(root, 'cases.json')));
mkdirSync(join(root, 'results'), { recursive: true });
const aggregate = rows => {
  const groups = {};
  for (const row of rows) for (const [condition, result] of Object.entries(row.conditions)) {
    const key = condition + '/' + row.form;
    const group = groups[key] ??= { cases: 0, articleAt1: 0, articleAt3: 0, returnedResults: 0, selectedBlockShownInTargetArticle: 0, articleAt3AndSelectedBlockShown: 0 };
    group.cases++; group.articleAt1 += result.knownArticleAt1; group.articleAt3 += result.knownArticleAt3;
    group.returnedResults += result.articles.length > 0;
    if (result.knownBlockShownInTargetArticle !== undefined) {
      group.selectedBlockShownInTargetArticle += result.knownBlockShownInTargetArticle;
      group.articleAt3AndSelectedBlockShown += result.knownArticleAt3AndKnownBlockShown;
    }
  }
  return groups;
};
const summaries = {}; const receipts = {}; const matrices = {}; const hierarchies = {};
for (const split of ['development', 'validation']) for (const kind of ['matrix', 'hierarchy']) {
  const file = kind === 'matrix' ? split + '-01.json' : 'hierarchy-' + split + '-01.json';
  const bytes = readFileSync(join(local, file)); const run = JSON.parse(bytes);
  const expected = cases.filter(row => row.split === split);
  assert.deepEqual(run.results.map(row => row.id), expected.map(row => row.id));
  for (const [key, value] of Object.entries(run.inputHashes)) assert.equal(value, sourceHashes[key], key);
  for (const row of run.results) {
    const query = byCase.get(row.id); assert.equal(row.article, query.article); assert.deepEqual(row.knownBlocks, query.knownBlocks);
    for (const [name, result] of Object.entries(row.conditions)) {
      const rank = result.articles.findIndex(article => article.article === row.article);
      assert.equal(result.knownArticleAt1, rank === 0); assert.equal(result.knownArticleAt3, rank >= 0 && rank < 3);
      assert.equal(result.knownArticleRankThrough5, rank < 0 ? null : rank + 1);
      assert.equal(result.searchText, name.includes('-focus-') ? focusQuery(query.query).focused : focusQuery(query.query).original);
      for (const article of result.articles) for (const unit of article.matches) {
        const source = allUnits.get(unit.id); assert(source); assert.equal(source.article, article.article);
        assert.deepEqual(source.sourceBlocks, unit.sourceBlocks); assert(Number.isFinite(unit.score));
      }
      if (kind === 'hierarchy') {
        const selected = result.articles.find(article => article.article === query.article);
        const shown = !!selected?.matches.some(unit => unit.sourceBlocks.some(block => query.knownBlocks.includes(block)));
        assert.equal(result.knownBlockShownInTargetArticle, shown);
        assert.equal(result.knownArticleAt3AndKnownBlockShown, rank >= 0 && rank < 3 && shown);
      }
    }
  }
  receipts[kind + '-' + split] = { rawReceiptSha256: sha(bytes), capturedAt: run.capturedAt, cases: run.results.length };
  summaries[kind + '-' + split] = aggregate(run.results);
  (kind === 'matrix' ? matrices : hierarchies)[split] = run;
  // All top-ten unit and top-five distinct-article ranks/scores remain. Repeated
  // heading/URL/block metadata resolve through the two published unit manifests.
  const normalized = { ...run, rawReceiptSha256: sha(bytes), normalization: 'Repeated unit metadata omitted; IDs resolve through unit-manifest.json and ../passage-search/corpus-manifest.json. All rows, conditions, scores, top-ten units and top-five articles retained.', results: run.results.map(row => ({ ...row, conditions: Object.fromEntries(Object.entries(row.conditions).map(([name, result]) => [name, { ...result,
    ...(result.units ? { units: result.units.map(({ id, score }) => ({ id, score })) } : {}),
    articles: result.articles.map(article => ({ ...article, matches: article.matches.map(({ sourceBlocks, ...unit }) => unit) })),
  }])) })) };
  save('results/' + kind + '-' + split + '.json', normalized, false);
}
for (const split of ['development', 'validation']) for (const row of hierarchies[split].results) {
  const other = matrices[split].results.find(candidate => candidate.id === row.id);
  for (const [name, result] of Object.entries(row.conditions)) assert.deepEqual(result.articles.map(article => article.article), other.conditions[name.replace('hierarchy-', 'passage-')].articles.map(article => article.article));
}
const flips = (rows, before, after, metric = 'knownArticleAt3') => ({
  before, after, metric,
  gains: rows.filter(row => row.article && !row.conditions[before][metric] && row.conditions[after][metric]).map(row => row.id),
  losses: rows.filter(row => row.article && row.conditions[before][metric] && !row.conditions[after][metric]).map(row => row.id),
});
const comparisons = [];
for (const method of ['keyword', 'semantic', 'hybrid']) {
  comparisons.push(flips(matrices.validation.results, `passage-raw-${method}`, `passage-focus-${method}`));
  for (const variant of ['raw', 'focus']) comparisons.push(flips(matrices.validation.results, `passage-${variant}-${method}`, `block-${variant}-${method}`));
}
for (const variant of ['raw', 'focus']) for (const method of ['semantic', 'hybrid']) comparisons.push(flips(matrices.validation.results, `passage-${variant}-keyword`, `passage-${variant}-${method}`));
const live = new Map(read(config.liveFile).pages.map(page => [page.slug, page.visibleText]));
const navigation = units.map(unit => {
  const link = paragraphLink(unit, live.get(unit.article));
  return { id: unit.id, kind: unit.kind, label: link.verifiedText && unit.kind !== 'p' ? 'Open matching text' : link.label, verifiedUniquePhrase: !!link.verifiedText, urlSha256: sha(link.url), phraseSha256: link.verifiedText ? sha(link.verifiedText) : null };
});
save('navigation-coverage.json', { capturedLiveTextSha256: initial.sourceInputs.liveVerificationSha256, query: 'Empty query; deterministic target-availability check for every unit, not a relevance or cross-browser test.', units: units.length, uniquePhrase: navigation.filter(row => row.verifiedUniquePhrase).length, fallback: navigation.filter(row => !row.verifiedUniquePhrase).length, rows: navigation });
save('results/summary.json', { analyzedAt: new Date().toISOString(), receipts, summaries, validationComparisons: comparisons,
  limitations: ['Source-aware agent-authored cases; article-level reserved split, not independent reader validation.', 'Paired topic/location forms are correlated.', 'Recollection block labels inherited a different article topic. Preserve rows; do not interpret their block counts as answer quality.', 'No-known-answer labels and missing words do not prove absence or calibrate refusal.', 'Optional expanded source context and UI repair follow validation and do not improve the frozen paragraph count.'],
  checks: { initialAndAmendmentFilesUnchanged: true, caseRowsAndInputHashesVerified: true, articleAndHierarchyBlockMetricsRecomputed: true, allHierarchyArticleOrdersEqualPassageCandidates: true, measuredQueriesEquivalentUnderFocusV2: cases.length } });
console.log(JSON.stringify({ rows: cases.length, navigation: { uniquePhrase: navigation.filter(row => row.verifiedUniquePhrase).length, fallback: navigation.filter(row => !row.verifiedUniquePhrase).length }, validation: summaries['hierarchy-validation'], comparisons }));
