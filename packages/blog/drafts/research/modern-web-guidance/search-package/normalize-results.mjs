import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const [inputArg, outputArg] = process.argv.slice(2);
if (!outputArg) throw new Error('Usage: node normalize-results.mjs /private-receipts /normalized-output');
const input = resolve(inputArg), output = resolve(outputArg); mkdirSync(output, { recursive: true });
const summaries = [];
for (const name of ['development-01','validation-01','native-development-01','native-validation-01','rerank-development-01','rerank-validation-01']) {
 const bytes = readFileSync(join(input, name + '.json')), raw = JSON.parse(bytes);
 // Explicit projection: do not export source bodies, HTML or unrelated raw capture fields.
 const rows = raw.results.map(row => ({ id: row.id, article: row.article ?? null, form: row.form, knownBlocks: row.knownBlocks ?? null,
  conditions: Object.fromEntries(Object.entries(row.conditions).map(([method, r]) => [method, {
   articleAt1: r.knownArticleAt1 ?? null, articleAt3: r.knownArticleAt3 ?? null, jointBlock: r.knownArticleAt3AndKnownBlockShown ?? null,
   rank: r.knownArticleRankThrough5 ?? r.knownArticleRank ?? null,
   articles: r.articles.map(a => ({ article: a.article, score: a.score, matches: a.matches, sections: a.sections })),
   rankingDigests: r.rankingDigests ?? r.fullRankingDigest, timing: r.timing ?? r.totalMs, pools: r.pools,
  }])) }));
 const summary = Object.fromEntries(Object.keys(rows[0].conditions).map(method => [method, Object.fromEntries(['topic','recollection','typo','negative'].map(form => {
  const subset = rows.filter(row => form === 'negative' ? !row.article : row.form === form);
  return [form, { n: subset.length, articleAt3: subset.filter(row => row.conditions[method].articleAt3 === true).length,
   jointBlock: method === 'raw' || method === 'prepared' ? null : subset.filter(row => row.conditions[method].jointBlock === true).length,
   returned: subset.filter(row => row.conditions[method].articles.length).length }];
 }))]));
 writeFileSync(join(output, name + '.json'), JSON.stringify({ sourceSha256: createHash('sha256').update(bytes).digest('hex'), split: raw.split, completedAt: raw.completedAt, summary, rows }, null, 2) + '\n');
 summaries.push({ name, summary });
}
writeFileSync(join(output, 'summary.json'), JSON.stringify(summaries, null, 2) + '\n');
