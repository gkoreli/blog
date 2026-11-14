import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { portableSchemaSource, schemaObjects } from './fresh-schema.mjs';
import { publicSignatureFixture, runPublicSignatures } from '../test/fixtures/public-signatures.mjs';
import * as requestApi from '../.test-dist/webbotauth.js';
import { auditDirectoryResponse } from '../.test-dist/directory-response-audit.js';
import { signatureCoverageRecordedSql } from '../.test-dist/signature-coverage-report.js';
import { signatureSelectionRecordedSql } from '../.test-dist/signature-selection.js';
import { reportProjectionSql, REPORT_PROJECTION_RULE_SHA256 } from '../.test-dist/report-projection.js';

const blogRequire = createRequire(new URL('../../blog/package.json', import.meta.url));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const fixture = publicSignatureFixture();
const expected = await runPublicSignatures(fixture, { ...requestApi, auditDirectoryResponse });
const vectors = JSON.parse(readFileSync(new URL('../test/fixtures/rfc9421-public-vectors.json', import.meta.url))).vectors;
const base = fileURLToPath(new URL('../', import.meta.url));
const modulePath = name => JSON.stringify(resolve(base, name));
const script = `
import * as api from ${modulePath('src/webbotauth.ts')};
import {auditDirectoryResponse} from ${modulePath('src/directory-response-audit.ts')};
import {runPublicSignatures} from ${modulePath('test/fixtures/run-public-signatures.mjs')};
import {importPublicVerificationKey,verifyPublicSignature} from ${modulePath('src/http-signature-key.ts')};
import {createD1ReportAdmission} from ${modulePath('src/report-budget-d1.ts')};
export default {async fetch(request,env) {
  const input=await request.json();
  if(input.type==='signatures')return Response.json(await runPublicSignatures(input.fixture,{...api,auditDirectoryResponse}));
  if(input.type==='vectors') {
    const values=[];
    for(const row of input.vectors) {
      const key=await importPublicVerificationKey(row.jwk,row.algorithm);
      values.push(!('reason'in key)&&await verifyPublicSignature(key,Uint8Array.from(atob(row.signature),c=>c.charCodeAt(0)),new TextEncoder().encode(row.base)));
    }
    return Response.json(values);
  }
  if(input.type==='budget') {
    const now=new Date('2026-11-13T12:00:00Z'),policy={maxColdFillsPerDay:2,maxReportedRowsReadPerDay:100};
    const a=createD1ReportAdmission(env.DB,policy),b=createD1ReportAdmission(env.DB,policy);
    const first=await Promise.all([a.reserve(now),b.reserve(now)]),admitted=first.filter(Boolean);
    if(admitted.length!==1)throw Error('Native admission race');
    await admitted[0].complete({reportedRowsRead:40});
    await admitted[0].complete({reportedRowsRead:90});
    const second=await b.reserve(now);if(second===null)throw Error('Native second reservation');
    await second.complete({reportedRowsRead:70});
    if(await a.reserve(now)!==null)throw Error('Native budget exceeded');
    const tomorrow=new Date('2026-11-14T00:00:00Z'),unknown=await a.reserve(tomorrow);
    if(unknown===null)throw Error('Native day rollover');await unknown.complete({reportedRowsRead:null});
    if(await b.reserve(tomorrow)!==null)throw Error('Native unknown metering reopened');
    return Response.json((await env.DB.prepare('SELECT utc_date,cold_fills,reported_rows_read,unmetered_fills FROM analytics_report_budget_days ORDER BY utc_date').all()).results);
  }
  return new Response('Unknown control',{status:400});
}};`;
const bundle = await build({ stdin: { contents: script, resolveDir: base }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
let outbound = 0;
const runtime = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-01',
  d1Databases: { DB: 'reporting-budget' }, log: new Log(LogLevel.ERROR),
  outboundService() { outbound++; throw Error('External network disabled'); },
});
try {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(portableSchemaSource());
    const db = await runtime.getD1Database('DB');
    for (const row of schemaObjects(sqlite)) await db.prepare(row.sql).run();
  } finally { sqlite.close(); }
  const run = async input => {
    const response = await runtime.dispatchFetch('https://fixture.example/check', { method: 'POST', body: JSON.stringify(input) });
    assert.equal(response.status, 200); return response.json();
  };
  assert.deepEqual(await run({ type: 'signatures', fixture }), expected);
  const db = await runtime.getD1Database('DB');
  const sql = `SELECT ${signatureCoverageRecordedSql()} AS coverage,${signatureSelectionRecordedSql()} AS selection
    FROM (SELECT ? AS signature_evidence,'verified' AS signature_status)`;
  for (const row of expected) {
    const envelope = { version: '2026-10-27.5', source: 'local-webbotauth', localStatus: 'verified', localOutcome: 'verified', coverage: row.valid.evidence };
    assert.deepEqual(await db.prepare(sql).bind(JSON.stringify(envelope)).first(), { coverage: 1, selection: 1 });
    envelope.coverage = { ...envelope.coverage, algorithm: 'hmac-sha256' };
    assert.equal((await db.prepare(sql).bind(JSON.stringify(envelope)).first()).coverage, 0);
  }
  const original = { version: '2026-10-27.5', source: 'local-webbotauth', localStatus: 'verified', localOutcome: 'verified', verifierProfile: '2026-10-31.3', coverage: null };
  const sourceRows = [original, { ...original, verifierProfile: '2026-11-13.1' }, { ...original, coverage: { version: '2026-11-13.1' } }, original];
  for (const [index, envelope] of sourceRows.entries()) await db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,signature_status,signature_evidence)
    VALUES('/upgrade',?,'ai','desktop',0,'verified',?)`).bind(String(index + 1).padStart(32, '0'), JSON.stringify(envelope)).run();
  await db.prepare(reportProjectionSql('range')).bind(0, 4).run();
  const predecessor = '2ca641b0fed3defaeb8bcc0556ec88a47abda3a7a8d4918655269007978569d2';
  await db.prepare('UPDATE page_observation_report_facts SET rule_sha256=?').bind(predecessor).run();
  await db.prepare('UPDATE page_observation_report_facts SET rule_sha256=? WHERE observation_id=4').bind('0'.repeat(64)).run();
  const before = (await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  const upgrade = await db.prepare(readFileSync(new URL('../schema/0003_signature_reporting_profiles.sql', import.meta.url), 'utf8')).run();
  assert.equal(upgrade.meta.changes, 1);
  const promoted = (await db.prepare('SELECT rule_sha256 FROM page_observation_report_facts ORDER BY observation_id').all()).results;
  assert.deepEqual(promoted.map(row => row.rule_sha256), [REPORT_PROJECTION_RULE_SHA256, predecessor, predecessor, '0'.repeat(64)]);
  assert.deepEqual((await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results, before);
  // The production delivery uses the same predicate in finite ID intervals.
  // A row outside the interval must remain untouched even when promotable.
  await db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,signature_status,signature_evidence)
    VALUES('/upgrade',?,'ai','desktop',0,'verified',?)`).bind('5'.padStart(32, '0'), JSON.stringify(original)).run();
  await db.prepare(reportProjectionSql('range')).bind(4, 5).run();
  await db.prepare('UPDATE page_observation_report_facts SET rule_sha256=? WHERE observation_id=5').bind(predecessor).run();
  const boundedUpgrade = readFileSync(new URL('../schema/0003_signature_reporting_profiles.sql', import.meta.url), 'utf8').trim().replace(/;$/, '')
    + ' AND observation_id BETWEEN ? AND ?';
  assert.equal((await db.prepare(boundedUpgrade).bind(1, 4).run()).meta.changes, 0);
  assert.equal((await db.prepare(boundedUpgrade).bind(5, 5).run()).meta.changes, 1);
  assert.deepEqual(await run({ type: 'vectors', vectors: [...vectors, fixture.oddModulus] }), [true, true, true, true]);
  assert.deepEqual(await run({ type: 'budget' }), [
    { utc_date: '2026-11-13', cold_fills: 2, reported_rows_read: 110, unmetered_fills: 0 },
    { utc_date: '2026-11-14', cold_fills: 1, reported_rows_read: 0, unmetered_fills: 1 },
  ]);
  assert.equal(outbound, 0);
  console.log(JSON.stringify({ passed: true, publicKeyAlgorithms: 5, publishedRfcVectors: 3,
    requestAndDirectoryResultsMatchNode: true, budgetRaceAndUnknownMetering: true, guardedProjectionUpgrade: true, boundedUpgradeGuard: true,
    guardedUpgradeCost: { rowsRead: upgrade.meta.rows_read, rowsWritten: upgrade.meta.rows_written, changes: upgrade.meta.changes },
    outboundRequests: 0, productionRequests: 0 }));
} finally { await runtime.dispose(); }
