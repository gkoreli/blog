ALTER TABLE page_observations
  ADD COLUMN representation TEXT
  CHECK (representation IN ('html', 'markdown'));
