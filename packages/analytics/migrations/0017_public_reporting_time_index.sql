-- Match the public owner/time predicate without scanning unrelated history.
-- Retained observations and owner-client exclusions are unchanged.
CREATE INDEX IF NOT EXISTS idx_page_observations_public_time
  ON page_observations(is_owner, observed_at);
PRAGMA optimize;
