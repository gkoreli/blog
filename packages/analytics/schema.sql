-- Analytics schema for Cloudflare D1
-- See: docs/adr/0004-analytics.md

CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  continent TEXT,
  visitor_hash TEXT,
  visitor_type INTEGER DEFAULT 0,
  is_owner INTEGER DEFAULT 0,
  device_type TEXT DEFAULT 'desktop',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_path ON page_views(path);
CREATE INDEX idx_created ON page_views(created_at);
CREATE INDEX idx_visitor ON page_views(visitor_hash);
