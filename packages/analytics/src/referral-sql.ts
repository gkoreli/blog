import { referralRules, type ReferralPolicy } from './referral-policy.js';

/**
 * D1 adapter for host-suffix-v1. One JSON parameter for the whole policy;
 * materialize rules and distinct hosts, never one OR/binding per list entry.
 * Scope to the report's time window; public selection/owner filters stay outside.
 */
export function referralAbusePredicate(policy: ReferralPolicy, start: string, end: string): { sql: string; values: string[] } {
  // Compact transport only: [host, exactHost, excluded, priority]. Domain rules
  // and their evidence remain in the archived policy, not this SQL encoding.
  const rules = referralRules(policy).map(({ host, scope, action, priority }) =>
    [host, Number(scope === 'host'), Number(action === 'exclude'), priority]);
  return {
    sql: `COALESCE(referrer_host IN (
      WITH RECURSIVE
      rules AS MATERIALIZED (
        SELECT json_extract(value, '$[0]') AS host, json_extract(value, '$[1]') AS exact_host,
               json_extract(value, '$[2]') AS excluded, json_extract(value, '$[3]') AS priority
        FROM json_each(?)
      ),
      hosts AS MATERIALIZED (
        SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
        FROM page_observations
        WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253
          AND observed_at >= ? AND observed_at < ?
      ),
      suffixes(original, candidate, depth) AS (
        SELECT original, normalized, 0 FROM hosts
        UNION ALL
        SELECT original, substr(candidate, instr(candidate, '.') + 1), depth + 1
        FROM suffixes WHERE instr(candidate, '.') > 0
      ),
      matches AS (
        SELECT original, excluded,
          row_number() OVER (PARTITION BY original ORDER BY priority DESC, length(rules.host) DESC,
            exact_host DESC) AS precedence
        FROM suffixes JOIN rules ON rules.host = suffixes.candidate
        WHERE exact_host = 0 OR depth = 0
      )
      SELECT original FROM matches WHERE precedence = 1 AND excluded = 1
    ), 0)`,
    values: [JSON.stringify(rules), start, end],
  };
}
