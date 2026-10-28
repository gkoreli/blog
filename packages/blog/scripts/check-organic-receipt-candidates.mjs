import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = process.argv[2]; assert.ok(output, 'Provide a new closed native receipt');
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("SQL fixture"); } }',
  compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'organic-candidate-fixtures' } });
const sqlPath = 'packages/blog/drafts/research/analytics-retrospective/organic-receipt-candidates.sql';
const sql = readFileSync(sqlPath, 'utf8'), bounds = ['2026-10-27 22:51:11', '2026-10-28 00:13:21'];
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const insert = (version, status, source, time, evidence, owner = 0) => db.prepare(`INSERT INTO page_observations
    (path,daily_client_id,traffic_class,device_type,is_owner,observation_source,reader_kind,reader_reason,collection_version,signature_status,signature_agent,signature_evidence,observed_at)
    VALUES('/fixture','00000000000000000000000000000000','ai','desktop',?,?,'signed-agent','fixture',?,?, 'https://fixture.example',?,?)`).bind(owner,source,version,status,evidence===null?null:JSON.stringify(evidence),time).run();
  const verified = { source: 'test-injected', localOutcome: 'verified' };
  await insert('2026-10-27.9','verified','edge','2026-10-27 23:00:00',verified);
  await insert('2026-10-28.1','verified','edge','2026-10-28 00:10:00',verified,1);
  await insert('2026-10-28.1','verified','edge','2026-10-28 00:10:01',{source:'test-injected',localOutcome:'invalid'});
  await insert('2026-10-27.10','verified','edge','2026-10-28 00:10:02',null);
  await insert('2026-10-28.1','unverified','edge','2026-10-28 00:10:03',verified);
  await insert('2026-10-27.8','verified','edge','2026-10-28 00:10:04',verified);
  await insert('2026-10-28.1','verified','beacon','2026-10-28 00:10:05',verified);
  await insert('2026-10-28.1','verified','edge','2026-10-27 22:51:10',verified);
  await insert('2026-10-28.1','verified','edge','2026-10-28 00:13:21',verified);
  const query = () => db.prepare(sql).bind(...bounds).all();
  const baseline = await query(); assert.equal(baseline.results.length,4);
  assert.ok(baseline.results.every(row=>typeof row.privateReference==='string' && /^[1-9][0-9]*$/.test(row.privateReference)));
  assert.equal(baseline.results.filter(row=>row.ownerExcluded===1).length,1);
  assert.equal(baseline.results.filter(row=>row.signatureEvidence===null).length,1);
  assert.equal(baseline.results.filter(row=>row.signatureEvidence!==null && JSON.parse(row.signatureEvidence).localOutcome==='invalid').length,1);
  assert.deepEqual(baseline.results.map(row=>row.observedAt),[...baseline.results].map(row=>row.observedAt).sort().reverse());
  const empty = await db.prepare(sql).bind('2026-10-29 00:00:00','2026-10-29 00:01:00').all(); assert.equal(empty.results.length,0);
  for(let i=0;i<22;i++)await insert('2026-10-28.1','verified','edge','2026-10-28 00:11:00',verified);
  const capped = await query(); assert.equal(capped.results.length,21);
  assert.equal(new Set(capped.results.map(row=>row.privateReference)).size,21);
  assert.equal(capped.meta.rows_written,0);
  const plan=(await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...bounds).all()).results;
  assert.ok(plan.some(row=>row.detail.includes('idx_page_observations_observed_at')));
  writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),method:'Native local D1 with synthetic stored records; not cryptographic, vendor or organic labels.',
    baselineRows:baseline.results.length,missingProofRetained:true,contradictoryProofRetained:true,ownerRowsRetainedForAssessment:true,emptyRows:0,cappedRows:21,capMeaning:'21 is a truncation sentinel, not a complete-population count',queryPlan:plan,
    baselineWork:{rowsRead:baseline.meta.rows_read,rowsWritten:baseline.meta.rows_written},cappedWork:{rowsRead:capped.meta.rows_read,rowsWritten:capped.meta.rows_written},
    sqlSha256:createHash('sha256').update(sql).digest('hex'),sourceSha256:createHash('sha256').update(readFileSync('packages/blog/scripts/check-organic-receipt-candidates.mjs')).digest('hex'),productionCalls:0,externalCalls:0},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({baselineRows:4,cappedRows:21,indexAccepted:true,productionCalls:0}));
} finally {await mf.dispose();}
