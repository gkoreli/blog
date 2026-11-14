import assert from 'node:assert/strict';
import test from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { statsPage } from '../src/pages/stats.js';
import { dataFactsHtml, groupedEvidenceTableHtml, metricTileHtml, rankedRowHtml } from '../src/lib/data-display.js';
import { classificationReasonLabel, requestContextRows, trafficMix } from '../src/lib/stats-presentation.js';

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

test('classification labels retain compound evidence without leaking diagnostic syntax or rewriting unknown codes', () => {
  assert.equal(classificationReasonLabel('cloud-browser', 'hosting-asn:24940; signature:missing-signature-agent'),
    'Hetzner (AS24940) · Signature: Signature-Agent missing');
  assert.equal(classificationReasonLabel('search-crawler', 'DuckDuckBot; signature:bare-uri-signature-agent'),
    'DuckDuckBot · Signature: unsupported bare-URI Signature-Agent');
  assert.equal(classificationReasonLabel('ai-search', 'Meta-WebIndexer; signature:key-unavailable'),
    'Meta-WebIndexer · Signature: key unavailable');
  assert.equal(classificationReasonLabel('preview-or-feed', 'archiver-asn:7941'), 'Archive network AS7941');
  assert.equal(classificationReasonLabel('unresolved', 'future-reason'), 'future-reason');
});

test('Stats puts the trend before detail, labels its native filters and preserves navigable visible results', async () => {
  const [snapshot] = await renderContent([statsPage([{ path: '/example', title: 'Example <title>' }])]); assert.ok(snapshot);
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
  assert.equal(root.querySelector('#stats-page-catalogue a[href="/example"]')?.textContent, 'Example <title>');
  assert.equal(root.querySelector('#stats-page-catalogue')?.hasAttribute('hidden'), true);
});

test('shared data templates escape captured labels and reject executable or off-site row destinations', async () => {
  await renderContent([statsPage()]);
  const hostile = '<img src=x onerror="alert(1)">';
  const root = document.createElement('div');
  root.innerHTML = metricTileHtml({ label: hostile, value: hostile, detail: hostile })
    + rankedRowHtml({ label: hostile, description: hostile, views: 12, href: 'javascript:alert(1)', openHref: '//evil.test', detail: hostile }, 0);
  assert.equal(root.querySelectorAll('img, script, a').length, 0);
  assert.ok(root.textContent?.includes(hostile));
  assert.equal(root.querySelector<HTMLElement>('.data-row-bar')?.style.width, '0%');
  root.innerHTML = rankedRowHtml({ label: 'Homepage', views: 12, href: '/stats?path=%2F', openHref: '/', openAriaLabel: 'Open homepage' }, 24);
  assert.equal(root.querySelectorAll('a').length, 2);
  assert.equal(root.querySelector('.data-row-open')?.getAttribute('aria-label'), 'Open homepage');
  assert.equal(root.querySelector<HTMLElement>('.data-row-bar')?.style.width, '50%');
  root.innerHTML = `<dl>${dataFactsHtml([{ label: hostile, value: 0 }, { label: 'Earlier records', value: 1248 }])}</dl>`;
  assert.equal(root.querySelector('img'), null);
  assert.deepEqual(Array.from(root.querySelectorAll('dd'), cell => cell.textContent), ['0', '1,248']);
  assert.equal(root.querySelector('dt')?.textContent, hostile);
});

test('grouped evidence retains every record, zero and missing marker without repeating classification cells', async () => {
  await renderContent([statsPage()]);
  const root = document.createElement('div');
  root.innerHTML = groupedEvidenceTableHtml('Complete example', ['Evidence', 'Profile'], [
    { group: 'Browser signals', groupHref: '/stats?kind=browser', cells: ['No signature headers', 'current'], views: 12 },
    { group: 'AI assistants', groupHref: 'javascript:alert(1)', cells: ['<img src=x onerror=alert(1)>', 'unavailable'], views: 3 },
    { group: 'Browser signals', cells: ['Earlier unrecorded', 'historical'], views: 0 },
    { group: 'Kind unrecorded or unrecognized', cells: ['Unassessed', 'unavailable'], views: 2 },
  ]);
  assert.equal(root.querySelectorAll('.data-table-record').length, 4);
  assert.equal(root.querySelectorAll('th[scope="rowgroup"]').length, 3);
  assert.equal(root.querySelectorAll('th[scope="col"]').length, 3);
  assert.equal(root.querySelectorAll('a').length, 1);
  assert.equal(root.querySelector('img'), null);
  assert.deepEqual(Array.from(root.querySelectorAll('.data-table-record .data-table-number'), cell => cell.textContent), ['12', '0', '3', '2']);
  assert.match(root.textContent ?? '', /Kind unrecorded or unrecognized/);
  assert.match(root.textContent ?? '', /<img src=x onerror=alert\(1\)>/);
});

test('request context transpose preserves all 28 parsing facts, including zero and overlapping parameters', () => {
  const field = (base: number) => ({ notAssessedViews: base + 1, absentViews: base + 2, validViews: base + 3,
    unrecognizedViews: base + 4, invalidViews: base + 5, policyLimitedViews: base + 6, parametersViews: 0 });
  const rows = requestContextRows({ mode: field(10), destination: field(20), site: field(30), activation: field(40) });
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map(row => row.values), [
    [11, 21, 31, 41], [12, 22, 32, 42], [13, 23, 33, 43], [14, 24, 34, 44],
    [15, 25, 35, 45], [16, 26, 36, 46], [0, 0, 0, 0],
  ]);
  assert.equal(rows[6]?.label, 'Parameters (overlap)');
});

test('Stats preserves each evidence section and keeps its complete reading notes after the results', async () => {
  const [snapshot] = await renderContent([statsPage()]); assert.ok(snapshot);
  const root = document.createElement('div'); root.innerHTML = snapshot;
  const ids = ['stats-pages', 'stats-referrers', 'stats-transitions', 'stats-previous-pages', 'stats-next-pages',
    'stats-traffic-mix', 'stats-client-form-section', 'stats-countries', 'stats-declarations', 'stats-composition',
    'stats-fetch-metadata', 'stats-kind-signature', 'stats-client-evidence', 'stats-signers', 'stats-verification-outcomes',
    'stats-vendor-network', 'stats-vendor-cache', 'stats-vendor-cache-access', 'stats-vendor-cache-policy',
    'stats-vendor-signatures', 'stats-verification', 'stats-directory-publication', 'stats-native-category'];
  for (const id of ids) {
    const section = root.querySelector(`#${id}`); assert.ok(section, id);
    const results = section.querySelector('.stats-section-results, [id$="-rows"]'); assert.ok(results, id);
    const note = section.querySelector('.data-note');
    if (note) assert.ok(Array.from(section.children).indexOf(results) < Array.from(section.children).indexOf(note), id);
    if (!id.startsWith('stats-vendor-cache')) assert.equal(section.closest('details'), null, id);
  }
  for (const link of root.querySelectorAll('.stats-method-navigation a')) {
    const target = link.getAttribute('href'); assert.ok(target);
    const topic = root.querySelector(target); assert.ok(topic); assert.equal(topic.closest('details'), null);
  }
  assert.equal(root.querySelectorAll('.stats-method-topic').length, 5);
  assert.match(root.querySelector('#stats-method-counting')?.textContent ?? '', /Hourly daily-client values are not additive/);
  assert.match(root.querySelector('#stats-method-sources')?.textContent ?? '', /These observations do not establish complete journeys/);
  assert.match(root.querySelector('#stats-method-history')?.textContent ?? '', /These version boundaries can change series without traffic changing/);
  assert.match(root.querySelector('#stats-method-verification')?.textContent ?? '', /do not keep a nonce replay database/);
});
