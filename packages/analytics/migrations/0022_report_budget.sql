-- Ordered upgrade after the issued 0001 baseline; no observation changes.
CREATE TABLE analytics_report_budget_days (
  utc_date TEXT PRIMARY KEY CHECK(length(utc_date)=10),
  fill_limit INTEGER NOT NULL CHECK(fill_limit BETWEEN 1 AND 9007199254740991),
  read_limit INTEGER NOT NULL CHECK(read_limit BETWEEN 1 AND 9007199254740991),
  cold_fills INTEGER NOT NULL DEFAULT 0 CHECK(cold_fills BETWEEN 0 AND 9007199254740991),
  reported_rows_read INTEGER NOT NULL DEFAULT 0 CHECK(reported_rows_read BETWEEN 0 AND 9007199254740991),
  unmetered_fills INTEGER NOT NULL DEFAULT 0 CHECK(unmetered_fills BETWEEN 0 AND 9007199254740991)
);
CREATE TABLE analytics_report_budget_runs (
  id TEXT PRIMARY KEY CHECK(length(id)=36),
  utc_date TEXT NOT NULL REFERENCES analytics_report_budget_days(utc_date) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','metered','unmetered')),
  reported_rows_read INTEGER CHECK(reported_rows_read BETWEEN 0 AND 9007199254740991),
  CHECK((state='metered' AND reported_rows_read IS NOT NULL) OR (state<>'metered' AND reported_rows_read IS NULL))
);
CREATE INDEX idx_analytics_report_budget_pending ON analytics_report_budget_runs(utc_date,state);
