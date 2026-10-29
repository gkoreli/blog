-- Offline prototype only. No production migration or collector caller.
-- ?1: ephemeral experiment scope; ?2: fresh per-attempt claim reference;
-- ?3: current whole second; ?4: inclusive verifier acceptance horizon.
INSERT INTO replay_claims(scope_key, first_claim, first_seen, retain_until)
VALUES(?1, ?2, ?3, ?4)
ON CONFLICT(scope_key) DO UPDATE SET
  first_claim = CASE WHEN replay_claims.retain_until < excluded.first_seen
    THEN excluded.first_claim ELSE replay_claims.first_claim END,
  first_seen = CASE WHEN replay_claims.retain_until < excluded.first_seen
    THEN excluded.first_seen ELSE replay_claims.first_seen END,
  retain_until = MAX(replay_claims.retain_until, excluded.retain_until)
WHERE replay_claims.retain_until < excluded.first_seen
   OR excluded.retain_until > replay_claims.retain_until
RETURNING first_claim = ?2 AS first_claimed;
