-- Prospective closed declarations/network facts; historical classifications stay.
ALTER TABLE page_observations ADD COLUMN classification_evidence TEXT
  CHECK (classification_evidence IS NULL OR (
    json_valid(classification_evidence) AND length(CAST(classification_evidence AS BLOB)) <= 2048
  ));
