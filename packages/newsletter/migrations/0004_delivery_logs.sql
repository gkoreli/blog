-- Migration 0004: user_agent on subscribers + delivery_logs table.
-- Apply to: blog-analytics D1 database
-- Command: wrangler d1 execute blog-analytics \
--            --file packages/newsletter/migrations/0004_delivery_logs.sql

-- Lightweight abuse-signal column. Optional at subscribe time; truncated to 512 chars in code.
-- Helps identify bot patterns that slip through Turnstile (curl, python-requests, headless Chrome UA, etc.)
ALTER TABLE subscribers ADD COLUMN user_agent TEXT;

-- Delivery log: one row per subscriber per campaign send.
-- Denormalizes email so the audit trail survives subscriber purges (GDPR data-minimisation deletes rows).
-- sub_id references subscribers(id) conceptually; no FK constraint (D1 does not enforce FK by default,
-- and subscriber rows will be purged after 90 days per GDPR cleanup).
CREATE TABLE IF NOT EXISTS delivery_logs (
  id           TEXT PRIMARY KEY,
  campaign_id  TEXT NOT NULL,
  sub_id       TEXT NOT NULL,
  email        TEXT NOT NULL,  -- snapshot; subscriber row may be purged later
  status       TEXT NOT NULL DEFAULT 'sent'
               CHECK (status IN ('sent', 'failed')),
  resend_id    TEXT,           -- Resend email ID for cross-reference / support
  error        TEXT,           -- error message if status = 'failed'
  sent_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dl_campaign ON delivery_logs (campaign_id);
CREATE INDEX IF NOT EXISTS idx_dl_sub      ON delivery_logs (sub_id);
CREATE INDEX IF NOT EXISTS idx_dl_sent_at  ON delivery_logs (sent_at);
