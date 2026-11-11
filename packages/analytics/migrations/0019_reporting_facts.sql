-- Disposable, versioned reporting facts. Source observations retain all evidence.
CREATE TABLE page_observation_report_facts (
  observation_id INTEGER PRIMARY KEY REFERENCES page_observations(id) ON DELETE CASCADE,
  rule_sha256 TEXT NOT NULL CHECK(length(rule_sha256)=64 AND rule_sha256 NOT GLOB '*[^0-9a-f]*'),
  path TEXT,
  referrer_host TEXT,
  referrer_state TEXT,
  internal_referrer_path TEXT,
  country TEXT,
  daily_client_id TEXT,
  traffic_class TEXT,
  agent_name TEXT,
  is_owner INTEGER,
  representation TEXT,
  signature_agent TEXT,
  signature_status TEXT,
  reader_kind TEXT,
  reader_reason TEXT,
  observed_at TEXT,
  report_form TEXT,
  report_form_recorded INTEGER,
  report_form_unsupported INTEGER,
  report_form_differing INTEGER,
  report_form_defaulted INTEGER,
  report_directory TEXT,
  report_native_category TEXT,
  report_signature_basis TEXT,
  report_verifier_profile TEXT,
  report_verification TEXT NOT NULL CHECK(json_valid(report_verification) AND json_type(report_verification)='array'),
  report_network TEXT NOT NULL CHECK(json_valid(report_network) AND json_type(report_network)='array'),
  report_metadata TEXT NOT NULL CHECK(json_valid(report_metadata) AND json_type(report_metadata)='object'),
  report_cache TEXT NOT NULL CHECK(json_valid(report_cache) AND json_type(report_cache)='object')
);
CREATE INDEX idx_page_observation_report_facts_window ON page_observation_report_facts(rule_sha256,is_owner,observed_at);
-- Every retained-field repair invalidates the snapshot, including dimensions.
CREATE TRIGGER invalidate_page_observation_report_facts AFTER UPDATE ON page_observations
BEGIN
  DELETE FROM page_observation_report_facts WHERE observation_id=NEW.id;
END;
