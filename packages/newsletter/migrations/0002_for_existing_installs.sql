-- Migration 0002: bring an existing install up to the final schema.
-- Only run this if you applied 0001 before 2026-04-08.
-- Starting fresh? 0001 already includes everything below — skip this file.

ALTER TABLE subscribers ADD COLUMN confirm_token_expires_at TEXT;
ALTER TABLE subscribers ADD COLUMN consent_ip TEXT;

-- Note on the 'bounced' status value:
-- SQLite does not support ALTER TABLE ... MODIFY CONSTRAINT.
-- The safest approach for a live table with 0 subscribers (fresh blog):
--   DROP TABLE subscribers;
--   then re-run 0001_create_subscribers.sql
-- 'bounced' is only needed when the Resend webhook is active (Phase 2).
-- The existing CHECK constraint is safe until then.
