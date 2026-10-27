SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  json_extract(signature_evidence, '$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence, '$.localOutcome') AS outcome,
  json_extract(signature_evidence, '$.localReasons') AS reasons,
  json_extract(signature_evidence, '$.coverage') IS NULL AS coverageAbsent,
  json_extract(signature_evidence, '$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence, '$.native.signedAgent') AS nativeSignedAgent,
  request_evidence IS NULL AS optionalCaptureAbsent, reader_kind AS readerKind
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?
  AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz'
  AND json_extract(signature_evidence, '$.verifierProfile') = '2026-10-27.4'
  AND json_extract(signature_evidence, '$.localReason') = 'duplicate-component'
ORDER BY id LIMIT 5;
