import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryAgentAccess } from '../../analytics/src/agent-access.ts';
import { consistentAgentAccessReport } from '../../analytics/src/agent-access-contract.ts';
import { agentResourcesFromIndex } from '../src/worker/agent-access.ts';
import { agentAccessViewHtml } from '../src/lib/agent-access-view.ts';
import { timePresentation } from '@gkoreli/time';
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
  const [snapshot] = await renderContent([statsPage()]);
  assert(snapshot); const element = document.createElement('div'); element.innerHTML = snapshot;
  const report = element.querySelector('agent-access-report');
  assert(report); assert.equal(report.id, 'stats-agent-access');
  assert.equal(report.closest('#stats-dashboard'), null);
  assert.equal(report.querySelectorAll('select').length, 2);
  assert.equal(report.querySelector('fieldset').disabled, true);
  assert.match(report.textContent, /28 completed UTC days/);
  assert.equal(element.querySelector('.stats-navigation a').getAttribute('href'), '#stats-agent-access');
  assert.equal(element.querySelectorAll('#stats-controls input[data-traffic]').length, 6);
  assert.match(element.querySelector('#stats-controls').textContent, /AI search, AI crawlers/);
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
    const html = agentAccessViewHtml(report, { articleId: null, client: null, kind: null }, timePresentation({timeZone:'America/Los_Angeles', locale:'en-US'}));
    assert.doesNotMatch(html, /<img|onerror="/); assert.match(html, /&lt;img/);
    assert.match(html, /PST/); assert.match(html, /UTC reporting days/);
    for (const text of ['AI-search declarations', 'AI-crawler declarations', 'On-demand fetcher declarations', 'historical or unknown role', 'No selected client name', 'Format not recorded', 'Stored proof and network evidence', 'Recorded measurement profiles', 'Unregistered resource events']) assert(html.includes(text), text);
    for (const client of ['ChatGPT-User', 'OAI-SearchBot', 'GPTBot']) assert(html.includes(client));
    const selected = agentAccessViewHtml(report, { articleId: 'article:a', client: 'OAI-SearchBot', kind: 'ai-search' });
    assert.match(selected, /Role: AI-search declarations/);
    assert.match(selected, /Show all roles/);
    assert.equal(JSON.stringify(report), before);
    sqlite.exec('DELETE FROM page_observations');
    const empty = await queryAgentAccess(db, resources, { now: new Date('2026-11-14T17:02:00.000Z'), readModel: 'source' });
    assert.match(agentAccessViewHtml(empty, { articleId: null, client: null, kind: null }), /No retained events match this selection/);
  } finally { sqlite.close(); }
});
