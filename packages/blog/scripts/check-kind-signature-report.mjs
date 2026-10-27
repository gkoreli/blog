import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';

const [output, fixtureOutput] = process.argv.slice(2); assert.ok(output, 'Provide a new aggregate receipt path');
const baselineCommit = 'ad5133a';
const oldSource = execFileSync('git', ['show', baselineCommit + ':packages/analytics/src/stats.ts'], { encoding: 'utf8' });
const baseline = await build({ stdin: { contents: oldSource, resolveDir: resolve('packages/analytics/src'), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { queryStats: oldQueryStats } = await import('data:text/javascript;base64,' + Buffer.from(baseline.outputFiles[0].contents).toString('base64'));
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("stored-report fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'kind-signature-report' } });
const now = new Date('2026-10-27T02:00:00Z'), query = { range: '7d', traffic: 'all' };
const verified = { version: '2026-10-27.3', source: 'local-webbotauth', verifierProfile: 'stored-fixture', localStatus: 'verified', localOutcome: 'verified', coverage: { version: '2026-10-27.1', covered: { userAgent: true } } };
const unsigned = { ...verified, localStatus: 'absent', localOutcome: 'absent', coverage: null };
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const insertSql = `INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_agent,signature_evidence,referrer_host) VALUES(?,?,'ai','desktop',?,?,'fixture','2026-10-27 01:00:00',?,?,?,?)`;
  function row(id, kind, evidence, options = {}) {
    const status = options.status !== undefined ? options.status : evidence?.localStatus === 'verified' ? 'verified' : evidence?.localStatus === 'unverified' ? 'unverified' : null;
    return db.prepare(insertSql).bind(options.path ?? '/article', id.toString(16).padStart(32, '0'), options.owner ?? 0, kind, status, status === 'verified' ? 'https://private-fixture.example' : null, evidence === null ? null : JSON.stringify(evidence), options.referrer ?? null);
  }
  let last;
  const tap = { prepare(sql) { return { bind(...values) { last = { sql, values }; return db.prepare(sql).bind(...values); } }; }, async batch(statements) { const results = await db.batch(statements); last.meta = results[0].meta; return results; } };
  const measurements = [], marginals = [], joints = [];
  for (const swapped of [false, true]) {
    await db.prepare('DELETE FROM page_observations').run();
    const records = [];
    for (let repeat = 0; repeat < 128; repeat++) for (let i = 0; i < 4; i++) {
      const search = i < 2;
      records.push(row(i + 1, search ? 'ai-search' : 'ai-assistant', search !== swapped ? verified : unsigned));
    }
    for (let i = 0; i < records.length; i += 64) await db.batch(records.slice(i, i + 64));
    const old = await oldQueryStats(tap, query, now); const oldReads = last.meta.rows_read;
    const report = await queryStats(tap, query, now); const currentReads = last.meta.rows_read;
    const { byKindSignature, ...common } = report; assert.deepEqual(common, old);
    assert.equal(report.totals.views, 512); assert.equal(byKindSignature.reduce((n, r) => n + r.views, 0), 512);
    marginals.push(common); joints.push(byKindSignature);
    measurements.push({ dataset: swapped ? 'B' : 'A', storedFixtureRows: 512, oldReads, currentReads, delta: currentReads - oldReads });
  }
  assert.deepEqual(marginals[0], marginals[1]); assert.notDeepEqual(joints[0], joints[1]);
  await db.prepare('DELETE FROM page_observations').run();
  const cases = [
    ['ai-search', verified, {}, 'verified-ua-covered'],
    ['ai-search', { ...verified, coverage: { ...verified.coverage, covered: { userAgent: false } } }, {}, 'verified-ua-uncovered'],
    ['ai-assistant', { ...verified, coverage: null }, {}, 'verified-coverage-unknown'],
    ['ai-search', { ...unsigned, localStatus: 'unverified', localOutcome: 'policy-rejected' }, {}, 'not-verified'],
    ['ai-assistant', unsigned, {}, 'unsigned'],
    ['signed-agent', null, { status: 'verified' }, 'verified-outcome-only'],
    [null, null, {}, 'not-recorded'],
    ['ai-search', { ...verified, source: 'test-injected', coverage: null }, {}, 'test-injected'],
    ['ai-assistant', { ...verified, version: 'future' }, {}, 'unrecognized-record'],
  ];
  await db.batch(cases.map(([kind, evidence, options], i) => row(i + 1, kind, evidence, options)));
  await db.batch([row(50, 'ai-search', verified, { owner: 1 }), row(51, 'ai-search', verified, { referrer: 'traffic2cash.xyz' })]);
  const reports = [];
  for (const selection of [query, { ...query, kind: 'ai-search' }, { ...query, path: '/missing' }]) {
    const report = await queryStats(tap, selection, now); reports.push(report);
    assert.equal(report.byKindSignature.reduce((n, r) => n + r.views, 0), report.totals.views);
  }
  assert.equal(reports[0].totals.views, 9); assert.equal(reports[0].referralPolicy.excludedViews, 1);
  for (const [kind, , , basis] of cases) assert.ok(reports[0].byKindSignature.some(r => r.kind === kind && r.basis === basis && r.views === 1));
  assert.equal(reports[1].totals.views, 4); assert.equal(reports[2].totals.views, 0);
  if (fixtureOutput) writeFileSync(fixtureOutput, JSON.stringify(reports, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  // Generate the real supported narrow report against native D1 before CLI use.
  const productionQuery = { range: '7d', traffic: 'agents', kind: 'signed-agent' };
  await queryStats(tap, productionQuery, new Date());
  let position = 0;
  const productionSql = last.sql.replace(/\?/g, () => {
    const value = last.values[position++];
    if (value === null) return 'NULL'; if (typeof value === 'number') return String(value);
    assert.equal(typeof value, 'string'); return "'" + value.replaceAll("'", "''") + "'";
  }).split('\n').map(line => line.trimEnd()).join('\n');
  assert.equal(position, last.values.length); assert.ok(Buffer.byteLength(productionSql) < 100000);
  const replay = (await db.prepare(productionSql).all()).results;
  const projected = JSON.parse(replay.find(r => r.section === 'kind-signature').payload); assert.equal(projected.length, 1);
  const prefix = resolve(output).replace(/\.json$/, '');
  writeFileSync(prefix + '-production.sql', productionSql + ';\n', { flag: 'wx' });
  writeFileSync(prefix + '-production-plan.json', JSON.stringify({ query: productionQuery, sqlSha256: createHash('sha256').update(productionSql + ';\n').digest('hex'), directReadCeiling: 50000, productionCalls: 0, limit: 'One known signed-client cohort, not a broad all-traffic report. Public fills/browser work are additional.' }, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version, baselineCommit,
    method: 'Supplied stored-record fixtures in native local D1, not operator-labelled requests or signature verification. Baseline SQL is compiled from the pinned repository source; other runtime dependencies use the current unchanged helper behavior.',
    oldMarginalsIdentical: true, newJointEvidenceDifferent: true, datasets: joints, measurements,
    checks: { commonReportOutputUnchanged: true, nineClosedBases: true, totalPartition: true, missingKindPreserved: true, ownerAndReferralExclusion: true, scopedAndEmpty: true, boundedProductionSql: true },
    sourceSha256: { baselineStats: createHash('sha256').update(oldSource).digest('hex'), currentStats: createHash('sha256').update(readFileSync('packages/analytics/src/stats.ts')).digest('hex'), signatureBasis: createHash('sha256').update(readFileSync('packages/analytics/src/signature-basis.ts')).digest('hex') },
    productionCalls: 0, networkCalls: 0, limits: ['Local row-read counters are fixture measurements, not a production cost forecast or account-wide cost.', 'No human accuracy, organic vendor/native agreement or authenticated purpose follows from these stored fixtures.'],
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ oldMarginalsIdentical: true, newJointEvidenceDifferent: true, measurements, fixtureEvents: 9, productionCalls: 0 }));
} finally { await mf.dispose(); }
