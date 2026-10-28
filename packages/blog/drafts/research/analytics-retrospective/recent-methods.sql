SELECT COUNT(*) AS storedRows,
  COALESCE(SUM(collection_version='2026-10-28.7'),0) AS collection7Rows,
  COALESCE(SUM(collection_version='2026-10-28.8'),0) AS collection8Rows,
  COALESCE(SUM(is_owner=1),0) AS ownerFlagRows,
  COALESCE(SUM(signature_status='verified'),0) AS storedVerifiedRows,
  COALESCE(SUM(signature_status='verified' AND signature_agent='https://agent.bot.goog'),0) AS googleOriginVerifiedRows,
  COALESCE(SUM(signature_status='verified' AND signature_agent='https://crawler.exa.ai'),0) AS exaOriginVerifiedRows,
  COALESCE(SUM(signature_status='verified' AND signature_agent='https://ahrefs.com'),0) AS ahrefsOriginVerifiedRows,
  COALESCE(SUM(signature_status='verified' AND json_extract(signature_evidence,'$.source')='local-webbotauth'
    AND json_extract(signature_evidence,'$.verifierProfile')='2026-10-28.6'),0) AS verifier6DetailedVerifiedRows,
  COALESCE(SUM(agent_name='Google-Agent'),0) AS singleGoogleAgentDeclarationRows,
  COALESCE(SUM(agent_name='DuckDuckBot'),0) AS singleDuckDuckBotDeclarationRows,
  COALESCE(SUM(json_type(signature_evidence,'$.native.verifiedBot') IN ('true','false')
    OR json_type(signature_evidence,'$.native.signedAgent') IN ('true','false')),0) AS nativeBooleanAvailableRows,
  COALESCE(SUM(EXISTS(SELECT 1 FROM json_each(vendor_ip_evidence,'$.checks') c
    WHERE json_extract(c.value,'$.source')='google-agent' AND json_extract(c.value,'$.outcome')='listed')),0) AS googleAgentListedRows,
  COALESCE(SUM(EXISTS(SELECT 1 FROM json_each(vendor_ip_evidence,'$.checks') c
    WHERE json_extract(c.value,'$.source')='duckduckbot' AND json_extract(c.value,'$.outcome')='listed')),0) AS duckDuckBotListedRows
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?;
