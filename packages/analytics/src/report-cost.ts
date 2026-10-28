/** Provider counters describe the returned attempt, not all retry work or account billing. */
export interface ReportCalculation {
  version: '2026-10-28.1';
  event: 'stats-report-calculation';
  outcome: 'returned' | 'threw';
  submittedStatements: 1;
  returnedResults: number | null;
  metadata: 'complete' | 'partial' | 'unavailable' | 'inconsistent';
  counterScope: 'last-attempt';
  reportedRowsRead: number | null;
  reportedRowsWritten: number | null;
  totalAttempts: number | null;
  unexpectedWrites: boolean | null;
}

export type ReportCalculationObserver = (event: ReportCalculation) => void;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function counter(value: unknown, minimum = 0): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum ? value : null;
}

/** Closed projection: never forward SQL, parameters, provider identifiers or raw errors. */
export function reportCalculation(value: unknown, outcome: ReportCalculation['outcome']): ReportCalculation {
  const returnedResults = Array.isArray(value) ? value.length : null;
  const result: unknown = Array.isArray(value) && value.length === 1 ? value[0] : null;
  const meta = record(result) && record(result.meta) ? result.meta : {};
  const reportedRowsRead = counter(meta.rows_read);
  const reportedRowsWritten = counter(meta.rows_written);
  const totalAttempts = counter(meta.total_attempts, 1);
  const known = [reportedRowsRead, reportedRowsWritten, totalAttempts].filter(n => n !== null).length;
  const inconsistent = outcome === 'returned' && (returnedResults !== 1 || !record(result) || result.success === false);
  return {
    version: '2026-10-28.1', event: 'stats-report-calculation', outcome,
    submittedStatements: 1, returnedResults,
    metadata: inconsistent ? 'inconsistent' : known === 3 ? 'complete' : known === 0 ? 'unavailable' : 'partial',
    counterScope: 'last-attempt', reportedRowsRead, reportedRowsWritten, totalAttempts,
    unexpectedWrites: reportedRowsWritten === null ? null : reportedRowsWritten > 0,
  };
}

function notify(observer: ReportCalculationObserver | undefined, event: ReportCalculation): void {
  // Operational logging must not turn a valid report into an outage.
  try { observer?.(event); } catch { /* Deliberately omit arbitrary observer errors. */ }
}

export async function measuredReportBatch(
  db: D1Database,
  statement: D1PreparedStatement,
  observer?: ReportCalculationObserver,
): Promise<D1Result<Record<string, unknown>>[]> {
  let results: D1Result<Record<string, unknown>>[];
  try {
    results = await db.batch<Record<string, unknown>>([statement]);
  } catch (error) {
    notify(observer, reportCalculation(null, 'threw'));
    throw error;
  }
  const event = reportCalculation(results, 'returned');
  notify(observer, event);
  if (event.metadata === 'inconsistent') throw new Error('Invalid statistics batch result');
  return results;
}
