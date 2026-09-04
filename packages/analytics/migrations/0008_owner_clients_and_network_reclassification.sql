-- ADR-0016.4. The classification boundary is this migration, not a calendar
-- date: every row already in the table was written by the classifier that
-- lacked these networks and the archiver rule, and every row after it is
-- written by the corrected code. Bounding by a fixed date would leave the rows
-- between the ADR and the deploy wrong, which is what a first pass did.
--
-- This migration creates the owner marker table, then rewrites only browser and
-- legacy-browser rows on hosting AS29802, AS64267, AS150436, AS59711, AS25820,
-- AS213230, AS62610 or AS139341, or Internet Archive AS7941. Every other reader
-- kind and ASN remains unchanged, and nothing is deleted.

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
WHERE asn IN (29802, 64267, 150436, 59711, 25820, 213230, 62610, 139341)
  AND reader_kind IN ('browser', 'legacy-browser');

UPDATE page_observations
SET reader_kind = 'preview-or-feed', reader_reason = 'archiver-asn:7941'
WHERE asn = 7941
  AND reader_kind IN ('browser', 'legacy-browser');
