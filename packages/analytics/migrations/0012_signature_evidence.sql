-- Derived verification/coverage facts only. No raw signatures, keys, nonces,
-- User-Agent values or source addresses. No historical evidence is fabricated.
ALTER TABLE page_observations ADD COLUMN signature_evidence TEXT
  CHECK (signature_evidence IS NULL OR (
    json_valid(signature_evidence) AND length(CAST(signature_evidence AS BLOB)) <= 2048
  ));
