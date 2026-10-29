-- Offline prototype: cap physical deletes per statement. Expiry is inclusive.
DELETE FROM replay_claims
WHERE scope_key IN (
  SELECT scope_key FROM replay_claims
  WHERE retain_until < ?1
  ORDER BY retain_until, scope_key
  LIMIT ?2
);
