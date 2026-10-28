import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { signatureSelectionFixture } from '../../analytics/test/fixtures/signature-selection.mjs';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { COLLECTION_VERSION, VERIFIER_PROFILE_VERSION } from '../../analytics/.test-dist/versions.js';

const [output, baselineModule] = process.argv.slice(2); assert.ok(output && baselineModule, 'Provide new closed receipt and compiled baseline module');
const { queryStats: baselineStats } = await import(pathToFileURL(resolve(baselineModule)).href);
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = await signatureSelectionFixture();
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { observePageResponse } from './packages/analytics/src/index.ts';
  const directories = ${JSON.stringify(fixture.directories)}, receipts = []; let directoryFetches = 0;
  console.log = (event, fields) => { if (event === 'analytics.observation_stored') receipts.push(fields); };
  globalThis.fetch = async (url) => { directoryFetches++; if (!Object.hasOwn(directories, String(url))) throw Error('Unexpected lookup');
    return Response.json(directories[String(url)], {headers:{'Content-Type':'application/http-message-signatures-directory+json'}}); };
  export default { fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__receipts') return Response.json({receipts,directoryFetches});
    const response = new Response('Signature selection fixture',{headers:{'Content-Type':'text/html'}});
    observePageResponse(request,response,'html',env,ctx); return response;
  } };
` }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {},
  d1Databases: { DB: 'signature-selection-controls' }, bindings: { ANALYTICS_HASH_KEY: 'local-fixture-only' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const rows = [], trials = [];
  for (const trial of [...fixture.cases, { ...fixture.cases[1], name: 'excluded', headers: { ...fixture.cases[1].headers, Referer: 'https://traffic2cash.xyz/' } }]) {
    const path = trial.name === 'excluded' ? '/privacy' : '/' + trial.name;
    assert.equal((await mf.dispatchFetch('https://publication.example' + path, { headers: trial.headers })).status, 200);
    let row;
    for (let attempt = 0; attempt < 50; attempt++) {
      row = await db.prepare('SELECT CAST(id AS TEXT) reference,collection_version,signature_status,signature_agent,signature_evidence,request_evidence FROM page_observations WHERE path=?').bind(path).first();
      if (row) break; await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.ok(row); const evidence = JSON.parse(row.signature_evidence), selection = evidence.coverage.selection;
    assert.equal(row.collection_version, COLLECTION_VERSION); assert.equal(evidence.verifierProfile, VERIFIER_PROFILE_VERSION);
    assert.equal(row.signature_agent, trial.selectedOrigin); assert.equal(row.signature_status, 'verified'); assert.equal(row.request_evidence, null);
    assert.deepEqual([selection.matchedCandidates, selection.taggedCandidates, selection.attemptedCandidates, selection.unassessedCandidates], trial.counts);
    rows.push(row); trials.push({ name: trial.name, knownSelectionMatches: true, counts: trial.counts });
  }
  const observed = await (await mf.dispatchFetch('https://publication.example/__receipts')).json();
  assert.equal(observed.receipts.length, 9); assert.equal(observed.directoryFetches, 2);
  for (const row of rows) {
    const matches = observed.receipts.filter(record => record.storage.observationId === row.reference); assert.equal(matches.length, 1);
    assert.equal(matches[0].receipt.version, '2026-10-28.1');
    assert.deepEqual(matches[0].receipt.signature.selection, JSON.parse(row.signature_evidence).coverage.selection);
  }
  const exactSql = readFileSync('packages/blog/drafts/research/analytics-retrospective/signature-ascii-storage-reference.sql','utf8');
  const exact = await db.prepare(exactSql).bind(rows.at(-1).reference,COLLECTION_VERSION).all();
  assert.equal(exact.results.length,1);assert.equal(exact.meta.rows_read,1);assert.equal(exact.meta.rows_written,0);
  assert.equal(exact.results[0].outcome,'verified');
  const seed = JSON.parse(rows[0].signature_evidence);
  const insert = evidence => db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,signature_status,signature_evidence,observed_at)
    VALUES('/snapshot','00000000000000000000000000000000','ai','desktop',0,'ai-search','fixture','verified',?,datetime('now'))`).bind(JSON.stringify(evidence)).run();
  const historical = structuredClone(seed); historical.coverage.version = '2026-10-27.1'; delete historical.coverage.selection;
  await insert(historical);
  for (const change of [s => { s.attemptedCandidates = -1; }, s => { s.taggedCandidates = true; }, s => { s.policy = 'unrecognized-fixture-policy'; }]) {
    const evidence = structuredClone(seed); change(evidence.coverage.selection); await insert(evidence);
  }
  await insert({ ...seed, source: 'test-injected' });
  async function measure(run) {
    const cost = { rowsRead: 0, rowsWritten: 0, statements: 0 };
    const wrapper = { prepare: sql => db.prepare(sql), async batch(statements) {
      const result = await db.batch(statements); for (const row of result) { cost.statements++; cost.rowsRead += row.meta.rows_read; cost.rowsWritten += row.meta.rows_written; } return result;
    } };
    return { report: await run(wrapper, { range: '7d', traffic: 'all' }), cost };
  }
  const before = await measure(baselineStats), after = await measure(queryStats), report = after.report;
  assert.equal(report.totals.views, 13); assert.equal(report.referralPolicy.excludedViews, 1);
  const v = report.verification;
  assert.equal(v.localVerifiedViews, 12); assert.equal(v.selectionRecordedViews, 8); assert.equal(v.selectionNotRecordedVerifiedViews, 1); assert.equal(v.selectionUnrecognizedVerifiedViews, 3);
  assert.equal(v.multipleTaggedCandidateViews, 4); assert.equal(v.unassessedCandidateViews, 3);
  assert.equal(v.selectionRecordedViews + v.selectionNotRecordedVerifiedViews + v.selectionUnrecognizedVerifiedViews, v.localVerifiedViews);
  assert.equal(v.testVerdictViews, 1); assert.deepEqual(before.report.totals, report.totals);
  const result = { checkedAt: new Date().toISOString(), collectionVersion: COLLECTION_VERSION, verifierProfile: VERIFIER_PROFILE_VERSION,
    method: 'Actual native local workerd/collector/WebCrypto/D1 with independently signed controls, intercepted directories, exact receipt/row references and versioned historical/malformed stored snapshots. Not vendor traffic or human labels.',
    trials, exactReceiptPairs: rows.length, directoryFetches: observed.directoryFetches, report: { total: 13, excluded: 1, localVerified: v.localVerifiedViews, selectionRecorded: v.selectionRecordedViews, selectionNotRecorded: v.selectionNotRecordedVerifiedViews, selectionUnrecognized: v.selectionUnrecognizedVerifiedViews, multipleTagged: v.multipleTaggedCandidateViews, unassessed: v.unassessedCandidateViews, testInjected: v.testVerdictViews },
    exactReferenceSql: {rows:1,rowsRead:exact.meta.rows_read,rowsWritten:exact.meta.rows_written},
    nativeReportCost: { before: before.cost, after: after.cost, extraReads: after.cost.rowsRead - before.cost.rowsRead },
    newProductionRequests: 0, externalDirectoryRequests: 0, optionalRawCaptureActivated: false,
    limits: ['Counts describe paired and tagged candidates, not all header members or verified signers.', 'A chosen proof does not establish uniqueness, purpose or human intent.', 'These selected synthetic controls do not measure production prevalence.'] };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ actualControls: rows.length, exactReceiptPairs: rows.length, reportCost: result.nativeReportCost, productionRequests: 0 }));
} finally { await mf.dispose(); }
