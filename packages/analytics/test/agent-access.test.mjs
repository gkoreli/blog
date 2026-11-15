import test from 'node:test';
import assert from 'node:assert/strict';
import { queryAgentAccess, createAgentAccessReportHandler } from '../.test-dist/agent-access.js';
import { accessDayCount, consistentAgentAccessReport, selectAgentAccess, validAgentAccessCatalogue, agentAccessWindow } from '../.test-dist/agent-access-contract.js';
import { partitionPredicate } from '../.test-dist/partition.js';
import { readerGroupOf, READER_KINDS } from '../.test-dist/contracts.js';
import { ACCESS_CATALOGUE, ACCESS_NOW, accessFixture } from './fixtures/agent-access.mjs';
import { memoryReportCache } from './fixtures/reporting-store.mjs';

test('AI search and crawling belong to Agents with explicit roles and disjoint public groups', () => {
  for (const kind of ['ai-assistant', 'ai-search', 'ai-crawler', 'signed-agent']) assert.equal(readerGroupOf(kind), 'agents');
  for (const kind of ['search-crawler', 'seo-crawler', 'preview-or-feed']) assert.equal(readerGroupOf(kind), 'crawlers');
  const groups = ['browser', 'agents', 'crawlers', 'automation', 'unresolved'];
  for (const kind of READER_KINDS) assert.equal(groups.filter(group => readerGroupOf(kind) === group).length, 1);
  assert.match(partitionPredicate('agents').sql, /ai-search/);
  assert.doesNotMatch(partitionPredicate('crawlers').sql, /ai-crawler/);
});

test('retained source and projection reports agree without changing observations; stale facts fall back', async () => {
  const fixture = accessFixture();
  try {
    const original = fixture.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
    const source = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    assert.equal(consistentAgentAccessReport(source), true);
    assert.equal(source.total.views, 39);
    assert.equal(source.accounting.ownerExcludedViews, 2);
    assert.equal(source.accounting.referralExcludedViews, 1);
    assert.equal(source.accounting.otherViews, 4);
    assert.equal(source.total.unrecognizedTimeViews, 1);
    assert.equal(accessDayCount(source.total.dayMask), 9);
    assert.equal(source.history.filter(row => row.collection === '2026-11-13.1').reduce((total, row) => total + row.metrics.views, 0), 37);
    assert.equal(source.history.filter(row => row.classifier === '2026-11-06.1').reduce((total, row) => total + row.metrics.views, 0), 37);
    assert.equal(source.history.filter(row => row.collection === 'unrecognized').reduce((total, row) => total + row.metrics.views, 0), 1);
    assert.equal(source.history.filter(row => row.collection === null).reduce((total, row) => total + row.metrics.views, 0), 1);
    assert.equal(JSON.stringify(source).includes('private-canary'), false);
    fixture.project();
    const events = [];
    assert.deepEqual(await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, onCalculation: event => events.push(event) }), source);
    assert.deepEqual(events.map(event => event.readModel), ['projection']);
    fixture.sqlite.exec('DELETE FROM page_observation_report_facts WHERE observation_id=(SELECT MIN(id) FROM page_observations)');
    events.length = 0;
    assert.deepEqual(await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, onCalculation: event => events.push(event) }), source);
    assert.deepEqual(events.map(event => event.readModel), ['projection', 'source-fallback']);
    assert.deepEqual(fixture.sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(), original);
    assert(fixture.queries.every(query => /^WITH RECURSIVE/.test(query.sql)));
  } finally { fixture.sqlite.close(); }
});

test('article and client selections reuse the complete cube, preserve resource roles and union days', async () => {
  const fixture = accessFixture();
  try {
    const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const before = JSON.stringify(report), queries = fixture.queries.length;
    const selected = selectAgentAccess(report, { articleId: 'article-a', client: 'ChatGPT-User', kind: null });
    assert.equal(selected.total.views, 9);
    assert.equal(accessDayCount(selected.total.dayMask), 8);
    assert.equal(selected.byResource.find(row => row.resource.id === 'archive-a').metrics.views, 0);
    assert.equal(selected.byResource.find(row => row.resource.id === 'archive-a').resource.collection, 'not-collected');
    assert.equal(selected.byResource.some(row => row.resource.id === 'article-b'), false);
    assert.equal(fixture.queries.length, queries);
    assert.equal(JSON.stringify(report), before);
    assert.throws(() => selectAgentAccess(report, { articleId: 'home', client: null, kind: null }));
  } finally { fixture.sqlite.close(); }
});

test('catalogue ownership and closed windows reject invalid or ambiguous definitions', () => {
  for (const mutate of [
    rows => rows.push(structuredClone(rows[0])), rows => rows[1].path = rows[0].path,
    rows => rows[3].articleId = 'home', rows => rows[0].path = '//private.example',
    rows => rows[0].path = '/a/../b', rows => rows[0].articleId = 'article-b',
    rows => rows[0].extra = 'private', rows => rows[0].path = '/article-a?private=1',
  ]) {
    const rows = structuredClone(ACCESS_CATALOGUE); mutate(rows); assert.equal(validAgentAccessCatalogue(rows), false);
  }
  assert.deepEqual(agentAccessWindow(ACCESS_NOW), { start: '2026-10-17', endExclusive: '2026-11-14', calculatedAt: '2026-11-14T12:34:56.000Z' });
  assert.throws(() => agentAccessWindow(new Date('invalid')));
});

test('resource lookup preserves exact paths even when historical text contains JSON syntax or NULs', async () => {
  const fixture = accessFixture();
  try {
    for (const path of ['/article-a\u0000suffix', '/article-a"', '/article-a\\', '/article-a[0]', '/article-a/../article-b']) {
      fixture.sqlite.prepare('UPDATE page_observations SET path=? WHERE id=1').run(path);
      const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
      assert.equal(report.total.views, 39);
      assert.equal(report.resourceTotals.find(row => row.resourceId === 'article-a').metrics.views, 34);
      assert.equal(report.resourceTotals.find(row => row.resourceId === null).metrics.views, 2);
    }
  } finally { fixture.sqlite.close(); }
});

test('malformed reports cannot silently drop counts, proof detail, history, coverage or metadata', async () => {
  const fixture = accessFixture();
  try {
    const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const mutations = [
      row => row.cells.pop(), row => row.history.pop(), row => row.proofs.pop(), row => row.roleTotals.pop(), row => row.resourceTotals.pop(),
      row => row.cells.push(structuredClone(row.cells[0])), row => row.history.push(structuredClone(row.history[0])), row => row.proofs.push(structuredClone(row.proofs[0])),
      row => row.total.views++, row => row.total.dayMask = 0, row => row.total.weeks.pop(), row => row.total.weeks[0]++,
      row => row.accounting.includedViews++, row => row.accounting.windowViews = '48', row => row.accounting.otherViews++,
      row => row.cells[0].client = 'private-canary', row => row.cells[0].resourceId = 'private-canary', row => row.cells[0].metrics.views = true,
      row => row.cells[0].format = 'future', row => row.proofs[0].basis = 'future', row => row.proofs[0].publisher = 'https://private.example',
      row => row.proofs[0].profile = 'future', row => row.proofs[0].network = 'future', row => { row.proofs[0].network = 'not-recorded'; row.proofs[0].networkListed = true; },
      row => row.history[0].classifier = 'private-canary', row => row.history[0].source = 'private-canary',
      row => row.scope.start = '2026-10-18', row => row.scope.calculatedAt = '2026-11-13T12:34:56.000Z',
      row => row.scope.calculatedAt = '2026-11-14T12:34:56Z', row => row.scope.calculatedAt = '2026-11-14T04:34:56.000-08:00',
      row => row.scope.catalogueHash = 'bad',
      row => row.resources[0].path = '/private?query', row => row.extra = 'private', row => delete row.cells,
      row => { row.cells[0].metrics = { views: Number.MAX_SAFE_INTEGER, weeks: [Number.MAX_SAFE_INTEGER, 0, 0, 0], dayMask: 1, unrecognizedTimeViews: 0 }; },
    ];
    for (const [index, mutate] of mutations.entries()) { const changed = structuredClone(report); mutate(changed); assert.equal(consistentAgentAccessReport(changed), false, String(index)); }
  } finally { fixture.sqlite.close(); }
});

test('one canonical cached report coalesces callers and binds cache identity to the resource catalogue', async () => {
  const fixture = accessFixture(), cache = memoryReportCache();
  try {
    fixture.project();
    let resources = structuredClone(ACCESS_CATALOGUE), reservations = 0;
    const settlements = [];
    const handler = createAgentAccessReportHandler(cache, {
      now: () => ACCESS_NOW.getTime(), catalogue: async () => resources,
      admission: () => ({ async reserve() { reservations++; return { async complete(cost) { settlements.push(cost); } }; } }),
    });
    const [a, b] = await Promise.all([
      handler(new Request('https://fixture.example/api/agent-access?range=all&client=private'), { DB: fixture.db }),
      handler(new Request('https://fixture.example/api/agent-access'), { DB: fixture.db }),
    ]);
    assert.equal(a.status, 200); assert.equal(b.status, 200);
    const first = await a.text(); assert.equal(await b.text(), first);
    assert.equal(reservations, 1); assert.deepEqual(settlements, [{ reportedRowsRead: null }]);
    const hit = await handler(new Request('https://fixture.example/api/agent-access?path=/unknown'), { DB: fixture.db });
    assert.equal(hit.headers.get('X-Stats-Cache'), 'HIT'); assert.equal(await hit.text(), first);
    assert.equal(reservations, 1);
    resources = resources.map(resource => ({ ...resource, title: resource.title + ' revised' }));
    const changed = await handler(new Request('https://fixture.example/api/agent-access'), { DB: fixture.db });
    assert.equal(changed.status, 200); assert.equal(reservations, 2); assert.notEqual(await changed.text(), first);
    assert.equal((await handler(new Request('https://fixture.example/api/agent-access', { method: 'POST' }), { DB: fixture.db })).status, 405);
    assert.equal(reservations, 2);
  } finally { fixture.sqlite.close(); }
});

test('failed catalogue, denied admission and malformed data never cache a plausible zero report', async () => {
  for (const condition of ['catalogue', 'denied', 'data']) {
    const fixture = accessFixture(), cache = memoryReportCache();
    let failure = true, calculations = 0;
    try {
      const handler = createAgentAccessReportHandler(cache, {
        now: () => ACCESS_NOW.getTime(),
        catalogue: async () => condition === 'catalogue' && failure ? [] : ACCESS_CATALOGUE,
        admission: () => ({ async reserve() { return condition === 'denied' && failure ? null : { async complete() {} }; } }),
        onCalculation: () => calculations++,
      });
      if (condition === 'data') fixture.db.batch = async () => [{ success: true, results: [] }];
      const response = await handler(new Request('https://fixture.example/api/agent-access'), { DB: fixture.db });
      assert.equal(response.status, 503, condition); assert.equal(response.headers.get('Cache-Control'), 'no-store');
      if (condition !== 'data') assert.equal(calculations, 0);
      failure = false;
      if (condition !== 'data') assert.equal((await handler(new Request('https://fixture.example/api/agent-access'), { DB: fixture.db })).status, 200);
    } finally { fixture.sqlite.close(); }
  }
});
