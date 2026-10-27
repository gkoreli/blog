WITH selected AS MATERIALIZED (
  SELECT * FROM analytics_calibration_trials
  WHERE id IN (SELECT value FROM json_each(?))
), observed AS MATERIALIZED (
  SELECT t.id, COUNT(*) AS stored, SUM(o.is_owner) AS owner_excluded,
    MIN(o.collection_version) AS min_collection, MAX(o.collection_version) AS max_collection,
    json_group_array(json_object('kind',o.reader_kind,'ownerExcluded',o.is_owner)) AS kinds
  FROM selected t JOIN page_observations o ON o.path='/analytics-check/' || t.id
  WHERE o.observed_at >= ? AND o.observed_at < ?
  GROUP BY t.id
)
SELECT t.condition, t.operator AS plannedOperator, COUNT(*) AS trials,
  SUM(t.page_responses) AS responsesPrepared, SUM(t.script) AS scriptReports,
  SUM(t.attempt) AS beaconAttemptReports, SUM(t.queued) AS queuedReports,
  SUM(t.not_queued) AS notQueuedReports, SUM(t.threw) AS thrownReports,
  SUM(t.beacon) AS beaconReceipts, SUM(COALESCE(o.stored,0)) AS storedObservations,
  SUM(COALESCE(o.owner_excluded,0)) AS ownerExcludedObservations,
  MIN(o.min_collection) AS minCollectionVersion, MAX(o.max_collection) AS maxCollectionVersion,
  json_group_array(json(COALESCE(o.kinds,'[]'))) AS observedKinds
FROM selected t LEFT JOIN observed o ON o.id=t.id
GROUP BY t.condition,t.operator ORDER BY t.condition,t.operator;
