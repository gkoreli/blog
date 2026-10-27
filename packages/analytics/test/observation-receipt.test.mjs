import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { observePageResponse } from '../.test-dist/index.js';
import { storedObservationReceipt } from '../.test-dist/observation-receipt.js';
import { COLLECTION_VERSION } from '../.test-dist/versions.js';
import { ed25519JwkThumbprint } from '../.test-dist/webbotauth.js';

function fixture(runOverride) {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const DB = { prepare(sql) { return { bind(...values) { return { async run() {
    const perform = () => { const result = sqlite.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } }; };
    return runOverride ? runOverride(sql, perform) : perform();
  } }; } }; } };
  return { sqlite, DB };
}
function request(headers = {}) {
  const req = new Request('https://publication.example/article?private-token=secret-value', { headers: {
    'User-Agent': 'ExaSearchBot/1.0', Accept: 'text/html', 'CF-Connecting-IP': '192.0.2.1',
    Cookie: 'private-cookie', Authorization: 'private-credential', ...headers,
  } });
  Object.defineProperty(req, 'cf', { value: { verifiedBotCategory: 'Search Engine Crawler', botManagement: { verifiedBot: false } } });
  return req;
}
async function capture(run) {
  const logs = [], originalLog = console.log, originalWarn = console.warn;
  console.log = (event, fields) => logs.push({ event, ...fields });
  console.warn = (event, fields) => logs.push({ event, ...fields });
  try { await run(logs); } finally { console.log = originalLog; console.warn = originalWarn; }
  return logs;
}
function collect(DB, req, options = {}, env = {}) {
  const work = [];
  observePageResponse(req, new Response('page', { headers: { 'Content-Type': 'text/html' } }), 'html',
    { DB, ANALYTICS_HASH_KEY: 'fixture-only', ...env }, { waitUntil(promise) { work.push(promise); } }, options);
  return Promise.allSettled(work);
}

test('actual crypto receipt reflects persisted role, coverage and nullable provider evidence without raw context', async () => {
  const { sqlite, DB } = fixture();
  const req = request(), epoch = Math.floor(Date.now() / 1000);
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey), kid = await ed25519JwkThumbprint(jwk);
  const agent = '"https://crawler.exa.ai"';
  const input = `("@authority" "signature-agent");created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
  const base = `"@authority": publication.example\n"signature-agent": ${agent}\n"@signature-params": ${input}`;
  req.headers.set('Signature-Agent', agent); req.headers.set('Signature-Input', `sig=${input}`);
  req.headers.set('Signature', `sig=:${Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64')}:`);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => { assert.equal(String(url), 'https://crawler.exa.ai/.well-known/http-message-signatures-directory'); return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' } }); };
  let logs;
  try { logs = await capture(async () => { assert.equal((await collect(DB, req))[0].status, 'fulfilled'); }); }
  finally { globalThis.fetch = originalFetch; }
  const stored = logs.filter(log => log.event === 'analytics.observation_stored'); assert.equal(stored.length, 1);
  const row = sqlite.prepare('SELECT * FROM page_observations').get();
  const evidence = JSON.parse(row.signature_evidence), classification = JSON.parse(row.classification_evidence), receipt = stored[0].receipt;
  assert.equal(stored[0].operationId, logs.find(log => log.event === 'analytics.observation_attempt').operationId);
  assert.equal(stored[0].collectionVersion, row.collection_version); assert.equal(row.collection_version, COLLECTION_VERSION);
  assert.equal(receipt.readerKind, row.reader_kind); assert.equal(receipt.readerKind, 'ai-search');
  assert.equal(receipt.signature.outcome, evidence.localOutcome); assert.equal(receipt.signature.outcome, 'verified');
  assert.equal(receipt.signature.reason, evidence.localReason); assert.deepEqual(receipt.signature.reasons, evidence.localReasons);
  assert.equal(receipt.signature.documentedVendorStatus, evidence.vendor.status); assert.equal(receipt.signature.documentedVendorStatus, 'matching-origin');
  assert.equal(receipt.signature.signer, 'Exa'); assert.equal(receipt.signature.source, 'local-webbotauth');
  for (const field of Object.keys(evidence.coverage.covered)) assert.equal(receipt.signature.coverage[field], evidence.coverage.covered[field]);
  assert.equal(receipt.signature.coverage.authority, true); assert.equal(receipt.signature.coverage.userAgent, false);
  assert.equal(receipt.native.categoryValue, evidence.native.category.value); assert.equal(receipt.native.verifiedBot, false); assert.equal(receipt.native.signedAgent, null);
  assert.deepEqual(receipt.declarations.candidates, classification.declarations.candidates);
  for (const canary of ['192.0.2.1', 'private-token', 'secret-value', 'private-cookie', 'private-credential', 'https://crawler.exa.ai', row.daily_client_id, '"id":'])
    assert.equal(JSON.stringify(logs).includes(canary), false, canary);
  // The receipt snapshots the bound values; later mutation cannot rewrite it.
  const inputObservation = { readerKind: row.reader_kind, signatureStatus: row.signature_status, signatureAgent: 'https://private-signer.example', signatureEvidence: evidence, classificationEvidence: classification };
  const snapshot = storedObservationReceipt(inputObservation);
  assert.equal(snapshot.signature.signer, 'Other');
  evidence.coverage.covered.authority = false; classification.declarations.candidates.push('ExaUser');
  assert.equal(snapshot.signature.coverage.authority, true); assert.deepEqual(snapshot.declarations.candidates, ['ExaSearchBot']);
});

test('stored receipt waits for the insert acknowledgement', async () => {
  let release, started;
  const gate = new Promise(resolve => { release = resolve; }), ready = new Promise(resolve => { started = resolve; });
  const { sqlite, DB } = fixture(async (_sql, perform) => { started(); await gate; return perform(); });
  const logs = await capture(async logs => {
    const work = collect(DB, request()); await ready;
    assert.equal(logs.some(log => log.event === 'analytics.observation_stored'), false);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 0);
    release(); assert.equal((await work)[0].status, 'fulfilled');
  });
  assert.equal(logs.filter(log => log.event === 'analytics.observation_stored').length, 1);
});

test('negative/missing/non-one-row acknowledgements never emit a stored receipt, even if a row was inserted', async () => {
  for (const acknowledgement of [{ success: false, meta: { changes: 1 } }, { success: true, meta: { changes: 0 } },
    { success: true, meta: { changes: 2 } }, { success: true }, undefined]) {
    const { sqlite, DB } = fixture((_sql, perform) => { perform(); return acknowledgement; });
    const logs = await capture(async () => { assert.equal((await collect(DB, request()))[0].status, 'rejected'); });
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
    assert.equal(logs.some(log => log.event === 'analytics.observation_stored'), false);
    assert.equal(logs.find(log => log.event === 'analytics.observation_write_failed').reason, 'unacknowledged-insert');
    assert.equal(logs.some(log => Object.hasOwn(log, 'receipt')), false);
  }
});

test('a thrown database error has no receipt and never copies private error text', async () => {
  const { DB } = fixture(() => { throw Error('private-error@example.invalid'); });
  const logs = await capture(async () => { assert.equal((await collect(DB, request()))[0].status, 'rejected'); });
  assert.equal(logs.some(log => log.event === 'analytics.observation_stored'), false);
  assert.equal(JSON.stringify(logs).includes('private-error'), false);
});

test('a negative acknowledgement without an insert cannot produce a receipt', async () => {
  const { sqlite, DB } = fixture(() => ({ success: false, meta: { changes: 0 } }));
  const logs = await capture(async () => { assert.equal((await collect(DB, request()))[0].status, 'rejected'); });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 0);
  assert.equal(logs.some(log => log.event === 'analytics.observation_stored'), false);
  assert.equal(logs.find(log => log.event === 'analytics.observation_write_failed').reason, 'unacknowledged-insert');
});

test('optional diagnostic failure preserves a base receipt; injected outcomes remain labelled', async () => {
  const { sqlite, DB } = fixture(); sqlite.exec('DROP TABLE page_observation_diagnostics');
  const logs = await capture(async () => { await collect(DB, request({ 'Signature-Agent': '"https://crawler.exa.ai"' }),
    { publicPagePaths: async () => new Set(['/article']), verifySignature: async () => ({ status: 'verified', agent: 'https://crawler.exa.ai' }) },
    { ANALYTICS_DIAGNOSTICS: 'private-v1' }); });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
  assert.ok(logs.some(log => log.event === 'analytics.diagnostic_write_failed'));
  const receipt = logs.find(log => log.event === 'analytics.observation_stored').receipt;
  assert.equal(receipt.signature.source, 'test-injected'); assert.equal(receipt.signature.outcome, 'test-injected');
  assert.equal(receipt.signature.signer, null); assert.equal(receipt.signature.coverage, null);
});

test('ineligible responses have neither a persistence attempt nor a stored receipt', async () => {
  const { DB } = fixture();
  const logs = await capture(async () => { const work = [];
    observePageResponse(new Request('https://publication.example/api/stats'), new Response('{}'), 'html',
      { DB, ANALYTICS_HASH_KEY: 'fixture' }, { waitUntil(promise) { work.push(promise); } });
    assert.equal(work.length, 0);
  });
  assert.deepEqual(logs, []);
});
