SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  reader_kind AS readerKind,
  json_extract(signature_evidence, '$.version') AS evidenceVersion,
  json_extract(signature_evidence, '$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence, '$.localOutcome') AS outcome,
  json_extract(signature_evidence, '$.localReason') AS reason,
  json_extract(signature_evidence, '$.localReasons') AS reasons,
  json_extract(signature_evidence, '$.coverage') IS NULL AS coverageAbsent,
  signature_agent IS NULL AS authenticatedSignerAbsent,
  request_evidence IS NULL AS optionalCaptureAbsent,
  json_extract(signature_evidence, '$.native.category.status') AS categoryStatus,
  json_extract(signature_evidence, '$.native.category.value') AS categoryValue,
  json_extract(signature_evidence, '$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence, '$.native.signedAgent') AS nativeSignedAgent,
  referrer_host = 'traffic2cash.xyz' AS referralControl
FROM page_observations
WHERE id = CAST(? AS INTEGER) AND path = '/privacy' AND collection_version = ?;
