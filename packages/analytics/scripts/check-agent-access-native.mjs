import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { schemaObjects } from './fresh-schema.mjs';
import { ACCESS_CATALOGUE, ACCESS_NOW, accessFixture } from '../test/fixtures/agent-access.mjs';
import { queryAgentAccess, buildAgentAccessQueryPlan } from '../.test-dist/agent-access.js';
import { consistentAgentAccessReport } from '../.test-dist/agent-access-contract.js';
import { reportProjectionSql } from '../.test-dist/report-projection.js';
import { ACTIVE_REFERRAL_POLICY } from '../.test-dist/referral-policy.generated.js';

const output = process.argv[2];
assert(output, 'Output directory required');
const repeat = process.argv[3] === undefined ? 1 : Number(process.argv[3]);
assert(Number.isSafeInteger(repeat) && repeat > 0 && repeat <= 500, 'Repeat must be 1–500');
await mkdir(output, { recursive: true });
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { Miniflare } = await import(pathToFileURL(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] })));
const { build } = await import(pathToFileURL(require.resolve('esbuild', { paths: [resolve('packages/blog')] })));
const entry = `import {queryAgentAccess} from './packages/analytics/src/agent-access.ts';
let externalFetches=0;globalThis.fetch=async()=>{externalFetches++;throw Error('External transport disabled')};
export default{async fetch(request,env){const calculations=[];
  try{const report=await queryAgentAccess(env.DB,${JSON.stringify(ACCESS_CATALOGUE)},{now:new Date(${JSON.stringify(ACCESS_NOW.toISOString())}),onCalculation:event=>calculations.push(event),readModel:new URL(request.url).searchParams.get('source')==='1'?'source':'projected'});
    return Response.json({report,calculations,externalFetches});
  }catch(error){return Response.json({error:String(error),calculations,externalFetches},{status:503})}}};`;
const compiled = await build({ stdin: { contents: entry, resolveDir: resolve('.'), loader: 'js' }, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', write: false });
const script = compiled.outputFiles[0].text;
const fixture = accessFixture(repeat);
const mf = new Miniflare({ modules: true, script, compatibilityDate: '2026-03-06', cf: {}, d1Databases: { DB: 'agent-access-native' } });
const receipts = [], schema = new DatabaseSync(':memory:');
try {
  schema.exec(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = await mf.getD1Database('DB');
  for (const object of schemaObjects(schema)) await db.prepare(object.sql).run();
  for (let offset = 0; offset < fixture.rows.length; offset += 32) {
    await db.batch(fixture.rows.slice(offset, offset + 32).map(row => {
      const columns = Object.keys(row);
      return db.prepare(`INSERT INTO page_observations(${columns.join(',')})VALUES(${columns.map(() => '?').join(',')})`).bind(...Object.values(row));
    }));
  }
  await db.prepare("INSERT INTO owner_clients(daily_client_id,utc_date)VALUES(?,'2026-10-17')").bind('f'.repeat(32)).run();
  const original = (await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  const expected = await queryAgentAccess(fixture.db, ACCESS_CATALOGUE, { now: ACCESS_NOW, readModel: 'source' });
  async function check(name, source, expectedReport = expected) {
    const response = await mf.dispatchFetch('https://native.fixture/report' + (source ? '?source=1' : ''));
    const body = await response.json();
    if (!response.ok) await writeFile(resolve(output, name + '-failure.json'), JSON.stringify(body, null, 2));
    assert.equal(response.status, 200, name + ': ' + JSON.stringify(body.error));
    assert.equal(body.externalFetches, 0);
    assert(consistentAgentAccessReport(body.report));
    assert.deepEqual(body.report, expectedReport);
    receipts.push({ name, views: body.report.total.views, cells: body.report.cells.length, history: body.report.history.length, proofs: body.report.proofs.length, bytes: JSON.stringify(body.report).length, calculations: body.calculations, externalFetches: body.externalFetches });
    return body.report;
  }
  await check('native-source', true);
  await check('missing-projection-fallback', false);
  await db.prepare(reportProjectionSql('range')).bind(0, Number.MAX_SAFE_INTEGER).run();
  fixture.project();
  await check('complete-projection', false);
  await db.prepare('UPDATE page_observation_report_facts SET rule_sha256=? WHERE observation_id=1').bind('0'.repeat(64)).run();
  await check('stale-projection-fallback', false);
  await db.prepare(reportProjectionSql('range')).bind(0, Number.MAX_SAFE_INTEGER).run();
  await db.prepare("UPDATE page_observation_report_facts SET report_signature_basis='invalid-proof-basis' WHERE observation_id=1").run();
  const rejected = await mf.dispatchFetch('https://native.fixture/report');
  const rejection = await rejected.json();
  assert.equal(rejected.status, 503);
  assert.equal(Object.hasOwn(rejection, 'report'), false);
  assert.equal(rejection.externalFetches, 0);
  receipts.push({ name: 'malformed-derived-proof-rejected', status: rejected.status, reportReturned: false });
  const after = (await db.prepare('SELECT * FROM page_observations ORDER BY id').all()).results;
  assert.deepEqual(after, original);
  const queries = buildAgentAccessQueryPlan(ACCESS_CATALOGUE, '2026-10-17', '2026-11-14', ACTIVE_REFERRAL_POLICY);
  const query = queries[0];
  const plan = (await db.prepare('EXPLAIN QUERY PLAN ' + query.sql).bind(...query.values).all()).results;
  assert(plan.some(row => /observed_at/.test(row.detail) && /SEARCH/.test(row.detail)), 'Date-bounded observation index is required');
  const summary = { version: 1, passed: true, recordedAt: new Date().toISOString(), runtime: 'native Workerd via installed Miniflare', originalRows: original.length, originalRowsUnchanged: true, originalRowsSha256: createHash('sha256').update(JSON.stringify(original)).digest('hex'), checks: receipts, queryPlan: plan, sourceSqlBytes: buildAgentAccessQueryPlan(ACCESS_CATALOGUE, '2026-10-17', '2026-11-14', ACTIVE_REFERRAL_POLICY, true).map(query=>query.sql.length), projectedSqlBytes: queries.map(query=>query.sql.length), boundParameters: query.values.length };
  await writeFile(resolve(output, 'native-acceptance.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, originalRows: original.length, originalRowsUnchanged: true, checks: receipts.map(({ name, views, cells, calculations, status }) => ({ name, views, cells, status, calculations: calculations?.map(event => ({ readModel: event.readModel, reads: event.reportedRowsRead, writes: event.reportedRowsWritten, statements: event.submittedStatements, elapsedMs: event.elapsedMs })) })), sourceSqlBytes: summary.sourceSqlBytes, projectedSqlBytes: summary.projectedSqlBytes }));
} finally { fixture.sqlite.close(); schema.close(); await mf.dispose(); }
