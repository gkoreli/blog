-- New evidence only. Historical observations remain null; no inferred backfill.
ALTER TABLE page_observations ADD COLUMN request_evidence TEXT
  CHECK (request_evidence IS NULL OR (json_valid(request_evidence) AND length(CAST(request_evidence AS BLOB)) <= 2048));

-- Private short-lived source evidence. Never selected by public stats queries.
CREATE TABLE page_observation_diagnostics (
  observation_id INTEGER PRIMARY KEY REFERENCES page_observations(id) ON DELETE CASCADE,
  evidence_version TEXT NOT NULL CHECK (length(evidence_version) BETWEEN 1 AND 32),
  captured_at TEXT NOT NULL,
  expires_at TEXT NOT NULL CHECK (expires_at > captured_at),
  payload TEXT NOT NULL CHECK (json_valid(payload) AND length(CAST(payload AS BLOB)) <= 4096)
);
CREATE INDEX idx_page_observation_diagnostics_expiry ON page_observation_diagnostics(expires_at);
