import { VENDOR_CACHE_ACCESS, VENDOR_CACHE_BLOCKERS } from './vendor-ip-cache-evidence.js';
import { VENDOR_CACHE_ACCESS_FIELDS, VENDOR_CACHE_BLOCKER_FIELDS, emptyVendorCacheSummary, consistentVendorCacheSummary, type VendorCacheSummary } from './vendor-cache-report-contract.js';

/** Reuse the membership validator, then group identical stored facts. A historical
 * profile cannot acquire a cache assessment merely by carrying similarly named keys.
 * The bounded per-record source/blocker expansion is evaluated only for the new profile.
 */
export function vendorCacheReportCtes(): string {
  const access = VENDOR_CACHE_ACCESS.map((v,i) => `WHEN '${v}' THEN ${1 << i}`).join(' ');
  const blockers = VENDOR_CACHE_BLOCKERS.map((v,i) => `WHEN '${v}' THEN ${1 << i}`).join(' ');
  const union = VENDOR_CACHE_BLOCKERS.map((_,i) => `COALESCE(MAX(blocker_mask & ${1 << i}),0)`).join(' + ');
  return `vendor_cache_inputs AS MATERIALIZED (
    SELECT vendor_ip_evidence,network_state,COUNT(*) AS cache_views FROM vendor_network_facts GROUP BY vendor_ip_evidence,network_state
  ), vendor_cache_records AS MATERIALIZED (
    SELECT cache_views,
      CASE WHEN network_state = 'unrecognized' THEN 'unrecognized'
        WHEN network_state = 'recognized' AND json_extract(vendor_ip_evidence,'$.profile') IN ('2026-10-30.1','2026-10-31.1') THEN 'recognized'
        ELSE 'not-recorded' END AS cache_state,
      CASE WHEN network_state = 'recognized' AND json_extract(vendor_ip_evidence,'$.profile') IN ('2026-10-30.1','2026-10-31.1') THEN
        CASE WHEN json_array_length(vendor_ip_evidence,'$.checks') = 0 THEN 0 ELSE 1 END ELSE NULL END AS applicable,
      CASE WHEN network_state = 'recognized' AND json_extract(vendor_ip_evidence,'$.profile') IN ('2026-10-30.1','2026-10-31.1') THEN (
        WITH cache_checks AS MATERIALIZED (
          SELECT CASE json_extract(value,'$.cache.access') ${access} ELSE 0 END AS access_mask,
            CASE WHEN json_type(value,'$.cache.policy') = 'object' THEN
              CASE WHEN json_array_length(value,'$.cache.policy.blockers') = 0 THEN 1 ELSE 2 END ELSE 4 END AS policy_mask,
            (SELECT COALESCE(SUM(CASE blocker.value ${blockers} ELSE 0 END),0) FROM json_each(check_row.value,'$.cache.policy.blockers') AS blocker) AS blocker_mask
          FROM json_each(vendor_ip_evidence,'$.checks') AS check_row
          WHERE check_row.key < 4 AND json_type(check_row.value,'$.cache') = 'object'
        ) SELECT json_object('access',COALESCE(SUM(DISTINCT access_mask),0),'policy',COALESCE(SUM(DISTINCT policy_mask),0),'blockers',${union}) FROM cache_checks
      ) ELSE NULL END AS cache_masks
    FROM vendor_cache_inputs
  )`;
}
export function vendorCacheReportProjectionSql(): string {
  return `SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
    SELECT json_object('state',cache_state,'applicable',applicable,'access',json_extract(cache_masks,'$.access'),
      'policy',json_extract(cache_masks,'$.policy'),'blockers',json_extract(cache_masks,'$.blockers'),'views',SUM(cache_views)) AS row_json
    FROM vendor_cache_records GROUP BY cache_state,applicable,cache_masks ORDER BY cache_state,applicable,cache_masks
  )`;
}
const bitCount = (value: number) => value.toString(2).split('1').length - 1;
const integer = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
/** Reject missing groups and contradictory masks before publishing plausible counts. */
export function decodeVendorCacheRows(rows: readonly Record<string, unknown>[], total: number): VendorCacheSummary {
  const summary = emptyVendorCacheSummary(), seen = new Set<string>();
  for (const row of rows) {
    const {state,applicable,access,policy,blockers,views} = row;
    if (Object.keys(row).length !== 6 || !['state','applicable','access','policy','blockers','views'].every(k => Object.hasOwn(row,k))
      || !integer(views,Number.MAX_SAFE_INTEGER) || views < 1) throw new Error('Malformed vendor cache cohort');
    const key = JSON.stringify([state,applicable,access,policy,blockers]);
    if (seen.has(key)) throw new Error('Duplicate vendor cache cohort');
    seen.add(key);
    if (state !== 'recognized') {
      if ((state !== 'not-recorded' && state !== 'unrecognized') || applicable !== null || access !== null || policy !== null || blockers !== null) throw new Error('Unassessed cache cohort carried claims');
      summary.records[state === 'not-recorded' ? 'notRecordedViews' : 'unrecognizedViews'] += views;
      continue;
    }
    if (!integer(applicable,1) || !integer(access,63) || bitCount(access) > 4 || !integer(policy,7) || !integer(blockers,127)
      || (applicable === 0 && (access !== 0 || policy !== 0 || blockers !== 0))
      || (access === 0 ? policy !== 0 || blockers !== 0 : policy === 0)
      || Boolean(policy & 2) !== (blockers > 0)) throw new Error('Inconsistent vendor cache masks');
    // Successful accepted contexts cannot be produced by a failed access alone;
    // a coalesced or cooldown result may carry either known policy or no policy.
    if (((access & 7) && !(policy & 3)) || ((access & 4) && !(policy & 1)) || ((access & 32) && !(policy & 4))
      || ((policy & 4) && !(access & 56)) || ((policy & 2) && !(access & 27))
      || (access === 32 && policy !== 4) || (access === 4 && policy !== 1)) throw new Error('Inconsistent cache access policy');
    const r = summary.records;
    r.recognizedViews += views;
    if (!applicable) r.noApplicableViews += views;
    else if (!access) r.guardedOnlyViews += views;
    else r.withAccessViews += views;
    if (policy & 3) r.policyKnownViews += views;
    if (policy & 4) r.policyUnknownViews += views;
    if ((policy & 3) && (policy & 4)) r.partialPolicyViews += views;
    if (policy & 1) summary.byPolicy.positiveViews += views;
    if (policy & 2) summary.byPolicy.blockedViews += views;
    if ((policy & 3) === 3) summary.byPolicy.mixedViews += views;
    for (const [i,field] of VENDOR_CACHE_ACCESS_FIELDS.entries()) if (access & 1 << i) summary.byAccess[field] += views;
    for (const [i,field] of VENDOR_CACHE_BLOCKER_FIELDS.entries()) if (blockers & 1 << i) summary.byBlocker[field] += views;
  }
  if (!consistentVendorCacheSummary(summary,total)) throw new Error('Inconsistent vendor cache summary');
  return summary;
}
