-- ADR-0016.4 sets the 2026-09-03 owner-exclusion and network-classification
-- boundary. This migration creates the owner marker table, then rewrites only
-- browser and legacy-browser rows observed before 2026-09-04 00:00:00 UTC on
-- hosting AS29802, AS64267, AS150436, AS59711, or AS25820, or Internet Archive
-- AS7941. Every other date, reader kind, and ASN remains unchanged.

CREATE TABLE owner_clients (
  daily_client_id TEXT PRIMARY KEY CHECK (
    length(daily_client_id) = 32
    AND daily_client_id NOT GLOB '*[^0-9a-f]*'
  ),
  utc_date TEXT NOT NULL,
  marked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

UPDATE page_observations
SET reader_kind = 'cloud-browser', reader_reason = 'hosting-asn:' || asn
WHERE asn IN (29802, 64267, 150436, 59711, 25820)
  AND observed_at < '2026-09-04 00:00:00'
  AND reader_kind IN ('browser', 'legacy-browser');

UPDATE page_observations
SET reader_kind = 'preview-or-feed', reader_reason = 'archiver-asn:7941'
WHERE asn = 7941
  AND observed_at < '2026-09-04 00:00:00'
  AND reader_kind IN ('browser', 'legacy-browser');
