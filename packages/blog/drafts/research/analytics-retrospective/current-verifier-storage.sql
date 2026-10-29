SELECT CAST(id AS TEXT) AS privateReference,
  observed_at AS observedAt, collection_version AS collectionVersion,
  classifier_version AS classifierVersion, path, representation,
  observation_source AS observationSource,
  reader_kind AS readerKind, agent_name AS agentName,
  signature_status AS signatureStatus, signature_agent AS signatureAgent,
  signature_evidence AS signatureEvidence,
  classification_evidence AS classificationEvidence,
  vendor_ip_evidence AS vendorIpEvidence,
  is_owner AS ownerFlag, referrer_host AS referrerHost,
  request_evidence IS NULL AS optionalCaptureAbsent
FROM page_observations
WHERE id IN (CAST(? AS INTEGER), CAST(? AS INTEGER), CAST(? AS INTEGER), CAST(? AS INTEGER))
ORDER BY id
LIMIT 5;
