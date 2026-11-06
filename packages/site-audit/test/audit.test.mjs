import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSite } from '../.test-dist/index.js';
import { isSiteAuditReport } from '../.test-dist/report-validation.js';

function fixture(overrides = {}) {
  const requested = [];
  const transport = { async retrieve(request) {
    requested.push(request);
    let text = '<html lang="en"><head><title>Useful page</title><meta name="description" content="An explanation"><link rel="canonical" href="/article"><script type="application/ld+json">{"@type":"Article"}</script></head><body><h1>A useful explanation</h1><p>' + 'Real source text. '.repeat(30) + '</p><a href="/more">Read more</a></body></html>';
    let status = 200;
    let contentType = 'text/html; charset=utf-8';
    let outcome = 'received';
    if (request.kind === 'robots') { text = 'User-agent: GPTBot\nDisallow: /\nUser-agent: ChatGPT-User\nAllow: /article\nUser-agent: *\nDisallow: /private'; contentType = 'text/plain'; }
    if (request.kind === 'llms') { text = '# Site\n\n- [Article](https://public-site.com/article)'; contentType = 'text/markdown'; }
    if (request.kind === 'sitemap') { text = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://public-site.com/article</loc></url></urlset>'; contentType = 'application/xml'; }
    if (request.kind === 'markdown') { text = '# A useful explanation\n\nSome text'; contentType = 'text/markdown'; }
    const custom = overrides[request.kind] ?? {};
    const evidence = { kind: request.kind, requestedUrl: request.url, finalUrl: request.url, outcome, status, contentType, bytes: text.length, elapsedMs: 12, redirects: 0, probeAgent: request.probeAgent ?? null,
      headers: { robots: null, link: null, contentLocation: null, vary: null }, ...custom };
    return { text: custom.outcome && custom.outcome !== 'received' ? null : text, evidence };
  } };
  return { transport, requested };
}
test('rich report keeps independent access, rules, representations and source facts', async () => {
  const { transport, requested } = fixture();
  const report = await analyzeSite('https://public-site.com/article', { transport, now: () => new Date('2026-11-06T12:00:00Z') });
  assert.equal(report.complete, true); // A documented unsupported vendor fallback can remain unknown in a completed plan.
  assert.equal(report.resources.length, 8);
  assert.equal(report.checkedAt, '2026-11-06T12:00:00.000Z');
  assert.equal(report.robots.bots.find(bot => bot.token === 'GPTBot').decision, 'disallowed');
  assert.equal(report.robots.bots.find(bot => bot.token === 'ChatGPT-User').decision, 'allowed');
  assert.deepEqual(report.discovery, { llms: 'present', llmsLinks: 1, sitemap: 'xml-observed', markdown: 'negotiated' });
  assert.equal(report.page.title, 'Useful page');
  assert.deepEqual(report.page.structuredDataTypes, ['Article']);
  assert.equal(requested.filter(request => request.probeAgent).length, 3);
  assert.equal(isSiteAuditReport(report), true);
  assert.equal(JSON.stringify(report).includes('<html'), false);
  assert.equal('score' in report, false);
});
test('individual timeout leaves partial report and unknown policy', async () => {
  const { transport } = fixture({ robots: { outcome: 'timeout', status: null }, llms: { outcome: 'network-error', status: null } });
  const report = await analyzeSite('https://public-site.com/article', { transport });
  assert.equal(report.complete, false);
  assert.equal(report.robots.state, 'unavailable');
  assert.equal(report.robots.bots.every(bot => bot.decision === 'unknown'), true);
  assert.equal(report.discovery.llms, 'unavailable');
  assert.equal(report.page.parseState, 'parsed');
});
test('robots 404 permits policy access while 503 remains unknown with conservative RFC note', async () => {
  const missing = await analyzeSite('public-site.com/article', { transport: fixture({ robots: { status: 404 } }).transport });
  assert.equal(missing.robots.state, 'missing');
  assert.equal(missing.robots.bots.every(bot => bot.decision === 'allowed'), true);
  const unreachable = await analyzeSite('public-site.com/article', { transport: fixture({ robots: { status: 503 } }).transport });
  assert.equal(unreachable.robots.state, 'unreachable');
  assert.equal(unreachable.robots.bots.every(bot => bot.decision === 'unknown'), true);
  assert.match(unreachable.robots.bots[0].reason, /complete disallow/);
});
test('synthetic provider status differences produce review rather than provider verdict', async () => {
  const report = await analyzeSite('public-site.com/article', { transport: fixture({ probe: { status: 403 } }).transport });
  const findings = report.findings.filter(finding => finding.id.startsWith('probe-'));
  assert.equal(findings.length, 3);
  assert.match(findings[0].recommendation, /test the real provider/);
  assert.match(report.limits.join(' '), /synthetic/);
});
test('invalid target throws before any retrieval', async () => {
  const { transport, requested } = fixture();
  await assert.rejects(analyzeSite('https://localhost/', { transport }));
  assert.equal(requested.length, 0);
});
