SELECT CAST(id AS TEXT) AS privateReference, observed_at AS observedAt,
  collection_version AS collectionVersion, classifier_version AS classifierVersion,
  path, representation, reader_kind AS readerKind,
  signature_status AS signatureStatus, signature_agent AS signatureAgent,
  signature_evidence AS signatureEvidence, classification_evidence AS classificationEvidence,
  is_owner AS ownerExcluded, referrer_host AS referrerHost,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations INDEXED BY idx_page_observations_observed_at
WHERE observed_at >= ? AND observed_at < ? AND observation_source = 'edge'
  AND signature_status = 'verified'
  AND collection_version IN ('2026-10-27.9','2026-10-27.10','2026-10-27.11','2026-10-28.1')
ORDER BY observed_at DESC, id DESC
LIMIT 21;
