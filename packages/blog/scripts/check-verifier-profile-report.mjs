import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { queryStats } from '../../analytics/.test-dist/stats.js';
import { verifierProfileSql, CURRENT_VERIFIER_PROFILE, isReportedVerifierProfile } from '../../analytics/.test-dist/verifier-profile.js';
import { signatureBasisSql, isSignatureBasis } from '../../analytics/.test-dist/signature-basis.js';
import { reportedKindSql } from '../../analytics/.test-dist/reporting-kind.js';
import { isReaderKind } from '../../analytics/.test-dist/contracts.js';
import { referralAssessmentCtes, referralRulesJson } from '../../analytics/.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/.test-dist/referral-policy.generated.js';

export function validateDeltaRows(rows) {
  assert.ok(Array.isArray(rows) && rows.length < 1001);
  const keys = new Set();
  for (const row of rows) {
    assert.ok(['included','owner-excluded','referral-excluded'].includes(row.inclusion));
    assert.ok(isReaderKind(row.kind) && isSignatureBasis(row.basis) && isReportedVerifierProfile(row.profile));
    assert.ok(['edge','beacon','unrecognized'].includes(row.source)); assert.ok(['current','other-recorded','not-recorded'].includes(row.collectionState));
    assert.ok(['canonical','unrecognized'].includes(row.timeState) && ['available','unavailable','not-recorded'].includes(row.nativeBooleans));
    assert.ok(Number.isSafeInteger(row.views) && row.views > 0);
    const { views, ...dimensions } = row; const key = JSON.stringify(dimensions); assert.ok(!keys.has(key)); keys.add(key);
  }
  return rows;
}

async function main() {
const [output, prefix] = process.argv.slice(2); assert.ok(output && prefix);
const baseline = 'aa937d5';
const previous = name => execFileSync('git', ['show', `${baseline}:packages/analytics/src/${name}.ts`], { encoding: 'utf8' });
const old = await build({ stdin: { contents: previous('stats'), loader: 'ts', resolveDir: resolve('packages/analytics/src') }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  plugins: [{ name: 'pinned-old-basis', setup(builder) { builder.onLoad({ filter: /[/\\]signature-basis\.ts$/ }, () => ({ contents: previous('signature-basis'), loader: 'ts', resolveDir: resolve('packages/analytics/src') })); } }] });
const oldStats = (await import('data:text/javascript;base64,' + Buffer.from(old.outputFiles[0].contents).toString('base64'))).queryStats;
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default{fetch(){return new Response("profile fixture")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'profile-report' } });
const start = '2026-10-27 21:49:00', end = '2026-10-28 04:40:00';
const deltaSql = `WITH RECURSIVE
  selected AS MATERIALIZED (
    SELECT *, EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=page_observations.daily_client_id) AS client_owner
    FROM page_observations INDEXED BY idx_page_observations_observed_at WHERE observed_at >= ? AND observed_at < ?
  ),
  ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host,'.')) AS normalized FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
  projected AS MATERIALIZED (
    SELECT CASE WHEN is_owner=1 OR client_owner=1 THEN 'owner-excluded' WHEN COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0)=1 THEN 'referral-excluded' ELSE 'included' END AS inclusion,
      ${reportedKindSql()} AS kind, ${signatureBasisSql()} AS basis, ${verifierProfileSql()} AS profile,
      CASE WHEN observation_source IN ('edge','beacon') THEN observation_source ELSE 'unrecognized' END AS source,
      CASE WHEN collection_version IS NULL THEN 'not-recorded' WHEN collection_version='2026-10-28.9' THEN 'current' ELSE 'other-recorded' END AS collectionState,
      CASE WHEN length(observed_at)=19 AND datetime(observed_at,'+0 seconds')=observed_at THEN 'canonical' ELSE 'unrecognized' END AS timeState,
      CASE WHEN signature_evidence IS NULL THEN 'not-recorded' WHEN json_type(signature_evidence,'$.native.verifiedBot') IN ('true','false') OR json_type(signature_evidence,'$.native.signedAgent') IN ('true','false') THEN 'available' ELSE 'unavailable' END AS nativeBooleans
    FROM selected
  ) SELECT inclusion,kind,basis,profile,source,collectionState,timeState,nativeBooleans,COUNT(*) AS views
  FROM projected GROUP BY inclusion,kind,basis,profile,source,collectionState,timeState,nativeBooleans
  ORDER BY inclusion,kind,basis,profile,source,collectionState,timeState,nativeBooleans LIMIT 1001`;
const countSql = 'SELECT COUNT(*) AS rows,COUNT(DISTINCT referrer_host) AS distinctReferrers FROM page_observations INDEXED BY idx_page_observations_observed_at WHERE observed_at >= ? AND observed_at < ?';
const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + value.replaceAll("'", "''") + "'";
const concrete = (sql, values) => { let i = 0; const result = sql.replace(/\?/g, () => quote(values[i++])); assert.equal(i, values.length); return result + ';\n'; };

try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(sql => db.prepare(sql)));
  const evidence = { version: '2026-10-27.5', source: 'local-webbotauth', localStatus: 'verified', localOutcome: 'verified', verifierProfile: CURRENT_VERIFIER_PROFILE, coverage: { version: '2026-10-27.1', covered: { userAgent: false } } };
  const insert = (id, e, options = {}) => db.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_agent,signature_evidence,referrer_host) VALUES('/privacy',?,'ai','desktop',?,'ai-search','fixture',?,'verified','https://crawler.exa.ai',?,?)`).bind(String(id).padStart(32, '0'), options.owner ?? 0, options.at ?? start, e === null ? null : JSON.stringify(e), options.referrer ?? null);
  let last;
  const tap = { prepare(sql) { return { bind(...values) { last = { sql, values }; return db.prepare(sql).bind(...values); } }; }, async batch(statements) { const results = await db.batch(statements); last.meta = results[0].meta; return results; } };
  const query = { range: '7d', traffic: 'all', path: '/privacy' }, now = new Date('2026-10-28T04:40:00Z');
  const measurements = [], collapsed = report => {
    const groups = new Map();
    for (const row of report.byKindSignature) { const key = JSON.stringify([row.kind,row.basis]); const previous = groups.get(key); groups.set(key, { kind: row.kind, basis: row.basis, views: (previous?.views ?? 0) + row.views }); }
    return [...groups.values()].sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  };
  for (let group = 0; group < 8; group++) await db.batch(Array.from({ length: 64 }, (_, i) => { const id = group * 64 + i; return insert(id + 1, { ...evidence, verifierProfile: id % 2 ? '2026-10-28.6' : CURRENT_VERIFIER_PROFILE }); }));
  const oldReport = await oldStats(tap, query, now), oldReads = last.meta.rows_read;
  const current = await queryStats(tap, query, now), currentReads = last.meta.rows_read;
  const { byKindSignature: oldJoint, ...oldCommon } = oldReport;
  const { byKindSignature: newJoint, verifierProfile, ...newCommon } = current;
  assert.deepEqual(newCommon, oldCommon); assert.deepEqual(collapsed(current), collapsed(oldReport));
  assert.equal(oldJoint.length, 1); assert.equal(newJoint.length, 2);
  measurements.push({ rows: 512, oldReads, currentReads, delta: currentReads-oldReads });
  await db.prepare('DELETE FROM page_observations').run();
  const cases = [evidence, { ...evidence, verifierProfile: '2026-10-28.6' }, { ...evidence, verifierProfile: null }, { ...evidence, verifierProfile: 'private-profile@example.invalid' }, { ...evidence, localOutcome: 'invalid' }, { ...evidence, source: 'test-injected' }, null];
  await db.batch(cases.map((e, i) => insert(i+1,e)));
  await db.batch([insert(20,evidence,{owner:1,referrer:'traffic2cash.xyz'}),insert(21,evidence,{referrer:'traffic2cash.xyz'}),insert(22,evidence,{at:'2026-10-27 21:48:59'}),insert(23,evidence,{at:end})]);
  const report = await queryStats(tap, query, now);
  assert.equal(report.totals.views, 9); assert.equal(report.byKindSignature.reduce((n,r)=>n+r.views,0),9); assert.equal(report.referralPolicy.excludedViews,1);
  assert.equal(JSON.stringify(report).includes('private-profile@'), false);
  writeFileSync(prefix+'-client-fixture.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  const delta = await db.prepare(deltaSql).bind(start,end,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all(); validateDeltaRows(delta.results);
  assert.equal(delta.results.reduce((n,r)=>n+r.views,0),9); assert.equal(delta.results.find(r=>r.inclusion==='owner-excluded').views,1);
  const count = await db.prepare(countSql).bind(start,end).first(); assert.equal(count.rows,9);
  const plan = await db.prepare('EXPLAIN QUERY PLAN '+deltaSql).bind(start,end,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all(); assert.ok(plan.results.some(row=>row.detail.includes('idx_page_observations_observed_at')));
  const sql = concrete(deltaSql,[start,end,referralRulesJson(ACTIVE_REFERRAL_POLICY)]), countCommand = concrete(countSql,[start,end]);
  writeFileSync(prefix+'-delta.sql',sql,{flag:'wx',mode:0o600}); writeFileSync(prefix+'-count.sql',countCommand,{flag:'wx',mode:0o600});
  // A native scale measurement informs the review threshold; it does not cap remote work.
  await db.prepare('DELETE FROM page_observations').run();
  for(let group=0;group<32;group++)await db.batch(Array.from({length:64},(_,i)=>insert(group*64+i+1,evidence,{referrer:`host${group*64+i}.fixture.example`})));
  const scaled = await db.prepare(deltaSql).bind(start,end,referralRulesJson(ACTIVE_REFERRAL_POLICY)).all();validateDeltaRows(scaled.results);
  const result={checkedAt:new Date().toISOString(),baselineCommit:baseline,method:'Supplied stored-record fixtures and actual local D1. No cryptographic, operator or population label.',measurements,commonOutputAndCollapsedBasisUnchanged:true,profileJointSeparatesSameBasis:true,fixtureIncludedViews:9,deltaFixtureRows:9,deltaTimeIndexUsed:true,deltaNativeScale:{rows:2048,distinctReferrers:2048,rowsRead:scaled.meta.rows_read,rowsWritten:scaled.meta.rows_written},startInclusive:start,endExclusive:end,querySha256:createHash('sha256').update(sql).digest('hex'),countSha256:createHash('sha256').update(countCommand).digest('hex'),productionPlan:{countStatements:1,deltaStatements:1,postExecutionReadThreshold:50000,maxCountBeforeDelta:2048,thresholdIsServerEnforced:false},productionCalls:0};
  writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({measurements,nativeDeltaReads:scaled.meta.rows_read,productionCalls:0}));
} finally { await mf.dispose(); }

}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
