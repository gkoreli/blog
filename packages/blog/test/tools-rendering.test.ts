import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { toolsPage } from '../src/pages/tools.js';
import { robotsPlaygroundPage } from '../src/pages/robots-playground.js';
import { reportComparePage } from '../src/pages/report-compare.js';
import { aiCheckPage } from '../src/pages/ai-check.js';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';
import type { SiteAuditReport, ResourceEvidence } from '@gkoreli/site-audit/contracts';

function fixture(): SiteAuditReport {
  const resource = (kind: ResourceEvidence['kind']): ResourceEvidence => ({ kind, requestedUrl: 'https://example.com/article', finalUrl: 'https://example.com/article', outcome: 'received', status: 200, contentType: 'text/html', bytes: 1000, elapsedMs: 5, redirects: 0, probeAgent: null, headers: { robots: null, link: null, contentLocation: null, vary: 'Accept' }, headersOmitted: [] });
  return { version: '2026-11-06.1', checkedAt: '2026-11-06T16:00:00.000Z', target: 'https://example.com/article', complete: true,
    resources: [resource('page'), resource('markdown')],
    page: { title: 'An example article', description: null, canonical: null, language: 'en', textCharacters: 500, headings: 1, links: 1, scriptElements: 0, metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState: 'parsed', indexingAssessmentComplete: true, textPreview: '<img src=x onerror=alert(1)>', headingOutline: [{ level: 1, text: 'An example article' }] },
    robots: { state: 'parsed', groups: 1, rules: 1, sitemaps: [], bots: [{ token: 'GPTBot', provider: 'OpenAI', role: 'training-control', source: 'https://platform.openai.com/docs/bots', decision: 'disallowed', matchedGroups: ['GPTBot'], matchedRule: 'Disallow: /', reason: 'Matched policy' }] },
    discovery: { llms: 'missing', llmsLinks: 0, sitemap: 'missing', markdown: 'not-negotiated' }, findings: [], limits: ['Fixture for local UI acceptance; not a live observation.'] };
}
function constructors(t: TestContext): Window {
  const view = document.defaultView; assert.ok(view);
  for (const name of ['Element', 'HTMLFormElement', 'HTMLInputElement', 'HTMLButtonElement', 'HTMLTextAreaElement', 'HTMLSelectElement'] as const) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value: view[name] });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else Reflect.deleteProperty(globalThis, name); });
  }
  const previousBody = document.body.innerHTML; t.after(() => { document.body.innerHTML = previousBody; }); return view;
}

test('tool entry pages expose actual tasks, local processing and a useful static fallback', async () => {
  const snapshots = await renderContent([toolsPage(), robotsPlaygroundPage(), reportComparePage()]);
  assert.match(snapshots[0] ?? '', /href="\/ai-check"/);
  assert.match(snapshots[0] ?? '', /href="\/tools\/robots"/);
  assert.match(snapshots[0] ?? '', /href="\/tools\/compare"/);
  assert.match(snapshots[0] ?? '', /href="\/ai-check#ai-check-request-heading"/);
  assert.match(snapshots[1] ?? '', /Allowed for OAI-SearchBot/);
  assert.match(snapshots[1] ?? '', /Nothing is uploaded/);
  assert.match(snapshots[2] ?? '', /file contents stay in this browser/);
  assert.match(snapshots[2] ?? '', /type="submit" disabled/);
});

test('extended evidence flags are validated before rendering supplied reports', () => {
  const report = fixture(); assert.equal(isSiteAuditReport(report), true);
  assert.equal(isSiteAuditReport({ ...report, page: { ...report.page, indexingAssessmentComplete: 'yes' } }), false);
  assert.equal(isSiteAuditReport({ ...report, page: { ...report.page, textPreview: 'x'.repeat(1201) } }), false);
  assert.equal(isSiteAuditReport({ ...report, page: { ...report.page, headingOutline: [{ level: 8, text: 'Invalid' }] } }), false);
  assert.equal(isSiteAuditReport({ ...report, resources: [{ ...report.resources[0], headersOmitted: ['unrecognized'] }] }), false);
});

test('optional Markdown and intentional training policy do not spoil a fully observed score', async () => {
  const { renderSiteAudit } = await import('../src/client/ai-check.js');
  const result = renderSiteAudit(fixture());
  assert.equal(result.querySelector('.access-score strong')?.textContent, '100');
  assert.match(result.textContent ?? '', /HTML returned; Markdown optional/);
  assert.equal(result.querySelectorAll('.ai-check-finding').length, 0);
  assert.equal(result.querySelectorAll('.access-evidence[open]').length, 0);
  assert.equal(result.querySelectorAll('img, script').length, 0, 'source preview remains text');
  assert.match(result.textContent ?? '', /<img src=x onerror=alert\(1\)>/);
});

test('robots and comparison workbenches evaluate actual form input with no network call', async t => {
  const view = constructors(t);
  const snapshots = await renderContent([robotsPlaygroundPage(), reportComparePage()]);
  const { parseSavedReport } = await import('../src/client/tools-workbench.js');
  assert.equal(parseSavedReport(JSON.stringify({ report: fixture(), quota: { remaining: 9 } })).target, fixture().target);
  assert.throws(() => parseSavedReport('{broken'), /not valid JSON/);
  assert.throws(() => parseSavedReport('x'.repeat(1_048_577)), /1 MB/);
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('Local tools must not fetch or upload'); });
  document.body.innerHTML = snapshots.join('');
  const robotsForm = document.querySelector('[data-robots-form]'); assert.ok(robotsForm);
  robotsForm.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(document.querySelector('robots-workbench [data-workbench-result]')?.textContent ?? '', /Allowed for OAI-SearchBot/);
  assert.match(document.querySelector('robots-workbench [data-workbench-status]')?.textContent ?? '', /No daily check used/);
  const before = document.querySelector('textarea[name="before"]'), after = document.querySelector('textarea[name="after"]');
  assert.ok(before instanceof HTMLTextAreaElement); assert.ok(after instanceof HTMLTextAreaElement);
  before.value = JSON.stringify(fixture()); after.value = JSON.stringify(fixture());
  const compareForm = document.querySelector('[data-compare-form]'); assert.ok(compareForm);
  compareForm.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(document.querySelector('report-comparison [data-workbench-result]')?.textContent ?? '', /No assessed evidence differences/);
  assert.match(document.querySelector('report-comparison [data-workbench-status]')?.textContent ?? '', /No upload or daily check used/);
});

test('example action loads only a static saved report and never enters quota admission', async t => {
  const view = constructors(t);
  const [snapshot] = await renderContent([aiCheckPage()]); assert.ok(snapshot);
  await import('../src/client/ai-check.js');
  const requests: unknown[] = [];
  t.mock.method(globalThis, 'fetch', async (input: unknown) => { requests.push(input); return Response.json({ report: fixture() }); });
  document.body.innerHTML = snapshot;
  const link = document.querySelector('[data-example-check]'); assert.ok(link);
  const status = document.querySelector('[data-audit-status]'); assert.ok(status instanceof HTMLElement); status.dataset['state'] = 'error';
  link.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(requests, ['/ai-check-example.json']);
  assert.equal(status.dataset['state'], 'ready', 'successful example clears a previous quota-error presentation');
  assert.match(document.querySelector('[data-audit-status]')?.textContent ?? '', /No live request to the target and no daily check used/);
  assert.match(document.querySelector('[data-audit-results]')?.textContent ?? '', /Example report · saved observation/);
  assert.doesNotMatch(document.querySelector('[data-audit-status]')?.textContent ?? '', /checks remaining/);
});


test('ambiguous duplicate resources do not present an unperformed comparison as no change', async () => {
  const { renderReportComparison } = await import('../src/client/tools-workbench.js');
  const baseline = fixture(), after = fixture();
  const first = baseline.resources[0]; assert.ok(first); baseline.resources.push({ ...first });
  const result = renderReportComparison(baseline, after);
  assert.match(result.textContent ?? '', /No comparison was made/);
  assert.doesNotMatch(result.textContent ?? '', /No assessed evidence differences/);
});


test('quota rejection retains the previous report and server-rendered evidence', async t => {
  const view = constructors(t);
  const [snapshot] = await renderContent([aiCheckPage()]); assert.ok(snapshot);
  await import('../src/client/ai-check.js');
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Daily allowance reached.', quota: { limit: 10, remaining: 0, resetAt: '2026-11-07T00:00:00.000Z' } }, { status: 429 }));
  document.body.innerHTML = snapshot;
  const result = document.querySelector('[data-audit-results]'), server = document.getElementById('ai-check-server-result'); assert.ok(result); assert.ok(server);
  result.textContent = 'Previous live report'; server.textContent = 'Previous server evidence';
  const form = document.querySelector('site-audit-check form'), input = document.querySelector('site-audit-check input'); assert.ok(form); assert.ok(input instanceof HTMLInputElement); input.value = 'https://example.com/article';
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.textContent, 'Previous live report'); assert.equal(server.textContent, 'Previous server evidence');
  assert.match(document.querySelector('[data-audit-status]')?.textContent ?? '', /0 of 10 checks remaining/);
});


test('a 100 score still exposes synthetic-probe and crawler-policy observations as review cards', async () => {
  const { renderSiteAudit } = await import('../src/client/ai-check.js');
  const report = fixture();
  report.findings = [
    { id: 'probe-ChatGPT-User', severity: 'review', title: 'Synthetic ChatGPT-User received 403', evidence: 'Baseline 200; synthetic declaration 403.', recommendation: 'Inspect edge rules and test the real provider.' },
    { id: 'robots-answer-bots', severity: 'review', title: 'Search policy disallows this path', evidence: 'OAI-SearchBot: Disallow: /', recommendation: 'Review whether the policy matches your intent.' },
    { id: 'llms-optional', severity: 'info', title: 'Optional directory not offered', evidence: 'HTTP 404.', recommendation: 'No score deduction.' },
  ];
  const result = renderSiteAudit(report);
  assert.equal(result.querySelector('.access-score strong')?.textContent, '100');
  const cards = [...result.querySelectorAll('.ai-check-finding')].map(item => item.textContent ?? '').join(' ');
  assert.match(cards, /Synthetic ChatGPT-User received 403/); assert.match(cards, /Search policy disallows/);
  assert.doesNotMatch(cards, /Optional directory not offered/);
  assert.match(result.textContent ?? '', /Optional directory not offered/);
});


test('malformed attached scores are rejected and a valid-looking forged total is recomputed', async () => {
  const { deriveTechnicalAssessment } = await import('@gkoreli/site-audit/product');
  const { renderSiteAudit } = await import('../src/client/ai-check.js');
  const { parseSavedReport } = await import('../src/client/tools-workbench.js');
  const report = fixture();
  const malformed = { ...report, assessment: { score: { lower: 100, upper: 100 } } };
  assert.equal(isSiteAuditReport(malformed), false);
  assert.throws(() => parseSavedReport(JSON.stringify(malformed)), /supported/);
  const validLedgerFromOtherEvidence = deriveTechnicalAssessment(report);
  const forged = { ...report, resources: report.resources.map(resource => resource.kind === 'page' ? { ...resource, status: 403 } : resource), assessment: validLedgerFromOtherEvidence };
  assert.equal(isSiteAuditReport(forged), true, 'well-shaped attachment is distinct from evidence consistency');
  const parsed = parseSavedReport(JSON.stringify(forged));
  const result = renderSiteAudit(parsed);
  assert.notEqual(result.querySelector('.access-score strong')?.textContent, '100', 'displayed score comes from current evidence, not the supplied total');
  assert.match(result.textContent ?? '', /HTTP 403/);
});

test('robots validation identifies and focuses the field without browser validation bubbles', async t => {
  const view = constructors(t);
  const [snapshot] = await renderContent([robotsPlaygroundPage()]); assert.ok(snapshot);
  await import('../src/client/tools-workbench.js'); document.body.innerHTML = snapshot;
  const form = document.querySelector('[data-robots-form]'), token = document.querySelector('input[name="token"]');
  assert.ok(form instanceof HTMLFormElement); assert.equal(form.noValidate, true); assert.ok(token instanceof HTMLInputElement);
  token.value = '';
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(token.getAttribute('aria-invalid'), 'true'); assert.equal(document.activeElement, token);
  assert.match(document.getElementById('robots-status')?.textContent ?? '', /Enter a crawler token/);
  token.value = 'GPTBot'; token.dispatchEvent(new view.Event('input', { bubbles: true }));
  assert.equal(token.hasAttribute('aria-invalid'), false);
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(document.querySelector('[data-workbench-result]')?.textContent ?? '', /Disallowed for GPTBot/);
  assert.equal(document.activeElement, document.querySelector('.workbench-verdict'));
});

test('comparison focuses the missing file input with an adjacent actionable error', async t => {
  const view = constructors(t); const [snapshot] = await renderContent([reportComparePage()]); assert.ok(snapshot);
  await import('../src/client/tools-workbench.js'); document.body.innerHTML = snapshot;
  const form = document.querySelector('[data-compare-form]'), before = document.querySelector('textarea[name="before"]'); assert.ok(form); assert.ok(before instanceof HTMLTextAreaElement);
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  const file = document.getElementById('compare-before-file'); assert.ok(file);
  assert.equal(before.closest('details')?.open, false); assert.equal(document.activeElement, file);
  assert.equal(file.getAttribute('aria-invalid'), 'true');
  assert.match(document.getElementById('compare-before-error')?.textContent ?? '', /Choose a before report/);
});

test('comparison does not let a stale file read overwrite a newer choice or edited JSON', async t => {
  const view = constructors(t); const [snapshot] = await renderContent([reportComparePage()]); assert.ok(snapshot);
  await import('../src/client/tools-workbench.js'); document.body.innerHTML = snapshot;
  const input = document.querySelector('input[data-report-file="before"]'), target = document.querySelector('textarea[name="before"]');
  assert.ok(input instanceof HTMLInputElement); assert.ok(target instanceof HTMLTextAreaElement);
  const result = document.querySelector('[data-workbench-result]'); assert.ok(result); result.textContent = 'Previous comparison';
  let resolveOld: (value: string) => void = () => { throw new Error('Old read was not started'); };
  Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'old.json', size: 100, text: () => new Promise<string>(resolve => { resolveOld = resolve; }) }] });
  input.dispatchEvent(new view.Event('change', { bubbles: true }));
  assert.equal(document.querySelector('report-comparison button[type="submit"]')?.hasAttribute('disabled'), true);
  assert.equal(result.textContent, '', 'Changing an input removes the previous comparison');
  Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'new.json', size: 100, text: async () => JSON.stringify(fixture()) }] });
  input.dispatchEvent(new view.Event('change', { bubbles: true })); await new Promise(resolve => setImmediate(resolve));
  const chosen = target.value; resolveOld('invalid old content'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(target.value, chosen); assert.equal(document.querySelector('[data-file-name="before"]')?.textContent, 'new.json');
  assert.equal(document.querySelector('report-comparison button[type="submit"]')?.hasAttribute('disabled'), false);
  Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'pending.json', size: 100, text: () => new Promise<string>(resolve => { resolveOld = resolve; }) }] });
  input.dispatchEvent(new view.Event('change', { bubbles: true })); target.value = 'manually edited'; target.dispatchEvent(new view.Event('input', { bubbles: true }));
  resolveOld(JSON.stringify(fixture())); await new Promise(resolve => setImmediate(resolve)); assert.equal(target.value, 'manually edited');
});

test('report overview and section destinations agree in enhanced and script-free renderers', async () => {
  const { renderSiteAudit } = await import('../src/client/ai-check.js'); const { checkResultHtml } = await import('../src/worker/ai-check-html.js');
  const report = fixture(); report.page.indexingAssessmentComplete = false; report.page.title = null;
  const client = renderSiteAudit(report), server = document.createElement('div'); server.innerHTML = checkResultHtml(report);
  assert.equal(client.querySelector('.access-score strong')?.textContent, server.querySelector('.access-score strong')?.textContent);
  assert.equal(client.querySelector('.access-summary h3')?.textContent, server.querySelector('.access-summary h3')?.textContent);
  for (const property of ['--score-earned', '--score-possible']) assert.equal(client.querySelector<HTMLElement>('.access-score')?.style.getPropertyValue(property), server.querySelector<HTMLElement>('.access-score')?.style.getPropertyValue(property));
  for (const root of [client, server]) for (const link of root.querySelectorAll('.report-navigation a')) {
    const target = link.getAttribute('href'); assert.ok(target); assert.ok(root.querySelector(target), `Report destination ${target} exists`);
  }
});

test('compact tools directory links to the checker and preserves its native POST entry', async t => {
  constructors(t);
  const [home, checker] = await renderContent([toolsPage(), aiCheckPage()]); assert.ok(home); assert.ok(checker);
  document.body.innerHTML = home;
  const choices = [...document.querySelectorAll('nav[aria-label="Tools"] .navigation-choice')];
  assert.equal(choices.length, 4);
  assert.equal(document.querySelector('form'), null);
  for (const choice of choices) {
    const links = choice.querySelectorAll('a'); assert.equal(links.length, 1);
    const link = links[0]; assert.ok(link);
    assert.ok(link.textContent?.trim());
    for (const id of (link.getAttribute('aria-describedby') ?? '').split(' ')) assert.ok(document.getElementById(id));
  }
  assert.equal(choices[0]?.querySelector('a')?.getAttribute('href'), '/ai-check');
  assert.ok(document.querySelector('a[href="/ai-check/example#access-report"]'));
  document.body.innerHTML = checker;
  const checkerForm = document.querySelector('form.ai-check-form'); assert.ok(checkerForm instanceof HTMLFormElement);
  assert.equal(checkerForm.getAttribute('action'), '/ai-check'); assert.equal(checkerForm.method, 'post'); assert.equal(checkerForm.noValidate, true);
  assert.equal(checkerForm.querySelector('input')?.type, 'text');
});

test('policy examples update all three inputs and remain entirely local', async t => {
  const view = constructors(t); const [snapshot] = await renderContent([robotsPlaygroundPage()]); assert.ok(snapshot);
  await import('../src/client/tools-workbench.js'); t.mock.method(globalThis, 'fetch', async () => { assert.fail('Examples must remain local'); });
  document.body.innerHTML = snapshot;
  const picker = document.querySelector('[data-robots-example]'), path = document.querySelector('input[name="path"]');
  assert.ok(picker instanceof HTMLSelectElement); assert.ok(path instanceof HTMLInputElement); assert.equal(picker.disabled, false);
  picker.value = 'exception'; picker.dispatchEvent(new view.Event('change', { bubbles: true }));
  assert.equal(path.value, '/private/public/article'); assert.match(document.querySelector('[data-workbench-result]')?.textContent ?? '', /Allow: \/private\/public\//);
  picker.value = 'specific'; picker.dispatchEvent(new view.Event('change', { bubbles: true }));
  assert.match(document.querySelector('[data-workbench-result]')?.textContent ?? '', /Disallowed for GPTBot/);
  path.value = '/edited'; path.dispatchEvent(new view.Event('input', { bubbles: true }));
  assert.equal(picker.value, ''); assert.equal(document.querySelector('[data-workbench-result]')?.textContent, '');
});

test('comparison example validates its reports, explains the illustration and focuses the result without fetching', async t => {
  const view = constructors(t); const [snapshot] = await renderContent([reportComparePage()]); assert.ok(snapshot);
  const { comparisonExample } = await import('../src/lib/report-comparison-example.js'); const samples = comparisonExample();
  assert.equal(isSiteAuditReport(samples.before), true); assert.equal(isSiteAuditReport(samples.after), true);
  await import('../src/client/tools-workbench.js'); t.mock.method(globalThis, 'fetch', async () => { assert.fail('Comparison example must not fetch'); });
  document.body.innerHTML = snapshot;
  const trigger = document.querySelector('[data-comparison-example]'); assert.ok(trigger);
  trigger.dispatchEvent(new view.MouseEvent('click', { bubbles: true }));
  const result = document.querySelector('.comparison-result'); assert.ok(result);
  assert.match(result.textContent ?? '', /Illustrative example/); assert.match(result.textContent ?? '', /not live measurements/);
  assert.match(result.textContent ?? '', /1 improved/); assert.equal(document.activeElement, result);
});

test('report facts preserve unavailable evidence and agree across both renderers', async () => {
  const { reportFacts } = await import('../src/lib/site-audit-presentation.js');
  const { renderSiteAudit } = await import('../src/client/ai-check.js'); const { checkResultHtml } = await import('../src/worker/ai-check-html.js');
  const report = fixture(); report.resources = []; report.page.parseState = 'unavailable'; report.robots.bots = [];
  const facts = reportFacts(report); assert.equal(facts[0]?.value, 'Unavailable'); assert.equal(facts[1]?.value, 'Unassessed'); assert.equal(facts[2]?.value, 'Unassessed');
  const enhanced = renderSiteAudit(report).querySelector('.report-facts')?.textContent ?? '';
  for (const fact of facts) { assert.ok(enhanced.includes(fact.value)); assert.ok(checkResultHtml(report).includes(fact.value)); }
});

test('all assessed results are visible without opening disclosures in both rendering paths', async () => {
  const { renderSiteAudit } = await import('../src/client/ai-check.js');
  const { checkResultHtml } = await import('../src/worker/ai-check-html.js');
  for (const condition of ['pass', 'fail', 'unknown'] as const) {
    const report = fixture();
    if (condition === 'fail') { report.page.title = null; report.resources = report.resources.map(resource => ({ ...resource, status: 403 })); }
    if (condition === 'unknown') { report.page.parseState = 'unavailable'; report.resources = []; }
    const client = renderSiteAudit(report), server = document.createElement('div'); server.innerHTML = checkResultHtml(report);
    for (const root of [client, server]) {
      assert.equal(root.querySelectorAll('.access-check-row').length, 6);
      assert.equal(root.querySelectorAll('.access-check-row[data-state="unknown"]').length > 0, condition !== 'pass');
      const results = root.querySelectorAll('.access-check-row, .access-optional-item, .report-policy-list li, .report-page-facts, .report-request-list');
      for (const result of results) assert.equal(result.closest('details, [hidden]'), null, 'The outcome and evidence are visible by default');
      assert.equal(root.querySelector('.report-policy-decision')?.textContent, 'Disallowed');
      for (const disclosure of root.querySelectorAll('details')) assert.ok(disclosure.closest('.report-technical'), 'Only method and raw-data sections use disclosures');
    }
    assert.equal(client.innerHTML, server.firstElementChild?.innerHTML, 'Enhanced and no-JavaScript reports share the same content');
  }
});
