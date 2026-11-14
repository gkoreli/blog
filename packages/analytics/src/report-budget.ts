/** Per-site report generation policy, independent of HTTP, caches and D1. */
export interface ReportBudgetPolicy {
  maxColdFillsPerDay: number;
  /** Circuit-breaker threshold on returned counters, not a SQL row limit. */
  maxReportedRowsReadPerDay: number;
}
export interface ReportWork {
  reportedRowsRead: number | null;
}
export interface ReportReservation {
  complete(work: ReportWork): Promise<void>;
}
export interface ReportAdmission {
  reserve(now: Date): Promise<ReportReservation | null>;
}
export function validateReportBudget(policy: ReportBudgetPolicy): Readonly<ReportBudgetPolicy> {
  if (![policy.maxColdFillsPerDay, policy.maxReportedRowsReadPerDay].every(n => Number.isSafeInteger(n) && n >= 1)) {
    throw new Error('Report budget limits must be positive safe integers');
  }
  return Object.freeze({ ...policy });
}
