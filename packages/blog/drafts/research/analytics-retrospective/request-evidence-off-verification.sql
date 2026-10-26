SELECT collection_version, COUNT(*) views, SUM(request_evidence IS NOT NULL) structured_captures FROM page_observations WHERE observed_at >= '2026-10-26 07:01:45' AND observed_at < '2026-10-26 07:11:47' AND path='/privacy' AND referrer_host='uniuit.com' GROUP BY collection_version;
SELECT COUNT(*) diagnostic_rows FROM page_observation_diagnostics;
