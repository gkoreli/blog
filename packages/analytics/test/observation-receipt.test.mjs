import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { observePageResponse } from '../.test-dist/index.js';
import { storedObservationReceipt } from '../.test-dist/observation-receipt.js';
import { COLLECTION_VERSION } from '../.test-dist/versions.js';
import { ed25519JwkThumbprint } from '../.test-dist/webbotauth.js';
import { KNOWN_AGENT_NAMES } from '../.test-dist/classify.js';
import { FAILURE_OUTCOMES } from '../.test-dist/signature-evidence.js';
import { isObservationId, observationStorageReference } from '../.test-dist/observation-storage.js';

function fixture(runOverride) {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const DB = { prepare(sql) { return { bind(...values) { return { async run() {
    const perform = () => {
      const statement = sqlite.prepare(sql);
      const results = sql.includes('RETURNING') ? statement.all(...values) : (statement.run(...values), []);
      const metadata = sqlite.prepare('SELECT changes() changes, CAST(last_insert_rowid() AS TEXT) last_row_id').get();
      return { success: true, results, meta: { changes: metadata.changes, last_row_id: Number(metadata.last_row_id) } };
    };
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
  assert.deepEqual(stored[0].storage, { version: '2026-10-27.1', status: 'returned', observationId: String(row.id) });
  assert.equal(receipt.readerKind, row.reader_kind); assert.equal(receipt.readerKind, 'ai-search');
  assert.equal(receipt.signature.outcome, evidence.localOutcome); assert.equal(receipt.signature.outcome, 'verified');
  assert.equal(receipt.signature.reason, 'none'); assert.equal(receipt.signature.reasonCount, 0); assert.equal(receipt.signature.reasonNames, 'none');
  assert.equal(receipt.signature.documentedVendorStatus, evidence.vendor.status); assert.equal(receipt.signature.documentedVendorStatus, 'matching-origin');
  assert.equal(receipt.signature.signer, 'Exa'); assert.equal(receipt.signature.source, 'local-webbotauth');
  for (const field of Object.keys(evidence.coverage.covered)) assert.equal(receipt.signature.coverage[field], evidence.coverage.covered[field]);
  assert.equal(receipt.signature.coverage.authority, true); assert.equal(receipt.signature.coverage.userAgent, false);
  assert.equal(receipt.native.categoryValue, evidence.native.category.value); assert.equal(receipt.native.verifiedBot, 'false'); assert.equal(receipt.native.signedAgent, 'unavailable');
  assert.equal(receipt.declarations.candidateCount, 1); assert.equal(receipt.declarations.candidateNames, 'ExaSearchBot');
  for (const canary of ['192.0.2.1', 'private-token', 'secret-value', 'private-cookie', 'private-credential', 'https://crawler.exa.ai', row.daily_client_id, '"id":'])
    assert.equal(JSON.stringify(logs).includes(canary), false, canary);
  // The receipt snapshots the bound values; later mutation cannot rewrite it.
  const inputObservation = { readerKind: row.reader_kind, signatureStatus: row.signature_status, signatureAgent: 'https://private-signer.example', signatureEvidence: evidence, classificationEvidence: classification };
  const snapshot = storedObservationReceipt(inputObservation);
  assert.equal(snapshot.signature.signer, 'Other');
  evidence.coverage.covered.authority = false; classification.declarations.candidates.push('ExaUser');
  evidence.directoryPublication.status = 'different-publisher';
  assert.equal(snapshot.signature.coverage.authority, true); assert.equal(snapshot.declarations.candidateNames, 'ExaSearchBot');
  assert.equal(snapshot.directoryPublication.status, 'matching-publisher');
});

test('storage references accept only one canonical positive signed-64-bit text rowid', () => {
  for (const value of ['1', '9007199254740993', '9223372036854775807']) {
    assert.equal(isObservationId(value), true);
    assert.equal(observationStorageReference([{ observation_id: value }]).observationId, value);
  }
  for (const value of [null, undefined, 1, 9007199254740992, 0n, '', '0', '-1', '01', '+1', '1e2', '1.0', ' 1', '9223372036854775808', '9'.repeat(100), 'private@example.invalid']) {
    assert.equal(isObservationId(value), false);
    assert.deepEqual(observationStorageReference([{ observation_id: value }]), { version: '2026-10-27.1', status: 'unavailable', observationId: 'unavailable' });
  }
  for (const rows of [undefined, {}, [], [null], [{}], [{ observation_id: '1' }, { observation_id: '2' }]])
    assert.equal(observationStorageReference(rows).status, 'unavailable');
});

test('acknowledged writes preserve the base receipt when the returned row reference is unavailable', async () => {
  for (const results of [undefined, [], [{}], [{ observation_id: 1 }], [{ observation_id: '1' }, { observation_id: '2' }]]) {
    let writes = 0;
    const { sqlite, DB } = fixture((_sql, perform) => { writes++; return { ...perform(), results }; });
    const logs = await capture(async () => { assert.equal((await collect(DB, request()))[0].status, 'fulfilled'); });
    assert.equal(writes, 1); assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM page_observations').get().n, 1);
    assert.equal(logs.find(log => log.event === 'analytics.observation_stored').storage.status, 'unavailable');
  }
});

test('exact large row reference also links optional diagnostics without numeric rounding', async () => {
  const { sqlite, DB } = fixture();
  sqlite.exec("INSERT INTO sqlite_sequence(name,seq) VALUES('page_observations',9007199254740994)");
  const logs = await capture(async () => { assert.equal((await collect(DB, request(),
    { publicPagePaths: async () => new Set(['/article']) }, { ANALYTICS_DIAGNOSTICS: 'private-v1' }))[0].status, 'fulfilled'); });
  const storage = logs.find(log => log.event === 'analytics.observation_stored').storage;
  assert.equal(storage.observationId, '9007199254740995'); assert.equal(storage.status, 'returned');
  assert.equal(sqlite.prepare('SELECT CAST(id AS TEXT) ref FROM page_observations').get().ref, storage.observationId);
  assert.equal(sqlite.prepare('SELECT CAST(observation_id AS TEXT) ref FROM page_observation_diagnostics').get().ref, storage.observationId);
  assert.equal(logs.some(log => log.event === 'analytics.diagnostic_write_failed'), false);
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
  assert.equal(receipt.signature.signer, 'none'); assert.deepEqual(receipt.signature.coverage, { status: 'unavailable' });
  assert.equal(receipt.signature.verifierProfile, 'not-applicable');
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

test('scalar receipts retain zero/unknown/conflict states when nulls and empty arrays are omitted', async () => {
  for (const name of [...KNOWN_AGENT_NAMES, ...Object.keys(FAILURE_OUTCOMES)]) {
    assert.notEqual(name, 'none'); assert.equal(name.includes(','), false);
  }
  const { DB } = fixture();
  const logs = await capture(async () => { await collect(DB, request({ 'User-Agent': 'ExaUser/1.0 ExaSearchBot/1.0' })); });
  const receipt = logs.find(log => log.event === 'analytics.observation_stored').receipt;
  assert.equal(receipt.version, '2026-10-29.2'); assert.equal(receipt.readerKind, 'unresolved');
  assert.equal(receipt.declarations.candidateCount, 2); assert.equal(receipt.declarations.candidateNames, 'ExaSearchBot,ExaUser');
  assert.equal(receipt.declarations.categoryAgreement, 'multiple-categories');
  assert.equal(receipt.signature.reasonCount, 0); assert.equal(receipt.signature.reasonNames, 'none');
  assert.equal(receipt.native.signedAgent, 'unavailable');
  const observedOmissionModel = value => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== null && !(Array.isArray(item) && item.length === 0)).map(([key, item]) => [key, observedOmissionModel(item)]));
    return value;
  };
  assert.deepEqual(observedOmissionModel(receipt), receipt);
  const requireScalars = value => {
    assert.notEqual(value, null); assert.equal(Array.isArray(value), false); assert.notEqual(value, '');
    if (typeof value === 'object') for (const item of Object.values(value)) requireScalars(item);
    else assert.ok(['string', 'number', 'boolean'].includes(typeof value));
  };
  requireScalars(receipt);
});
