SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  device_type AS legacyDeviceType, reader_kind AS readerKind,
  json_extract(client_form_evidence, '$.profile') AS profile,
  json_extract(client_form_evidence, '$.form') AS clientForm,
  json_extract(client_form_evidence, '$.markers') AS markers,
  json_extract(client_form_evidence, '$.mobileHint') AS mobileHint,
  json_extract(client_form_evidence, '$.comparison') AS comparison,
  json_extract(client_form_evidence, '$.legacyCompatibility.defaulted') AS legacyDefaulted,
  length(CAST(client_form_evidence AS BLOB)) AS evidenceBytes,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?
  AND collection_version = '2026-10-27.5'
  AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz'
ORDER BY id;
