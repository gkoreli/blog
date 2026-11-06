-- Additive campaign admission: one application execution per campaign identity.
-- Apply once to the shared blog-analytics database before enabling the new sender.
-- No messages or recipient snapshots are retained in this table. Identities are
-- not automatically purged: removing one would remove its replay protection.
CREATE TABLE IF NOT EXISTS newsletter_campaign_runs (
  campaign_id TEXT PRIMARY KEY NOT NULL
    CHECK (length(campaign_id) BETWEEN 1 AND 128
      AND substr(campaign_id, 1, 1) GLOB '[A-Za-z0-9]'
      AND campaign_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL
    CHECK (length(payload_hash) = 64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),
  recipient_count INTEGER NOT NULL CHECK (recipient_count >= 0),
  state TEXT NOT NULL DEFAULT 'reserved'
    CHECK (state IN ('reserved', 'completed', 'interrupted')),
  interruption_reason TEXT
    CHECK (interruption_reason IN ('delivery-unconfirmed', 'delivery-log-unconfirmed')),
  accepted_count INTEGER CHECK (accepted_count >= 0),
  failed_count INTEGER CHECK (failed_count >= 0),
  unknown_count INTEGER CHECK (unknown_count >= 0),
  not_attempted_count INTEGER CHECK (not_attempted_count >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  CHECK (
    (state = 'reserved' AND interruption_reason IS NULL
      AND accepted_count IS NULL AND failed_count IS NULL
      AND unknown_count IS NULL AND not_attempted_count IS NULL
      AND completed_at IS NULL)
    OR
    (state != 'reserved' AND accepted_count IS NOT NULL AND failed_count IS NOT NULL
      AND unknown_count IS NOT NULL AND not_attempted_count IS NOT NULL
      AND accepted_count + failed_count + unknown_count + not_attempted_count = recipient_count
      AND completed_at IS NOT NULL
      AND ((state = 'completed' AND interruption_reason IS NULL
        AND unknown_count = 0 AND not_attempted_count = 0)
        OR (state = 'interrupted' AND interruption_reason IS NOT NULL)))
  )
);
