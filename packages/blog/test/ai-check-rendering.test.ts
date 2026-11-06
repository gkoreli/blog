import assert from 'node:assert/strict';
import test from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { aiCheckPage } from '../src/pages/ai-check.js';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';

const hostile = '<img src=x onerror="globalThis.compromised=true">';
const report: SiteAuditReport = {
  version: '2026-11-06.1', checkedAt: '2026-11-06T12:00:00.000Z', target: 'https://example.com/article', complete: true,
  page: { title: hostile, description: null, canonical: 'https://example.com/article', language: 'en', textCharacters: 1000,
    headings: 2, links: 3, scriptElements: 1, metaRobots: [{ agent: 'robots', value: hostile }], structuredDataTypes: ['Article'],
    structuredDataBlocks: 1, invalidStructuredDataBlocks: 0, alternateLinks: [{ type: 'text/markdown', href: hostile }], parseState: 'parsed' },
  robots: { state: 'parsed', groups: 1, rules: 1, sitemaps: ['https://example.com/sitemap.xml'], bots: [{
    token: 'GPTBot', provider: 'OpenAI', role: 'training-control', source: 'javascript:alert(1)', decision: 'disallowed',
    matchedGroups: ['GPTBot'], matchedRule: 'Disallow: /', reason: 'Longest matching rule',
  }] },
  discovery: { llms: 'missing', llmsLinks: 0, sitemap: 'xml-observed', markdown: 'not-negotiated' },
  findings: [{ id: 'fixture', severity: 'action', title: hostile, evidence: hostile, recommendation: 'Inspect your indexing controls.' }],
  resources: [{ kind: 'probe', requestedUrl: 'https://example.com/article', finalUrl: 'https://example.com/article', outcome: 'received', status: 200,
    contentType: 'text/html', bytes: 1000, elapsedMs: 3, redirects: 0, probeAgent: 'GPTBot', headers: { robots: hostile, link: null, contentLocation: null, vary: 'Accept' } }],
  limits: ['Synthetic probe, not a provider request.'],
};

test('actual static snapshot preserves no-JavaScript form, API access and server result slot', async () => {
  const [snapshot] = await renderContent([aiCheckPage()]);
  assert.ok(snapshot);
  assert.match(snapshot, /<div id="ai-check-server-result"><\/div>/);
  assert.match(snapshot, /action="\/ai-check" method="post"/);
  assert.match(snapshot, /name="url" type="url"/);
  assert.match(snapshot, /href="\/api\/request-check"/);
  assert.match(snapshot, /Ten checks per network address per UTC day/);
  assert.match(snapshot, /does not promise/);
});

test('report boundary validates nested evidence and rejects malformed arrays and booleans', () => {
  assert.equal(isSiteAuditReport(report), true);
  assert.equal(isSiteAuditReport({ ...report, page: { ...report.page, metaRobots: [{ agent: 'robots' }] } }), false);
  assert.equal(isSiteAuditReport({ ...report, resources: [{ ...report.resources[0], headers: null }] }), false);
  assert.equal(isSiteAuditReport({ ...report, robots: { ...report.robots, bots: [{ ...report.robots.bots[0], decision: 'guaranteed-citation' }] } }), false);
  assert.equal(isSiteAuditReport({ ...report, complete: 'true' }), false);
});

test('target-controlled HTML and URLs render as text without executable markup', async () => {
  await renderContent([aiCheckPage()]);
  const { renderSiteAudit } = await import('../src/client/ai-check.js');
  const result = renderSiteAudit(report);
  assert.equal(result.querySelectorAll('img, script').length, 0);
  assert.equal(result.querySelectorAll('a[href^="javascript:"]').length, 0);
  assert.ok(result.textContent?.includes(hostile));
  assert.match(result.textContent ?? '', /Synthetic GPTBot/);
  assert.match(result.textContent ?? '', /training-control/);
  assert.match(result.textContent ?? '', /does not come from that bot’s provider/);
  assert.equal(result.querySelectorAll('table').length, 2);
});

test('enhanced form submits one JSON request, renders evidence and reports the shared quota', async t => {
  const view = document.defaultView; assert.ok(view);
  for (const name of ['HTMLFormElement', 'HTMLInputElement', 'HTMLButtonElement'] as const) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value: view[name] });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else Reflect.deleteProperty(globalThis, name); });
  }
  const [snapshot] = await renderContent([aiCheckPage()]); assert.ok(snapshot);
  await import('../src/client/ai-check.js');
  const previousBody = document.body.innerHTML;
  t.after(() => { document.body.innerHTML = previousBody; });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    calls++; assert.equal(input, '/api/ai-check'); assert.equal(init?.method, 'POST');
    assert.equal(init?.body, JSON.stringify({ url: 'https://example.com/article' }));
    return Response.json({ report, quota: { limit: 10, remaining: 9, resetAt: '2026-11-07T00:00:00.000Z' } });
  });
  document.body.innerHTML = snapshot;
  const form = document.querySelector('site-audit-check form'), input = document.querySelector('site-audit-check input');
  assert.ok(form); assert.ok(input instanceof HTMLInputElement); input.value = 'https://example.com/article';
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.match(document.querySelector('[data-audit-status]')?.textContent ?? '', /9 of 10 checks remaining/);
  assert.equal(document.querySelector('[data-audit-results]')?.querySelectorAll('table').length, 2);
  assert.equal(document.querySelector('site-audit-check button')?.hasAttribute('disabled'), false);
});
