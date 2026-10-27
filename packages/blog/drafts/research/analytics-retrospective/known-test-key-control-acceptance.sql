SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  json_extract(signature_evidence, '$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence, '$.localOutcome') AS outcome,
  json_extract(signature_evidence, '$.localReasons') AS reasons,
  json_extract(signature_evidence, '$.coverage') IS NULL AS coverageAbsent,
  json_extract(signature_evidence, '$.vendor.status') AS vendorStatus,
  json_extract(signature_evidence, '$.vendor.userAgentCovered') AS vendorUserAgentCovered,
  json_extract(signature_evidence, '$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence, '$.native.signedAgent') AS nativeSignedAgent,
  signature_agent IS NULL AS authenticatedSignerAbsent,
  request_evidence IS NULL AS optionalCaptureAbsent, reader_kind AS readerKind,
  agent_name AS declaredAgent, is_owner AS ownerExcluded
FROM page_observations INDEXED BY idx_page_observations_public_path_time
WHERE is_owner IN (0,1) AND path = '/privacy' AND observed_at >= ? AND observed_at < ?
  AND referrer_host = 'traffic2cash.xyz'
  AND json_extract(signature_evidence, '$.verifierProfile') = '2026-10-27.6'
  AND json_extract(signature_evidence, '$.localReason') = 'known-test-key'
ORDER BY id LIMIT 5;
