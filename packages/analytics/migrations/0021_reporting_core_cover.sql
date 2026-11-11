-- Cover core report dimensions and current-fact counts without reading evidence payload pages.
CREATE INDEX IF NOT EXISTS idx_page_observation_report_facts_public_cover
  ON page_observation_report_facts(rule_sha256, observed_at, report_referral_rule_sha256, report_referral_excluded, daily_client_id, path, referrer_host, country, report_form, report_form_recorded, report_form_unsupported, report_form_differing, report_form_defaulted, agent_name, traffic_class, reader_kind, reader_reason, signature_agent, signature_status, internal_referrer_path, representation, referrer_state) WHERE is_owner=0;
PRAGMA optimize;
