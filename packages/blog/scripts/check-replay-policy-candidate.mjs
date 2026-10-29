import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { replayPolicyFixture } from '../drafts/research/analytics-retrospective/replay-policy-fixture.mjs';

const [inputFile, output, fixtureOutput] = process.argv.slice(2);
assert.ok(inputFile && output && fixtureOutput, 'Provide frozen private retained input, closed output and private fixture output');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inputBytes = readFileSync(inputFile), input = JSON.parse(inputBytes);
const accepted = JSON.parse(readFileSync('packages/blog/drafts/research/analytics-retrospective/current-verifier-cohort.json'));
assert.equal(hash(inputBytes), accepted.inputSha256, 'Use the exact previously accepted retained contexts');
assert.equal(input.trials.length, 12);
const originals = input.trials.filter(row => row.variant === 'original');
assert.equal(originals.length, 4); assert.ok(originals.every(row => row.vendor === 'exa'));
const fixture = await replayPolicyFixture();
writeFileSync(fixtureOutput, JSON.stringify(fixture) + '\n', { flag: 'wx', mode: 0o600 });
const sourcePath = resolve('packages/analytics/src/webbotauth.ts'), source = readFileSync(sourcePath, 'utf8');
// Research adapter uses the actual parser without adding production exports.
const adapter = `${source}\nexport async function researchReplayFacts(request, label, verdict, cache) {
 const context=candidateContext(request);if(context.status!=='ready')return null;
 const candidate=context.tagged.find(candidate=>candidate.label===label);if(!candidate)return null;
 const expires=integerValue(parameter(candidate.input.parameters,'expires'));
 const tokens=await webBotAuthCandidateReuseTokens(request,label,verdict.agent,cache);
 return expires===null||tokens===null?null:{expires,tokens};
}`;
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
 import {verifyWebBotAuthCandidate,createWebBotAuthCache,inspectWebBotAuthCandidates,researchReplayFacts} from 'replay-proof-adapter';
 import {VERIFIER_PROFILE_VERSION} from './packages/analytics/src/versions.ts';
 let secret;
 async function privateScope(parts){secret??=crypto.subtle.generateKey({name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',await secret,new TextEncoder().encode(JSON.stringify(parts)));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
 export default{async fetch(request){
  const row=await request.json(),context=new Request(row.url,{method:row.method,headers:row.headers});
  const inspected=inspectWebBotAuthCandidates(context);
  if(inspected.status!=='ready'||inspected.labels.length!==1)return Response.json({verification:'not-assessed'});
  const label=inspected.labels[0],cache=createWebBotAuthCache();
  const verdict=await verifyWebBotAuthCandidate(context,label,{now:new Date(row.now),cache,maxAgeSeconds:row.probeMaxAgeSeconds??86400,fetcher:async url=>{
   if(!['https://crawler.exa.ai/.well-known/http-message-signatures-directory','https://fixture.example/.well-known/http-message-signatures-directory','https://second.example/.well-known/http-message-signatures-directory'].includes(String(url)))throw Error('Unreviewed directory');
   return Response.json(row.directory,{headers:{'Content-Type':'application/http-message-signatures-directory+json'}});
  }});
  if(verdict.status!=='verified')return Response.json({verification:verdict.status,reason:verdict.reason??null});
  const facts=await researchReplayFacts(context,label,verdict,cache);if(!facts)return Response.json({verification:'verified',state:'not-assessed'});
  // Original reuse digests never enter the candidate DB or closed result.
  return Response.json({verification:'verified',verifierProfile:VERIFIER_PROFILE_VERSION,expires:facts.expires,
   nonceState:facts.tokens.nonceState,proof:await privateScope(['proof',facts.tokens.proof]),
   nonce:facts.tokens.nonce===null?null:await privateScope(['nonce',facts.tokens.nonce]),
   context:await privateScope(['context',facts.tokens.proof,facts.tokens.context])});
 }};` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent',
  plugins: [{ name: 'private-research-adapter', setup(builder) {
    builder.onResolve({ filter: /^replay-proof-adapter$/ }, () => ({ path: sourcePath, namespace: 'research-adapter' }));
    builder.onLoad({ filter: /.*/, namespace: 'research-adapter' }, () => ({ contents: adapter, loader: 'ts', resolveDir: dirname(sourcePath) }));
  } }] });
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'offline-replay-policy' } });
const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/replay-claim-candidate.sql', 'utf8');
try {
  const db = await mf.getD1Database('DB');
  await db.exec('CREATE TABLE replay_claims(scope_key TEXT PRIMARY KEY,first_claim TEXT NOT NULL,first_seen INTEGER NOT NULL,retain_until INTEGER NOT NULL) WITHOUT ROWID; CREATE INDEX replay_claims_expiry ON replay_claims(retain_until);');
  const meters = {}, checks = [];
  let verificationCalls = 0;
  function meter(group, result) {
    const total = meters[group] ??= { statements: 0, reads: 0, writes: 0 };
    total.statements++; total.reads += result.meta.rows_read; total.writes += result.meta.rows_written;
  }
  async function verify(row) {
    verificationCalls++;
    const response = await mf.dispatchFetch('https://offline.example/verify', { method: 'POST', body: JSON.stringify(row) });
    if (response.status !== 200) writeFileSync(`${output}.failure.txt`, await response.text(), { flag: 'wx', mode: 0o600 });
    assert.equal(response.status, 200); const facts = await response.json();
    if (facts.verification === 'verified') assert.equal(facts.verifierProfile, '2026-10-29.1');
    return facts;
  }
  async function claim(group, key, now, until, mode = 'atomic') {
    assert.ok(Number.isSafeInteger(now) && Number.isSafeInteger(until) && until >= now);
    if (key === null) return { state: 'not-assessed', reason: 'nonce-unavailable' };
    if (mode === 'unavailable') return { state: 'unavailable', reason: 'injected-state-unavailable' };
    try {
      const statement = mode === 'storage-error' ? 'INSERT INTO deliberately_missing_replay_state VALUES(?1,?2,?3,?4)' : sql;
      const result = await db.prepare(statement).bind(`${group}:${key}`, randomUUID(), now, until).all(); meter(group, result);
      assert.ok(result.results.length <= 1);
      return { state: result.results[0]?.first_claimed === 1 ? 'first-observed' : 'seen-before' };
    } catch (error) {
      if (mode !== 'storage-error') throw error;
      return { state: 'unavailable', reason: 'native-storage-error', unreturnedMetering: true };
    }
  }
  const nowSeconds = row => Math.floor(Date.parse(row.now) / 1000);
  const changed = (row, kind) => {
    const copy = structuredClone(row), url = new URL(copy.url);
    if (kind === 'unsigned-change') { url.pathname = '/offline-unsigned-policy-change'; copy.headers['user-agent'] = 'OfflineChangedRole/1.0'; }
    if (kind === 'signed-host-change') url.hostname = 'offline-invalid.example';
    if (kind === 'relabelled') {
      const headers = new Headers(copy.headers);
      for (const name of ['signature', 'signature-input']) headers.set(name, headers.get(name).replace(/^[a-zA-Z0-9_*.-]+=/, 'renamed='));
      copy.headers = Object.fromEntries(headers);
    }
    copy.url = url.href; return copy;
  };
  const retained = {};
  const retainedInputs = new Set();
  for (const policy of ['proof', 'nonce', 'context']) {
    const counts = { firstObserved: 0, seenBefore: 0, invalid: 0, notAssessed: 0, retryMarkedSeen: 0, unsignedChangesFirstObserved: 0 };
    for (const kind of ['original', 'retry', 'unsigned-change', 'relabelled', 'signed-host-change']) for (const row of originals) {
      const trial = changed(row, kind);
      retainedInputs.add(hash(JSON.stringify([trial.now, trial.method, trial.url, [...new Headers(trial.headers)]])));
      const facts = await verify(trial);
      if (facts.verification !== 'verified') {
        assert.equal(kind, 'signed-host-change');
        assert.equal(facts.reason, 'signature-invalid', 'Unavailable or policy outcomes must not become invalid-signature controls');
        counts.invalid++; continue;
      }
      const result = await claim(`retained-${policy}`, facts[policy], nowSeconds(row), facts.expires + 60);
      if (result.state === 'first-observed') counts.firstObserved++;
      else if (result.state === 'seen-before') counts.seenBefore++;
      else counts.notAssessed++;
      if (kind === 'retry' && result.state === 'seen-before') counts.retryMarkedSeen++;
      if (kind === 'unsigned-change' && result.state === 'first-observed') counts.unsignedChangesFirstObserved++;
    }
    assert.equal(counts.invalid, 4); assert.equal(counts.notAssessed, 0); assert.equal(counts.retryMarkedSeen, 4);
    assert.equal(counts.firstObserved, policy === 'context' ? 8 : 4); assert.equal(counts.seenBefore, policy === 'context' ? 8 : 12);
    retained[policy] = counts;
  }
  for (const row of originals) assert.equal((await verify({ ...row, probeMaxAgeSeconds: 60 })).reason, 'validity-policy-exceeded');
  checks.push({ name: 'sixty-second-lifetime-policy-counterexample', retainedOriginalsRejectedByProposedPolicy: 4, acceptedByRecordedPolicy: 4, vendorLifetimeSeconds: 300 });
  const at = fixture.epoch, f = {};
  for (const [name, row] of Object.entries(fixture.records)) { f[name] = await verify(row); assert.equal(f[name].verification, 'verified'); }
  const basic = f.original;
  // Same-publisher key aliases share nonce scope; publishers/key material differ.
  assert.equal(basic.nonce, f.alias.nonce); assert.notEqual(basic.proof, f.alias.proof);
  assert.notEqual(basic.nonce, f.otherKey.nonce); assert.notEqual(basic.nonce, f.otherPublisher.nonce);
  assert.notEqual(basic.proof, f.longer.proof); assert.equal(basic.nonce, f.longer.nonce);
  for (const [name, expected] of [['original', 'first-observed'], ['alias', 'seen-before'], ['otherKey', 'first-observed'], ['otherPublisher', 'first-observed']]) {
    assert.equal((await claim('scope', f[name].nonce, at, f[name].expires + 60)).state, expected);
  }
  checks.push({ name: 'publisher-key-and-alias-scope', accepted: true });
  for (const name of ['absentNonce', 'emptyNonce']) assert.equal((await claim('missing', f[name].nonce, at, f[name].expires + 60)).state, 'not-assessed');
  checks.push({ name: 'missing-or-empty-nonce-is-not-assessed', accepted: true, statements: 0 });
  const race = await Promise.all(Array.from({ length: 24 }, () => claim('atomic-race', basic.nonce, at, basic.expires + 60)));
  assert.equal(race.filter(row => row.state === 'first-observed').length, 1);
  checks.push({ name: 'atomic-concurrent-claim', arrivals: 24, firstObserved: 1, seenBefore: 23 });
  // A check followed by a later write can let both callers make the decision.
  const scope = 'unsafe-race:synthetic';
  const reads = await Promise.all([0, 1].map(() => db.prepare('SELECT scope_key FROM replay_claims WHERE scope_key=?').bind(scope).all()));
  for (const result of reads) { meter('unsafe-race', result); assert.equal(result.results.length, 0); }
  const wouldAdmit = reads.filter(result => result.results.length === 0).length;
  for (const _ of reads) meter('unsafe-race', await db.prepare('INSERT OR IGNORE INTO replay_claims VALUES(?,?,?,?)').bind(scope, randomUUID(), at, at + 120).run());
  assert.equal(wouldAdmit, 2); checks.push({ name: 'separate-check-write-counterexample', arrivals: 2, wouldAdmit });
  const edge = at + 120;
  assert.equal((await claim('skew', basic.nonce, at, edge)).state, 'first-observed');
  assert.equal((await verify({ ...fixture.records.original, now: new Date(edge * 1000).toISOString() })).verification, 'verified');
  assert.equal((await claim('skew', basic.nonce, edge, edge)).state, 'seen-before');
  const expired = await verify({ ...fixture.records.original, now: new Date((edge + 1) * 1000).toISOString() });
  assert.equal(expired.reason, 'expired');
  checks.push({ name: 'inclusive-expiry-plus-sixty-second-skew', lastAcceptedSecondMarkedSeen: true, nextSecondRejectedBeforeClaim: true });
  await claim('premature', basic.nonce, at, basic.expires);
  assert.equal((await claim('premature', basic.nonce, at + 61, edge)).state, 'first-observed');
  checks.push({ name: 'no-skew-retention-counterexample', sameStillValidProofAdmittedAgain: true });
  assert.equal((await claim('extension', basic.nonce, at, edge)).state, 'first-observed');
  assert.equal((await claim('extension', f.longer.nonce, at + 30, f.longer.expires + 60)).state, 'seen-before');
  assert.equal((await claim('extension', f.longer.nonce, at + 121, f.longer.expires + 60)).state, 'seen-before');
  checks.push({ name: 'repeated-nonce-extends-longer-acceptance-horizon', oldHorizonBypassPrevented: true });
  // Two disconnected stores/maps admit one each: local atomicity is not shared scope.
  const maps = [new Set(), new Set()]; const localFirst = maps.map(map => { const seen = map.has(basic.nonce); map.add(basic.nonce); return !seen; }).filter(Boolean).length;
  assert.equal(localFirst, 2); checks.push({ name: 'disconnected-isolate-map-counterexample', stores: 2, firstObserved: 2 });
  // The experimental privacy key is per Worker instance. Prove that this
  // deliberate isolation is unsuitable for a shared production replay key.
  const second = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {} });
  try {
    verificationCalls++;
    const response = await second.dispatchFetch('https://offline.example/verify', { method: 'POST', body: JSON.stringify(fixture.records.original) });
    assert.equal(response.status, 200); const other = await response.json();
    assert.equal(other.verification, 'verified'); assert.notEqual(other.nonce, basic.nonce);
    assert.equal((await claim('two-worker-privacy-keys', basic.nonce, at, edge)).state, 'first-observed');
    assert.equal((await claim('two-worker-privacy-keys', other.nonce, at, edge)).state, 'first-observed');
    checks.push({ name: 'per-worker-privacy-key-counterexample', localWorkerInstances: 2, sharedCandidateDatabases: 1, sameVerifiedProofFirstObserved: 2,
      productionConsequence: 'A shared enforcement scope requires a stable cross-instance key domain; experiment-only HMAC isolation must not be deployed as replay prevention.' });
  } finally { await second.dispose(); }
  assert.equal((await claim('unavailable', basic.nonce, at, edge, 'unavailable')).state, 'unavailable');
  checks.push({ name: 'verified-proof-with-unavailable-state', verification: 'verified', replay: 'unavailable', statements: 0, faultInjection: true });
  assert.deepEqual(await claim('storage-error', basic.nonce, at, edge, 'storage-error'), { state: 'unavailable', reason: 'native-storage-error', unreturnedMetering: true });
  checks.push({ name: 'native-d1-state-error', verification: 'verified', replay: 'unavailable', attemptedStatements: 1, returnedMetering: null, faultInjection: true });
  // Indexed cleanup retains the last accepted whole second and deletes afterwards.
  const cleanupKey = 'cleanup:synthetic'; meter('cleanup', await db.prepare('INSERT INTO replay_claims VALUES(?,?,?,?)').bind(cleanupKey, randomUUID(), at, edge).run());
  const cleanAt = await db.prepare('DELETE FROM replay_claims WHERE retain_until < ? AND scope_key LIKE ?').bind(edge, 'cleanup:%').run(); meter('cleanup', cleanAt); assert.equal(cleanAt.meta.changes, 0);
  const cleanAfter = await db.prepare('DELETE FROM replay_claims WHERE retain_until < ? AND scope_key LIKE ?').bind(edge + 1, 'cleanup:%').run(); meter('cleanup', cleanAfter); assert.equal(cleanAfter.meta.changes, 1);
  checks.push({ name: 'strict-cleanup-boundary', atHorizonDeleted: 0, nextSecondDeleted: 1 });
  const plan = await db.prepare('EXPLAIN QUERY PLAN DELETE FROM replay_claims WHERE retain_until < ?').bind(edge).all();
  assert.ok(plan.results.some(row => row.detail.includes('replay_claims_expiry')));
  const cleanupSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/replay-cleanup-candidate.sql', 'utf8');
  const scaledSql = cleanupSql.replaceAll('replay_claims', 'replay_cleanup_fixture');
  await db.exec('CREATE TABLE replay_cleanup_fixture(scope_key TEXT PRIMARY KEY,first_claim TEXT NOT NULL,first_seen INTEGER NOT NULL,retain_until INTEGER NOT NULL) WITHOUT ROWID; CREATE INDEX replay_cleanup_fixture_expiry ON replay_cleanup_fixture(retain_until);');
  for (let start = 0; start < 512; start += 64) {
    const inserted = await db.batch(Array.from({ length: 64 }, (_, offset) => {
      const index = start + offset;
      return db.prepare('INSERT INTO replay_cleanup_fixture VALUES(?,?,?,?)').bind(`synthetic-${String(index).padStart(4, '0')}`, `fixture-${index}`, at, index < 128 ? edge - 1 : edge);
    }));
    for (const result of inserted) meter('cleanup-scale-setup', result);
  }
  const scaledDeletes = [], scaledMetering = [];
  for (let index = 0; index < 3; index++) {
    const result = await db.prepare(scaledSql).bind(edge, 64).run(); meter('cleanup-scale', result); scaledDeletes.push(result.meta.changes);
    scaledMetering.push({ deleted: result.meta.changes, reads: result.meta.rows_read, writes: result.meta.rows_written });
  }
  assert.deepEqual(scaledDeletes, [64, 64, 0]);
  const scalePlan = await db.prepare('EXPLAIN QUERY PLAN ' + scaledSql).bind(edge, 64).all();
  assert.ok(scalePlan.results.some(row => row.detail.includes('replay_cleanup_fixture_expiry')));
  checks.push({ name: 'bounded-indexed-cleanup', suppliedRows: 512, expiredRows: 128, stillValidRows: 384, limit: 64, deletedPerStatement: scaledDeletes, perStatement: scaledMetering });
  assert.equal(retainedInputs.size, 16);
  const result = { checkedAt: new Date().toISOString(), prototypeOnly: true, enforcement: 'none-in-production',
    inputSha256: hash(inputBytes), fixtureSha256: hash(JSON.stringify(fixture) + '\n'),
    scriptSha256: hash(readFileSync(new URL(import.meta.url))),
    fixtureFactorySha256: hash(readFileSync('packages/blog/drafts/research/analytics-retrospective/replay-policy-fixture.mjs')),
    verifierSourceSha256: hash(source), sqlSha256: hash(sql), cleanupSqlSha256: hash(cleanupSql),
    retainedOriginals: 4, retainedTrialOccurrencesPerPolicy: 20, distinctRetainedRequestInputs: retainedInputs.size, policyRepetitions: 3, verificationCalls,
    retained, checks, localD1Metering: meters, expiryIndexPlan: true,
    additionalLocalStatements: { setupDdl: 4, queryPlans: 2, deliberatelyFailed: 1, metering: 'Not included in the successful metered operation groups; failed statement returns no row metering.' },
    externalRequests: 0, productionRequests: 0, productionD1Statements: 0, newHumanLabels: 0,
    limits: ['Constructed retry/unsigned-change labels are simulation conditions, not captured vendor retries or attacks.',
      'Local D1 concurrency/cost does not prove production global scope, latency, service billing or failure behavior.',
      'Candidate state has no production admission/capacity/retention approval; linkable replay identifiers are not deployed.',
      'Seen-before does not authenticate intent, establish an attack or justify deleting analytics observations.'] };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ retained, checks: checks.length, verificationCalls, meters }));
} finally { await mf.dispose(); }
