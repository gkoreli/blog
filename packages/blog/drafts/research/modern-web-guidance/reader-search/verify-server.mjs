// Product integration check against existing frozen rankings; not new relevance data.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { request } from 'node:http';

if (process.argv.length !== 5) throw new Error('Usage: node verify-server.mjs http://127.0.0.1:port /local-run-directory /new-public-receipt');
const base = new URL(process.argv[2]); assert.equal(base.hostname, '127.0.0.1');
const local = resolve(process.argv[3]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8')).cases;
const expected = new Map(['development', 'validation'].flatMap(split => JSON.parse(readFileSync(local + '/hierarchy-' + split + '-01.json', 'utf8')).results).map(row => [row.id, row]));
const startedAt = new Date().toISOString(); const rows = [];
const output = resolve(process.argv[4]);
writeFileSync(output + '.started.json', JSON.stringify({ startedAt, cases: cases.length, purpose: 'Agreement with frozen rankings; no new relevance cases' }, null, 2) + '\n', { flag: 'wx' });
for (const query of cases) for (const [variant, focus] of [['raw', 'literal'], ['focus', 'topic']]) for (const method of ['keyword', 'semantic', 'hybrid']) {
  const url = new URL('/api/search', base); url.search = new URLSearchParams({ q: query.query, method, focus });
  const response = await fetch(url); assert.equal(response.status, 200, query.id);
  const result = await response.json(); const frozen = expected.get(query.id).conditions[`hierarchy-${variant}-${method}`];
  assert.equal(result.searchText, frozen.searchText, query.id);
  const ranks = articles => articles.map(article => ({ article: article.article, units: article.matches.map(unit => unit.id) }));
  assert.deepEqual(ranks(result.articles), ranks(frozen.articles), `${query.id}/${variant}/${method}`);
  rows.push({ id: query.id, variant, method, rankingDigest: sha(JSON.stringify(ranks(result.articles))), agrees: true });
}
writeFileSync(output + '.rankings.json', JSON.stringify({ completedAt: new Date().toISOString(), rows }, null, 2) + '\n', { flag: 'wx' });
const contracts = [];
for (const [name, path, options, status] of [
  ['unknown-option', '/api/search?q=icons&method=invalid', {}, 400],
  ['character-limit', '/api/search?q=' + 'x'.repeat(4097), {}, 400],
  ['token-limit', '/api/search?q=' + encodeURIComponent('model '.repeat(600)), {}, 400],
  ['method', '/', { method: 'POST' }, 405],
  ['origin', '/', { headers: { Origin: 'https://example.com' } }, 403],
  ['host', '/', { headers: { Host: 'example.com' } }, 403],
  ['missing-route', '/absent', {}, 404],
]) {
  // node: http sends the explicit Host header. Node 24 fetch silently replaces it.
  const actual = await new Promise((resolve, reject) => {
    const req = request(new URL(path, base), options, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(actual, status, name);
  contracts.push({ name, status });
}
const defaultUrl = new URL('/api/search', base); defaultUrl.search = new URLSearchParams({ q: 'Find the post about animated icons for Svelte 5?' });
const defaultResult = await (await fetch(defaultUrl)).json(); assert.equal(defaultResult.focus, 'literal'); assert.equal(defaultResult.changed, false);
const htmlUrl = new URL('/', base); htmlUrl.search = new URLSearchParams({ q: '</textarea><script>alert(1)</script>' });
const html = await (await fetch(htmlUrl)).text(); assert(!html.includes('<script')); assert(html.includes('&lt;/textarea&gt;'));
writeFileSync(output, JSON.stringify({ startedAt, completedAt: new Date().toISOString(), boundary: 'Integration agreement with the existing 114 cases in six conditions. This adds no independent relevance examples or latency benchmark.', requests: rows.length, agrees: rows.every(row => row.agrees), defaultWholeQuestion: true, htmlEscapedAndNoClientScripts: true, contracts, rows }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ requests: rows.length, agrees: true, contracts: contracts.length, defaultWholeQuestion: true }));
