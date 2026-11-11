import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { reportCalculation, measuredReportBatch, reportFailure } from '../.test-dist/report-cost.js';
import { queryStats } from '../.test-dist/stats.js';

const meta = { rows_read: 12, rows_written: 0, total_attempts: 2, served_by: 'PRIVATE', last_row_id: 999, sql: 'PRIVATE' };
test('report counters retain last-attempt scope and omit arbitrary provider fields', () => {
  const e = reportCalculation([{ success: true, meta }], 'returned');
  assert.deepEqual(e, { version: '2026-11-11.1', event: 'stats-report-calculation', outcome: 'returned', submittedStatements: 1, returnedResults: 1, metadata: 'complete', counterScope: 'last-attempt', reportedRowsRead: 12, reportedRowsWritten: 0, reportedSqlDurationMs: null, totalAttempts: 2, unexpectedWrites: false });
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

test('database failures retain only closed categories and inspect wrapped causes', () => {
  for (const [message, expected] of [
    ["D1_ERROR: Your account has exceeded D1's free tier daily row read limit.", 'read-limit'],
    ["D1_ERROR: Your account has exceeded D1's free tier daily row write limit.", 'write-limit'],
    ['D1_ERROR: Exceeded maximum DB size.', 'storage-limit'],
    ['D1_ERROR: D1 DB is overloaded. Too many requests queued.', 'overloaded'],
    ["D1_ERROR: D1 DB's isolate exceeded its memory limit and was reset.", 'memory-limit'],
    ['D1_ERROR: D1 DB exceeded its CPU time limit and was reset.', 'timeout'],
    ['D1_ERROR: D1 query result exceeded the maximum response size limit of 50 MB', 'response-limit'],
    ['D1_ERROR: SQL query was too large', 'query-limit'],
    ['D1_ERROR: VIEWs and/or subqueries nested too deep: SQLITE_ERROR', 'query-limit'],
    ['D1_ERROR: no such column: PRIVATE_VALUE: SQLITE_ERROR', 'schema'],
    ['D1_ERROR: malformed JSON: SQLITE_ERROR', 'invalid-json'],
    ['D1_ERROR: not authorized', 'authorization'],
    ['D1_ERROR: Network connection lost.', 'connection'],
    ['D1_ERROR: D1 DB reset because its code was updated.', 'reset'],
    ['D1_TYPE_ERROR: PRIVATE_VALUE', 'type'],
    ['D1_ERROR: near PRIVATE_VALUE: SQLITE_ERROR', 'sql'],
    ['PRIVATE_VALUE', 'unknown'],
  ]) {
    assert.equal(reportFailure(new Error(message)), expected);
    assert.equal(reportFailure(new Error('Wrapper', { cause: new Error(message) })), expected);
  }
  for (const value of [null, undefined, 'PRIVATE_VALUE', { message: 'malformed JSON' }]) assert.equal(reportFailure(value), 'unknown');
  const cycle = new Error('PRIVATE_VALUE'); cycle.cause = cycle;
  assert.equal(reportFailure(cycle), 'unknown');
});

test('transactional batch costs retain every statement and unknown meters do not become a zero total', () => {
  const results = [{ success: true, meta }, { success: true, meta: { rows_read: 5, rows_written: 0, total_attempts: 1 } }];
  const event = reportCalculation(results, 'returned', 2);
  assert.equal(event.reportedRowsRead, 17); assert.equal(event.reportedRowsWritten, 0);
  assert.equal(event.totalAttempts, null); assert.equal(event.metadata, 'complete');
  assert.deepEqual(event.statementCosts.map(cost => cost.totalAttempts), [2, 1]);
  const partial = reportCalculation([results[0], { success: true }], 'returned', 2);
  assert.equal(partial.reportedRowsRead, null); assert.equal(partial.reportedRowsWritten, null);
  assert.equal(partial.metadata, 'partial');
  assert.equal(reportCalculation(results.slice(0,1), 'returned', 2).metadata, 'inconsistent');
});

test('one batch emits once before decoding, preserves failures, and isolates observer errors', async () => {
  let calls = 0; const events = [], statement = {};
  const db = { async batch(stmts) { calls++; assert.deepEqual(stmts, [statement]); return [{ success: true, meta, results: [] }]; } };
  await measuredReportBatch(db, statement, e => { events.push(e); throw new Error('PRIVATE'); });
  assert.equal(calls, 1); assert.equal(events.length, 1);
  const failure = new Error('PRIVATE database failure');
  await assert.rejects(measuredReportBatch({ async batch() { throw failure; } }, statement, e => events.push(e)), e => e === failure);
  assert.deepEqual([events[1].outcome, events[1].metadata, events[1].reportedRowsRead], ['threw', 'unavailable', null]);
  assert.equal(events[1].failure, 'unknown');
  assert.ok(!JSON.stringify(events).includes('PRIVATE'));
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
  assert.equal(submitted.length, 2); assert.equal(submitted[0].length, 5); assert.equal(events.length, 1);
  assert.ok(!JSON.stringify(after).includes('reportedRowsRead'));
  await assert.rejects(queryStats({ ...db, async batch() { return [{ success: true, meta, results: [] }]; } }, q, now, undefined, e => events.push(e)));
  assert.equal(events.length, 2); assert.equal(events[1].reportedRowsRead, null);
  sqlite.close();
});


test('SQL duration retains fractional zero and missing provider timings independently of row counters', () => {
  const results = [
    { success: true, meta: { ...meta, duration: 7, timings: { sql_duration_ms: 0 } } },
    { success: true, meta: { ...meta, duration: 0.125 } },
  ];
  const event = reportCalculation(results, 'returned', 2);
  assert.equal(event.reportedSqlDurationMs, 0.125);
  assert.deepEqual(event.statementCosts.map(cost => cost.reportedSqlDurationMs), [0, 0.125]);
  assert.equal(event.metadata, 'complete');
  for (const invalid of [undefined, null, '1', -1, NaN, Infinity]) {
    const missing = reportCalculation([results[0], { success: true, meta: { ...meta, duration: invalid } }], 'returned', 2);
    assert.equal(missing.reportedSqlDurationMs, null);
    assert.equal(missing.statementCosts[0].reportedSqlDurationMs, 0);
    assert.equal(missing.reportedRowsRead, 24);
  }
  assert.equal(reportCalculation([{ success: true, meta: { ...meta, duration: 1, timings: { sql_duration_ms: -1 } } }], 'returned').reportedSqlDurationMs, 1);
});
