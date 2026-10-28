import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';
import { CURRENT_VERIFIER_PROFILE, REVIEWED_VERIFIER_PROFILES, verifierProfileSql, verifierProfileLabel } from '../.test-dist/verifier-profile.js';

const verified = { version: '2026-10-27.5', source: 'local-webbotauth', localStatus: 'verified', localOutcome: 'verified', coverage: null, verifierProfile: CURRENT_VERIFIER_PROFILE };
function database() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  let id = 0, mutate = rows => rows;
  const add = (evidence, options = {}) => sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,referrer_host) VALUES('/article',?,'ai','desktop',?,'ai-search','fixture','2026-10-28 00:00:00',?,?,?)`)
    .run(String(++id).padStart(32, '0'), options.owner ?? 0, options.status ?? 'verified', evidence === null ? null : JSON.stringify(evidence), options.referrer ?? null);
  const db = { prepare(sql) { return { bind(...args) { return { run: () => mutate(sqlite.prepare(sql).all(...args)) }; } }; }, async batch(statements) { return statements.map(s => ({ results: s.run() })); } };
  return { sqlite, db, add, mutate: fn => mutate = fn };
}
test('profile provenance preserves reviewed history and rejects unknown and contradictory claims', () => {
  assert.ok(REVIEWED_VERIFIER_PROFILES.includes(CURRENT_VERIFIER_PROFILE));
  const f = database(), cases = [
    [verified, {}, CURRENT_VERIFIER_PROFILE],
    [{ ...verified, verifierProfile: '2026-10-28.6' }, {}, '2026-10-28.6'],
    [{ ...verified, verifierProfile: '2026-10-26.1' }, {}, '2026-10-26.1'],
    [null, {}, 'not-recorded'], [{ ...verified, verifierProfile: null }, {}, 'not-recorded'],
    [{ ...verified, verifierProfile: 'future-private@example.invalid' }, {}, 'unrecognized-record'],
    [{ ...verified, verifierProfile: 7 }, {}, 'unrecognized-record'],
    [{ ...verified, source: 'test-injected' }, {}, 'test-injected'],
    [verified, { status: 'unverified' }, 'unrecognized-record'],
    [{ ...verified, localOutcome: 'invalid' }, {}, 'unrecognized-record'],
    [{ ...verified, localOutcome: null }, {}, 'unrecognized-record'],
    [{ ...verified, version: 'future' }, {}, 'unrecognized-record'],
  ];
  for (const [value, options] of cases) f.add(value, options);
  const rows = f.sqlite.prepare('SELECT ' + verifierProfileSql() + ' AS profile FROM page_observations ORDER BY id').all();
  assert.deepEqual(rows.map(row => row.profile), cases.map(row => row[2]));
  assert.equal(JSON.stringify(rows).includes('private@'), false);
  assert.match(verifierProfileLabel('2026-10-28.6', CURRENT_VERIFIER_PROFILE), /^Historical stored/);
});
test('same totals and signature bases can hide different producer profiles; report keeps the joint denominator', async () => {
  const f = database(), query = { range: '7d', traffic: 'all' }, now = new Date('2026-10-28T01:00:00Z');
  f.add(verified); f.add({ ...verified, verifierProfile: '2026-10-28.6' });
  f.add(verified, { owner: 1 }); f.add(verified, { referrer: 'traffic2cash.xyz' });
  const result = await queryStats(f.db, query, now);
  assert.equal(result.totals.views, 2); assert.equal(result.byKindSignature.length, 2);
  assert.equal(result.byKindSignature.reduce((sum, row) => sum + row.views, 0), 2);
  assert.equal(result.verifierProfile.current, CURRENT_VERIFIER_PROFILE);
  for (const bad of [
    '[{"key1":"ai-search","key2":"verified-coverage-unknown","views":2}]',
    '[{"key1":"ai-search","key2":"verified-coverage-unknown","key3":"private-profile","views":2}]',
  ]) {
    f.mutate(rows => rows.map(row => row.section === 'kind-signature' ? { ...row, payload: bad } : row));
    await assert.rejects(queryStats(f.db, query, now), /Malformed statistics report/);
  }
});
