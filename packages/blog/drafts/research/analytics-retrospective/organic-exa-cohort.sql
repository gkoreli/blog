-- Candidate cohort only: time/path do not provide an invocation-to-D1 identity join.
SELECT collection_version AS collectionVersion, reader_kind AS readerKind,
  signature_status AS signatureStatus,
  json_extract(signature_evidence,'$.version') AS evidenceVersion,
  json_extract(signature_evidence,'$.source') AS evidenceSource,
  json_extract(signature_evidence,'$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence,'$.localOutcome') AS localOutcome,
  json_extract(signature_evidence,'$.vendor.status') AS vendorStatus,
  json_extract(signature_evidence,'$.coverage.covered.authority') AS authorityCovered,
  json_extract(signature_evidence,'$.coverage.covered.userAgent') AS userAgentCovered,
  json_extract(signature_evidence,'$.coverage.covered.path') AS pathCovered,
  json_extract(signature_evidence,'$.native.verifiedBot') AS nativeVerifiedBot,
  json_extract(signature_evidence,'$.native.signedAgent') AS nativeSignedAgent,
  source_event_id IS NULL AS routineSourceEventIdAbsent,
  request_evidence IS NULL AS optionalCaptureAbsent,
  count(*) AS observations
FROM page_observations INDEXED BY idx_page_observations_public_path_time
WHERE is_owner IN (0,1) AND path='/which-ai-fetchers-send-which-headers'
  AND observed_at >= '2026-10-27 20:16:44' AND observed_at < '2026-10-27 20:16:48'
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
LIMIT 10;
