-- Newsletter subscribers table
-- Apply to: blog-analytics D1 database
-- Command: wrangler d1 execute blog-analytics --file packages/newsletter/migrations/0001_create_subscribers.sql

CREATE TABLE IF NOT EXISTS subscribers (
  id                TEXT PRIMARY KEY,           -- crypto.randomUUID()
  email             TEXT UNIQUE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirm_token     TEXT,                       -- one-time; cleared after confirmation
  unsubscribe_token TEXT NOT NULL,              -- permanent; stable link in every newsletter
  source            TEXT,                       -- pathname where signup occurred
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at      TEXT,
  unsubscribed_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email         ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirm_token ON subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsub_token   ON subscribers (unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_status        ON subscribers (status);
