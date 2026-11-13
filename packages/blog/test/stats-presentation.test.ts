import assert from 'node:assert/strict';
import test from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { statsPage } from '../src/pages/stats.js';
import { metricTileHtml, rankedRowHtml } from '../src/lib/data-display.js';
import { trafficMix } from '../src/lib/stats-presentation.js';

test('traffic mix reconciles repeated reason rows into the existing disjoint request groups', () => {
  const rows = [
    { kind: 'browser', reason: 'navigation-shaped', views: 8, dailyClients: 3 },
    { kind: 'browser', reason: 'earlier-rule', views: 2, dailyClients: 1 },
    { kind: 'ai-assistant', reason: 'ChatGPT-User', views: 3, dailyClients: 2 },
    { kind: 'signed-agent', reason: 'Other', views: 4, dailyClients: 1 },
    { kind: 'ai-search', reason: 'ExaSearchBot', views: 5, dailyClients: 2 },
    { kind: 'cloud-browser', reason: 'hosting-asn:1', views: 6, dailyClients: 1 },
    { kind: 'unresolved', reason: 'classification-not-recorded', views: 7, dailyClients: 2 },
  ] as const;
  const mix = trafficMix([...rows]);
  assert.deepEqual(mix.map(row => row.views), [10, 7, 5, 6, 7]);
  assert.equal(mix.reduce((sum, row) => sum + row.views, 0), rows.reduce((sum, row) => sum + row.views, 0));
  assert.deepEqual(trafficMix([]).map(row => row.views), [0, 0, 0, 0, 0]);
});

test('Stats puts the trend before detail, labels its native filters and preserves navigable visible results', async () => {
  const [snapshot] = await renderContent([statsPage()]); assert.ok(snapshot);
  const root = document.createElement('div'); root.innerHTML = snapshot;
  const select = root.querySelector('select#stats-traffic'); assert.ok(select);
  assert.equal(select.querySelectorAll('option').length, 6);
  assert.equal(root.querySelector('label[for="stats-traffic"]')?.textContent, 'Traffic');
  assert.equal(root.querySelectorAll('[data-days]').length, 4);
  assert.ok(snapshot.indexOf('id="stats-activity"') < snapshot.indexOf('id="stats-client-form-section"'));
  assert.ok(snapshot.indexOf('id="stats-activity"') < snapshot.indexOf('id="stats-pages"'));
  assert.equal(root.querySelectorAll('.data-metric').length, 2);
  for (const link of root.querySelectorAll('.stats-navigation a')) {
    const target = link.getAttribute('href'); assert.ok(target); assert.ok(root.querySelector(target));
  }
  for (const id of ['stats-pages', 'stats-traffic-mix', 'stats-client-form-section', 'stats-kind-signature', 'stats-client-evidence']) {
    const section = root.querySelector(`#${id}`); assert.ok(section); assert.equal(section.closest('details'), null);
  }
  assert.match(root.querySelector('noscript')?.textContent ?? '', /30-day report as JSON/);
  assert.match(snapshot, /Per-day identifiers, not people/);
});

test('shared data templates escape captured labels and reject executable or off-site row destinations', async () => {
  await renderContent([statsPage()]);
  const hostile = '<img src=x onerror="alert(1)">';
  const root = document.createElement('div');
  root.innerHTML = metricTileHtml({ label: hostile, value: hostile, detail: hostile })
    + rankedRowHtml({ label: hostile, views: 12, href: 'javascript:alert(1)', openHref: '//evil.test', detail: hostile }, 0);
  assert.equal(root.querySelectorAll('img, script, a').length, 0);
  assert.ok(root.textContent?.includes(hostile));
  assert.equal(root.querySelector<HTMLElement>('.data-row-bar')?.style.width, '0%');
  root.innerHTML = rankedRowHtml({ label: 'Homepage', views: 12, href: '/stats?path=%2F', openHref: '/', openAriaLabel: 'Open homepage' }, 24);
  assert.equal(root.querySelectorAll('a').length, 2);
  assert.equal(root.querySelector('.data-row-open')?.getAttribute('aria-label'), 'Open homepage');
  assert.equal(root.querySelector<HTMLElement>('.data-row-bar')?.style.width, '50%');
});
