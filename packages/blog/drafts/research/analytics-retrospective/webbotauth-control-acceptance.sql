SELECT COUNT(*) AS controlViews,
  COALESCE(SUM(signature_evidence IS NOT NULL), 0) AS evidenceRecordedViews,
  COALESCE(SUM(json_extract(signature_evidence, '$.localStatus') = 'absent'), 0) AS absentViews,
  COALESCE(SUM(json_extract(signature_evidence, '$.source') = 'local-webbotauth'), 0) AS localVerifierSourceViews,
  COALESCE(SUM(json_type(signature_evidence, '$.native.verifiedBot') IN ('true','false') OR json_type(signature_evidence, '$.native.signedAgent') IN ('true','false')), 0) AS nativeAvailableViews,
  COALESCE(SUM(request_evidence IS NOT NULL), 0) AS optionalStructuredCaptures
FROM page_observations
WHERE observed_at >= '2026-10-27 15:03:16' AND observed_at <= '2026-10-27 15:03:18'
  AND collection_version = '2026-10-27.1' AND path = '/privacy' AND referrer_host = 'traffic2cash.xyz';
