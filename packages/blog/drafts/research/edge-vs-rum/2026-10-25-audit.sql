-- inventory
SELECT COUNT(*) totalStored, MIN(observed_at) firstAt, MAX(observed_at) lastAt, SUM(CASE WHEN observed_at >= '2026-09-27' AND observed_at < '2026-10-27' THEN 1 ELSE 0 END) recentRows, SUM(CASE WHEN observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner=1 THEN 1 ELSE 0 END) recentIngestOwner, SUM(CASE WHEN observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND NOT (is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id)) THEN 1 ELSE 0 END) recentExcludedOwner, (SELECT COUNT(*) FROM owner_clients) ownerMarks, (SELECT MAX(utc_date) FROM owner_clients) latestOwnerDay FROM page_observations p;

-- daily-kinds
SELECT date(observed_at) day, reader_kind kind, reader_reason reason, representation, signature_status signatureStatus, signature_agent signer, agent_name agent, COUNT(*) views, COUNT(DISTINCT daily_client_id) dailyClients FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id) GROUP BY day,kind,reason,representation,signatureStatus,signer,agent ORDER BY day,views DESC;

-- browser-dimensions
SELECT date(observed_at) day, referrer_host host, referrer_state referrerState, country, asn, as_org asOrg, device_type device, representation, COUNT(*) views, COUNT(DISTINCT daily_client_id) dailyClients FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id) AND reader_kind='browser' GROUP BY day,host,referrerState,country,asn,asOrg,device,representation ORDER BY views DESC;

-- browser-client-distribution
WITH clients AS (SELECT date(observed_at) day,referrer_host host,daily_client_id,COUNT(*) n,COUNT(DISTINCT path) paths,MIN(observed_at) firstAt,MAX(observed_at) lastAt FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id) AND reader_kind='browser' GROUP BY day,host,daily_client_id) SELECT day,host,COUNT(*) dailyClients,SUM(n) views,MAX(n) maxPerClient,SUM(CASE WHEN n=1 THEN 1 ELSE 0 END) singleEventClients,SUM(CASE WHEN n>=10 THEN n ELSE 0 END) viewsFrom10Plus,MAX(paths) maxPathsPerClient FROM clients GROUP BY day,host ORDER BY views DESC;

-- browser-paths-by-referrer
SELECT date(observed_at) day,referrer_host host,path,COUNT(*) views FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id) AND reader_kind='browser' GROUP BY day,host,path ORDER BY views DESC;

-- provenance
SELECT observation_source source,asn_source asnSource,reader_kind kind,COUNT(*) views,SUM(CASE WHEN asn IS NULL THEN 1 ELSE 0 END) missingAsn,SUM(CASE WHEN referrer_state IS NULL THEN 1 ELSE 0 END) missingReferrerState FROM page_observations p WHERE observed_at >= '2026-09-27' AND observed_at < '2026-10-27' AND is_owner = 0 AND NOT EXISTS (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id) GROUP BY source,asnSource,kind;

-- migrations
SELECT name,applied_at FROM d1_migrations ORDER BY id;