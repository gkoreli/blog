import {buildProjectedStatsQueryPlan} from '../.test-dist/stats-query.js';
import {createStatsWindow} from '../.test-dist/dates.js';
import {referralReportProjectionSql,REFERRAL_REPORT_RULES_JSON} from '../.test-dist/referral-report-projection.js';
/** Native D1/SQLite parity over synthetic events. Optional first argument is an
 * earlier bundled stats module for before/after comparison. MINIFLARE_WORKERD_PATH
 * can select a separately installed runtime without changing workspace pins.
 */
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import wrangler from 'wrangler';
import { reportProjectionSql as networkReportProjectionSql } from '../.test-dist/report-projection.js';
import { queryProjectedStats as queryStats } from '../.test-dist/stats.js';
import { STATS_INTEGRITY_INSERT, statsIntegrityValues } from '../test/fixtures/stats-integrity.mjs';
import { networkSummaryCases } from '../test/fixtures/vendor-network-summary.mjs';

import {summaryCases} from '../test/fixtures/signature-summary.mjs';
import {parsingCases} from '../test/fixtures/fetch-metadata-summary.mjs';
import {vendorCacheSummaryCases} from '../test/fixtures/vendor-cache-summary.mjs';
import {verifyVendorIp,createVendorIpCache} from '../.test-dist/vendor-ip.js';
import {clientFormEvidence} from '../.test-dist/client-form.js';

const reference = process.argv[2] ? await import(pathToFileURL(resolve(process.argv[2])).href) : await import('../.test-dist/stats.js');
const directory = mkdtempSync(join(tmpdir(), 'gkoreli-stats-runtime-'));
const configPath = join(directory, 'wrangler.json');
writeFileSync(configPath, JSON.stringify({ name: 'stats-runtime-fixture', compatibility_date: '2026-03-06',
  d1_databases: [{ binding: 'DB', database_name: 'fixture', database_id: '00000000-0000-0000-0000-000000000001' }],
}));
const sqlite = new DatabaseSync(':memory:');
let proxy;
try {
  proxy = await wrangler.getPlatformProxy({ configPath, persist: false });
  const db = proxy.env.DB;
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  sqlite.exec(schema);
  await db.batch(wrangler.unstable_splitSqlQuery(schema).map(sql => db.prepare(sql)));
  const inserts = statsIntegrityValues().map(values => ({ sql: STATS_INTEGRITY_INSERT, values }));
  for (const [index, item] of networkSummaryCases.entries()) inserts.push({
    sql: `INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence)
      VALUES('/network',?,'browser','desktop',0,'browser','fixture','2026-10-30 11:00:00',?)`,
    values: [(index + 100).toString(16).padStart(32,'0'), item.e === null ? null : JSON.stringify(item.e)],
  });
  const base={path:'/projection-fixture',daily_client_id:'f'.repeat(32),traffic_class:'ai',device_type:'desktop',is_owner:0,reader_kind:'ai-search',reader_reason:'fixture',observed_at:'2026-10-30 11:00:00'};
  const records=[
    ...summaryCases.map(item=>({...base,signature_status:item.status,signature_evidence:item.e===null?null:JSON.stringify(item.e)})),
    ...parsingCases().map(([,row])=>row),
    ...(await vendorCacheSummaryCases(verifyVendorIp,createVendorIpCache)).map(item=>({...base,vendor_ip_evidence:item.e===null?null:JSON.stringify(item.e)})),
    ...['Mobile','iPhone iPad','Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',''].flatMap(ua=>[null,'?0','?1','unsupported'].map(hint=>({...base,client_form_evidence:JSON.stringify(clientFormEvidence(ua,hint,null))}))),
  ];
  for(const row of records) inserts.push({sql:`INSERT INTO page_observations(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`,values:Object.values(row)});
  for (const {sql,values} of inserts) sqlite.prepare(sql).run(...values);
  await db.batch(inserts.map(({sql,values}) => db.prepare(sql).bind(...values)));
  const referenceDb = {
    prepare(sql) { return { bind(...values) { return { sql, values }; } }; },
    async batch(statements) { return statements.map(({sql,values}) => ({ success: true, results: sqlite.prepare(sql).all(...values) })); },
  };
  const queries = ['7d','30d','90d','all'].flatMap(range =>
    ['all','browser','agents','crawlers','automation','unresolved'].map(traffic => ({ range, traffic })));
  for (const path of ['/alpha','/delta','/network','/excluded','/absent']) queries.push({ range: '7d', traffic: 'all', path });
  for (const kind of ['browser','ai-assistant','unresolved']) queries.push({ range: 'all', traffic: 'all', kind });
  queries.push({ range: '7d', traffic: 'all', agent: 'ExaUser' });
  const now = new Date('2026-10-31T12:00:00Z');
  const costs = [];
  for (const mode of ['fallback', 'projected']) {
    if (mode === 'projected') {
      await db.prepare(networkReportProjectionSql('range')).bind(0, Number.MAX_SAFE_INTEGER).run();
      await db.prepare(referralReportProjectionSql()).bind(0, Number.MAX_SAFE_INTEGER, REFERRAL_REPORT_RULES_JSON).run();
    }
    for (const query of queries) {
    const expected = await reference.queryStats(referenceDb, query, now);
    const actual = await queryStats(db, query, now, undefined, cost => costs.push(cost));
    assert.deepEqual(actual, expected, JSON.stringify({ mode, query }));
    }
  }
  const [plan]=buildProjectedStatsQueryPlan({range:'30d',traffic:'all'},createStatsWindow('30d',now));
  const explained=await db.prepare('EXPLAIN QUERY PLAN '+plan.sql).bind(...plan.values).all();
  const coveringPlans=explained.results.filter(row=>typeof row.detail==='string' && row.detail.includes('COVERING INDEX')).map(row=>row.detail);
  assert.ok(coveringPlans.some(step=>step.includes('idx_page_observation_report_facts_public_cover')));
  assert.ok(coveringPlans.some(step=>step.includes('idx_page_observations_public_time')));
  assert.ok(costs.every(cost => [2,5].includes(cost.submittedStatements) && cost.returnedResults === cost.submittedStatements && cost.reportedRowsWritten === 0));
  console.log(JSON.stringify({ selectors: queries.length, comparisons: queries.length * 2, meteredBatches: costs.length, modes: ['fallback', 'projected'], syntheticRows: inserts.length, projectedStatementsPerReport: 2, sourceStatementsPerReport: 5,
    firstReport: costs[0], coveringPlans, parity: true }));
} finally {
  sqlite.close();
  await proxy?.dispose();
  rmSync(directory, { recursive: true, force: true });
}
