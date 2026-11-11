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
import { queryStats } from '../.test-dist/stats.js';
import { STATS_INTEGRITY_INSERT, statsIntegrityValues } from '../test/fixtures/stats-integrity.mjs';
import { networkSummaryCases } from '../test/fixtures/vendor-network-summary.mjs';

const reference = process.argv[2] ? await import(pathToFileURL(resolve(process.argv[2])).href) : { queryStats };
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
  for (const query of queries) {
    const expected = await reference.queryStats(referenceDb, query, now);
    const actual = await queryStats(db, query, now, undefined, cost => costs.push(cost));
    assert.deepEqual(actual, expected, JSON.stringify(query));
  }
  assert.ok(costs.every(cost => cost.submittedStatements === 5 && cost.returnedResults === 5 && cost.reportedRowsWritten === 0));
  console.log(JSON.stringify({ selectors: queries.length, syntheticRows: inserts.length, statementsPerReport: 5,
    firstReport: costs[0], parity: true }));
} finally {
  sqlite.close();
  await proxy?.dispose();
  rmSync(directory, { recursive: true, force: true });
}
