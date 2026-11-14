import { createStatsHandler, type StatsCacheStore, type StatsCacheOptions } from './report-cache.js';
import { queryProjectedStats } from './stats.js';
import { parseStatsQuery } from './stats-selection.js';
import type { StatsRange } from './contracts.js';
import type { ReportAdmission } from './report-budget.js';
import type { ReportCalculation, ReportCalculationObserver } from './report-cost.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';

export { createStatsHandler, STATS_REPORT_VERSION, STATS_EDGE_TTL_SECONDS } from './report-cache.js';
export type { StatsCacheStore, StatsCacheOptions, StatsCacheOutcome, StatsCacheOperation, StatsBackgroundWork } from './report-cache.js';
export { createD1ReportAdmission } from './report-budget-d1.js';
export type { ReportBudgetPolicy, ReportAdmission, ReportReservation, ReportWork } from './report-budget.js';
export { renderAnalyticsReport } from './report-html.js';

export interface AnalyticsReportingOptions<Environment extends { DB: D1Database }> extends StatsCacheOptions {
  /** Explicitly choose durable admission, or null for an externally controlled endpoint. */
  admission: ((env: Environment) => ReportAdmission) | null;
  allowedRanges?: readonly StatsRange[];
  onCalculation?: ReportCalculationObserver;
}

/** Reporting application service: one selection, one complete report, one
 * cost settlement. Cache/delivery and storage are composed through typed ports.
 */
export function createAnalyticsReportHandler<Environment extends { DB: D1Database }>(
  cache: StatsCacheStore, options: AnalyticsReportingOptions<Environment>,
) {
  const clock = options.now ?? Date.now;
  const admission = options.admission, onCalculation = options.onCalculation;
  const ranges = new Set(options.allowedRanges ?? ['7d', '30d', '90d', 'all']);
  const load = async (request: Request, env: Environment): Promise<Response> => {
    const query = parseStatsQuery(new URL(request.url).searchParams);
    if (typeof query === 'string') return Response.json({ error: query }, { status: 400 });
    const now = new Date(clock());
    const reservation = admission === null ? undefined : await admission(env).reserve(now);
    if (reservation === null) return Response.json({ error: 'Report generation budget unavailable. Cached reports remain available.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
    let total = 0, complete = true, calculations = 0;
    const observe = (event: ReportCalculation) => {
      calculations++;
      if (event.outcome !== 'returned' || event.reportedRowsRead === null || !Number.isSafeInteger(total + event.reportedRowsRead)) complete = false;
      else total += event.reportedRowsRead;
      try { onCalculation?.(event); } catch { /* Observers do not affect the report. */ }
    };
    try {
      const report = await queryProjectedStats(env.DB, query, now, ACTIVE_REFERRAL_POLICY, observe);
      return Response.json(report);
    } finally {
      // This happens before a successful response can be cached. A failed
      // settlement leaves the durable reservation closed instead of hiding cost.
      await reservation?.complete({ reportedRowsRead: complete && calculations > 0 ? total : null });
    }
  };
  const cached = createStatsHandler(cache, load, options);
  return (request: Request, env: Environment, background?: { waitUntil(work: Promise<unknown>): void }): Promise<Response> => {
    const query = parseStatsQuery(new URL(request.url).searchParams);
    if (request.method === 'GET' && typeof query !== 'string' && !ranges.has(query.range)) return Promise.resolve(Response.json({ error: 'Range is outside this report endpoint\'s configured scope.' }, {
      status: 400, headers: { 'Cache-Control': 'no-store' },
    }));
    return cached(request, env, background);
  };
}
