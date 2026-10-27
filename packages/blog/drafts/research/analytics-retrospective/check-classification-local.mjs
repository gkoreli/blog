import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePageResponse } from '../../../../analytics/.test-dist/index.js';
import { queryStats } from '../../../../analytics/.test-dist/stats.js';
import { buildSignatureBase, ed25519JwkThumbprint } from '../../../../analytics/.test-dist/webbotauth.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../../../../analytics/.test-dist/versions.js';

const output = process.argv[2];
if (!output) throw new Error('Provide a new output JSON path');
const prefix = resolve(output).replace(/\.json$/, '');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'classification-evidence' } });
const originalFetch = globalThis.fetch;
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').split('\n').filter(line => !line.trim().startsWith('classification_evidence ')).join('\n').replace(/^--.*$/gm, '');
  await db.batch(schema.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  await db.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,collection_version,classifier_version) VALUES('/historical','00000000000000000000000000000000','browser','desktop',0,'browser','navigation-shaped','2026-10-26.3','2026-10-26.3')").run();
  await db.prepare(readFileSync('packages/analytics/migrations/0013_classification_evidence.sql', 'utf8').replace(/^--.*$/gm, '')).run();
  assert.deepEqual(await db.prepare('SELECT reader_kind,reader_reason,classification_evidence FROM page_observations').first(), { reader_kind: 'browser', reader_reason: 'navigation-shaped', classification_evidence: null });
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign','verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey); const kid = await ed25519JwkThumbprint(jwk);
  let directoryCalls = 0;
  globalThis.fetch = async input => { assert.equal(String(input), 'https://classification-fixture.example/.well-known/http-message-signatures-directory'); directoryCalls++; return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' } }); };
  const chrome = 'Mozilla/5.0 Chrome/152.0 Safari/537.36';
  const cases = [
    { label: 'navigation', ua: chrome, kind: 'browser', reason: 'navigation-shaped-network-unlisted' },
    { label: 'missing-network', ua: chrome, asn: null, kind: 'unresolved', reason: 'network-evidence-missing' },
    { label: 'lookalike', ua: 'NotChatGPT-Userish/1.0', kind: 'unresolved', reason: 'unrecognized-browser-claim' },
    { label: 'context-conflict', ua: chrome, sameOrigin: true, kind: 'unresolved', reason: 'request-context-conflict' },
    { label: 'signed-category-conflict', ua: 'GPTBot/1.0 ChatGPT-User/1.0', signed: true, kind: 'unresolved', reason: 'multiple-client-declarations' },
    { label: 'signed-common-category', ua: 'Cypress/15 HeadlessChrome/152', signed: true, kind: 'headless-browser', reason: 'multiple-declarations-same-category' },
    { label: 'signed-named-crawler', ua: 'ExaSearchBot/1.0', signed: true, kind: 'ai-search', reason: 'ExaSearchBot' },
    { label: 'slack-general', ua: 'Slackbot 1.0 (+https://api.slack.com/robots)', kind: 'other-bot', reason: 'Slackbot' },
    { label: 'slack-link', ua: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', kind: 'preview-or-feed', reason: 'Slackbot-LinkExpanding' },
    { label: 'headerless', ua: chrome, headerless: true, kind: 'unresolved', reason: 'fetch-metadata-absent' },
    { label: 'referral-excluded', ua: 'GPTBot/1.0 ChatGPT-User/1.0', referrer: 'https://traffic2cash.xyz/', kind: 'unresolved', reason: 'multiple-client-declarations' },
    { label: 'owner-excluded', ua: chrome, owner: true, kind: 'browser', reason: 'navigation-shaped-network-unlisted' },
  ];
  const rows = [];
  for (const item of cases) {
    const headers = { 'User-Agent': item.ua, Accept: 'text/html', 'Accept-Language': 'en', Referer: item.referrer ?? 'https://outside.example/', 'CF-Connecting-IP': '192.0.2.1' };
    if (!item.headerless) { headers['Sec-Fetch-Mode'] = 'navigate'; headers['Sec-Fetch-Dest'] = 'document'; headers['Sec-Fetch-Site'] = item.sameOrigin ? 'same-origin' : 'cross-site'; }
    const url = `https://publication.example/${item.label}`;
    if (item.signed) {
      const epoch = Math.floor(Date.now()/1000);
      headers['Signature-Agent'] = 'sig="https://classification-fixture.example";type=directory';
      headers['Signature-Input'] = `sig=("@authority" "signature-agent";key="sig");created=${epoch};expires=${epoch+300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
      const base = buildSignatureBase(new Request(url, { headers }), 'sig'); assert.notEqual(base, null);
      headers.Signature = `sig=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`;
    }
    const request = new Request(url, { headers }); Object.defineProperty(request, 'cf', { value: item.asn === null ? {} : { asn: 64512 } });
    const pending = [];
    observePageResponse(request, new Response('fixture', { headers: { 'Content-Type': 'text/html' } }), 'html', { DB: db, ANALYTICS_HASH_KEY: 'local-only', ...(item.owner ? { OWNER_IPS: '192.0.2.1' } : {}) }, { waitUntil: p => pending.push(p) });
    await Promise.all(pending);
    const stored = await db.prepare('SELECT reader_kind,reader_reason,agent_name,classification_evidence,signature_evidence,signature_status,collection_version,classifier_version,request_evidence FROM page_observations WHERE path=?').bind(`/${item.label}`).first();
    assert.equal(stored.reader_kind, item.kind); assert.equal(stored.reader_reason, item.reason);
    assert.equal(stored.collection_version, COLLECTION_VERSION); assert.equal(stored.classifier_version, CLASSIFIER_VERSION); assert.equal(stored.request_evidence, null);
    const evidence = JSON.parse(stored.classification_evidence), signature = JSON.parse(stored.signature_evidence);
    assert.equal(signature.localStatus, item.signed ? 'verified' : 'absent');
    if (item.signed) assert.equal(signature.coverage.covered.userAgent, false);
    if (evidence.declarations.status === 'multiple') assert.equal(stored.agent_name, null);
    assert.ok(Buffer.byteLength(stored.classification_evidence) <= 2048);
    rows.push({ label: item.label, kind: stored.reader_kind, reason: stored.reader_reason, classification: evidence, signatureStatus: signature.localStatus });
  }
  assert.equal(directoryCalls, 1);
  const all = await queryStats(db, { range: '7d', traffic: 'all' }); assert.equal(all.totals.views, 11); assert.equal(all.referralPolicy.excludedViews, 1);
  const partitions = {};
  for (const traffic of ['browser','agents','crawlers','automation','unresolved']) partitions[traffic] = (await queryStats(db, { range: '7d', traffic })).totals.views;
  assert.equal(Object.values(partitions).reduce((sum,value) => sum+value, 0), all.totals.views); assert.equal(partitions.unresolved, 5);
  let captured;
  const tap = { prepare(sql) { return { bind(...values) { captured = { sql,values }; return db.prepare(sql).bind(...values); } }; }, batch(statements) { return db.batch(statements); } };
  const query = { range: '7d', traffic: 'unresolved' }; const report = await queryStats(tap, query);
  let position = 0;
  const literal = captured.sql.replace(/\?/g, () => { const value = captured.values[position++]; if (value === null) return 'NULL'; if (typeof value === 'number') return String(value); assert.equal(typeof value,'string'); return "'"+value.replaceAll("'","''")+"'"; }).split('\n').map(line => line.trimEnd()).join('\n').trim()+';\n';
  assert.equal(position,captured.values.length); const replay = (await db.prepare(literal).all()).results; assert.equal(JSON.parse(replay.find(row => row.section === 'totals').payload)[0].views, 5);
  writeFileSync(`${prefix}-production.sql`, literal, { flag: 'wx' });
  writeFileSync(`${prefix}-production-plan.json`, JSON.stringify({ query, start: report.period.start, end: report.period.end, sqlSha256: createHash('sha256').update(literal).digest('hex'), directSelectReadCeiling: 50000, productionCalls: 0 }, null, 2)+'\n', { flag:'wx' });
  await db.prepare("UPDATE page_observations SET path='/privacy',referrer_host='traffic2cash.xyz',observed_at='2026-10-27 16:00:00' WHERE path IN ('/referral-excluded','/lookalike','/signed-common-category')").run();
  const controlSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/classification-control-acceptance.sql', 'utf8');
  const controlQueryResult = (await db.prepare(controlSql).bind('2026-10-27 15:59:00', '2026-10-27 16:01:00').all()).results;
  assert.equal(controlQueryResult.reduce((sum,row) => sum+row.observations,0),3);
  assert.equal(controlQueryResult.find(row => row.categoryAgreement === 'multiple-categories').kind, 'unresolved');
  assert.ok(controlQueryResult.every(row => row.optionalStructuredCaptures === 0));
  const receipt = { checkedAt: new Date().toISOString(), collectionVersion: COLLECTION_VERSION, classifierVersion: CLASSIFIER_VERSION, runtime:'Node runs actual compiled collector/verifier/report; D1 executes in Miniflare/workerd', migration:'0013_classification_evidence.sql', historicalKindUnchanged:true, rows, publicViews:all.totals.views, partitions, directoryCalls, preparedProductionSelectAccepted:true, controlQueryAccepted:controlQueryResult, productionCalls:0, limits:['Collector and WebCrypto run in Node 24.14.1, not inside a production Worker isolate.','Synthetic inputs and ephemeral signing key; not vendor or native-provider acceptance.','Multiple compatible declarations retain their category without authenticating an identity or trigger.','No historical rewrite, raw-profile activation, human count or population accuracy rate.'] };
  writeFileSync(output, JSON.stringify(receipt,null,2)+'\n', { flag:'wx' }); console.log(JSON.stringify(receipt));
} finally { globalThis.fetch = originalFetch; await mf.dispose(); }
