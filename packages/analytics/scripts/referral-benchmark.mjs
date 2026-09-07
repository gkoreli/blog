// Local measurement, not a CI latency threshold. Run analytics tests first to compile.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { queryStats } from '../.test-dist/stats.js';
import { referralAbusePredicate } from '../.test-dist/referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from '../.test-dist/referral-policy.generated.js';

const policy = ACTIVE_REFERRAL_POLICY;
const predicate = referralAbusePredicate(policy, '2026-09-01', '2026-09-07');
const measurements = [];
for (const [observations, distinctHosts] of [[10000, 100], [100000, 1000], [100000, 100000]]) {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
    const insert = sqlite.prepare(`INSERT INTO page_observations
      (path,referrer_host,daily_client_id,traffic_class,device_type,is_owner,reader_kind,observed_at)
      VALUES ('/',?,?,'browser','desktop',0,'browser','2026-09-05 12:00:00')`);
    sqlite.exec('BEGIN');
    for (let i = 0; i < observations; i++) {
      const host = i % distinctHosts;
      insert.run(host % 20 === 0 ? `h${host}.uniuit.com` : `h${host}.example`, i.toString(16).padStart(32, '0'));
    }
    sqlite.exec('COMMIT');
    const statements = [];
    const adapter = {
      prepare(sql) { return { sql, values: [], bind(...values) { return { sql, values }; } }; },
      async batch(batch) {
        statements.push(...batch);
        return batch.map(statement => ({ results: sqlite.prepare(statement.sql).all(...statement.values) }));
      },
    };
    const elapsed = [];
    for (let run = 0; run < 3; run++) {
      const before = performance.now();
      const response = await queryStats(adapter, { range: '7d', traffic: 'browser' }, new Date('2026-09-06T23:59:59Z'));
      elapsed.push(Number((performance.now() - before).toFixed(2)));
      if (response.totals.views !== observations * 0.95 || response.referralPolicy.excludedViews !== observations * 0.05) throw new Error('Benchmark counts do not reconcile');
    }
    const statement = statements[0];
    const plan = sqlite.prepare('EXPLAIN QUERY PLAN ' + statement.sql).all(...statement.values).map(row => row.detail);
    measurements.push({ observations, distinctHosts, fullReportMs: elapsed, plan });
  } finally { sqlite.close(); }
}
console.log(JSON.stringify({
  capturedAt: new Date().toISOString(), node: process.version,
  policyVersion: policy.version, policySha256: policy.sha256,
  ruleCount: policy.upstreamHosts.length + policy.localRules.length,
  predicateSqlBytes: Buffer.byteLength(predicate.sql), rulesJsonBytes: Buffer.byteLength(predicate.values[0]),
  predicateBindCount: predicate.values.length, measurements,
}, null, 2));
