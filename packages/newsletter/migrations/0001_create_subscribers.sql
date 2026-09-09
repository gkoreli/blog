-- Newsletter subscribers table — initial fresh-install schema (2026-04-08)
-- Apply to: blog-analytics D1 database
-- Command: wrangler d1 execute blog-analytics \
--            --file packages/newsletter/migrations/0001_create_subscribers.sql
--
-- Fresh installs: 0001, then 0003, 0004, 0005. Do not also run 0002.
-- 0002 only patches a pre-April-8 schema; inspect existing columns first.

CREATE TABLE IF NOT EXISTS subscribers (
  id                       TEXT PRIMARY KEY,
  -- Confirmation tokens are hashed; unsubscribe tokens are raw for footer links.
  -- Database disclosure exposes addresses and usable opt-out tokens. See tokens.ts.
  email                    TEXT UNIQUE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),

  confirm_token            TEXT,             -- SHA-256(rawConfirmToken); NULL after use
  confirm_token_expires_at TEXT,             -- 24-hour window; NULL after confirmation

  unsubscribe_token        TEXT NOT NULL,    -- raw token; stable while this row is retained

  source                   TEXT,             -- signup path + allowlisted acquisition params
  consent_ip               TEXT,             -- truncated request IP ("1.2.3.x"); not authenticated consent

  created_at               TEXT NOT NULL DEFAULT (datetime('now')),  -- first stored request timestamp
  confirmed_at             TEXT,
  unsubscribed_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_sub_email         ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_sub_confirm_token ON subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS idx_sub_unsub_token   ON subscribers (unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_sub_status        ON subscribers (status);
