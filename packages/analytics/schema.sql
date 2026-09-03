-- Fresh analytics schema. observation_source preserves the method boundary for optional legacy backfills.

CREATE TABLE page_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL CHECK (path LIKE '/%'),
  referrer_host TEXT,
  country TEXT,
  daily_client_id TEXT NOT NULL CHECK (
    length(daily_client_id) = 32
    AND daily_client_id NOT GLOB '*[^0-9a-f]*'
  ),
  traffic_class TEXT NOT NULL CHECK (traffic_class IN ('browser', 'bot', 'ai')),
  agent_name TEXT CHECK (agent_name IS NULL OR traffic_class IN ('bot', 'ai')),
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  is_owner INTEGER NOT NULL CHECK (is_owner IN (0, 1)),
  observation_source TEXT NOT NULL DEFAULT 'edge'
    CHECK (observation_source IN ('beacon', 'edge')),
  source_event_id INTEGER,
  asn INTEGER,
  as_org TEXT,
  sec_fetch_mode TEXT,
  sec_fetch_dest TEXT,
  sec_fetch_site TEXT,
  sec_fetch_user INTEGER CHECK (sec_fetch_user IN (0, 1)),
  accepts_html INTEGER CHECK (accepts_html IN (0, 1)),
  has_accept_language INTEGER CHECK (has_accept_language IN (0, 1)),
  signature_agent TEXT,
  signature_status TEXT CHECK (signature_status IN ('verified', 'unverified')),
  reader_kind TEXT,
  reader_reason TEXT,
  observed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_page_observations_observed_at
  ON page_observations(observed_at);
CREATE INDEX idx_page_observations_public_traffic_time
  ON page_observations(is_owner, traffic_class, observed_at);
CREATE INDEX idx_page_observations_public_path_time
  ON page_observations(is_owner, path, observed_at);
CREATE UNIQUE INDEX idx_page_observations_source_event
  ON page_observations(observation_source, source_event_id)
  WHERE source_event_id IS NOT NULL;
