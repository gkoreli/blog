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
