-- Old null referrers cannot distinguish internal, absent, and rejected headers.
-- Leave them unknown. New ingestion records the category explicitly.
ALTER TABLE page_observations ADD COLUMN referrer_state TEXT
  CHECK (referrer_state IN ('external', 'internal', 'absent', 'unusable'));
ALTER TABLE page_observations ADD COLUMN internal_referrer_path TEXT
  CHECK (internal_referrer_path IS NULL OR (
    referrer_state IS 'internal' AND internal_referrer_path LIKE '/%'
    AND instr(internal_referrer_path, '?') = 0 AND instr(internal_referrer_path, '#') = 0
  ));
CREATE INDEX idx_page_observations_public_internal_referrer_time
  ON page_observations(is_owner, internal_referrer_path, observed_at);
