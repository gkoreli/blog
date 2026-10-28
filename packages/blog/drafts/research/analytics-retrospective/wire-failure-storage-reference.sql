SELECT CAST(id AS TEXT) AS privateReference,
  observed_at AS observedAt, collection_version AS collectionVersion,
  classifier_version AS classifierVersion, path, representation,
  reader_kind AS readerKind, signature_status AS signatureStatus,
  signature_agent AS signatureAgent, signature_evidence AS signatureEvidence,
  classification_evidence AS classificationEvidence,
  is_owner AS isOwner, referrer_host AS referrerHost,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations
WHERE id = CAST(? AS INTEGER)
ORDER BY id;
