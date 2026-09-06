-- Read-only snapshot: two complete UTC days, 2026-09-04 through 2026-09-05.
-- Run: pnpm exec wrangler d1 execute blog-analytics --remote --file <this-file> --json
SELECT datetime('now') AS queried_at;
SELECT * FROM d1_migrations;
SELECT migration, from_kind, to_kind, COUNT(*) AS rows,
       MIN(revised_at) AS first_revision, MAX(revised_at) AS last_revision
FROM reader_kind_revisions GROUP BY 1,2,3;
SELECT utc_date, COUNT(*) AS marked_clients FROM owner_clients GROUP BY 1;

SELECT date(observed_at) AS day, traffic_class, reader_kind, COUNT(*) AS views,
       COUNT(DISTINCT daily_client_id) AS daily_clients
FROM page_observations p
WHERE observed_at >= '2026-09-04' AND observed_at < '2026-09-06'
  AND is_owner=0
  AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)
GROUP BY 1,2,3 ORDER BY 1,2,3;

SELECT reader_kind, sec_fetch_mode, sec_fetch_dest, accepts_html,
       has_accept_language, COUNT(*) AS views
FROM page_observations p
WHERE observed_at >= '2026-09-04' AND observed_at < '2026-09-06'
  AND traffic_class='browser' AND is_owner=0
  AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)
GROUP BY 1,2,3,4,5;

SELECT date(observed_at) AS day, path, reader_kind, representation, COUNT(*) AS views
FROM page_observations p
WHERE observed_at >= '2026-09-04' AND observed_at < '2026-09-06' AND is_owner=0
  AND NOT EXISTS(SELECT 1 FROM owner_clients o WHERE o.daily_client_id=p.daily_client_id)
GROUP BY 1,2,3,4 ORDER BY 1,2,3,4;

SELECT signature_status, signature_agent, agent_name, reader_kind, COUNT(*) AS views,
       MIN(observed_at) AS first_seen, MAX(observed_at) AS last_seen
FROM page_observations
WHERE observed_at >= '2026-09-03 01:35:29' AND observed_at < '2026-09-06'
  AND signature_status IS NOT NULL AND is_owner=0
GROUP BY 1,2,3,4;

SELECT date(observed_at) AS day, asn, referrer_host, sec_fetch_site,
       COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS daily_clients,
       COUNT(DISTINCT path) AS paths
FROM page_observations
WHERE observed_at >= '2026-09-04' AND observed_at < '2026-09-06'
  AND reader_kind='browser' AND is_owner=0
GROUP BY 1,2,3,4 ORDER BY views DESC;

SELECT asn, reader_kind, sec_fetch_mode, sec_fetch_dest, accepts_html,
       has_accept_language, COUNT(*) AS views,
       COUNT(DISTINCT daily_client_id) AS daily_clients,
       COUNT(DISTINCT path) AS paths, MIN(observed_at) AS first_seen,
       MAX(observed_at) AS last_seen
FROM page_observations
WHERE observed_at >= '2026-09-04' AND observed_at < '2026-09-06'
  AND asn=396982 AND is_owner=0
GROUP BY 1,2,3,4,5,6;

SELECT reader_kind, asn, COUNT(*) AS rows
FROM page_observations
WHERE observed_at >= '2026-09-04 18:30:09' AND observed_at < '2026-09-06'
  AND asn IN (29802,64267,150436,59711,25820,213230,62610,139341,7941)
GROUP BY 1,2;
