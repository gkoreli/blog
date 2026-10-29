import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { analyzeTraffic, classifyTraffic, KNOWN_AGENT_NAMES, KNOWN_CLIENT_PRODUCTS } from '../.test-dist/classify.js';
import { classifyReaderKind } from '../.test-dist/readerkind.js';
import { classificationEvidence, retainedDeclaredCategories } from '../.test-dist/classification-evidence.js';
import { networkEvidence } from '../.test-dist/networks.js';
import { parseStatsQuery, queryStats } from '../.test-dist/stats.js';
import { READER_GROUPS, readerGroupOf } from '../.test-dist/contracts.js';

const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
function facts(userAgent = chrome, changes = {}) {
  const analysis = analyzeTraffic(userAgent);
  return { ...analysis, userAgent, observationSource: 'edge', asn: 64512, secFetchMode: 'navigate', secFetchDest: 'document', secFetchSite: 'none', secFetchUser: null, acceptsHtml: 1, hasAcceptLanguage: 1, signature: { status: 'absent' }, ...changes };
}

test('Parallel declarations preserve search versus retrieval roles without authenticating a trigger', () => {
  for (const [token,kind] of [['ShapBot','ai-search'],['Shap-User','ai-assistant']]) {
    const f = facts(`Mozilla/5.0 (compatible; ${token}/0.1.0)`);
    assert.equal(f.agentName, token);
    for (const signature of [{status:'absent'},{status:'verified',agent:'https://unrelated.example'},{status:'unverified',reason:'signature-invalid'}]) {
      assert.equal(classifyReaderKind({...f,signature}).kind, kind);
    }
  }
  const mixed = facts('ShapBot/0.1.0 Shap-User/0.1.0');
  assert.equal(mixed.agentName, null);
  assert.deepEqual(classifyReaderKind(mixed), {kind:'unresolved',reason:'multiple-client-declarations'});
  assert.equal(typeof parseStatsQuery(new URLSearchParams('traffic=crawlers&kind=ai-search&agent=ShapBot')), 'object');
  assert.equal(typeof parseStatsQuery(new URLSearchParams('traffic=agents&kind=ai-assistant&agent=Shap-User')), 'object');
});

test('every catalogue identifier rejects substrings, URL placement and malformed versions', () => {
  for (const name of KNOWN_AGENT_NAMES) {
    const token = name === 'FacebookBot' ? 'facebookexternalhit' : name;
    for (const value of [`${token}/1.0`, `Mozilla/5.0 (compatible; ${token}/1.0; +https://example.test/)`, token.toLowerCase()]) {
      assert.equal(classifyTraffic(value).agentName, name, value);
    }
    for (const value of [`Not${token}/1.0`, `${token}Impostor/1.0`, `https://example.test/${token}/1.0`, `(${token}//invalid)`, `x-${token}/1.0`, `${token}/1.0/extra`]) {
      assert.equal(classifyTraffic(value).agentName, null, value);
    }
  }
});

test('documented Google aliases share a family, Slack products keep distinct declarations', () => {
  const google = analyzeTraffic('Googlebot-Image/1.0 Googlebot/2.1');
  assert.equal(google.agentName, 'Googlebot');
  assert.deepEqual(google.declarations.matchedProducts, ['Googlebot', 'Googlebot-Image']);
  assert.deepEqual(analyzeTraffic('Googlebot-Video/1.0').declarations.candidates, ['Googlebot']);
  assert.equal(classifyTraffic('Googlebot-News/1.0').agentName, null, 'robots-only identifier has no invented request alias');
  assert.equal(classifyReaderKind(facts('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)')).kind, 'preview-or-feed');
  assert.equal(classifyReaderKind(facts('Slack-ImgProxy 0.19 (+https://api.slack.com/robots)')).kind, 'preview-or-feed');
  assert.equal(classifyReaderKind(facts('Slackbot 1.0 (+https://api.slack.com/robots)')).kind, 'other-bot');
  assert.equal(typeof parseStatsQuery(new URLSearchParams('agent=Slackbot&traffic=crawlers&kind=preview-or-feed')), 'object', 'retained historical Slack grouping remains filterable');
  assert.equal(typeof parseStatsQuery(new URLSearchParams('agent=Slackbot&traffic=automation&kind=other-bot')), 'object');
});

test('multiple declarations retain all candidates and abstain regardless of order or signature', () => {
  for (const ua of ['GPTBot/1.0 ChatGPT-User/1.0', 'ChatGPT-User/1.0 GPTBot/1.0', 'Googlebot/2.1 GPTBot/1.0']) {
    const f = facts(ua);
    assert.equal(f.agentName, null); assert.equal(f.declarations.status, 'multiple'); assert.equal(f.declarations.candidates.length, 2);
    for (const signature of [{ status: 'absent' }, { status: 'verified', agent: 'https://fixture.example' }, { status: 'unverified', reason: 'signature-invalid' }]) {
      assert.deepEqual(classifyReaderKind({ ...f, signature }), { kind: 'unresolved', reason: 'multiple-client-declarations' });
    }
  }
  assert.deepEqual(analyzeTraffic('GPTBot/1.0 ChatGPT-User/1.0').declarations, analyzeTraffic('ChatGPT-User/1.0 GPTBot/1.0').declarations);
});

test('compatible multiple declarations retain their common category without choosing an identity', () => {
  for (const [ua,kind] of [['Cypress/15 HeadlessChrome/152', 'headless-browser'], ['ChatGPT-User/1.0 ExaUser/1.0', 'ai-assistant']]) {
    const f = facts(ua);
    assert.equal(f.agentName, null); assert.equal(f.declarations.candidates.length, 2);
    const result = { kind, reason: 'multiple-declarations-same-category' };
    assert.deepEqual(classifyReaderKind(f), result);
    assert.deepEqual(classifyReaderKind({ ...f, signature: { status: 'verified', agent: 'https://fixture.example' } }), result);
    assert.equal(classificationEvidence(f, f.declarations).categoryAgreement, 'multiple-same-category');
  }
});

test('missing network, list nonmatch and listed infrastructure are distinct facts', () => {
  for (const value of [null, 0, -1, NaN, Infinity, 1.5, 4294967295]) assert.equal(networkEvidence(value), 'missing');
  assert.equal(networkEvidence(64512), 'not-listed');
  for (const relay of [15169, 13335, 36183, 20940, 54113, 6939]) assert.equal(networkEvidence(relay), 'not-listed');
  assert.equal(networkEvidence(16509), 'hosting-listed'); assert.equal(networkEvidence(7941), 'archiver-listed');
  assert.deepEqual(classifyReaderKind(facts(chrome, { asn: null })), { kind: 'unresolved', reason: 'network-evidence-missing' });
  assert.deepEqual(classifyReaderKind(facts()), { kind: 'browser', reason: 'navigation-shaped-network-unlisted' });
  assert.equal(classifyReaderKind(facts(chrome, { asn: 16509 })).kind, 'cloud-browser');
});

test('arbitrary UA, missing context and contradictory context do not become verified browser/human evidence', () => {
  assert.deepEqual(classifyReaderKind(facts('NotChatGPT-Userish/1.0')), { kind: 'unresolved', reason: 'unrecognized-browser-claim' });
  assert.deepEqual(classifyReaderKind(facts(chrome, { secFetchMode: null, secFetchDest: null })), { kind: 'unresolved', reason: 'fetch-metadata-absent' });
  assert.equal(classifyReaderKind(facts('Mozilla/5.0 Chrome/49', { secFetchMode: null, secFetchDest: null })).reason, 'fetch-metadata-support-unknown');
  assert.equal(classifyReaderKind(facts(chrome, { secFetchMode: 'unrecognized-value' })).reason, 'fetch-metadata-unrecognized');
  const conflict = facts(chrome, { referrerState: 'external', secFetchSite: 'same-origin' });
  assert.equal(classifyReaderKind(conflict).reason, 'request-context-conflict');
  assert.equal(classificationEvidence(conflict, conflict.declarations).referrerContext, 'external-with-same-origin');
  assert.equal(classifyReaderKind(facts(chrome, { secFetchUser: null })).kind, 'browser', 'user activation is not required or a human test');
});

test('retained derived evidence is bounded and contains no unrecognized free-text or address', () => {
  const allTokens = [...KNOWN_CLIENT_PRODUCTS].join(' ');
  const f = facts(`${allTokens} private-reader@example.test credential-canary/very-secret 203.0.113.4`, { asn: 7941, secFetchUser: 0, secFetchSite: 'same-origin', referrerState: 'external' });
  const evidence = classificationEvidence(f, f.declarations); const json = JSON.stringify(evidence);
  assert.ok(Buffer.byteLength(json) <= 2048); assert.equal(evidence.declarations.status, 'multiple');
  assert.deepEqual(evidence.declarations.matchedProducts, f.declarations.matchedProducts);
  assert.deepEqual(evidence.declarations.candidates, f.declarations.candidates);
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,classification_evidence) VALUES('/bounded','00000000000000000000000000000000','bot','desktop',0,?)").run(json);
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT classification_evidence FROM page_observations').get().classification_evidence), evidence);
  for (const canary of ['private-reader', 'credential-canary', 'very-secret', '203.0.113.4']) assert.equal(json.includes(canary), false);
  assert.equal(evidence.network, 'archiver-listed'); assert.equal(evidence.activation, 'other-value');
  assert.equal(classificationEvidence({ ...f, secFetchUser: 0 }, f.declarations).activation, 'other-value');
});

test('category encoding round-trips complete facts and preserves historical/unknown boundaries', () => {
  const ua = [...KNOWN_CLIENT_PRODUCTS].join(' '), f = facts(ua), evidence = classificationEvidence(f, f.declarations);
  const kinds = [...new Set(f.declarations.candidates.map(name => classifyReaderKind(facts(name)).kind))].sort();
  assert.deepEqual(retainedDeclaredCategories(evidence), kinds);
  assert.deepEqual(retainedDeclaredCategories({version:'2026-10-27.2',declaredCategories:kinds}), kinds);
  assert.deepEqual(retainedDeclaredCategories({version:'2026-10-29.1',declaredCategoryBits:0}), []);
  for (const value of [null,{}, {version:'future',declaredCategoryBits:0},
    {version:'2026-10-27.2',declaredCategories:['private-canary']}, {version:'2026-10-27.2',declaredCategories:['ai-search','ai-search']},
    ...[-1,1.5,16384,2**32,NaN].map(bits=>({version:'2026-10-29.1',declaredCategoryBits:bits}))]) assert.equal(retainedDeclaredCategories(value),null);
});

test('migration preserves historical kinds/evidence absence and validates the JSON budget', () => {
  const db = new DatabaseSync(':memory:');
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').split('\n').filter(line => !line.trim().startsWith('classification_evidence ')).join('\n'); db.exec(schema);
  db.exec("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason) VALUES('/old','00000000000000000000000000000000','browser','desktop',0,'browser','navigation-shaped')");
  db.exec(readFileSync(new URL('../migrations/0013_classification_evidence.sql', import.meta.url), 'utf8'));
  assert.deepEqual({ ...db.prepare('SELECT reader_kind,reader_reason,classification_evidence FROM page_observations').get() }, { reader_kind: 'browser', reader_reason: 'navigation-shaped', classification_evidence: null });
  assert.throws(() => db.prepare('UPDATE page_observations SET classification_evidence=?').run('invalid'));
  assert.throws(() => db.prepare('UPDATE page_observations SET classification_evidence=?').run(JSON.stringify({ value: 'x'.repeat(2049) })));
});

test('Unresolved is disjoint and reportable under the same exclusions, with preserved legacy grouping', async () => {
  assert.deepEqual(READER_GROUPS.unresolved, ['unresolved']); assert.equal(readerGroupOf('legacy-browser'), 'automation');
  assert.deepEqual(parseStatsQuery(new URLSearchParams('traffic=unresolved&kind=unresolved')), { range: '30d', traffic: 'unresolved', kind: 'unresolved' });
  const db = new DatabaseSync(':memory:'); db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const insert = db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,referrer_host) VALUES('/article',?,'browser','desktop',?,?,'fixture','2026-10-27 12:00:00',?)");
  const rows = [['unresolved',0,null],['browser',0,null],['legacy-browser',0,null],['unresolved',1,null],['unresolved',0,'traffic2cash.xyz']];
  rows.forEach(([kind,owner,referrer],i) => insert.run(String(i).repeat(32),owner,kind,referrer));
  const adapter = { prepare(sql) { return { bind(...values) { return { sql,values }; } }; }, async batch(statements) { return statements.map(s => ({ results: db.prepare(s.sql).all(...s.values) })); } };
  const now = new Date('2026-10-27T13:00:00Z');
  const all = await queryStats(adapter,{range:'7d',traffic:'all'},now); let total = 0;
  for (const traffic of ['browser','agents','crawlers','automation','unresolved']) {
    const report = await queryStats(adapter,{range:'7d',traffic},now); total += report.totals.views;
    if (traffic === 'unresolved') { assert.equal(report.totals.views,1); assert.equal(report.referralPolicy.excludedViews,1); }
  }
  assert.equal(all.totals.views,3); assert.equal(total,all.totals.views);
});
