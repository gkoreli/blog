SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  json_extract(signature_evidence, '$.source') AS source,
  json_extract(signature_evidence, '$.localStatus') AS localStatus,
  json_extract(signature_evidence, '$.localOutcome') AS localOutcome,
  json_extract(signature_evidence, '$.localReasons') AS localReasons,
  json_extract(signature_evidence, '$.vendor.status') AS vendorStatus,
  json_extract(signature_evidence, '$.vendor.documentedDeclarationCount') AS documentedDeclarations,
  json_extract(signature_evidence, '$.vendor.unmappedDeclarationCount') AS unmappedDeclarations,
  reader_kind AS readerKind, request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?
  AND collection_version = '2026-10-27.3'
  AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz'
ORDER BY id;
