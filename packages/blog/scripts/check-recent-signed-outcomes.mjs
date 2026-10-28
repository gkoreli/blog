import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const [output, privatePlan] = process.argv.slice(2); assert.ok(output && privatePlan);
const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/recent-signed-outcomes.sql', 'utf8');
const bounds = ['2026-10-28 02:51:51', '2026-10-28 02:59:52'];
const req = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(req.resolve('miniflare', { paths: [dirname(req.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default{fetch(){return new Response("SQL control")}}', compatibilityDate: '2026-03-06', d1Databases: { DB: 'recent-signed-outcomes' } });
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)));
  const add = (id, time, origin, evidence, options = {}) => db.prepare(`INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,observed_at,signature_status,signature_agent,signature_evidence,collection_version)
    VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','bot','desktop',?,?,?,?,?,?)`)
    .bind(id, options.owner ?? 0, time, options.status ?? 'verified', origin, evidence, options.version ?? '2026-10-28.7').run();
  await add('9007199254740992', bounds[0], 'https://crawler.exa.ai', '{}');
  await add('9007199254740993', bounds[0], 'https://crawler.exa.ai', null, { owner: 1 });
  await add('9007199254740994', bounds[0], 'https://ahrefs.com', '{"localOutcome":"invalid"}', { version: 'contradictory-fixture' });
  await add('1', '2026-10-28 02:51:50', 'https://crawler.exa.ai', '{}');
  await add('2', bounds[1], 'https://crawler.exa.ai', '{}');
  await add('3', bounds[0], 'https://private-fixture.example', '{}');
  await add('4', bounds[0], 'https://crawler.exa.ai', '{}', { status: 'unverified' });
  const baseline = await db.prepare(sql).bind(...bounds).all();
  assert.equal(baseline.results.length, 3); assert.deepEqual(baseline.results.map(r => r.privateReference), ['9007199254740992', '9007199254740993', '9007199254740994']);
  assert.equal(baseline.results[1].signatureEvidence, null); assert.equal(baseline.results[1].ownerFlag, 1);
  assert.equal(baseline.results[2].collectionVersion, 'contradictory-fixture');
  assert.equal(JSON.parse(baseline.results[2].signatureEvidence).localOutcome, 'invalid');
  for (let i = 0; i < 4; i++) await add(String(100 + i), bounds[0], 'https://crawler.exa.ai', '{}');
  const capped = await db.prepare(sql).bind(...bounds).all(); assert.equal(capped.results.length, 4);
  assert.equal((await db.prepare(sql).bind(bounds[1], '2026-10-28 03:00:00').all()).results.length, 1);
  const plan = (await db.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...bounds).all()).results;
  assert.ok(plan.some(row => row.detail.includes('idx_page_observations_observed_at')));
  const command = sql.replace('?', "'" + bounds[0] + "'").replace('?', "'" + bounds[1] + "'");
  const sqlSha256 = createHash('sha256').update(command).digest('hex');
  writeFileSync(privatePlan, JSON.stringify({ sql: command, sqlSha256, start: bounds[0], endExclusive: bounds[1], expectedPriorCount: 3, truncationSentinel: 4, postExecutionReadThreshold: 100, expectedFields: Object.keys(baseline.results[0]) }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Native local D1 stored-record query controls, not cryptographic or operator labels.', baselineRows: 3, unsafeIntegerNeighborsPreserved: true, missingAndContradictoryEvidenceRetained: true, ownerRowsRetained: true, timeAndOriginBoundaries: true, cap: 4, capIsTruncationSentinel: true, timeIndexUsed: true, baselineRowsRead: baseline.meta.rows_read, cappedRowsRead: capped.meta.rows_read, rowsWritten: baseline.meta.rows_written, sqlSha256, productionStatements: 0, limits: ['Returned-row cap does not enforce a read-cost cap.', 'Stored verified status is not independent packet verification.', 'Scope deliberately includes public-excluded records.'] }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ baselineRows: 3, cap: 4, timeIndexUsed: true, baselineRowsRead: baseline.meta.rows_read }));
} finally { await mf.dispose(); }
