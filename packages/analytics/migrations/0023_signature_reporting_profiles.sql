-- The new interpretation only adds the 2026-11-13.1 verifier/coverage formats.
-- Existing facts outside those formats have exactly the same interpretation.
-- Promote only the reviewed predecessor; preserve all fact values and source.
-- A row already carrying a new format or an unrelated fingerprint stays stale
-- and uses the complete source fallback until explicitly rebuilt.
UPDATE page_observation_report_facts
SET rule_sha256='1907b5de82b5694ff41a88b1dbf77f134929199785d63bdf1246bf88713078ca'
WHERE rule_sha256='2ca641b0fed3defaeb8bcc0556ec88a47abda3a7a8d4918655269007978569d2'
  AND EXISTS (
    SELECT 1 FROM page_observations AS source
    WHERE source.id=page_observation_report_facts.observation_id
      AND json_extract(source.signature_evidence,'$.verifierProfile') IS NOT '2026-11-13.1'
      AND json_extract(source.signature_evidence,'$.coverage.version') IS NOT '2026-11-13.1'
  );
