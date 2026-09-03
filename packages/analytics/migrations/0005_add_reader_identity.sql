ALTER TABLE page_observations
  ADD COLUMN signature_agent TEXT;

ALTER TABLE page_observations
  ADD COLUMN signature_status TEXT
  CHECK (signature_status IN ('verified', 'unverified'));

ALTER TABLE page_observations
  ADD COLUMN reader_kind TEXT;

ALTER TABLE page_observations
  ADD COLUMN reader_reason TEXT;
