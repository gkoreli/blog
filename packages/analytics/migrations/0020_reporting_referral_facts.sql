-- Versioned referral decisions make the read snapshot independent of recursive policy expansion.
ALTER TABLE page_observation_report_facts ADD COLUMN report_referral_excluded INTEGER CHECK(report_referral_excluded IN (0,1));
ALTER TABLE page_observation_report_facts ADD COLUMN report_referral_rule_sha256 TEXT CHECK(report_referral_rule_sha256 IS NULL OR (length(report_referral_rule_sha256)=64 AND report_referral_rule_sha256 NOT GLOB '*[^0-9a-f]*'));
