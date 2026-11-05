WITH bounded AS MATERIALIZED (
 SELECT reserved_at,outcome,provider_status FROM confirmation_attempts INDEXED BY idx_confirmation_time WHERE reserved_at>=unixepoch('2026-10-29 00:00:00') AND reserved_at<unixepoch('2026-11-05 15:15:00') ORDER BY reserved_at DESC LIMIT 2001
) SELECT date(reserved_at,'unixepoch') day,outcome,provider_status,COUNT(*) operations,(SELECT COUNT(*) FROM bounded) bounded_total FROM bounded GROUP BY day,outcome,provider_status ORDER BY day DESC;
