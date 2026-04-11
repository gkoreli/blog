-- Client-side error observability — sanitized browser reports.
-- Apply:
--   wrangler d1 execute blog-analytics --remote \
--     --file packages/client-observability/migrations/0001_create_client_errors.sql

CREATE TABLE IF NOT EXISTS client_errors (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL
                  CHECK (type IN ('window_error', 'unhandled_rejection', 'interaction_error')),
  message         TEXT NOT NULL,
  path            TEXT NOT NULL,
  referrer        TEXT,
  component       TEXT,
  status          INTEGER,
  source          TEXT,
  line            INTEGER,
  column          INTEGER,
  stack           TEXT,
  user_agent      TEXT,
  build_id        TEXT,
  ray             TEXT,
  country         TEXT,
  colo            TEXT,
  as_organization TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors (created_at);
CREATE INDEX IF NOT EXISTS idx_client_errors_type       ON client_errors (type);
CREATE INDEX IF NOT EXISTS idx_client_errors_path       ON client_errors (path);
CREATE INDEX IF NOT EXISTS idx_client_errors_component  ON client_errors (component);
