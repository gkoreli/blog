import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryAgentAccess } from '../../analytics/src/agent-access.ts';
import { consistentAgentAccessReport } from '../../analytics/src/agent-access-contract.ts';
import { agentResourcesFromIndex } from '../src/worker/agent-access.ts';
import { exploreAgentAccess } from '../../analytics/src/agent-access-explorer.ts';
import { agentAccessViewHtml, agentAccessSelectionLabel } from '../src/lib/agent-access-view.ts';
import { timePresentation } from '@gkoreli/time';
import { agentAccessPage } from '../src/pages/agent-access.ts';
import { statsPage } from '../src/pages/stats.ts';
import { renderContent } from '../src/lib/ssg.ts';

test('public catalogue maps current articles and declared files, rejects ambiguity and omits retired prompt resources', () => {
  const resources = agentResourcesFromIndex([{ url: '/oss-radar-08-bun-aot', title: 'Bun AOT' }, { url: '/other', title: 'Other' }]);
  assert.equal(resources.filter(row => row.role === 'article').length, 2);
  const download = resources.find(row => row.role === 'evidence');
  assert.equal(download.path, '/downloads/bun-aot-check-0.1.0.zip');
  assert.equal(download.collection, 'not-collected');
  assert.equal(download.articleId, 'article:oss-radar-08-bun-aot');
  assert.equal(resources.some(row => row.path.includes('prompts')), false);
  for (const input of [[], [{ url: '//private.example', title: 'Bad' }], [{ url: '/same', title: 'A' }, { url: '/same', title: 'B' }]]) assert.throws(() => agentResourcesFromIndex(input));
});

test('actual Stats markup separates the fixed agent report from the selected-period request report', async () => {
  const [snapshot, requestsHtml] = await renderContent([agentAccessPage(), statsPage()]);
  assert(snapshot); const element = document.createElement('div'); element.innerHTML = snapshot;
  const report = element.querySelector('agent-access-report');
  assert(report); assert.equal(report.id, 'stats-agent-access');
  assert.equal(report.closest('#stats-dashboard'), null);
  assert.equal(report.querySelectorAll('select').length, 2);
  assert.equal(report.querySelector('fieldset').disabled, true);
  assert.equal(report.querySelectorAll('input[data-agent-role]').length, 5);
  assert.equal(report.querySelector('[data-agent-clear]').disabled, true);
  assert(report.querySelector('[data-agent-overview]'));
  assert.equal(report.querySelector('.agent-access-navigation').hidden, true);
  assert.equal(report.querySelector('[data-agent-status]').getAttribute('aria-atomic'), 'true');
  assert.deepEqual([...report.querySelectorAll('.report-scope-facts dd')].map(item => item.textContent), ['28 completed days', 'UTC reporting days', 'Article, client and role']);
  const requests = document.createElement('div'); requests.innerHTML = requestsHtml;
  assert.equal(requests.querySelector('agent-access-report'), null);
  assert.equal(element.querySelector('#stats-controls'), null);
  assert.equal(element.querySelector('.stats-views [aria-current]').getAttribute('href'), '/stats/agent-access');
  assert.equal(requests.querySelector('.stats-views [aria-current]').getAttribute('href'), '/stats');
  assert.equal(requests.querySelectorAll('#stats-controls [data-traffic] option').length, 6);
  assert.match(requests.querySelector('#stats-controls').textContent, /AI search, AI crawlers/);
});

test('report rendering preserves scope, complete evidence, unknowns, safe labels and localized calculation time', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../analytics/schema.sql', import.meta.url), 'utf8'));
  const resources = agentResourcesFromIndex([{ url: '/a', title: '<img src=x onerror=alert(1)>Article' }]);
  const insert = sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,reader_kind,agent_name,traffic_class,device_type,is_owner,observed_at,representation)VALUES('/a',?,?,?,'ai','desktop',0,'2026-11-01 12:00:00',?)");
  for (const [index, kind, client, format] of [[1, 'ai-assistant', 'ChatGPT-User', 'html'], [2, 'ai-search', 'OAI-SearchBot', 'markdown'], [3, 'ai-crawler', 'GPTBot', null], [4, 'signed-agent', null, 'html']]) insert.run(String(index).padStart(32, '0'), kind, client, format);
  const db = { prepare(sql) { return { bind(...values) { return { sql, values }; } }; }, async batch(statements) { return statements.map(statement => ({ success: true, results: sqlite.prepare(statement.sql).all(...statement.values) })); } };
  try {
    const report = await queryAgentAccess(db, resources, { now: new Date('2026-11-14T17:02:00.000Z'), readModel: 'source' });
    assert(consistentAgentAccessReport(report));
    const before = JSON.stringify(report);
    const view = exploreAgentAccess(report);
    const rendered = agentAccessViewHtml(view, timePresentation({timeZone:'America/Los_Angeles', locale:'en-US'}));
    const html = rendered.overview + rendered.details;
    assert.doesNotMatch(html, /<img|onerror="/); assert.match(html, /&lt;img/);
    assert.match(html, /PST/); assert.match(html, /UTC reporting days/);
    assert.match(html, /<time datetime="2026-11-14T17:02:00.000Z" data-local-time>Nov 14, 2026, 9:02 AM PST<\/time>/);
    for (const text of ['AI-search declarations', 'AI-crawler declarations', 'On-demand fetcher declarations', 'historical or unknown role', 'No selected client name', 'Format not recorded', 'Stored proof and network evidence', 'Recorded measurement profiles', 'Unregistered resource events']) assert(html.includes(text), text);
    for (const client of ['ChatGPT-User', 'OAI-SearchBot', 'GPTBot']) assert(html.includes(client));
    const selected = exploreAgentAccess(report, { articleId: 'article:a', client: 'OAI-SearchBot', kind: 'ai-search' });
    assert.match(agentAccessSelectionLabel(selected), /OAI-SearchBot.*AI-search declarations/);
    const element = document.createElement('div'); element.innerHTML = rendered.details;
    const [shell] = await renderContent([agentAccessPage()]); assert(shell);
    const page = document.createElement('div'); page.innerHTML = shell;
    page.querySelector('[data-agent-overview]').innerHTML = rendered.overview;
    page.querySelector('[data-agent-results]').innerHTML = rendered.details;
    const indexes = page.querySelectorAll('nav[aria-label="Agent access sections"]');
    assert.equal(indexes.length, 1);
    const links = indexes[0].querySelectorAll('a'); assert.equal(links.length, 8);
    assert.equal(links[1].getAttribute('href'), '#agent-access-change');
    assert.match(page.querySelector('#agent-access-change').textContent, /Weekly change.*Latest seven completed UTC days/s);
    for (const link of links) assert(page.querySelector(link.getAttribute('href')));
    assert.equal(element.querySelector('.agent-access-visit').getAttribute('href'), '/a');
    assert.equal(element.querySelector('button[data-agent-article]').getAttribute('data-agent-article'), 'article:a');
    assert.equal(JSON.stringify(report), before);
    sqlite.exec('DELETE FROM page_observations');
    const empty = await queryAgentAccess(db, resources, { now: new Date('2026-11-14T17:02:00.000Z'), readModel: 'source' });
    assert.match(agentAccessViewHtml(exploreAgentAccess(empty)).details, /No retained events match this selection/);
  } finally { sqlite.close(); }
});
