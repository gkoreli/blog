/** Uncached, same-database report comparison over synthetic evidence.
 * First argument: frozen earlier stats bundle exporting queryStats.
 * MINIFLARE_WORKERD_PATH selects a local runtime; no remote database is used.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import wrangler from 'wrangler';
import { reportProjectionSql as networkReportProjectionSql } from '../.test-dist/report-projection.js';
import { queryStats, queryProjectedStats } from '../.test-dist/stats.js';
import { summaryCases } from '../test/fixtures/signature-summary.mjs';
import { networkSummaryCases } from '../test/fixtures/vendor-network-summary.mjs';
import { vendorCacheSummaryCases } from '../test/fixtures/vendor-cache-summary.mjs';
import { verifyVendorIp, createVendorIpCache } from '../.test-dist/vendor-ip.js';

if (!process.argv[2]) throw new Error('Pass a frozen earlier stats module for exact before/after comparison');
const reference = await import(pathToFileURL(resolve(process.argv[2])).href);
const directory = mkdtempSync(join(tmpdir(), 'gkoreli-stats-benchmark-'));
const configPath = join(directory, 'wrangler.json');
writeFileSync(configPath, JSON.stringify({ name: 'stats-benchmark', compatibility_date: '2026-03-06',
  d1_databases: [{ binding: 'DB', database_name: 'fixture', database_id: '00000000-0000-0000-0000-000000000001' }],
}));
const networks = [...networkSummaryCases, ...await vendorCacheSummaryCases(verifyVendorIp, createVendorIpCache)];
const clock = new Date('2026-10-31T12:00:00Z');
const insert = `INSERT INTO page_observations
  (path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,country,
   referrer_host,referrer_state,signature_status,signature_agent,agent_name,signature_evidence,vendor_ip_evidence,representation)
  VALUES(?,?,'ai','desktop',?,'ai-search','ExaSearchBot',?,'US',?,'external',?,'https://crawler.exa.ai','ExaSearchBot',?,?,'html')`;
const scenarios = [
  { name: 'empty', rows: 0, distinct: false, query: { range: '7d', traffic: 'all' } },
  { name: 'repeated-4500', rows: 4500, distinct: false, query: { range: '7d', traffic: 'all' } },
  { name: 'unique-network-4500', rows: 4500, distinct: false, distinctNetwork: true, query: { range: '7d', traffic: 'all' } },
  { name: 'distinct-4500', rows: 4500, distinct: true, query: { range: '7d', traffic: 'all' } },
  { name: 'wide-15000', rows: 15000, distinct: false, query: { range: '30d', traffic: 'all' } },
];
function record(value, distinct, sequence) {
  return value === null ? null : JSON.stringify(distinct ? { ...value, benchmarkSequence: sequence } : value);
}
async function measure(native, execute, query) {
  const batches = [];
  const db = {
    prepare(sql) { return { bind(...values) { return { sql, values }; } }; },
    async batch(statements) {
      const results = await native.batch(statements.map(s => native.prepare(s.sql).bind(...s.values)));
      batches.push(results);
      return results;
    },
  };
  const started = performance.now();
  const report = await execute(db, query, clock);
  const elapsedMs = performance.now() - started;
  assert.equal(batches.length, 1, 'One transactional batch per complete report');
  const results = batches[0];
  const statements = results.map(r => ({ sqlMs: r.meta.timings?.sql_duration_ms ?? r.meta.duration,
    reads: r.meta.rows_read, writes: r.meta.rows_written }));
  assert.ok(statements.every(s => s.writes === 0));
  return { report, metrics: { elapsedMs, sqlMs: statements.reduce((n,s) => n + s.sqlMs, 0),
    reads: statements.reduce((n,s) => n + s.reads, 0), writes: 0, statements } };
}
let proxy;
try {
  proxy = await wrangler.getPlatformProxy({ configPath, persist: false });
  const db = proxy.env.DB;
  await db.batch(wrangler.unstable_splitSqlQuery(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8')).map(sql => db.prepare(sql)));
  const measurements = [];
  for (const scenario of scenarios) {
    await db.prepare('DELETE FROM page_observations').run();
    for (let start = 0; start < scenario.rows; start += 100) {
      const statements = Array.from({ length: Math.min(100, scenario.rows - start) }, (_, j) => {
        const i = start + j, signature = summaryCases[i % summaryCases.length], network = networks[i % networks.length];
        // Distinct envelopes exercise the worst case for grouping; owner/referral
        // exclusions and repeated client IDs preserve their independent meanings.
        const at = scenario.name === 'wide-15000' ? `2026-10-${String(2 + i % 29).padStart(2,'0')} 10:00:00` : '2026-10-30 10:00:00';
        return db.prepare(insert).bind('/article-' + i % 50, (i % 2300).toString(16).padStart(32,'0'),
          i % 101 === 100 ? 1 : 0, at, i % 37 === 36 ? 'traffic2cash.xyz' : i % 3 === 0 ? 'google.com' : null,
          signature.status, record(signature.e, scenario.distinct, i), record(network.e, scenario.distinct || scenario.distinctNetwork, i));
      });
      await db.batch(statements);
    }
    const before = await measure(db, reference.queryStats, scenario.query);
    const after = await measure(db, queryStats, scenario.query);
    assert.deepEqual(after.report, before.report, scenario.name);
    const highWater = await db.prepare('SELECT COALESCE(MAX(id),0) AS n FROM page_observations').first();
    const projection = await db.prepare(networkReportProjectionSql('range')).bind(0, highWater.n).run();
    const projected = await measure(db, queryProjectedStats, scenario.query);
    assert.deepEqual(projected.report, before.report, scenario.name + ': projected');
    const measurement = { ...scenario, views: after.report.totals.views, before: before.metrics, after: after.metrics, projected: projected.metrics, projectionCost: projection.meta, parity: true };
    measurements.push(measurement);
    console.log(JSON.stringify({ scenario: scenario.name, beforeMs: before.metrics.elapsedMs, afterMs: after.metrics.elapsedMs, projectedMs: projected.metrics.elapsedMs, parity: true }));
  }
  await db.prepare(`WITH RECURSIVE archive(n) AS (VALUES(0) UNION ALL SELECT n+1 FROM archive WHERE n<29999)
    INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,observed_at)
    SELECT '/archive',printf('%032x',n+100000),'browser','desktop',0,'2025-01-01 00:00:00' FROM archive`).run();
  await db.prepare('DROP INDEX idx_page_observations_public_time').run();
  const withoutIndex = await measure(db, queryStats, { range: '30d', traffic: 'all' });
  await db.batch([db.prepare('CREATE INDEX idx_page_observations_public_time ON page_observations(is_owner, observed_at)'), db.prepare('PRAGMA optimize')]);
  const withIndex = await measure(db, queryStats, { range: '30d', traffic: 'all' });
  assert.deepEqual(withIndex.report, withoutIndex.report);
  const historyIndex = { archivedRows: 30000, selectedSourceRows: 15000, withoutIndex: withoutIndex.metrics, withIndex: withIndex.metrics, parity: true };
  assert.ok(withIndex.metrics.reads < withoutIndex.metrics.reads, 'Time bounds must avoid unrelated archive reads');
  console.log(JSON.stringify({ synthetic: true, cacheUsed: false, measurements, historyIndex }));
} finally {
  await proxy?.dispose();
  rmSync(directory, { recursive: true, force: true });
}
