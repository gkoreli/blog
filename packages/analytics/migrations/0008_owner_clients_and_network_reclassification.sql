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
--
-- Nothing is lost either. Migrations 0006 and 0007 rewrote reader_kind in place
-- and the prior verdict was recoverable only by reading their SQL, never per
-- row. ADR-0016.3 tenet 4 asks for more than that, so this migration records
-- every rewrite in reader_kind_revisions first: one row per observation, with
-- the value before and after and the migration that changed it. Future
-- reclassifications append to the same table.

CREATE TABLE owner_clients (
  daily_client_id TEXT PRIMARY KEY CHECK (
    length(daily_client_id) = 32
    AND daily_client_id NOT GLOB '*[^0-9a-f]*'
  ),
  utc_date TEXT NOT NULL,
  marked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reader_kind_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER NOT NULL REFERENCES page_observations(id),
  migration TEXT NOT NULL,
  from_kind TEXT,
  from_reason TEXT,
  to_kind TEXT NOT NULL,
  to_reason TEXT NOT NULL,
  revised_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reader_kind_revisions_observation
  ON reader_kind_revisions(observation_id);

INSERT INTO reader_kind_revisions
  (observation_id, migration, from_kind, from_reason, to_kind, to_reason)
SELECT
  id,
  '0008_owner_clients_and_network_reclassification',
  reader_kind,
  reader_reason,
  'cloud-browser',
  'hosting-asn:' || asn
FROM page_observations
WHERE asn IN (29802, 64267, 150436, 59711, 25820, 213230, 62610, 139341)
  AND reader_kind IN ('browser', 'legacy-browser');

UPDATE page_observations
SET reader_kind = 'cloud-browser', reader_reason = 'hosting-asn:' || asn
WHERE asn IN (29802, 64267, 150436, 59711, 25820, 213230, 62610, 139341)
  AND reader_kind IN ('browser', 'legacy-browser');

INSERT INTO reader_kind_revisions
  (observation_id, migration, from_kind, from_reason, to_kind, to_reason)
SELECT
  id,
  '0008_owner_clients_and_network_reclassification',
  reader_kind,
  reader_reason,
  'preview-or-feed',
  'archiver-asn:7941'
FROM page_observations
WHERE asn = 7941
  AND reader_kind IN ('browser', 'legacy-browser');

UPDATE page_observations
SET reader_kind = 'preview-or-feed', reader_reason = 'archiver-asn:7941'
WHERE asn = 7941
  AND reader_kind IN ('browser', 'legacy-browser');
