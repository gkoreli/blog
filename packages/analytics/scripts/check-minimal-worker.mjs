import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { freshSchemaPath, schemaObjects } from './fresh-schema.mjs';
import { CLIENT_REGISTRY, KNOWN_CLIENT_PRODUCTS } from '../src/client-registry.ts';
import { retainedMatchedProducts } from '../src/retained-client-products.ts';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from '../src/versions.ts';

const blogRequire = createRequire(new URL('../../blog/package.json', import.meta.url));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', {
  paths: [dirname(require.resolve('wrangler/package.json'))],
})));
const entry = fileURLToPath(new URL('../examples/minimal-worker/worker.ts', import.meta.url));
// Only the test harness waits for all scheduled writes before returning. The
// example itself uses the real ctx.waitUntil API and returns its page promptly.
const bundle = await build({ stdin: { contents: `import worker from ${JSON.stringify(entry)};
export default {async fetch(request,env) {
  const pending=[];
  const response=await worker.fetch(request,env,{waitUntil(p){pending.push(p)}});
  const work=await Promise.allSettled(pending);
  const headers=new Headers(response.headers);
  headers.set('x-test-background-failures',String(work.filter(r=>r.status==='rejected').length));
  return new Response(response.body,{status:response.status,headers});
}};`, resolveDir: dirname(entry) }, bundle: true, format: 'esm', platform: 'browser', write: false });
const secret = randomBytes(32).toString('hex');
let outbound = 0;
function instance(hashKey = randomBytes(32).toString('hex')) {
  return new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-03-01', cf: {}, d1Databases: { DB: 'minimal-worker' },
    bindings: { ANALYTICS_HASH_KEY: hashKey, ADMIN_SECRET: secret },
    outboundService() { outbound++; throw new Error('External network disabled in portability check'); },
    log: new Log(LogLevel.ERROR),
  });
}
const runtime = instance();
const failedRuntime = instance('');
const browser = 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36';
const headers = { 'User-Agent': browser, Accept: 'text/html', 'Accept-Language': 'en',
  'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' };
let requests = 0;
async function visit(path, init = {}, host = 'publication.example', mf = runtime) {
  requests++;
  return mf.dispatchFetch(`https://${host}${path}`, { ...init, headers: { ...headers, ...init.headers } });
}

/** Separate native composed-blog phase: no production configuration, raw
 * diagnostics, browser/human labels or external requests. Existing example
 * request/row counters above remain independent of these controlled fixtures.
 */
async function checkDetectionProfiles() {
  const composedEntry = fileURLToPath(new URL('../../blog/src/worker/index.ts', import.meta.url));
  const receiptEntry = fileURLToPath(new URL('../src/observation-receipt.ts', import.meta.url));
  const receiptBundle = await build({ stdin: { contents: `export {storedObservationReceipt} from ${JSON.stringify(receiptEntry)};`,
    resolveDir: dirname(receiptEntry) }, bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent' });
  const { storedObservationReceipt } = await import('data:text/javascript;base64,' + Buffer.from(receiptBundle.outputFiles[0].contents).toString('base64'));
  // Only this harness waits for background work and exposes the closed success
  // receipt in a test response header. No production route/collector is changed.
  const composedBundle = await build({ stdin: { contents: `import worker from ${JSON.stringify(composedEntry)};
export default {async fetch(request,env) {
  const pending=[],events=[],previous=console.log;
  console.log=(...values)=>{if(['analytics.observation_attempt','analytics.observation_stored'].includes(values[0]))events.push(values)};
  try {
    // Node's transport rewrites Sec-Fetch-Mode to cors. Supply the intended
    // native Request fixture explicitly; this is not browser/wire fidelity.
    const inputHeaders=new Headers(request.headers),fixture=inputHeaders.get('x-test-fetch-metadata');
    if(!['navigation','absent'].includes(fixture))throw Error('Missing native metadata fixture');
    for(const name of ['Mode','Dest','Site','User'])inputHeaders.delete('Sec-Fetch-'+name);
    if(fixture==='navigation')for(const [name,value]of [['Mode','navigate'],['Dest','document'],['Site','none'],['User','?1']])inputHeaders.set('Sec-Fetch-'+name,value);
    inputHeaders.delete('x-test-fetch-metadata');
    const input=new Request(request,{headers:inputHeaders});
    const response=await worker.fetch(input,env,{waitUntil(p){pending.push(p)}});
    const work=await Promise.allSettled(pending),headers=new Headers(response.headers);
    const attempts=events.filter(e=>e[0]==='analytics.observation_attempt');
    const stores=events.filter(e=>e[0]==='analytics.observation_stored');
    headers.set('x-test-background-failures',String(work.filter(r=>r.status==='rejected').length));
    headers.set('x-test-attempts',String(attempts.length));headers.set('x-test-stores',String(stores.length));
    if(stores.length===1) {
      const stored=stores[0][1];headers.set('x-test-observation-id',stored.storage.observationId);
      headers.set('x-test-receipt',btoa(JSON.stringify(stored.receipt)));
      headers.set('x-test-operation-match',String(attempts.length===1&&attempts[0][1].operationId===stored.operationId));
    }
    return new Response(response.body,{status:response.status,headers});
  } finally {console.log=previous}
}};`, resolveDir: dirname(composedEntry) }, bundle: true, format: 'esm', platform: 'browser', write: false,
    external: ['cloudflare:workers'], logLevel: 'silent' });
  const profiles = [
    { label: 'cubot', ua: 'Mozilla/5.0 (Linux; Android 6.0; CUBOT MAX) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36', traffic: 'browser', kind: 'browser', reason: 'navigation-shaped-network-unlisted', names: [], products: [] },
    { label: 'uri-negative', ua: 'Mozilla/5.0 Chrome/150.0 Safari/537.36 (+https://example.test/;GPTBot/1.0)', traffic: 'browser', kind: 'browser', reason: 'navigation-shaped-network-unlisted', names: [], products: [] },
    { label: 'gpt-positive', ua: 'GPTBot/1.0', traffic: 'ai', kind: 'ai-crawler', reason: 'GPTBot', names: ['GPTBot'], products: ['GPTBot'] },
    { label: 'seo-name', ua: 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)', traffic: 'bot', kind: 'seo-crawler', reason: 'SemrushBot', names: ['SemrushBot'], products: ['SemrushBot'] },
    { label: 'http-name', ua: 'node-fetch', traffic: 'bot', kind: 'http-client', reason: 'node-fetch', names: ['node-fetch'], products: ['node-fetch'] },
    { label: 'all-products', ua: [...KNOWN_CLIENT_PRODUCTS].sort().join(' '), traffic: 'bot', kind: 'unresolved', reason: 'multiple-client-declarations', names: CLIENT_REGISTRY.map(client => client.name).sort(), products: [...KNOWN_CLIENT_PRODUCTS].sort() },
    { label: 'malformed-browser', ua: 'Chrome/150.0/extra', traffic: 'browser', kind: 'unresolved', reason: 'unrecognized-browser-claim', names: [], products: [] },
    { label: 'missing-metadata', ua: browser, missingMetadata: true, traffic: 'browser', kind: 'unresolved', reason: 'fetch-metadata-absent', names: [], products: [] },
  ].map(profile => ({ ...profile, id: randomUUID() }));
  assert.equal(CLIENT_REGISTRY.length, 63); assert.equal(KNOWN_CLIENT_PRODUCTS.size, 74);
  const issuedAt = Date.now() - 1000, expiresAt = issuedAt + 600000;
  const grant = randomBytes(32).toString('hex');
  let nativeRequests = 0, mockedFeedRequests = 0;
  const detectionRuntime = new Miniflare({ modules: true, script: composedBundle.outputFiles[0].text,
    compatibilityDate: '2026-03-01', cf: { asn: 64512, asOrganization: 'Explicit synthetic native fixture' },
    d1Databases: { DB: 'detection-profiles' },
    bindings: { ANALYTICS_HASH_KEY: randomBytes(32).toString('hex'),
      OWNER_MARK_GRANT: JSON.stringify({ token: grant, issuedAt, expiresAt }),
      ANALYTICS_CALIBRATION: JSON.stringify({ issuedAt, expiresAt,
        trials: profiles.map(profile => ({ id: profile.id, condition: 'http-client', operator: 'controlled-curl' })) }),
    },
    // Deterministic local failed-feed responses exercise existing bounded
    // network evidence without contacting or impersonating any vendor.
    outboundService() { mockedFeedRequests++; return new Response('Synthetic unavailable feed', { status: 503 }); },
    log: new Log(LogLevel.ERROR),
  });
  const controlHeaders = profile => {
    const value = new Headers({ 'User-Agent': profile.ua, Accept: 'text/html', 'Accept-Language': 'en',
      'CF-Connecting-IP': '192.0.2.44', 'X-Test-Fetch-Metadata': profile.missingMetadata ? 'absent' : 'navigation' });
    if (!profile.missingMetadata) {
      value.set('Sec-Fetch-Mode', 'navigate'); value.set('Sec-Fetch-Dest', 'document');
      value.set('Sec-Fetch-Site', 'none'); value.set('Sec-Fetch-User', '?1');
    }
    return value;
  };
  const call = (path, profile, init = {}) => {
    nativeRequests++;
    const value = controlHeaders(profile);
    for (const [name, content] of new Headers(init.headers)) value.set(name, content);
    return detectionRuntime.dispatchFetch('https://detection.example' + path, { ...init, headers: value });
  };
  try {
    const db = await detectionRuntime.getD1Database('DB');
    const snapshot = new DatabaseSync(':memory:');
    try {
      snapshot.exec(readFileSync(freshSchemaPath, 'utf8'));
      for (const row of schemaObjects(snapshot)) await db.prepare(row.sql).run();
    } finally { snapshot.close(); }
    assert.equal((await call('/analytics-check/' + profiles[0].id, profiles[0])).status, 403);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observations').first()).n, 0);
    const accepted = [];
    for (const profile of profiles) {
      const marked = await call('/api/owner', profile, { method: 'POST', headers: { Authorization: `Bearer ${grant}` } });
      assert.equal(marked.status, 200); assert.equal((await marked.json()).marked, true);
      const ready = await call('/api/analytics-calibration/' + profile.id + '/ready', profile);
      assert.equal(ready.status, 200); assert.equal(ready.headers.get('x-test-attempts'), '0');
      const page = await call('/analytics-check/' + profile.id, profile);
      assert.equal(page.status, 200, profile.label);
      assert.equal(page.headers.get('x-test-background-failures'), '0', profile.label);
      assert.equal(page.headers.get('x-test-attempts'), '1', profile.label);
      assert.equal(page.headers.get('x-test-stores'), '1', profile.label);
      assert.equal(page.headers.get('x-test-operation-match'), 'true', profile.label);
      const reference = page.headers.get('x-test-observation-id'); assert.match(reference, /^[1-9][0-9]*$/);
      const row = await db.prepare('SELECT CAST(id AS TEXT) AS id,path,is_owner,traffic_class,agent_name,reader_kind,reader_reason,collection_version,classifier_version,classification_evidence,signature_evidence,signature_status,signature_agent,vendor_ip_evidence,request_evidence FROM page_observations WHERE id=CAST(? AS INTEGER)').bind(reference).first();
      assert.equal(row.id, reference); assert.equal(row.path, '/analytics-check/' + profile.id);
      assert.equal(row.is_owner, 1); assert.equal(row.traffic_class, profile.traffic, profile.label);
      assert.equal(row.agent_name, profile.names.length === 1 ? profile.names[0] : null, profile.label);
      assert.equal(row.reader_kind, profile.kind, profile.label); assert.equal(row.reader_reason, profile.reason, profile.label);
      assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(row.classifier_version, CLASSIFIER_VERSION);
      assert.equal(row.request_evidence, null);
      const classification = JSON.parse(row.classification_evidence), receipt = JSON.parse(Buffer.from(page.headers.get('x-test-receipt'), 'base64').toString('utf8'));
      assert.equal(classification.version, '2026-11-06.1'); assert.equal(classification.classifierProfile, CLASSIFIER_VERSION);
      assert.deepEqual(classification.declarations.candidates, profile.names, profile.label);
      assert.deepEqual(retainedMatchedProducts(classification), profile.products, profile.label);
      assert.equal(classification.declarations.status, profile.names.length === 0 ? 'none' : profile.names.length === 1 ? 'single' : 'multiple');
      assert.equal(receipt.classifierProfile, row.classifier_version); assert.equal(receipt.readerKind, row.reader_kind);
      assert.equal(receipt.declarations.candidateCount, profile.names.length);
      assert.equal(receipt.declarations.candidateNames, profile.names.join(',') || 'none');
      assert.equal(receipt.declarations.categoryAgreement, classification.categoryAgreement);
      assert.equal(receipt.fetchMetadataBits, classification.fetchMetadataBits);
      assert.equal(receipt.signature.status, 'absent'); assert.equal(JSON.parse(row.signature_evidence).source, 'local-webbotauth');
      assert.deepEqual(receipt, storedObservationReceipt({ readerKind: row.reader_kind,
        signatureStatus: row.signature_status, signatureAgent: row.signature_agent,
        classificationEvidence: classification, signatureEvidence: JSON.parse(row.signature_evidence),
        vendorIpEvidence: JSON.parse(row.vendor_ip_evidence) }), profile.label + ': full current receipt projection');
      const bytes = Buffer.byteLength(row.classification_evidence); assert.ok(bytes <= 2048, profile.label);
      accepted.push({ label: profile.label, kind: row.reader_kind, reason: row.reader_reason,
        candidates: profile.names.length, products: profile.products.length, classificationEvidenceBytes: bytes });
    }
    const counters = (await db.prepare('SELECT page_responses,script,attempt,queued,not_queued,threw,beacon FROM analytics_calibration_trials ORDER BY id').all()).results;
    assert.equal(counters.length, profiles.length);
    assert.ok(counters.every(row => row.page_responses === 1 && ['script', 'attempt', 'queued', 'not_queued', 'threw', 'beacon'].every(key => row[key] === 0)));
    const counts = await db.prepare('SELECT COUNT(*) AS n,SUM(is_owner) AS excluded FROM page_observations').first();
    assert.equal(counts.n, profiles.length); assert.equal(counts.excluded, profiles.length);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observation_diagnostics').first()).n, 0);
    // Permanent owner flags survive deletion of the separate current-day marks.
    await db.prepare('DELETE FROM owner_clients').run();
    const report = await call('/api/stats?range=7d&traffic=all', profiles[0]);
    assert.equal(report.status, 200); assert.equal((await report.json()).totals.views, 0);
    assert.ok(mockedFeedRequests <= 5, 'one GPT source plus four-source complete-catalogue budget');
    return { checkedAt: new Date().toISOString(), bundleSha256: createHash('sha256').update(composedBundle.outputFiles[0].contents).digest('hex'),
      actualExecutor: 'Node supplies synthetic HTTP inputs; planned calibration operator labels are not execution proof',
      requests: nativeRequests, storedEvents: profiles.length, publicEventsAfterMarksRemoved: 0,
      ownerExcluded: profiles.length, attemptedAndAcknowledged: profiles.length, exactStorageReadbacks: profiles.length,
      fullCurrentReceiptMatches: profiles.length,
      profiles: accepted, collection: COLLECTION_VERSION, classifier: CLASSIFIER_VERSION,
      optionalDiagnosticRows: 0, mockedFeedRequests, externalRequests: 0, productionRequests: 0, humanLabels: 0,
      limits: ['Actual composed Worker and native D1/crypto with explicit synthetic edge ASN and a special-range test address; no vendor source is authenticated.',
        'Outbound fetches have local unavailable-feed responses configured; the address guard can avoid them entirely.',
        'A test-only Request adapter supplies canonical Fetch Metadata because Node transport rewrites Sec-Fetch-Mode; no wire-fidelity claim.',
        'Node supplies HTTP requests; no real browser, vendor identity or population accuracy claim.'] };
  } finally { await detectionRuntime.dispose(); }
}
try {
  const db = await runtime.getD1Database('DB');
  const snapshot = new DatabaseSync(':memory:');
  try {
    snapshot.exec(readFileSync(freshSchemaPath, 'utf8'));
    for (const row of schemaObjects(snapshot)) await db.prepare(row.sql).run();
  } finally { snapshot.close(); }
  assert.equal((await visit('/api/stats')).status, 200);
  const empty = await (await visit('/api/stats')).json();
  assert.equal(empty.totals.views, 0);
  assert.equal((await visit('/notes')).headers.get('x-test-background-failures'), '0');
  await visit('/notes', { headers: { Accept: 'text/markdown' } });
  await visit('/notes', { headers: { 'User-Agent': 'HeadlessChrome/130.0.0.0' } });
  await visit('/notes', { headers: { 'User-Agent': 'ExaSearchBot/1.0' } });
  for (const [path, init, status] of [
    ['/notes', { method: 'HEAD' }, 200], ['/notes', { method: 'POST' }, 405],
    ['/notes', { headers: { 'Sec-Purpose': 'prefetch' } }, 200],
    ['/notes.md', {}, 200], ['/missing', {}, 404], ['/api/stats', { method: 'POST' }, 405],
  ]) assert.equal((await visit(path, init)).status, status);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observations').first()).n, 4);
  const before = await (await visit('/api/stats')).json();
  assert.equal(before.totals.views, 4);
  const stored = (await db.prepare('SELECT reader_kind,agent_name,representation,daily_client_id,signature_status FROM page_observations ORDER BY id').all()).results;
  assert.deepEqual(stored.map(row => row.representation), ['html', 'markdown', 'html', 'html']);
  assert.equal(stored[2].reader_kind, 'headless-browser');
  assert.equal(stored[3].agent_name, 'ExaSearchBot');
  assert.equal(stored[3].reader_kind, 'ai-search');
  assert.equal(stored[3].signature_status, null);
  assert.equal((await visit('/api/owner', { method: 'POST' })).status, 401);
  assert.equal((await visit('/api/owner', { method: 'POST', headers: { Authorization: `Bearer ${secret}` } })).status, 200);
  const marked = await (await visit('/api/stats')).json();
  assert.equal(marked.totals.views, 2); // Prior HTML + Markdown now owner-excluded.
  await visit('/notes');
  assert.equal((await (await visit('/api/stats')).json()).totals.views, 2);
  await visit('/notes', {}, 'another-publication.example');
  assert.equal((await (await visit('/api/stats')).json()).totals.views, 3);
  const ids = (await db.prepare("SELECT daily_client_id FROM page_observations WHERE agent_name IS NULL AND reader_kind <> 'headless-browser' ORDER BY id").all()).results;
  assert.equal(ids[0].daily_client_id, ids[1].daily_client_id);
  assert.notEqual(ids[0].daily_client_id, ids.at(-1).daily_client_id);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM page_observation_diagnostics').first()).n, 0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM analytics_calibration_trials').first()).n, 0);
  // Missing configuration must be visible as failed background work, while the
  // page still works. The report failure must not become a plausible zero.
  const failed = await visit('/notes', {}, 'publication.example', failedRuntime);
  assert.equal(failed.status, 200);
  assert.equal(failed.headers.get('x-test-background-failures'), '1');
  const failedReport = await visit('/api/stats', {}, 'publication.example', failedRuntime);
  assert.equal(failedReport.status, 503);
  assert.equal(failedReport.headers.get('cache-control'), 'no-store');
  assert.equal(outbound, 0);
  const detectionProfiles = await checkDetectionProfiles();
  console.log(JSON.stringify({ result: 'passed', requests, storedEvents: 6, publicEvents: 3,
    ownerExcluded: 3, secondOriginIdSeparated: true, diagnostics: 0, externalRequests: outbound,
    storedKinds: stored.map(row => row.reader_kind), productionRequests: 0, humanLabels: 0, detectionProfiles }));
} finally { await Promise.all([runtime.dispose(), failedRuntime.dispose()]); }
