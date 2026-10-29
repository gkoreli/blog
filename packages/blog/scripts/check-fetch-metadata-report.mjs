import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { fetchMetadataReportCtes, fetchMetadataReportProjectionSql, decodeFetchMetadataRows } from '../../analytics/.test-dist/fetch-metadata-report.js';
import { consistentFetchMetadataSummary } from '../../analytics/.test-dist/fetch-metadata-report-contract.js';
import { parsingCases, current, now } from '../../analytics/test/fixtures/fetch-metadata-summary.mjs';

const [output, privateOutput] = process.argv.slice(2);
assert.ok(output && privateOutput);
const baseline = 'e5fbbd72e1966ce88bd4325529e28d6c2d355e90', sourceRoot = resolve('packages/analytics/src');
const previous = path => execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
const old = await build({ stdin: { contents: previous('packages/analytics/src/stats.ts'), loader: 'ts', resolveDir: sourceRoot }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', plugins: [{ name: 'pinned-baseline', setup(builder) {
  builder.onLoad({ filter: /[/\\]analytics[/\\]src[/\\].*\.ts$/ }, args => ({ contents: previous('packages/analytics/src/' + relative(sourceRoot, args.path).replaceAll('\\', '/')), loader: 'ts', resolveDir: dirname(args.path) }));
} }] });
const oldStats = (await import('data:text/javascript;base64,' + Buffer.from(old.outputFiles[0].contents).toString('base64'))).queryStats;
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default{fetch(){return new Response("Fetch Metadata report fixture")}}', compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'fetch-metadata-report' } });
const hash = value => createHash('sha256').update(value).digest('hex');
const schema = readFileSync('packages/analytics/schema.sql', 'utf8');
const cases = parsingCases(), inputs = [], trials = [], measurements = [];
try {
  const db = await mf.getD1Database('DB');
  await db.batch(schema.replace(/^\s*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const malformed = { ...current(), classification_evidence: '{' }, malformedKeys = Object.keys(malformed);
  await assert.rejects(db.prepare(`INSERT INTO page_observations(${malformedKeys.join(',')})VALUES(${malformedKeys.map(() => '?').join(',')})`).bind(...Object.values(malformed)).run(), /CHECK constraint failed/);
  let pending, last;
  const tap = { prepare(sql) { return { bind(...values) { pending = { sql, values }; return db.prepare(sql).bind(...values); } }; }, async batch(statements) {
    assert.equal(statements.length, 1);
    const results = await db.batch(statements);
    last = { ...pending, rows: results[0].results, meta: results[0].meta };
    return results;
  } };
  async function compare(label, query, fixtureRows) {
    const before = await oldStats(tap, query, now), oldCapture = last;
    const after = await queryStats(tap, query, now), newCapture = last;
    const { fetchMetadata, ...common } = after;
    assert.deepEqual(common, before, label + ' existing public fields');
    assert.deepEqual(newCapture.rows.filter(r => r.section !== 'fetch-metadata'), oldCapture.rows, label + ' existing raw sections');
    assert.deepEqual(newCapture.values, oldCapture.values);
    assert.ok(consistentFetchMetadataSummary(fetchMetadata, after.totals.views));
    assert.equal(newCapture.meta.rows_written, 0); assert.equal(oldCapture.meta.rows_written, 0);
    assert.ok(Buffer.byteLength(newCapture.sql) < 100000); assert.ok(newCapture.values.length <= 100);
    trials.push({ label, query, candidateSql: newCapture.sql, values: newCapture.values, expectedRows: newCapture.rows });
    measurements.push({ label, fixtureRows, included: after.totals.views, baselineReads: oldCapture.meta.rows_read, candidateReads: newCapture.meta.rows_read, writes: 0, existingRawAndDecodedOutputEqual: true, summary: fetchMetadata, sqlBytes: Buffer.byteLength(newCapture.sql), boundParameters: newCapture.values.length });
    return after;
  }
  await compare('empty-seven-day', { range: '7d', traffic: 'all', path: '/fixture' }, 0);
  await compare('empty-all-time', { range: 'all', traffic: 'all' }, 0);
  for (let i = 0; i < 512; i++) {
    const row = { ...cases[i % cases.length][1], daily_client_id: (i + 1).toString(16).padStart(32, '0'), path: i % 11 === 0 ? '/other-fixture' : '/fixture',
      reader_kind: ['browser', 'ai-search', 'search-crawler', 'other-bot', 'unresolved', 'ai-assistant', null][i % 7],
      observed_at: i % 19 === 0 ? '2026-10-01 04:00:00' : '2026-10-29 04:00:00', is_owner: Number(i % 17 === 0), referrer_host: i % 13 === 0 ? 'traffic2cash.xyz' : null };
    inputs.push(row);
    const keys = Object.keys(row);
    await db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(() => '?').join(',')})`).bind(...Object.values(row)).run();
  }
  for (const range of ['7d', 'all']) for (const traffic of ['all', 'browser', 'agents', 'crawlers', 'automation', 'unresolved']) await compare(range + '-' + traffic, { range, traffic, path: '/fixture' }, 512);
  for (const range of ['30d', '90d']) await compare(range + '-all-paths', { range, traffic: 'all' }, 512);
  await compare('missing-path', { range: '7d', traffic: 'all', path: '/missing-fixture' }, 512);
  await db.prepare('DELETE FROM page_observations').run();
  const oneByOne = [];
  for (const [label, row, expected] of cases) {
    const keys = Object.keys(row);
    const id = (await db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(() => '?').join(',')})RETURNING id`).bind(...Object.values(row)).first()).id;
    const sql = `WITH included AS (SELECT * FROM page_observations WHERE id=?),${fetchMetadataReportCtes()} SELECT (${fetchMetadataReportProjectionSql()}) AS payload`;
    const cohort = JSON.parse((await db.prepare(sql).bind(id).first()).payload);
    assert.equal(cohort.length, 1); assert.equal(cohort[0].state, expected, label);
    decodeFetchMetadataRows(cohort, 1);
    oneByOne.push({ label, record: expected });
  }
  // Exhaust the closed encoding, including parameters and valid Boolean values.
  await db.prepare('DELETE FROM page_observations').run();
  const tokenChoices = [[0, false], [1, false], [2, false], [2, true], [3, false], [3, true], [4, false], [4, true], [5, false]];
  const activationChoices = [[0, false, null], [1, false, null], [2, false, 0], [2, false, 1], [2, true, 0], [2, true, 1], [4, false, null], [4, true, null], [5, false, null]];
  const encodingRows = [];
  for (const mode of tokenChoices) for (const dest of tokenChoices) for (const site of tokenChoices) for (const user of activationChoices) {
    const fields = [mode, dest, site, user], row = current();
    let bits = 0;
    for (const [i, [state, parameters]] of fields.entries()) bits |= (state << (i * 3)) | (parameters ? 1 << (12 + i) : 0);
    row.sec_fetch_mode = mode[0] === 2 ? 'navigate' : null; row.sec_fetch_dest = dest[0] === 2 ? 'document' : null; row.sec_fetch_site = site[0] === 2 ? 'none' : null; row.sec_fetch_user = user[2];
    const activation = user[0] === 2 ? (user[2] === 1 ? 'true-claim' : 'other-value') : { 0: 'not-assessed', 1: 'absent', 4: 'invalid', 5: 'policy-limit' }[user[0]];
    row.classification_evidence = JSON.stringify({ ...JSON.parse(row.classification_evidence), fetchMetadataBits: bits, activation });
    encodingRows.push(row);
  }
  for (let i = 0; i < encodingRows.length; i += 64) await db.batch(encodingRows.slice(i, i + 64).map(row => {
    const keys = Object.keys(row);
    return db.prepare(`INSERT INTO page_observations(${keys.join(',')})VALUES(${keys.map(() => '?').join(',')})`).bind(...Object.values(row));
  }));
  const boundary = await db.prepare(`WITH included AS (SELECT * FROM page_observations),${fetchMetadataReportCtes()} SELECT (${fetchMetadataReportProjectionSql()}) AS payload`).first();
  const cohorts = JSON.parse(boundary.payload), summary = decodeFetchMetadataRows(cohorts, encodingRows.length);
  assert.equal(encodingRows.length, 6561); assert.equal(cohorts.length, 6561); assert.equal(summary.records.recognizedViews, 6561);
  assert.ok(Buffer.byteLength(boundary.payload) < 2000000);
  const privateBytes = JSON.stringify({ baseline, schema, inputs, trials, encodingRows }, null, 2) + '\n';
  writeFileSync(privateOutput, privateBytes, { flag: 'wx', mode: 0o600 });
  const receipt = { checkedAt: new Date().toISOString(), baseline, fixtureRows: 512, parsingCases: oneByOne, comparisons: measurements.length, measurements,
    encodingBoundary: { rows: encodingRows.length, cohorts: cohorts.length, payloadBytes: Buffer.byteLength(boundary.payload), allRecognized: true, nonRecognizedAdditionalCohortsMaximum: 3 },
    inputSha256: hash(privateBytes), scriptSha256: hash(readFileSync(new URL(import.meta.url))), productionCalls: 0, humanLabels: 0,
    limits: ['Synthetic stored facts; Node decoder with native local D1 SQL, not production equivalence or human accuracy.', 'Common fields and raw sections match the pinned baseline; the new summary adds metered work.', 'Encoding exhaustion tests the report representation, not all possible request strings or classification facts.'] };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ comparisons: measurements.length, cases: cases.length, encodingCohorts: cohorts.length, payloadBytes: Buffer.byteLength(boundary.payload), existingOutputEqual: true }));
} finally { await mf.dispose(); }
