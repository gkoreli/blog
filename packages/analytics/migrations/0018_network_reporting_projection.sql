-- Disposable read projection of stored network evidence, not a new observation.
CREATE TABLE page_observation_network_facts (
  observation_id INTEGER PRIMARY KEY REFERENCES page_observations(id) ON DELETE CASCADE,
  rule_sha256 TEXT NOT NULL CHECK (length(rule_sha256) = 64 AND rule_sha256 NOT GLOB '*[^0-9a-f]*'),
  network_state TEXT NOT NULL CHECK (network_state IN ('not-recorded', 'recognized', 'unrecognized'))
);

-- Raw-evidence repairs must not leave an accepted derived interpretation behind.
CREATE TRIGGER invalidate_page_observation_network_facts
AFTER UPDATE OF vendor_ip_evidence ON page_observations
BEGIN
  DELETE FROM page_observation_network_facts WHERE observation_id = NEW.id;
END;
