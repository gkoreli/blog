import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const [distArg, packageArg, modelArg, outputArg] = process.argv.slice(2);
if (!outputArg) throw new Error('Usage: node evaluate-package.mjs /built-site /search-package /model /fresh-output.json');
const site = resolve(distArg), packageRoot = resolve(packageArg), output = resolve(outputArg);
if (existsSync(output) || existsSync(output + '.started.json')) throw new Error('Refusing to overwrite a package attempt.');
const manifest = JSON.parse(readFileSync(join(site, 'search-manifest.json')));
const serialized = readFileSync(join(site, manifest.index), 'utf8'), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const labels = JSON.parse(readFileSync(new URL('./package-labels.json', import.meta.url)));
if (hash(serialized) !== labels.indexSha256) throw new Error('Package corpus does not match the fixed label bridge.');
const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url))).cases;
const { createSearch } = await import(pathToFileURL(join(packageRoot, 'dist/index.js')));
const { createLocalE5 } = await import(pathToFileURL(join(packageRoot, 'dist/e5-node.js')));
const startedAt = new Date().toISOString();
writeFileSync(output + '.started.json', JSON.stringify({ startedAt, indexSha256: labels.indexSha256, caseSha256: hash(JSON.stringify(cases)), packageEntrySha256: hash(readFileSync(join(packageRoot, 'dist/search.js'))) }, null, 2), { flag: 'wx' });
const initialized = performance.now(), encoder = await createLocalE5(resolve(modelArg));
const search = await createSearch(serialized, { encoder, loadVectors: async () => readFileSync(join(site, manifest.vectors)) });
const initializationMs = performance.now() - initialized;
const results = [];
for (const row of cases) {
 const bridge = labels.cases.find(item => item.id === row.id); if (!bridge) throw new Error('Unmapped case.');
 const known = new Set(bridge.targets.flatMap(target => target.passages)); const conditions = {};
 for (const mode of ['words', 'related']) {
  const started = performance.now(), result = await search.search(row.query, { mode });
  const rank = row.article ? result.articles.findIndex(item => item.article.id === row.article) : -1;
  conditions[mode] = { milliseconds: performance.now() - started, articleAt3: rank >= 0 && rank < 3, articleRankThrough5: rank >= 0 ? rank + 1 : null,
   jointBlock: rank >= 0 && rank < 3 && result.articles[rank].passages.some(passage => known.has(passage.passage.id)),
   missingWords: result.missingWords, articles: result.articles.map(item => ({ article: item.article.id, passages: item.passages.map(passage => ({ id: passage.passage.id, url: passage.url, sourceTextSha256: hash(passage.passage.text) })) })) };
 }
 results.push({ id: row.id, article: row.article ?? null, form: row.form, split: row.split, conditions });
}
writeFileSync(output, JSON.stringify({ startedAt, completedAt: new Date().toISOString(), boundary: 'Current package corpus and Node E5 adapter; source-aware regression acceptance, not untouched reader validation or browser timing.', indexSha256: labels.indexSha256, indexId: search.id, initializationMs, results }, null, 2), { flag: 'wx' });
console.log({ cases: results.length, indexId: search.id, output });
