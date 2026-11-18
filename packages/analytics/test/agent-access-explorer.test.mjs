import test from 'node:test';
import assert from 'node:assert/strict';
import { exploreAgentAccess, ALL_AGENT_ACCESS } from '../.test-dist/agent-access-explorer.js';
import { queryAgentAccess } from '../.test-dist/agent-access.js';
import { accessDayCount, selectAgentAccess } from '../.test-dist/agent-access-contract.js';
import { ACCESS_CATALOGUE, ACCESS_NOW, accessFixture } from './fixtures/agent-access.mjs';

test('exploration reconciles evidence, coverage and active-day unions without queries or source mutation', async () => {
  const fixture = accessFixture();
  try {
    const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const before = JSON.stringify(report), queries = fixture.queries.length;
    const view = exploreAgentAccess(report);
    assert.equal(view.metrics.views, 39); assert.equal(view.articlesAccessed, 2);
    assert.equal(accessDayCount(view.metrics.dayMask), 9);
    assert.deepEqual([view.coverage.articleEvents, view.coverage.evidenceEvents, view.coverage.siteEvents, view.coverage.unregisteredEvents], [36, 1, 1, 1]);
    assert.equal(view.coverage.evidence.find(row => row.resource.id === 'archive-a').resource.collection, 'not-collected');
    assert.equal(view.attribution.reduce((total, row) => total + row.views, 0), 39);
    assert.equal(view.measurements.reduce((total, row) => total + row.views, 0), 39);
    assert.equal(view.choices.articles.find(row => row.resource.id === 'article-a').metrics.views, 36);
    assert.equal(view.choices.articles.find(row => row.resource.id === 'article-zero').metrics.views, 0);
    assert.equal(JSON.stringify(view).includes('private-canary'), false);
    assert.equal(fixture.queries.length, queries); assert.equal(JSON.stringify(report), before);
  } finally { fixture.sqlite.close(); }
});

test('empty intersections keep alternative role/client counts and explicit evidence gaps', async () => {
  const fixture = accessFixture();
  try {
    const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const view = exploreAgentAccess(report, { articleId: 'article-a', client: 'ChatGPT-User', kind: 'ai-search' });
    assert.equal(view.metrics.views, 0);
    assert.equal(view.choices.roles.find(row => row.kind === 'ai-assistant').metrics.views, 9);
    assert.equal(view.choices.allRoles.views, 9);
    assert.equal(view.choices.allClients.views, 9);
    assert.equal(view.choices.clients.find(row => row.client === 'OAI-SearchBot').metrics.views, 8);
    assert.equal(view.coverage.evidence.length, 2);
    assert(view.coverage.evidence.every(row => row.metrics.views === 0));
    assert.equal(view.attribution.length, 0); assert.equal(view.measurements.length, 0);
    assert.throws(() => exploreAgentAccess(report, { ...ALL_AGENT_ACCESS, articleId: 'home' }));
  } finally { fixture.sqlite.close(); }
});

test('all facet combinations retain exact selected metrics and ignore only their own dimension', async () => {
  const fixture = accessFixture();
  try {
    const report = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const clients = [null, ...new Set(report.cells.map(row => row.client))];
    for (const articleId of [null, 'article-a', 'article-b', 'article-zero']) for (const client of clients) for (const kind of [null, 'ai-assistant', 'ai-search', 'ai-crawler', 'signed-agent']) {
      const selection = { articleId, client, kind }, view = exploreAgentAccess(report, selection);
      assert.deepEqual(view.metrics, selectAgentAccess(report, selection).total);
      assert.deepEqual(view.choices.allRoles, selectAgentAccess(report, { ...selection, kind: null }).total);
      assert.deepEqual(view.choices.allClients, selectAgentAccess(report, { ...selection, client: null }).total);
      assert.deepEqual(view.choices.allResources, selectAgentAccess(report, { ...selection, articleId: null }).total);
      assert.equal(view.attribution.reduce((sum, row) => sum + row.views, 0), view.metrics.views);
      assert.equal(view.measurements.reduce((sum, row) => sum + row.views, 0), view.metrics.views);
    }
  } finally { fixture.sqlite.close(); }
});

test('weekly comparison uses two complete periods and only the profiles of their dated events', async () => {
  const fixture = accessFixture();
  try {
    const query = () => queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
    const report = await query();
    const { comparison } = exploreAgentAccess(report);
    assert.deepEqual(comparison.previous, { start: '2026-10-31', endExclusive: '2026-11-07', views: 9 });
    assert.deepEqual(comparison.latest, { start: '2026-11-07', endExclusive: '2026-11-14', views: 8 });
    assert.equal(comparison.change, -1);
    assert.equal(comparison.measurement.status, 'one-profile');
    assert.deepEqual(comparison.measurement.profiles.map(row => [row.previous, row.latest]), [[9, 8]]);
    assert.deepEqual(comparison.clients, [{ kind: 'entry', key: 'ExaSearchBot', previous: 1, latest: 0, change: -1 }]);
    assert.equal(exploreAgentAccess(report, { ...ALL_AGENT_ACCESS, articleId: 'article-b' }).comparison.measurement.status, 'empty-week');

    fixture.sqlite.prepare("UPDATE page_observations SET classifier_version=? WHERE observed_at='2026-11-07 12:00:00' AND reader_kind='ai-search'").run('2026-11-07.9');
    const different = exploreAgentAccess(await query()).comparison.measurement;
    assert.equal(different.status, 'multiple-profiles');
    assert.deepEqual(different.profiles.map(row => [row.previous, row.latest]), [[9, 7], [0, 1]]);

    fixture.sqlite.prepare("UPDATE page_observations SET collection_version=NULL WHERE observed_at='2026-11-07 12:00:00' AND reader_kind='ai-search'").run();
    const incomplete = exploreAgentAccess(await query()).comparison.measurement;
    assert.equal(incomplete.status, 'incomplete');
    assert.equal(incomplete.profiles.find(row => row.collection === null)?.latest, 1);
  } finally { fixture.sqlite.close(); }
});

test('weekly change ranks both directions and reconciles remainder and unregistered resources even at net zero', async () => {
  const fixture = accessFixture();
  try {
    const catalogue = [...ACCESS_CATALOGUE];
    const add = (name, resourceId, date, views) => {
      if (resourceId && !catalogue.some(resource => resource.id === resourceId)) {
        catalogue.push({ id: resourceId, path: `/${resourceId}`, title: resourceId, role: 'article', articleId: null, collection: 'page' });
      }
      for (let index = 0; index < views; index++) {
        const row = { ...fixture.rows[0], path: resourceId ? `/${resourceId}` : '/unregistered-private-canary', observed_at: date, agent_name: name };
        const columns = Object.keys(row);
        fixture.sqlite.prepare(`INSERT INTO page_observations(${columns.join(',')})VALUES(${columns.map(() => '?').join(',')})`).run(...Object.values(row));
      }
    };
    add('Claude-User', null, '2026-11-10 10:00:00', 5);
    add('ExaUser', 'added-1', '2026-11-10 10:00:00', 4);
    add('Perplexity-User', 'added-2', '2026-11-10 10:00:00', 3);
    add('PerplexityBot', 'added-3', '2026-11-10 10:00:00', 2);
    add('Applebot', 'removed-1', '2026-11-02 10:00:00', 5);
    add('Amazonbot', 'removed-2', '2026-11-02 10:00:00', 4);
    add('Claude-SearchBot', 'removed-3', '2026-11-02 10:00:00', 3);
    add('ClaudeBot', 'removed-4', '2026-11-02 10:00:00', 1);
    const report = await queryAgentAccess(fixture.db, catalogue, { now: ACCESS_NOW, readModel: 'source' });
    const { comparison } = exploreAgentAccess(report);
    assert.deepEqual([comparison.previous.views, comparison.latest.views, comparison.change], [22, 22, 0]);
    for (const rows of [comparison.clients, comparison.resources]) {
      assert.deepEqual(rows.map(row => row.change), [5, 4, 3, 2, -5, -4, -3, -2]);
      assert.deepEqual(rows.filter(row => row.kind === 'other').map(row => [row.direction, row.count]), [['increase', 1], ['decrease', 2]]);
      assert.equal(rows.reduce((total, row) => total + row.change, 0), comparison.change);
    }
    assert.equal(comparison.resources[0].key, null);
    assert.equal(JSON.stringify(comparison).includes('private-canary'), false);
  } finally { fixture.sqlite.close(); }
});
