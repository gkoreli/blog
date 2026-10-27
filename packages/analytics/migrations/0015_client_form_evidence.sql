-- Explicit UA form markers/preferences, not physical-device authentication.
ALTER TABLE page_observations ADD COLUMN client_form_evidence TEXT
  CHECK (client_form_evidence IS NULL OR (json_valid(client_form_evidence) AND length(CAST(client_form_evidence AS BLOB)) <= 1024));
