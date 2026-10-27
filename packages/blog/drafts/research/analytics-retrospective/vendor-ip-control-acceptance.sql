SELECT collection_version AS collectionVersion, classifier_version AS classifierVersion,
  agent_name AS declaration, reader_kind AS readerKind,
  json_extract(vendor_ip_evidence, '$.profile') AS profile,
  json_extract(vendor_ip_evidence, '$.address.state') AS addressState,
  json_extract(vendor_ip_evidence, '$.address.header') AS addressHeader,
  json_extract(vendor_ip_evidence, '$.summary') AS summary,
  json_extract(vendor_ip_evidence, '$.checks') AS checks,
  length(CAST(vendor_ip_evidence AS BLOB)) AS evidenceBytes,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?
  AND collection_version = '2026-10-27.4'
  AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz'
ORDER BY id;
