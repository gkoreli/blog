ALTER TABLE page_observations
  ADD COLUMN asn INTEGER;

ALTER TABLE page_observations
  ADD COLUMN as_org TEXT;

ALTER TABLE page_observations
  ADD COLUMN sec_fetch_mode TEXT;

ALTER TABLE page_observations
  ADD COLUMN sec_fetch_dest TEXT;

ALTER TABLE page_observations
  ADD COLUMN sec_fetch_site TEXT;

ALTER TABLE page_observations
  ADD COLUMN sec_fetch_user INTEGER
  CHECK (sec_fetch_user IN (0, 1));

ALTER TABLE page_observations
  ADD COLUMN accepts_html INTEGER
  CHECK (accepts_html IN (0, 1));

ALTER TABLE page_observations
  ADD COLUMN has_accept_language INTEGER
  CHECK (has_accept_language IN (0, 1));
