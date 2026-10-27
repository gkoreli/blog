SELECT collection_version AS collectionVersion, reader_kind AS readerKind,
  json_extract(signature_evidence,'$.version') AS evidenceVersion,
  json_extract(signature_evidence,'$.source') AS evidenceSource,
  json_extract(signature_evidence,'$.localOutcome') AS localOutcome,
  json_extract(signature_evidence,'$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence,'$.native.category.status') AS categoryStatus,
  json_extract(signature_evidence,'$.native.category.value') AS categoryValue,
  json_extract(signature_evidence,'$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence,'$.native.signedAgent') AS nativeSignedAgent,
  request_evidence IS NULL AS optionalCaptureAbsent,
  referrer_host='traffic2cash.xyz' AS referralControl
FROM page_observations
WHERE id=CAST(? AS INTEGER) AND path='/privacy' AND collection_version=?;
