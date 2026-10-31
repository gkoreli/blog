import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeSearchEvidence, renderSearchEvidence } from '../.test-dist/search-evidence.js';

const fixture = () => JSON.parse(readFileSync(new URL('../../blog/scripts/examples/search-evidence.demo.json', import.meta.url), 'utf8'));

test('query/page rows produce bounded article hypotheses with reconciled selected counts', () => {
  const r = analyzeSearchEvidence(fixture());
  assert.equal(r.provenance, 'synthetic'); assert.equal(r.sourceAuthenticity, 'not-established');
  assert.deepEqual(r.totals, { selectedRowClicks: 15, selectedRowImpressions: 455, selectedRowCtr: 15 / 455 });
  assert.deepEqual(r.followUps.observedClickQueries, [0, 7]); assert.deepEqual(r.followUps.impressionsWithoutClicks, [1, 2]);
  assert.deepEqual(r.unmappedRowIndices, [3, 4, 5]); assert.deepEqual(r.rows.slice(3, 6).map(row => row.mapping), ['url-variant', 'other-page', 'other-origin']);
  assert.equal(r.articles[0].ctr, 5 / 300); assert.notEqual(r.articles[0].ctr, (0.05 + 0) / 2);
  assert.deepEqual(r.articlesWithoutReturnedRows.map(row => row.path), ['/unused']);
  const mappedClicks = r.articles.reduce((n, a) => n + a.clicks, 0), otherClicks = r.unmappedRowIndices.reduce((n, i) => n + r.rows[i].clicks, 0);
  assert.equal(mappedClicks + otherClicks, r.totals.selectedRowClicks);
  assert.deepEqual(r.urlMapping.map(row => [row.rows, row.clicks, row.impressions]), [[5, 7, 375], [1, 1, 10], [1, 3, 30], [1, 4, 40]]);
  assert.equal(r.urlMapping.reduce((n, row) => n + row.clicks, 0), r.totals.selectedRowClicks);
  assert.equal(r.urlMapping.reduce((n, row) => n + row.impressions, 0), r.totals.selectedRowImpressions);
  assert.equal(Object.hasOwn(r.totals, 'position'), false); assert.equal(r.scope.populationCompleteness, 'not-established');
});

test('ordered dimensions, native filters and missing rows retain their source meanings', () => {
  const f = fixture(), base = analyzeSearchEvidence(f); f.request.dimensions.reverse(); f.response.rows.forEach(row => row.keys.reverse());
  const reverse = analyzeSearchEvidence(f); assert.deepEqual(reverse.rows, base.rows); assert.deepEqual(reverse.scope.dimensions, ['query', 'page']);
  const empty = fixture(); delete empty.response.rows; const r = analyzeSearchEvidence(empty);
  assert.equal(r.rows.length, 0); assert.equal(r.totals.selectedRowCtr, null); assert.equal(r.articlesWithoutReturnedRows.length, 4);
  const all = fixture(); all.request.dataState = 'ALL'; all.request.dimensionFilterGroups = [{ groupType: 'and', filters: [{ dimension: 'query', operator: 'includingRegex', expression: '(?i)agent' }] }];
  const a = analyzeSearchEvidence(all); assert.equal(a.scope.freshness, 'may-include-preliminary'); assert.equal(a.scope.nativeMetadata.firstIncompleteDate, null);
  assert.deepEqual(a.scope.filters, all.request.dimensionFilterGroups); assert.deepEqual(a.rows, base.rows, 'Native filters are not re-executed as JS regex');
  all.request.startDate = '2026-03-07'; all.request.endDate = '2026-03-09';
  assert.deepEqual([analyzeSearchEvidence(all).scope.startDate, analyzeSearchEvidence(all).scope.endDate], ['2026-03-07', '2026-03-09']);
});

test('URL normalization cannot silently join a noncanonical returned URL to an article', () => {
  for (const page of ['https://example.test/a/../agent-fetchers', 'https://EXAMPLE.test/agent-fetchers', 'https://example.test:443/agent-fetchers', 'https://example.test/agent-fetchers#section']) {
    const f = fixture(); f.response.rows[0].keys[0] = page; const r = analyzeSearchEvidence(f);
    assert.equal(r.rows[0].articlePath, null, page); assert.equal(r.rows[0].mapping, 'url-variant');
  }
});

test('malformed, mixed and incomplete context cannot become plausible demand metrics', () => {
  const mutations = [
    f => { f.request.dimensions = ['page', 'page']; }, f => { f.request.dimensions = ['query']; },
    f => { f.request.aggregationType = 'byProperty'; }, f => { f.response.responseAggregationType = 'byProperty'; },
    f => { delete f.response.responseAggregationType; }, f => { f.request.type = null; }, f => { f.request.rowLimit = null; },
    f => { f.request.startDate = '2026-02-30'; }, f => { f.capturedAt = '2026-02-30T00:00:00Z'; },
    f => { f.request.endDate = '2026-09-01'; }, f => { f.request.rowLimit = 1; },
    f => { f.request.dimensionFilterGroups = [{ groupType: 'or', filters: [] }]; },
    f => { f.response.rows.push(structuredClone(f.response.rows[0])); },
    f => { f.response.rows[0].clicks = '5'; }, f => { f.response.rows[0].impressions = 1.5; },
    f => { f.response.rows[0].ctr = 0.7; }, f => { f.response.rows[0].position = NaN; },
    f => { f.response.rows[0].keys[0] = 'https://outside.example/article'; },
    f => { f.response.rows[0].keys[0] = 'https://user:password@example.test/agent-fetchers'; },
    f => { f.response.metadata = { first_incomplete_date: '2026-10-25' }; },
    f => { f.request.apiKey = 'private-canary'; }, f => { f.articles.push(f.articles[0]); },
    f => { f.articles[0].path = '/agent-fetchers?token=private'; },
    f => { f.response.rows[0].clicks = 0; f.response.rows[0].impressions = Number.MAX_SAFE_INTEGER; f.response.rows[0].ctr = 0; },
  ];
  for (const mutate of mutations) { const f = fixture(); mutate(f); assert.throws(() => analyzeSearchEvidence(f), /^Error: Search evidence rejected:/); }
  const huge = fixture(); huge.response.rows[0].keys[1] = 'x'.repeat(8 * 1024 * 1024); assert.throws(() => analyzeSearchEvidence(huge), /input-budget/);
});

test('briefs label synthetic and untrusted input, escape queries and preserve snapshots', () => {
  const f = fixture(); f.response.rows[0].keys[1] = '<script>alert(1)</script>|[open](https://bad.example)';
  const r = analyzeSearchEvidence(f); f.response.rows[0].clicks = 999; f.articles[0].title = 'changed';
  assert.equal(r.rows[0].clicks, 5); assert.equal(r.articles[0].title, 'Agent fetcher field notes');
  const markdown = renderSearchEvidence(r); assert.ok(markdown.startsWith('# Synthetic')); assert.equal(markdown.includes('<script>'), false);
  assert.equal(markdown.includes('[open](https://bad.example)'), false); assert.ok(markdown.includes('total demand is unknown') || markdown.includes('their demand is unknown'));
});
