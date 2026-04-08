-- Newsletter subscribers table — authoritative schema (2026-04-08)
-- Apply to: blog-analytics D1 database
-- Command: wrangler d1 execute blog-analytics \
--            --file packages/newsletter/migrations/0001_create_subscribers.sql
--
-- Existing install? Run 0002_for_existing_installs.sql instead.

CREATE TABLE IF NOT EXISTS subscribers (
  id                       TEXT PRIMARY KEY,
  -- Hashed token fields: raw tokens sent in email URLs, SHA-256 hashes stored here.
  -- A D1 breach cannot yield usable confirm/unsubscribe links. See tokens.ts.
  email                    TEXT UNIQUE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),

  confirm_token            TEXT,             -- SHA-256(rawConfirmToken); NULL after use
  confirm_token_expires_at TEXT,             -- 24-hour window; NULL after confirmation

  unsubscribe_token        TEXT NOT NULL,    -- SHA-256(rawUnsubToken); permanent, never expires

  source                   TEXT,             -- pathname of signup page (conversion analytics)
  consent_ip               TEXT,             -- truncated IP for GDPR proof-of-consent ("1.2.3.x")

  created_at               TEXT NOT NULL DEFAULT (datetime('now')),  -- = consent timestamp
  confirmed_at             TEXT,
  unsubscribed_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_sub_email         ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_sub_confirm_token ON subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS idx_sub_unsub_token   ON subscribers (unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_sub_status        ON subscribers (status);
