SELECT collection_version AS collectionVersion,
  json_extract(signature_evidence,'$.version') AS evidenceVersion,
  json_extract(signature_evidence,'$.localOutcome') AS localOutcome,
  json_extract(signature_evidence,'$.native.category.version') AS categoryVersion,
  json_extract(signature_evidence,'$.native.category.status') AS categoryStatus,
  json_extract(signature_evidence,'$.native.category.value') AS categoryValue,
  json_extract(signature_evidence,'$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence,'$.native.signedAgent') AS nativeSignedAgent,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations INDEXED BY idx_page_observations_public_path_time
WHERE is_owner IN (0,1) AND path='/privacy' AND observed_at >= ? AND observed_at < ?
  AND referrer_host='traffic2cash.xyz' AND collection_version='2026-10-27.7'
ORDER BY id LIMIT 5;
