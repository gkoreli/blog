/** Closed processing facts about a public feed, never reader identifiers or raw headers.
 * An empty blockers list means positive reuse at validation time, not current freshness.
 * The enclosing vendor-IP profile versions this shape. Historical profiles lack it.
 */
export const VENDOR_CACHE_ACCESS = ['fetched', 'revalidated', 'memory', 'coalesced', 'cooldown', 'failed'] as const;
export const VENDOR_CACHE_BLOCKERS = ['no-store', 'private', 'no-cache', 'invalid-lifetime', 'zero-lifetime', 'invalid-age', 'age-exhausted'] as const;
export interface VendorCachePolicy {
  assessedAt: string;
  lifetimeSource: 'max-age' | 'expires' | 'default';
  blockers: (typeof VENDOR_CACHE_BLOCKERS[number])[];
}
export interface VendorCacheEvidence {
  access: typeof VENDOR_CACHE_ACCESS[number];
  /** Last accepted response in this isolate's current attempt context; null after failure.
   * Cooldown context does not supply a membership result or retain a forbidden body.
   */
  policy: VendorCachePolicy | null;
}

export function copyVendorCachePolicy(policy: VendorCachePolicy | null): VendorCachePolicy | null {
  return policy === null ? null : { ...policy, blockers: [...policy.blockers] };
}

/** Stored-field coherence only. Does not recover publisher headers or rerun membership. */
export function vendorCacheCheckSql(): string {
  const c = (key: string) => `json_extract(check_row.value, '$.${key}')`;
  const t = (key: string) => `json_type(check_row.value, '$.${key}')`;
  const p = (key: string) => c(`cache.policy.${key}`);
  const pt = (key: string) => t(`cache.policy.${key}`);
  const has = (value: string) => `EXISTS (SELECT 1 FROM json_each(check_row.value, '$.cache.policy.blockers') AS blocker WHERE blocker.value = '${value}')`;
  const policy = `${t('cache.policy')} = 'object'
    AND ${pt('assessedAt')} = 'text' AND strftime('%Y-%m-%dT%H:%M:%fZ', ${p('assessedAt')}, '+0 days') = ${p('assessedAt')}
    AND ${p('assessedAt')} <= json_extract(vendor_ip_evidence, '$.checkedAt')
    AND ${p('lifetimeSource')} IN ('max-age','expires','default')
    AND ${pt('blockers')} = 'array' AND json_array_length(check_row.value, '$.cache.policy.blockers') <= 7
    AND NOT EXISTS (SELECT 1 FROM json_each(check_row.value, '$.cache.policy.blockers') AS blocker
      WHERE blocker.type <> 'text' OR blocker.value NOT IN (${VENDOR_CACHE_BLOCKERS.map(b => `'${b}'`).join(',')}))
    AND NOT EXISTS (SELECT 1 FROM json_each(check_row.value, '$.cache.policy.blockers') AS blocker GROUP BY blocker.value HAVING COUNT(*) > 1)
    AND NOT (${has('invalid-age')} AND ${has('age-exhausted')})
    AND NOT (${has('invalid-lifetime')} AND (${has('zero-lifetime')} OR ${has('age-exhausted')}))
    AND NOT (${has('zero-lifetime')} AND ${has('age-exhausted')})
    AND (${p('lifetimeSource')} <> 'default' OR NOT (${has('invalid-lifetime')} OR ${has('zero-lifetime')}))`;
  return `CASE
    WHEN json_extract(vendor_ip_evidence, '$.address.state') <> 'usable' OR check_row.key >= 4 THEN ${t('cache')} = 'null'
    ELSE ${t('cache')} = 'object' AND CASE
      WHEN ${c('outcome')} IN ('listed','not-listed') THEN ${c('cache.access')} IN ('fetched','revalidated','memory','coalesced')
        AND (${policy}) AND ${p('assessedAt')} = ${c('snapshot.validatedAt')}
        AND ((${c('snapshot.freshUntil')} > ${c('snapshot.validatedAt')} AND json_array_length(check_row.value, '$.cache.policy.blockers') = 0)
          OR (${c('snapshot.freshUntil')} = ${c('snapshot.validatedAt')} AND json_array_length(check_row.value, '$.cache.policy.blockers') > 0))
        AND (${c('cache.access')} NOT IN ('fetched','revalidated') OR ${p('assessedAt')} = json_extract(vendor_ip_evidence, '$.checkedAt'))
        AND (${c('cache.access')} <> 'memory' OR ${c('snapshot.freshUntil')} > json_extract(vendor_ip_evidence, '$.checkedAt'))
      WHEN ${c('reason')} = 'refresh-cooldown' THEN ${c('cache.access')} = 'cooldown' AND (${t('cache.policy')} = 'null' OR (${policy}))
      ELSE ${c('cache.access')} IN ('failed','coalesced') AND ${t('cache.policy')} = 'null'
    END END`;
}
