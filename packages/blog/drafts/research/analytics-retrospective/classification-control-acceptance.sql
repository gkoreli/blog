SELECT reader_kind AS kind, reader_reason AS reason, agent_name AS selectedName,
  json_extract(classification_evidence, '$.declarations.candidates') AS candidates,
  json_extract(classification_evidence, '$.declarations.status') AS declarationStatus,
  json_extract(classification_evidence, '$.categoryAgreement') AS categoryAgreement,
  json_extract(classification_evidence, '$.network') AS networkEvidence,
  json_extract(signature_evidence, '$.localStatus') AS signatureStatus,
  COUNT(*) AS observations,
  SUM(request_evidence IS NOT NULL) AS optionalStructuredCaptures,
  MAX(length(CAST(classification_evidence AS BLOB))) AS largestEvidenceBytes
FROM page_observations
WHERE observed_at >= ? AND observed_at < ?
  AND collection_version = '2026-10-27.2'
  AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz'
GROUP BY reader_kind, reader_reason, agent_name, candidates, declarationStatus,
  categoryAgreement, networkEvidence, signatureStatus;
