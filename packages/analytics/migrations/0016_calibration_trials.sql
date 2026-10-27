-- Explicitly activated owner-excluded experiment counters, not ordinary readership.
CREATE TABLE analytics_calibration_trials (
  id TEXT PRIMARY KEY CHECK(length(id) = 36),
  condition TEXT NOT NULL CHECK(condition IN ('normal','block-script','block-beacon','http-client','javascript-off')),
  operator TEXT NOT NULL CHECK(operator IN ('agent-browser','controlled-curl','human-reported')),
  expires_at TEXT NOT NULL,
  page_responses INTEGER NOT NULL DEFAULT 0 CHECK(page_responses BETWEEN 0 AND 4),
  script INTEGER NOT NULL DEFAULT 0 CHECK(script BETWEEN 0 AND 8),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK(attempt BETWEEN 0 AND 8),
  queued INTEGER NOT NULL DEFAULT 0 CHECK(queued BETWEEN 0 AND 8),
  not_queued INTEGER NOT NULL DEFAULT 0 CHECK(not_queued BETWEEN 0 AND 8),
  threw INTEGER NOT NULL DEFAULT 0 CHECK(threw BETWEEN 0 AND 8),
  beacon INTEGER NOT NULL DEFAULT 0 CHECK(beacon BETWEEN 0 AND 8)
);
CREATE INDEX idx_calibration_expiry ON analytics_calibration_trials(expires_at);
