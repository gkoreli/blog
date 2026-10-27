WITH requested AS MATERIALIZED (
  SELECT value AS id FROM json_each(?)
), observed AS MATERIALIZED (
  SELECT r.id, COUNT(*) AS stored, SUM(o.is_owner) AS owner_excluded,
    MIN(o.collection_version) AS min_collection, MAX(o.collection_version) AS max_collection,
    json_group_array(json_object('kind',o.reader_kind,'ownerExcluded',o.is_owner)) AS observations
  FROM requested r JOIN page_observations o INDEXED BY idx_page_observations_public_path_time
    ON o.path='/analytics-check/' || r.id
  WHERE o.is_owner IN (0,1) AND o.observed_at >= ? AND o.observed_at < ?
  GROUP BY r.id
)
SELECT r.id, t.id IS NOT NULL AS trialRecorded, t.condition, t.operator AS plannedOperator,
  t.page_responses AS responsesPrepared, t.script AS scriptReports,
  t.attempt AS beaconAttemptReports, t.queued AS queuedReports,
  t.not_queued AS notQueuedReports, t.threw AS thrownReports, t.beacon AS beaconReceipts,
  COALESCE(o.stored,0) AS storedObservations,
  COALESCE(o.owner_excluded,0) AS ownerExcludedObservations,
  o.min_collection AS minCollectionVersion, o.max_collection AS maxCollectionVersion,
  COALESCE(o.observations,'[]') AS observations
FROM requested r LEFT JOIN analytics_calibration_trials t ON t.id=r.id
LEFT JOIN observed o ON o.id=r.id ORDER BY r.id;
