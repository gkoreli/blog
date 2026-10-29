import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [output] = process.argv.slice(2); assert.ok(output);
const require = createRequire(resolve('package.json'));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const mf = new Miniflare({ modules: true, script: 'export default{fetch(){return new Response("Offline SQL fixture")}}', compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'latest-signed-storage' } });
try {
  const db = await mf.getD1Database('DB'), schema = readFileSync('packages/analytics/schema.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  await db.batch(schema.split(';').map(text => text.trim()).filter(Boolean).map(text => db.prepare(text)));
  const refs = ['9007199254740992', '9007199254740993'];
  for (const [index, ref] of refs.entries()) await db.prepare("INSERT INTO page_observations(id,path,daily_client_id,traffic_class,device_type,is_owner,collection_version,signature_status) VALUES(CAST(? AS INTEGER),'/fixture','00000000000000000000000000000000','ai','desktop',?,?,?)")
    .bind(ref, index === 0 ? 1 : 0, index === 0 ? 'contradictory-fixture' : '2026-10-29.3', index === 0 ? 'unverified' : 'verified').run();
  const sql = readFileSync('packages/blog/drafts/research/analytics-retrospective/latest-signed-storage.sql', 'utf8'); assert.equal((sql.match(/\?/g) ?? []).length, 2);
  const result = await db.prepare(sql).bind(...refs).all(); assert.deepEqual(result.results.map(row => row.privateReference), refs);
  assert.equal(result.results[0].signatureStatus, 'unverified'); assert.equal(result.results[0].collectionVersion, 'contradictory-fixture'); assert.equal(result.results[0].ownerFlag, 1);
  assert.ok(result.results.every(row => row.signatureEvidence === null && row.classificationEvidence === null && row.vendorIpEvidence === null));
  assert.equal(result.meta.rows_read, 4); assert.equal(result.meta.rows_written, 0);
  const plan = await db.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...refs).all(); assert.ok(plan.results.some(row => row.detail.includes('INTEGER PRIMARY KEY')));
  const control = await db.prepare('SELECT 1 AS query_access_control').all();
  assert.deepEqual(control.results, [{ query_access_control: 1 }]); assert.equal(control.meta.rows_read, 0); assert.equal(control.meta.rows_written, 0);
  const receipt = { checkedAt: new Date().toISOString(), sqlSha256: createHash('sha256').update(sql).digest('hex'), nativeRows: 2, reads: result.meta.rows_read, writes: result.meta.rows_written,
    primaryKeyPlan: true, unsafeNeighborTextIdsDistinct: true, contradictoryAndMissingFieldsRetained: true, ownerIncluded: true,
    accessControl: { sql: 'SELECT 1 AS query_access_control', reads: control.meta.rows_read, writes: control.meta.rows_written }, productionStatements: 0 };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); console.log(JSON.stringify(receipt));
} finally { await mf.dispose(); }
