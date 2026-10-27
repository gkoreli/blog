-- Bounded recent collection acceptance; no raw request context or identifier.
WITH recent AS MATERIALIZED (
  SELECT collection_version, signature_status, signature_evidence, request_evidence
  FROM page_observations
  WHERE observed_at >= datetime('now', '-15 minutes')
  ORDER BY observed_at DESC
  LIMIT 200
)
SELECT COUNT(*) AS inspectedRecentRows,
  COALESCE(SUM(collection_version = '2026-10-27.1'), 0) AS prospectiveViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND signature_evidence IS NOT NULL), 0) AS evidenceRecordedViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND json_extract(signature_evidence, '$.source') = 'local-webbotauth'), 0) AS localVerifierSourceViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND signature_status = 'verified'), 0) AS verifiedViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND signature_status = 'unverified'), 0) AS unverifiedViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND signature_status IS NULL AND json_extract(signature_evidence, '$.localStatus') = 'absent'), 0) AS absentViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND json_type(signature_evidence, '$.coverage') = 'object'), 0) AS coverageRecordedViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND (json_type(signature_evidence, '$.native.verifiedBot') IN ('true', 'false') OR json_type(signature_evidence, '$.native.signedAgent') IN ('true', 'false'))), 0) AS nativeAvailableViews,
  COALESCE(SUM(collection_version = '2026-10-27.1' AND request_evidence IS NOT NULL), 0) AS optionalStructuredCaptures,
  MAX(CASE WHEN collection_version = '2026-10-27.1' THEN length(CAST(signature_evidence AS BLOB)) END) AS largestEvidenceBytes
FROM recent;
