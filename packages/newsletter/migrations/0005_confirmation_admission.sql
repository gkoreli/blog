-- Apply once to the shared blog-analytics database before deploying this code.
-- Existing installations have newsletter migrations 0001, 0003, and 0004.
-- 0002 is an old-install compatibility patch, not a sequential migration.

ALTER TABLE subscribers ADD COLUMN suppression_reason TEXT
  CHECK (suppression_reason IN ('bounce', 'complaint', 'confirmation-opt-out', 'legacy-inactive'));

-- Old unsubscribed rows do not distinguish ordinary opt-outs from complaints.
-- Preserve that uncertainty and do not silently reactivate them.
UPDATE subscribers SET suppression_reason = 'bounce' WHERE status = 'bounced';
UPDATE subscribers SET suppression_reason = 'legacy-inactive' WHERE status = 'unsubscribed';

CREATE TABLE confirmation_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  reserved_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
  outcome TEXT NOT NULL DEFAULT 'reserved'
    CHECK (outcome IN ('reserved', 'accepted', 'failed', 'unknown', 'legacy')),
  provider_id TEXT,
  provider_status INTEGER
);

CREATE INDEX idx_confirmation_email_time ON confirmation_attempts(email, reserved_at);
CREATE INDEX idx_confirmation_time ON confirmation_attempts(reserved_at);

-- Tokens from existing emails remain usable through their original expiry.
-- These imported hashes do not claim a measured provider send or use new budget.
INSERT INTO confirmation_attempts (id, email, token_hash, reserved_at, expires_at, outcome)
SELECT 'legacy:' || confirm_token, email, confirm_token,
       unixepoch(confirm_token_expires_at) - 86400,
       unixepoch(confirm_token_expires_at), 'legacy'
FROM subscribers
WHERE status = 'pending' AND confirm_token IS NOT NULL
  AND unixepoch(confirm_token_expires_at) IS NOT NULL;
