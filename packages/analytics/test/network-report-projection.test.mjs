import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { NETWORK_REPORT_RULE_SHA256, networkReportProjectionSql, projectNetworkObservation } from '../.test-dist/network-report-projection.js';
import { vendorNetworkStateSql } from '../.test-dist/vendor-network-summary.js';
import { queryStats } from '../.test-dist/stats.js';
import { observePageResponse } from '../.test-dist/index.js';
import { networkSummaryCases } from './fixtures/vendor-network-summary.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) { return { bind(...values) { return { sql, values, async run() {
      if (sql.startsWith('INSERT INTO page_observations')) return { success: true, meta: { changes: 1 }, results: sqlite.prepare(sql).all(...values) };
      const result = sqlite.prepare(sql).run(...values);
      return { success: true, meta: { changes: result.changes } };
    } }; } }; },
    async batch(statements) { return statements.map(s => ({ success: true, results: sqlite.prepare(s.sql).all(...s.values) })); },
  };
  return { sqlite, db };
}
const query = { range: '7d', traffic: 'all' }, now = new Date('2026-10-31T12:00:00Z');

test('interpretation fingerprint cannot silently reuse facts after the validator changes', () => {
  assert.equal(createHash('sha256').update(vendorNetworkStateSql()).digest('hex'), NETWORK_REPORT_RULE_SHA256,
    'Change the projection fingerprint and plan a bounded rebuild for a changed interpreter');
});

test('projected, missing and stale network facts preserve exact reports and evidence multiplicity', async () => {
  const { sqlite, db } = fixture();
  try {
    const insert = sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence)
      VALUES('/network',?,'browser','desktop',0,'browser','fixture','2026-10-30 10:00:00',?)`);
    for (const [i, item] of networkSummaryCases.entries()) for (let copy = 0; copy < 3; copy++) {
      insert.run((i+1).toString(16).padStart(32,'0'), item.e === null ? null : JSON.stringify(item.e));
    }
    const source = sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all();
    const expected = await queryStats(db, query, now);
    sqlite.prepare(networkReportProjectionSql('range')).run(0, Number.MAX_SAFE_INTEGER);
    assert.deepEqual(await queryStats(db, query, now), expected);
    const repeated = sqlite.prepare(networkReportProjectionSql('range')).run(0, Number.MAX_SAFE_INTEGER);
    assert.equal(repeated.changes, 0);
    sqlite.prepare(`UPDATE page_observation_network_facts SET rule_sha256=?,network_state='unrecognized'`).run('0'.repeat(64));
    assert.deepEqual(await queryStats(db, query, now), expected);
    sqlite.prepare('DELETE FROM page_observation_network_facts WHERE observation_id % 2 = 0').run();
    assert.deepEqual(await queryStats(db, query, now), expected);
    sqlite.prepare(networkReportProjectionSql('range')).run(0, Number.MAX_SAFE_INTEGER);
    assert.deepEqual(sqlite.prepare('SELECT * FROM page_observations ORDER BY id').all(), source);
  } finally { sqlite.close(); }
});

test('evidence updates invalidate derived state and source deletion cascades without stale claims', async () => {
  const { sqlite, db } = fixture();
  try {
    const evidence = networkSummaryCases.find(item => item.name === 'current-listed').e;
    sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,vendor_ip_evidence)
      VALUES('/network',?,'browser','desktop',0,'browser','fixture','2026-10-30 10:00:00',?)`).run('a'.repeat(32), JSON.stringify(evidence));
    await projectNetworkObservation(db, '1');
    assert.equal((await queryStats(db, query, now)).vendorNetwork.recognizedViews, 1);
    sqlite.prepare('UPDATE page_observations SET vendor_ip_evidence=? WHERE id=1').run(JSON.stringify({ ...evidence, profile: 'future' }));
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM page_observation_network_facts').get().n, 0);
    assert.equal((await queryStats(db, query, now)).vendorNetwork.unrecognizedViews, 1);
    await projectNetworkObservation(db, '1');
    assert.equal((await queryStats(db, query, now)).vendorNetwork.unrecognizedViews, 1);
    sqlite.prepare('DELETE FROM page_observations WHERE id=1').run();
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM page_observation_network_facts').get().n, 0);
  } finally { sqlite.close(); }
});

test('a projection failure preserves the acknowledged observation and never replays ingestion', async () => {
  const { sqlite, db } = fixture();
  try {
    let projectionAttempts = 0;
    const failing = { ...db, prepare(sql) {
      if (sql.startsWith('INSERT INTO page_observation_report_facts')) return { bind() { return { async run() { projectionAttempts++; throw new Error('controlled projection failure'); } }; } };
      return db.prepare(sql);
    } };
    const pending = [];
    observePageResponse(new Request('https://publication.example/article', { headers: { 'User-Agent': 'fixture', 'CF-Connecting-IP': '192.0.2.1' } }),
      new Response('page', { headers: { 'Content-Type': 'text/html' } }), 'html',
      { DB: failing, ANALYTICS_HASH_KEY: 'synthetic-projection-fixture-key' }, { waitUntil(work) { pending.push(work); } });
    await Promise.all(pending);
    assert.equal(projectionAttempts, 1);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM page_observations').get().n, 1);
  } finally { sqlite.close(); }
});
