import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { reportCalculation, measuredReportBatch } from '../.test-dist/report-cost.js';
import { queryStats } from '../.test-dist/stats.js';

const meta = { rows_read: 12, rows_written: 0, total_attempts: 2, served_by: 'PRIVATE', last_row_id: 999, sql: 'PRIVATE' };
test('report counters retain last-attempt scope and omit arbitrary provider fields', () => {
  const e = reportCalculation([{ success: true, meta }], 'returned');
  assert.deepEqual(e, { version: '2026-10-28.1', event: 'stats-report-calculation', outcome: 'returned', submittedStatements: 1, returnedResults: 1, metadata: 'complete', counterScope: 'last-attempt', reportedRowsRead: 12, reportedRowsWritten: 0, totalAttempts: 2, unexpectedWrites: false });
  assert.ok(!JSON.stringify(e).includes('PRIVATE'));
  assert.equal(reportCalculation([{ meta: { ...meta, rows_written: 3 } }], 'returned').unexpectedWrites, true);
});

test('unknown and malformed counters never become zero or an all-attempt total', () => {
  for (const invalid of [undefined, null, '12', -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const e = reportCalculation([{ meta: { rows_read: invalid, rows_written: 0, total_attempts: 0 } }], 'returned');
    assert.equal(e.reportedRowsRead, null); assert.equal(e.totalAttempts, null);
    assert.equal(e.metadata, 'partial'); assert.equal(e.reportedRowsWritten, 0);
  }
  assert.equal(reportCalculation([{}], 'returned').metadata, 'unavailable');
  for (const results of [null, [], [{}, {}], [null], [{ success: false, error: 'PRIVATE' }]]) {
    assert.equal(reportCalculation(results, 'returned').metadata, 'inconsistent');
  }
});

test('one batch emits once before decoding, preserves failures, and isolates observer errors', async () => {
  let calls = 0; const events = [], statement = {};
  const db = { async batch(stmts) { calls++; assert.deepEqual(stmts, [statement]); return [{ success: true, meta, results: [] }]; } };
  await measuredReportBatch(db, statement, e => { events.push(e); throw new Error('PRIVATE'); });
  assert.equal(calls, 1); assert.equal(events.length, 1);
  const failure = new Error('PRIVATE database failure');
  await assert.rejects(measuredReportBatch({ async batch() { throw failure; } }, statement, e => events.push(e)), e => e === failure);
  assert.deepEqual([events[1].outcome, events[1].metadata, events[1].reportedRowsRead], ['threw', 'unavailable', null]);
  for (const results of [[], [{}, {}], [{ success: false }]]) {
    const bad = [];
    await assert.rejects(measuredReportBatch({ async batch() { return results; } }, statement, e => bad.push(e)), /Invalid statistics batch/);
    assert.equal(bad.length, 1); assert.equal(bad[0].metadata, 'inconsistent');
  }
});

test('query output and statement are unchanged with telemetry; decoding failures still retain cost', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const submitted = [], events = [];
  const db = { prepare(sql) { return { bind(...values) { return { sql, values }; } }; }, async batch(stmts) { submitted.push(stmts); return stmts.map(s => ({ success: true, meta, results: sqlite.prepare(s.sql).all(...s.values) })); } };
  const q = { range: '7d', traffic: 'all' }, now = new Date('2026-10-28T05:00:00Z');
  const before = await queryStats(db, q, now);
  const after = await queryStats(db, q, now, undefined, e => events.push(e));
  assert.deepEqual(after, before); assert.deepEqual(submitted[1], submitted[0]);
  assert.equal(submitted.length, 2); assert.equal(submitted[0].length, 1); assert.equal(events.length, 1);
  assert.ok(!JSON.stringify(after).includes('reportedRowsRead'));
  await assert.rejects(queryStats({ ...db, async batch() { return [{ success: true, meta, results: [] }]; } }, q, now, undefined, e => events.push(e)));
  assert.equal(events.length, 2); assert.equal(events[1].reportedRowsRead, 12);
  sqlite.close();
});
