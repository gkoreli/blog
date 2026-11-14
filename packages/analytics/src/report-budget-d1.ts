import { validateReportBudget, type ReportAdmission, type ReportBudgetPolicy, type ReportWork } from './report-budget.js';

/** Durable cold-fill admission, one database per site. At most one unsettled
 * calculation is admitted. Unknown work stays closed until the next UTC day.
 * The admission/accounting queries themselves are additional D1 work.
 */
export function createD1ReportAdmission(db: D1Database, limits: ReportBudgetPolicy): ReportAdmission {
  const policy = validateReportBudget(limits);
  return {
    async reserve(now) {
      if (!Number.isFinite(now.getTime())) throw new Error('Invalid report budget clock');
      const day = now.toISOString().slice(0, 10), id = crypto.randomUUID();
      const result = await db.batch<{ id: string }>([
        db.prepare(`INSERT INTO analytics_report_budget_days
          (utc_date,fill_limit,read_limit) VALUES(?,?,?) ON CONFLICT(utc_date) DO NOTHING`)
          .bind(day, policy.maxColdFillsPerDay, policy.maxReportedRowsReadPerDay),
        db.prepare(`INSERT INTO analytics_report_budget_runs(id,utc_date)
          SELECT ?,utc_date FROM analytics_report_budget_days WHERE utc_date=?
            AND fill_limit=? AND read_limit=? AND cold_fills<fill_limit
            AND reported_rows_read<read_limit AND unmetered_fills=0
            AND NOT EXISTS(SELECT 1 FROM analytics_report_budget_runs WHERE utc_date=? AND state='reserved')
          RETURNING id`).bind(id, day, policy.maxColdFillsPerDay, policy.maxReportedRowsReadPerDay, day),
        db.prepare(`UPDATE analytics_report_budget_days SET cold_fills=cold_fills+1
          WHERE utc_date=? AND changes()=1`).bind(day),
      ]);
      if (result.length !== 3 || result.some(row => !row.success)) throw new Error('Report admission unavailable');
      if (result[1].results.length === 0) return null;
      if (result[1].results.length !== 1 || result[1].results[0]?.id !== id) throw new Error('Invalid report reservation');
      let completion: Promise<void> | undefined;
      return {
        complete(work: ReportWork) {
          if (completion !== undefined) return completion;
          const reads = work.reportedRowsRead;
          const metered = typeof reads === 'number' && Number.isSafeInteger(reads) && reads >= 0;
          completion = db.batch([
            db.prepare(`UPDATE analytics_report_budget_runs SET state=?,reported_rows_read=? WHERE id=? AND state='reserved'`)
              .bind(metered ? 'metered' : 'unmetered', metered ? reads : null, id),
            db.prepare(`UPDATE analytics_report_budget_days
              SET reported_rows_read=reported_rows_read+?,unmetered_fills=unmetered_fills+?
              WHERE utc_date=? AND changes()=1`).bind(metered ? reads : 0, metered ? 0 : 1, day),
          ]).then(rows => {
            if (rows.length !== 2 || rows.some(row => !row.success)) throw new Error('Report settlement unavailable');
          });
          return completion;
        },
      };
    },
  };
}
