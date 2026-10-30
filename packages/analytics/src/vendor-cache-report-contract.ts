/** Event counts for stored public-feed processing facts, never people or vendor identity. */
export const VENDOR_CACHE_ACCESS_FIELDS = ['fetched', 'revalidated', 'memory', 'coalesced', 'cooldown', 'failed'] as const;
export const VENDOR_CACHE_BLOCKER_FIELDS = ['noStore', 'private', 'noCache', 'invalidLifetime', 'zeroLifetime', 'invalidAge', 'ageExhausted'] as const;
const recordFields = ['recognizedViews', 'notRecordedViews', 'unrecognizedViews', 'noApplicableViews', 'guardedOnlyViews', 'withAccessViews', 'policyKnownViews', 'policyUnknownViews', 'partialPolicyViews'] as const;
export interface VendorCacheSummary {
  records: Record<typeof recordFields[number], number>;
  /** Overlap across sources; a cooldown is not an upstream fetch. */
  byAccess: Record<typeof VENDOR_CACHE_ACCESS_FIELDS[number], number>;
  /** Last accepted validation context, including on a later cooldown. Not current freshness. */
  byPolicy: { positiveViews: number; blockedViews: number; mixedViews: number };
  byBlocker: Record<typeof VENDOR_CACHE_BLOCKER_FIELDS[number], number>;
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
function counts<K extends string>(value: unknown, keys: readonly K[], total: number): value is Record<K, number> {
  return object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key) && typeof value[key] === 'number'
    && Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= total);
}
/** Necessary marginal/partition consistency, not authentication of the stored inputs. */
export function consistentVendorCacheSummary(value: unknown, total: number): value is VendorCacheSummary {
  if (!Number.isSafeInteger(total) || total < 0 || !object(value) || Object.keys(value).length !== 4
    || !counts(value.records, recordFields, total) || !counts(value.byAccess, VENDOR_CACHE_ACCESS_FIELDS, total)
    || !counts(value.byPolicy, ['positiveViews','blockedViews','mixedViews'] as const, total)
    || !counts(value.byBlocker, VENDOR_CACHE_BLOCKER_FIELDS, total)) return false;
  const r = value.records, p = value.byPolicy, access = Object.values(value.byAccess), blockers = Object.values(value.byBlocker);
  const sum = (values: readonly number[]) => values.reduce((n,value) => n + BigInt(value),0n);
  return sum([r.recognizedViews,r.notRecordedViews,r.unrecognizedViews]) === BigInt(total)
    && sum([r.noApplicableViews,r.guardedOnlyViews,r.withAccessViews]) === BigInt(r.recognizedViews)
    && r.policyKnownViews <= r.withAccessViews && r.policyUnknownViews <= r.withAccessViews
    && r.partialPolicyViews <= Math.min(r.policyKnownViews,r.policyUnknownViews)
    && sum([r.policyKnownViews,r.policyUnknownViews]) - BigInt(r.partialPolicyViews) === BigInt(r.withAccessViews)
    && access.every(n => n <= r.withAccessViews) && sum(access) >= BigInt(r.withAccessViews)
    && sum(access) <= 4n * BigInt(r.withAccessViews)
    && p.positiveViews <= r.policyKnownViews && p.blockedViews <= r.policyKnownViews
    && p.mixedViews <= Math.min(p.positiveViews,p.blockedViews)
    && sum([p.positiveViews,p.blockedViews]) - BigInt(p.mixedViews) === BigInt(r.policyKnownViews)
    && blockers.every(n => n <= p.blockedViews) && sum(blockers) >= BigInt(p.blockedViews);
}
export function emptyVendorCacheSummary(): VendorCacheSummary {
  return { records: { recognizedViews:0,notRecordedViews:0,unrecognizedViews:0,noApplicableViews:0,guardedOnlyViews:0,withAccessViews:0,policyKnownViews:0,policyUnknownViews:0,partialPolicyViews:0 },
    byAccess:{fetched:0,revalidated:0,memory:0,coalesced:0,cooldown:0,failed:0},byPolicy:{positiveViews:0,blockedViews:0,mixedViews:0},
    byBlocker:{noStore:0,private:0,noCache:0,invalidLifetime:0,zeroLifetime:0,invalidAge:0,ageExhausted:0} };
}
