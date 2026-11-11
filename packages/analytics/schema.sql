-- Fresh analytics schema. observation_source preserves the method boundary for optional legacy backfills.

CREATE TABLE page_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL CHECK (path LIKE '/%'),
  referrer_host TEXT,
  referrer_state TEXT CHECK (referrer_state IN ('external', 'internal', 'absent', 'unusable')),
  internal_referrer_path TEXT CHECK (internal_referrer_path IS NULL OR (
    referrer_state IS 'internal' AND internal_referrer_path LIKE '/%'
    AND instr(internal_referrer_path, '?') = 0 AND instr(internal_referrer_path, '#') = 0
  )),
  country TEXT,
  daily_client_id TEXT NOT NULL CHECK (
    length(daily_client_id) = 32
    AND daily_client_id NOT GLOB '*[^0-9a-f]*'
  ),
  traffic_class TEXT NOT NULL CHECK (traffic_class IN ('browser', 'bot', 'ai')),
  agent_name TEXT CHECK (agent_name IS NULL OR traffic_class IN ('bot', 'ai')),
  -- Deprecated compatibility heuristic. Current claims live in client_form_evidence.
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  is_owner INTEGER NOT NULL CHECK (is_owner IN (0, 1)),
  observation_source TEXT NOT NULL DEFAULT 'edge'
    CHECK (observation_source IN ('beacon', 'edge')),
  source_event_id INTEGER,
  asn INTEGER,
  as_org TEXT,
  sec_fetch_mode TEXT,
  sec_fetch_dest TEXT,
  sec_fetch_site TEXT,
  sec_fetch_user INTEGER CHECK (sec_fetch_user IN (0, 1)),
  accepts_html INTEGER CHECK (accepts_html IN (0, 1)),
  has_accept_language INTEGER CHECK (has_accept_language IN (0, 1)),
  representation TEXT CHECK (representation IN ('html', 'markdown')),
  signature_agent TEXT,
  signature_status TEXT CHECK (signature_status IN ('verified', 'unverified')),
  reader_kind TEXT,
  reader_reason TEXT,
  asn_source TEXT CHECK (asn_source IN ('request', 'zone-sample')),
  collection_version TEXT CHECK (collection_version IS NULL OR length(collection_version) BETWEEN 1 AND 32),
  classifier_version TEXT CHECK (classifier_version IS NULL OR length(classifier_version) BETWEEN 1 AND 32),
  request_evidence TEXT CHECK (request_evidence IS NULL OR (json_valid(request_evidence) AND length(CAST(request_evidence AS BLOB)) <= 2048)),
  signature_evidence TEXT CHECK (signature_evidence IS NULL OR (json_valid(signature_evidence) AND length(CAST(signature_evidence AS BLOB)) <= 2048)),
  classification_evidence TEXT CHECK (classification_evidence IS NULL OR (json_valid(classification_evidence) AND length(CAST(classification_evidence AS BLOB)) <= 2048)),
  vendor_ip_evidence TEXT CHECK (vendor_ip_evidence IS NULL OR (json_valid(vendor_ip_evidence) AND length(CAST(vendor_ip_evidence AS BLOB)) <= 4096)),
  client_form_evidence TEXT CHECK (client_form_evidence IS NULL OR (json_valid(client_form_evidence) AND length(CAST(client_form_evidence AS BLOB)) <= 1024)),
  observed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_page_observations_observed_at
  ON page_observations(observed_at);
CREATE INDEX idx_page_observations_public_time
  ON page_observations(is_owner, observed_at);
CREATE INDEX idx_page_observations_public_traffic_time
  ON page_observations(is_owner, traffic_class, observed_at);
CREATE INDEX idx_page_observations_public_path_time
  ON page_observations(is_owner, path, observed_at);
CREATE INDEX idx_page_observations_public_internal_referrer_time
  ON page_observations(is_owner, internal_referrer_path, observed_at);
CREATE UNIQUE INDEX idx_page_observations_source_event
  ON page_observations(observation_source, source_event_id)
  WHERE source_event_id IS NOT NULL;

CREATE TABLE owner_clients (
  daily_client_id TEXT PRIMARY KEY CHECK (
    length(daily_client_id) = 32
    AND daily_client_id NOT GLOB '*[^0-9a-f]*'
  ),
  utc_date TEXT NOT NULL,
  marked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ADR-0016.4: every reclassification of reader_kind records the value it
-- replaced, so a method change can be audited per observation rather than only
-- by reading the migration that made it.
CREATE TABLE reader_kind_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER NOT NULL REFERENCES page_observations(id),
  migration TEXT NOT NULL,
  from_kind TEXT,
  from_reason TEXT,
  to_kind TEXT NOT NULL,
  to_reason TEXT NOT NULL,
  revised_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reader_kind_revisions_observation
  ON reader_kind_revisions(observation_id);

-- Private diagnostic evidence has a separate lifecycle from audience events.
CREATE TABLE page_observation_diagnostics (
  observation_id INTEGER PRIMARY KEY REFERENCES page_observations(id) ON DELETE CASCADE,
  evidence_version TEXT NOT NULL CHECK (length(evidence_version) BETWEEN 1 AND 32),
  captured_at TEXT NOT NULL,
  expires_at TEXT NOT NULL CHECK (expires_at > captured_at),
  payload TEXT NOT NULL CHECK (json_valid(payload) AND length(CAST(payload AS BLOB)) <= 4096)
);
CREATE INDEX idx_page_observation_diagnostics_expiry ON page_observation_diagnostics(expires_at);

-- Explicitly activated owner-excluded experiment counters, not ordinary readership.
CREATE TABLE analytics_calibration_trials (
  id TEXT PRIMARY KEY CHECK(length(id) = 36),
  condition TEXT NOT NULL CHECK(condition IN ('normal','block-script','block-beacon','http-client','javascript-off')),
  operator TEXT NOT NULL CHECK(operator IN ('agent-browser','controlled-curl','human-reported')),
  expires_at TEXT NOT NULL,
  page_responses INTEGER NOT NULL DEFAULT 0 CHECK(page_responses BETWEEN 0 AND 4),
  script INTEGER NOT NULL DEFAULT 0 CHECK(script BETWEEN 0 AND 8),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK(attempt BETWEEN 0 AND 8),
  queued INTEGER NOT NULL DEFAULT 0 CHECK(queued BETWEEN 0 AND 8),
  not_queued INTEGER NOT NULL DEFAULT 0 CHECK(not_queued BETWEEN 0 AND 8),
  threw INTEGER NOT NULL DEFAULT 0 CHECK(threw BETWEEN 0 AND 8),
  beacon INTEGER NOT NULL DEFAULT 0 CHECK(beacon BETWEEN 0 AND 8)
);
CREATE INDEX idx_calibration_expiry ON analytics_calibration_trials(expires_at);

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

-- Versioned referral decisions make the read snapshot independent of recursive policy expansion.
ALTER TABLE page_observation_report_facts ADD COLUMN report_referral_excluded INTEGER CHECK(report_referral_excluded IN (0,1));
ALTER TABLE page_observation_report_facts ADD COLUMN report_referral_rule_sha256 TEXT CHECK(report_referral_rule_sha256 IS NULL OR (length(report_referral_rule_sha256)=64 AND report_referral_rule_sha256 NOT GLOB '*[^0-9a-f]*'));

-- Cover core report dimensions and current-fact counts without reading evidence payload pages.
CREATE INDEX IF NOT EXISTS idx_page_observation_report_facts_public_cover
  ON page_observation_report_facts(rule_sha256, observed_at, report_referral_rule_sha256, report_referral_excluded, daily_client_id, path, referrer_host, country, report_form, report_form_recorded, report_form_unsupported, report_form_differing, report_form_defaulted, agent_name, traffic_class, reader_kind, reader_reason, signature_agent, signature_status, internal_referrer_path, representation, referrer_state) WHERE is_owner=0;
PRAGMA optimize;
