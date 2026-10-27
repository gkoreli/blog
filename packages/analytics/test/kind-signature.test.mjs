import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { queryStats } from '../.test-dist/stats.js';
import { signatureBasisSql } from '../.test-dist/signature-basis.js';

const verified = { version: '2026-10-27.3', source: 'local-webbotauth', localStatus: 'verified', coverage: { version: '2026-10-27.1', covered: { userAgent: true } } };
function fixture() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  let batches = 0; let alter = rows => rows;
  const db = { prepare(sql) { return { bind(...values) { return { execute() { return { results: alter(sqlite.prepare(sql).all(...values)) }; } }; } }; }, async batch(statements) { batches++; return statements.map(s => s.execute()); } };
  let next = 0;
  const insert = sqlite.prepare(`INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,signature_status,signature_evidence,referrer_host) VALUES(?,?,'ai','desktop',?,?,'fixture',?,?,?,?)`);
  function add(evidence, options = {}) {
    const id = options.id ?? (++next).toString(16).padStart(32, '0');
    const status = options.status !== undefined ? options.status : evidence?.localStatus === 'verified' ? 'verified' : evidence?.localStatus === 'unverified' ? 'unverified' : null;
    insert.run(options.path ?? '/article', id, options.owner ?? 0, options.kind === undefined ? 'ai-search' : options.kind, options.at ?? '2026-10-27 01:00:00', status, evidence === null ? null : JSON.stringify(evidence), options.referrer ?? null);
    return id;
  }
  return { sqlite, db, add, batches: () => batches, alter: value => alter = value };
}

test('signature basis separates proof, absent coverage, injection, future schemas and inconsistent records', () => {
  const f = fixture();
  const cases = [
    [null, null, 'not-recorded'], [null, 'verified', 'verified-outcome-only'],
    [verified, 'verified', 'verified-ua-covered'],
    [{ ...verified, coverage: { ...verified.coverage, covered: { userAgent: false } } }, 'verified', 'verified-ua-uncovered'],
    [{ ...verified, coverage: null }, 'verified', 'verified-coverage-unknown'],
    [{ ...verified, coverage: { ...verified.coverage, covered: { userAgent: 1 } } }, 'verified', 'verified-coverage-unknown'],
    [{ ...verified, source: 'test-injected' }, 'verified', 'test-injected'],
    [{ ...verified, localStatus: 'unverified', coverage: null }, 'unverified', 'not-verified'],
    [{ ...verified, localStatus: 'absent', coverage: null }, null, 'unsigned'],
    [{ ...verified, version: 'future' }, 'verified', 'unrecognized-record'],
    [{ ...verified, version: null }, 'verified', 'unrecognized-record'],
    [{ ...verified, source: 'private-canary' }, 'verified', 'unrecognized-record'],
    [verified, 'unverified', 'unrecognized-record'],
    [{ ...verified, localStatus: 'unverified' }, 'unverified', 'unrecognized-record'],
  ];
  for (const [evidence, status] of cases) f.add(evidence, { status });
  const rows = f.sqlite.prepare('SELECT ' + signatureBasisSql() + ' AS basis FROM page_observations ORDER BY id').all();
  assert.deepEqual(rows.map(row => row.basis), cases.map(c => c[2]));
});

test('joint report partitions the same selected events, preserves missing kinds and excludes owners/referrals/time independently', async () => {
  const f = fixture(), sameId = '1'.repeat(32);
  f.add(verified, { id: sameId });
  f.add({ ...verified, coverage: { ...verified.coverage, covered: { userAgent: false } } }, { id: sameId });
  f.add(null, { kind: 'signed-agent', status: 'verified' });
  f.add(null, { kind: null });
  const marked = f.add(verified); f.sqlite.prepare("INSERT INTO owner_clients(daily_client_id,utc_date) VALUES(?,'2026-10-27')").run(marked);
  f.add(verified, { owner: 1 }); f.add(verified, { referrer: 'traffic2cash.xyz' }); f.add(verified, { at: '2026-10-28 01:00:00' });
  f.add(verified, { path: '/another' });
  const query = { range: '7d', traffic: 'all', path: '/article' }, now = new Date('2026-10-27T02:00:00Z');
  const report = await queryStats(f.db, query, now); assert.equal(f.batches(), 1);
  assert.equal(report.totals.views, 4); assert.equal(report.referralPolicy.excludedViews, 1);
  assert.deepEqual(report.byKindSignature, [
    { kind: null, basis: 'not-recorded', views: 1 },
    { kind: 'ai-search', basis: 'verified-ua-covered', views: 1 },
    { kind: 'ai-search', basis: 'verified-ua-uncovered', views: 1 },
    { kind: 'signed-agent', basis: 'verified-outcome-only', views: 1 },
  ]);
  assert.equal(report.byKindSignature.reduce((n, row) => n + row.views, 0), report.totals.views);
  const scoped = await queryStats(f.db, { ...query, kind: 'ai-search' }, now);
  assert.equal(scoped.totals.views, 2); assert.equal(scoped.totals.dailyClients, 1);
  assert.equal(scoped.byKindSignature.length, 2);
  const empty = await queryStats(f.db, { ...query, path: '/missing' }, now); assert.deepEqual(empty.byKindSignature, []);
  assert.equal(JSON.stringify(report.byKindSignature).includes('private-canary'), false);
});

test('joint report rejects a missing denominator, fabricated basis or changed row count', async () => {
  const f = fixture(); f.add(verified);
  const query = { range: '7d', traffic: 'all' }, now = new Date('2026-10-27T02:00:00Z');
  for (const payload of ['[]', '[{"key1":"ai-search","key2":"private-canary","views":1}]', '[{"key1":"ai-search","key2":"verified-ua-covered","views":2}]']) {
    f.alter(rows => rows.map(row => row.section === 'kind-signature' ? { ...row, payload } : row));
    await assert.rejects(queryStats(f.db, query, now), /Malformed statistics report/);
  }
});
