-- Prospective provenance only. Historical rows stay unversioned rather than guessed.
ALTER TABLE page_observations ADD COLUMN collection_version TEXT
  CHECK (collection_version IS NULL OR length(collection_version) BETWEEN 1 AND 32);
ALTER TABLE page_observations ADD COLUMN classifier_version TEXT
  CHECK (classifier_version IS NULL OR length(classifier_version) BETWEEN 1 AND 32);
