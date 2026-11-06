-- Delivery admission state only: no target URL, raw address, UA or report.
CREATE TABLE IF NOT EXISTS ai_check_daily_quota (
  caller_key TEXT NOT NULL,
  utc_day TEXT NOT NULL,
  used INTEGER NOT NULL CHECK (used BETWEEN 1 AND 10),
  reset_at INTEGER NOT NULL,
  PRIMARY KEY (caller_key, utc_day)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS ai_check_quota_expiry ON ai_check_daily_quota(reset_at);
