ALTER TABLE page_observations
  ADD COLUMN observation_source TEXT NOT NULL DEFAULT 'edge'
  CHECK (observation_source IN ('beacon', 'edge'));

ALTER TABLE page_observations
  ADD COLUMN source_event_id INTEGER;

CREATE UNIQUE INDEX idx_page_observations_source_event
  ON page_observations(observation_source, source_event_id)
  WHERE source_event_id IS NOT NULL;

INSERT OR IGNORE INTO page_observations (
  path,
  referrer_host,
  country,
  daily_client_id,
  traffic_class,
  agent_name,
  device_type,
  is_owner,
  observation_source,
  source_event_id,
  observed_at
)
SELECT
  path,
  CASE
    WHEN referrer IS NULL THEN NULL
    WHEN instr(referrer, '/') = 0 THEN referrer
    ELSE substr(referrer, 1, instr(referrer, '/') - 1)
  END,
  country,
  visitor_hash || visitor_hash,
  CASE visitor_type
    WHEN 0 THEN 'browser'
    WHEN 1 THEN 'bot'
    WHEN 2 THEN 'ai'
  END,
  NULL,
  device_type,
  COALESCE(is_owner, 0),
  'beacon',
  id,
  created_at
FROM page_views
WHERE visitor_hash IS NOT NULL
  AND length(visitor_hash) = 16
  AND visitor_hash NOT GLOB '*[^0-9a-f]*'
  AND visitor_type IN (0, 1, 2)
  AND device_type IN ('desktop', 'mobile', 'tablet')
  AND path LIKE '/%';
