/** Provider counters describe the returned attempt, not all retry work or account billing. */
export interface ReportCalculation {
  version: '2026-11-11.1';
  event: 'stats-report-calculation';
  outcome: 'returned' | 'threw';
  submittedStatements: number;
  returnedResults: number | null;
  metadata: 'complete' | 'partial' | 'unavailable' | 'inconsistent';
  counterScope: 'last-attempt';
  reportedRowsRead: number | null;
  reportedRowsWritten: number | null;
  reportedSqlDurationMs: number | null;
  totalAttempts: number | null;
  unexpectedWrites: boolean | null;
  readModel?: 'projection' | 'source-fallback';
  /** Wall time of the awaited binding call, including its transport. */
  elapsedMs?: number;
  failure?: ReportFailure;
  statementCosts?: ReportStatementCost[];
}

export type ReportCalculationObserver = (event: ReportCalculation) => void;

interface ReportStatementCost {
  reportedRowsRead: number | null;
  reportedRowsWritten: number | null;
  reportedSqlDurationMs: number | null;
  totalAttempts: number | null;
}

export type ReportFailure = 'read-limit' | 'write-limit' | 'storage-limit' | 'overloaded'
  | 'memory-limit' | 'timeout' | 'response-limit' | 'query-limit' | 'schema' | 'invalid-json'
  | 'authorization' | 'connection' | 'reset' | 'type' | 'sql' | 'unknown';

/** Closed diagnostic labels only: provider messages can contain SQL and private values. */
export function reportFailure(error: unknown): ReportFailure {
  let current = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth++) {
    const message = current.message;
    if (message.includes('daily row read limit')) return 'read-limit';
    if (message.includes('daily row write limit')) return 'write-limit';
    if (message.includes('maximum account storage limit') || message.includes('maximum DB size')) return 'storage-limit';
    if (message.includes('D1 DB is overloaded')) return 'overloaded';
    if (message.includes('memory limit')) return 'memory-limit';
    if (message.includes('timeout') || message.includes('CPU time limit')) return 'timeout';
    if (message.includes('maximum response size')) return 'response-limit';
    if (/too many SQL variables|too many terms|too many arguments|query.*too (large|long)|statement.*too (large|long)|Expression tree is too large|parser stack overflow|subqueries nested too deep/i.test(message)) return 'query-limit';
    if (/no such (table|column)|D1_COLUMN_NOTFOUND/.test(message)) return 'schema';
    if (message.includes('malformed JSON')) return 'invalid-json';
    if (/authorization|authentication|not authorized|SQLITE_AUTH/i.test(message)) return 'authorization';
    if (/Network connection lost|Replica disconnected|Cannot resolve D1 DB|client disconnected/.test(message)) return 'connection';
    if (message.includes('reset')) return 'reset';
    if (message.includes('D1_TYPE_ERROR')) return 'type';
    if (message.includes('SQLITE_ERROR')) return 'sql';
    current = current.cause;
  }
  return 'unknown';
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function counter(value: unknown, minimum = 0): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum ? value : null;
}

function duration(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Closed projection: never forward SQL, parameters, provider identifiers or raw errors. */
export function reportCalculation(value: unknown, outcome: ReportCalculation['outcome'], submittedStatements = 1): ReportCalculation {
  const returnedResults = Array.isArray(value) ? value.length : null;
  const costs = Array.from({ length: submittedStatements }, (_, index) => {
    const result: unknown = Array.isArray(value) ? value[index] : null;
    const meta = record(result) && record(result.meta) ? result.meta : {};
    const timings = record(meta.timings) ? meta.timings : {};
    return { reportedRowsRead: counter(meta.rows_read), reportedRowsWritten: counter(meta.rows_written),
      reportedSqlDurationMs: duration(timings.sql_duration_ms) ?? duration(meta.duration),
      totalAttempts: counter(meta.total_attempts, 1) };
  });
  const sum = (field: 'reportedRowsRead' | 'reportedRowsWritten'): number | null => {
    let total = 0;
    for (const cost of costs) {
      const count = cost[field];
      if (count === null || !Number.isSafeInteger(total + count)) return null;
      total += count;
    }
    return total;
  };
  let reportedSqlDurationMs: number | null = 0;
  for (const cost of costs) {
    if (cost.reportedSqlDurationMs === null || !Number.isFinite(reportedSqlDurationMs + cost.reportedSqlDurationMs)) {
      reportedSqlDurationMs = null; break;
    }
    reportedSqlDurationMs += cost.reportedSqlDurationMs;
  }
  const reportedRowsRead = sum('reportedRowsRead');
  const reportedRowsWritten = sum('reportedRowsWritten');
  // Attempts belong to individual returned statements; do not invent a batch retry count.
  const totalAttempts = submittedStatements === 1 ? costs[0]?.totalAttempts ?? null : null;
  const known = costs.reduce((total,cost) => total + [cost.reportedRowsRead, cost.reportedRowsWritten, cost.totalAttempts].filter(n => n !== null).length, 0);
  const inconsistent = outcome === 'returned' && (returnedResults !== submittedStatements || !Array.isArray(value)
    || !value.every((result: unknown) => record(result) && result.success !== false));
  return {
    version: '2026-11-11.1', event: 'stats-report-calculation', outcome,
    submittedStatements, returnedResults,
    metadata: inconsistent ? 'inconsistent' : known === costs.length * 3 ? 'complete' : known === 0 ? 'unavailable' : 'partial',
    counterScope: 'last-attempt', reportedRowsRead, reportedRowsWritten, reportedSqlDurationMs, totalAttempts,
    unexpectedWrites: reportedRowsWritten === null ? null : reportedRowsWritten > 0,
    ...(submittedStatements > 1 ? { statementCosts: costs } : {}),
  };
}

function notify(observer: ReportCalculationObserver | undefined, event: ReportCalculation): void {
  // Operational logging must not turn a valid report into an outage.
  try { observer?.(event); } catch { /* Deliberately omit arbitrary observer errors. */ }
}

function isStatementList(value: D1PreparedStatement | readonly D1PreparedStatement[]): value is readonly D1PreparedStatement[] {
  return Array.isArray(value);
}

export async function measuredReportBatch(
  db: D1Database,
  statement: D1PreparedStatement | readonly D1PreparedStatement[],
  observer?: ReportCalculationObserver,
): Promise<D1Result<Record<string, unknown>>[]> {
  let results: D1Result<Record<string, unknown>>[];
  const statements = isStatementList(statement) ? [...statement] : [statement];
  const startedAt = performance.now();
  try {
    results = await db.batch<Record<string, unknown>>(statements);
  } catch (error) {
    notify(observer, { ...reportCalculation(null, 'threw', statements.length), elapsedMs: Math.max(0, performance.now() - startedAt), failure: reportFailure(error) });
    throw error;
  }
  const event = { ...reportCalculation(results, 'returned', statements.length), elapsedMs: Math.max(0, performance.now() - startedAt) };
  notify(observer, event);
  if (event.metadata === 'inconsistent') throw new Error('Invalid statistics batch result');
  return results;
}
