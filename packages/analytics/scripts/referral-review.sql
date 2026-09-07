-- Private review only (ADR-0016.5). SELECTs, no writes and no raw client IDs/IPs.
-- Includes suspected abuse and unreviewed names; never serve this as a public API.
-- Window: current UTC day plus the preceding 29 days. Save the capture timestamp.
SELECT date(observed_at) AS utc_day, referrer_host,
       reader_kind, COUNT(*) AS observations,
       COUNT(DISTINCT daily_client_id) AS daily_clients
FROM page_observations
WHERE observed_at >= datetime('now', 'start of day', '-29 days')
  AND observed_at < datetime('now', 'start of day', '+1 day')
  AND is_owner = 0
  AND NOT EXISTS (SELECT 1 FROM owner_clients
                  WHERE owner_clients.daily_client_id = page_observations.daily_client_id)
  AND referrer_host IS NOT NULL
GROUP BY date(observed_at), referrer_host, reader_kind
ORDER BY utc_day, observations DESC, referrer_host, reader_kind;

SELECT referrer_host, path, reader_kind, COUNT(*) AS observations,
       MIN(observed_at) AS first_observed_at, MAX(observed_at) AS last_observed_at
FROM page_observations
WHERE observed_at >= datetime('now', 'start of day', '-29 days')
  AND observed_at < datetime('now', 'start of day', '+1 day')
  AND is_owner = 0
  AND NOT EXISTS (SELECT 1 FROM owner_clients
                  WHERE owner_clients.daily_client_id = page_observations.daily_client_id)
  AND referrer_host IS NOT NULL
GROUP BY referrer_host, path, reader_kind
ORDER BY observations DESC, referrer_host, path, reader_kind;
