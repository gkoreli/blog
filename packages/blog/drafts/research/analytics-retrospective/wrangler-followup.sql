-- clock
SELECT datetime('now') queriedAt;

-- r1-daily
WITH eligible AS MATERIALIZED (SELECT * FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-26 01:03:18' AND is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)), cohort AS MATERIALIZED (SELECT * FROM eligible WHERE reader_kind='browser' AND referrer_host=:r1_host) SELECT date(observed_at) day,COUNT(*) views,COUNT(DISTINCT daily_client_id) dailyIds,COUNT(DISTINCT path) paths,COUNT(DISTINCT country) countries,COUNT(DISTINCT asn) asns,MIN(observed_at) firstAt,MAX(observed_at) lastAt FROM cohort GROUP BY day ORDER BY day;

-- r1-shape
WITH eligible AS MATERIALIZED (SELECT * FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-26 01:03:18' AND is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)), cohort AS MATERIALIZED (SELECT * FROM eligible WHERE reader_kind='browser' AND referrer_host=:r1_host) SELECT sec_fetch_mode mode,sec_fetch_dest destination,sec_fetch_site site,sec_fetch_user userActivation,accepts_html acceptsHtml,has_accept_language hasLanguage,representation,signature_status signatureStatus,signature_agent signer,reader_reason reason,asn_source asnSource,COUNT(*) views FROM cohort GROUP BY mode,destination,site,userActivation,acceptsHtml,hasLanguage,representation,signatureStatus,signer,reason,asnSource ORDER BY views DESC;

-- r1-client-context
WITH eligible AS MATERIALIZED (SELECT * FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-26 01:03:18' AND is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)), cohort AS MATERIALIZED (SELECT * FROM eligible WHERE reader_kind='browser' AND referrer_host=:r1_host), clients AS MATERIALIZED (SELECT DISTINCT daily_client_id FROM cohort) SELECT reader_kind kind,referrer_state referrerState,CASE WHEN referrer_host=:r1_host THEN 'R1' WHEN referrer_host IS NULL THEN 'no-external-host' ELSE 'different-reported-host' END hostClass,COUNT(*) views,COUNT(DISTINCT e.daily_client_id) dailyIds,COUNT(DISTINCT path) paths FROM eligible e JOIN clients c ON c.daily_client_id=e.daily_client_id GROUP BY kind,referrerState,hostClass ORDER BY views DESC;

-- r1-hours
WITH eligible AS MATERIALIZED (SELECT * FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-26 01:03:18' AND is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)), cohort AS MATERIALIZED (SELECT * FROM eligible WHERE reader_kind='browser' AND referrer_host=:r1_host) SELECT strftime('%Y-%m-%dT%H:00:00Z',observed_at) hour,COUNT(*) views,COUNT(DISTINCT daily_client_id) dailyIds,COUNT(DISTINCT path) paths FROM cohort GROUP BY hour ORDER BY hour;

-- signed-roles
SELECT signature_agent signer,signature_status signatureStatus,traffic_class trafficClass,agent_name agentName,reader_kind kind,reader_reason reason,COUNT(*) views,COUNT(DISTINCT daily_client_id) dailyIds FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-26 01:03:18' AND is_owner=0 AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id) AND signature_status IS NOT NULL GROUP BY signer,signatureStatus,trafficClass,agentName,kind,reason ORDER BY views DESC;
