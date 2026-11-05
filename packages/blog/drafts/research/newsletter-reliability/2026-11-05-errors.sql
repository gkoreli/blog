WITH bounded AS MATERIALIZED (
 SELECT type,message,component,status,created_at,build_id,subscription_evidence FROM client_errors INDEXED BY idx_client_errors_created_at
 WHERE created_at>='2026-10-06 00:00:00' AND created_at<'2026-11-05 15:15:00' ORDER BY created_at DESC LIMIT 2001
), normalized AS MATERIALIZED (
 SELECT substr(created_at,1,10) day,created_at,
 CASE WHEN component='subscribe_form' THEN 'subscribe_form' ELSE 'other' END component,
 CASE WHEN message IN ('subscribe_widget_configuration_missing','subscribe_widget_unavailable','subscribe_widget_error','subscribe_widget_expired','subscribe_widget_timeout','subscribe_widget_unsupported','subscribe_widget_render_exception','subscribe_widget_execute_exception','subscribe_widget_deadline','subscribe_widget_empty_token','subscribe_request_timeout','subscribe_api_rejected','subscribe_network_error','subscribe_widget_remove_exception') THEN message ELSE 'other-error' END stage,
 CASE WHEN type IN ('interaction_error','window_error','unhandled_rejection') THEN type ELSE 'other' END type,
 CASE WHEN status BETWEEN 100 AND 599 THEN status ELSE NULL END status,
 CASE WHEN json_valid(subscription_evidence) THEN subscription_evidence ELSE '{}' END evidence,
 CASE WHEN build_id IS NULL OR trim(build_id)='' THEN 0 ELSE 1 END has_build
 FROM bounded
), assessed AS MATERIALIZED (
 SELECT *,CASE WHEN json_extract(evidence,'$.phase') IN ('idle','verifying','sending') THEN json_extract(evidence,'$.phase') ELSE 'unknown' END phase,
 CASE WHEN json_extract(evidence,'$.turnstileError.code') GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]' THEN json_extract(evidence,'$.turnstileError.code') ELSE 'unknown' END provider_code,
 CASE WHEN json_extract(evidence,'$.operation.state') IN ('not-started','response-unavailable','response-id','response-id-missing','response-id-invalid','redirected-response') THEN json_extract(evidence,'$.operation.state') ELSE 'unknown' END operation
 FROM normalized
)
SELECT day,component,stage,type,status,phase,provider_code,operation,has_build,COUNT(*) reports,MIN(created_at) first_seen,MAX(created_at) last_seen,(SELECT COUNT(*) FROM bounded) bounded_total
 FROM assessed GROUP BY day,component,stage,type,status,phase,provider_code,operation,has_build ORDER BY day DESC,reports DESC;
