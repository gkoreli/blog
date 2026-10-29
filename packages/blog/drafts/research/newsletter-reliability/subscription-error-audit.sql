WITH bounded AS MATERIALIZED (
 SELECT type,message,created_at,build_id
 FROM client_errors INDEXED BY idx_client_errors_component
 WHERE component='subscribe_form' LIMIT 1001
), assessed AS MATERIALIZED (
 SELECT type,build_id,
 CASE WHEN message IN ('subscribe_widget_configuration_missing','subscribe_widget_unavailable','subscribe_widget_error','subscribe_widget_expired','subscribe_widget_timeout','subscribe_widget_unsupported','subscribe_widget_render_exception','subscribe_widget_execute_exception','subscribe_widget_deadline','subscribe_widget_empty_token','subscribe_request_timeout','subscribe_api_rejected','subscribe_network_error','subscribe_widget_remove_exception') THEN message ELSE 'other-stage' END AS stage,
 CASE WHEN typeof(created_at)='text' AND length(created_at)=19
  AND strftime('%Y-%m-%d %H:%M:%S',created_at,'+0 seconds')=created_at
  THEN created_at ELSE NULL END AS ingested
 FROM bounded
), eligible AS MATERIALIZED (
 SELECT * FROM assessed WHERE ingested>='2026-10-01 00:00:00' AND ingested<'2026-10-29 22:59:00'
)
SELECT 'coverage' AS rowKind,'' AS day,'all-retained-component' AS stage,
 COUNT(*) AS reportCount,
 COALESCE(SUM(ingested>='2026-10-01 00:00:00' AND ingested<'2026-10-29 22:59:00'),0) AS windowReports,
 COALESCE(SUM(ingested<'2026-10-01 00:00:00' OR ingested>='2026-10-29 22:59:00'),0) AS outsideWindowReports,
 COALESCE(SUM(ingested IS NULL),0) AS invalidTimeReports,
 (SELECT COALESCE(SUM(build_id IS NULL OR trim(build_id)=''),0) FROM eligible) AS missingBuildReports,
 (SELECT COALESCE(SUM(type<>'interaction_error' OR type IS NULL),0) FROM eligible) AS unexpectedTypeReports
 FROM assessed
UNION ALL
SELECT 'stage',substr(ingested,1,10),stage,COUNT(*),COUNT(*),0,0,
 COALESCE(SUM(build_id IS NULL OR trim(build_id)=''),0),
 COALESCE(SUM(type<>'interaction_error' OR type IS NULL),0)
 FROM eligible GROUP BY substr(ingested,1,10),stage
ORDER BY rowKind,day,stage;
