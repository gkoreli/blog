-- Additive diagnostics: historical records stay NULL, without a backfill.
-- Apply only this reviewed migration after schema preflight, before deploying
-- the writer that uses these columns. This package has its own migration folder.
ALTER TABLE client_errors ADD COLUMN occurred_at TEXT;
ALTER TABLE client_errors ADD COLUMN subscription_evidence TEXT;
