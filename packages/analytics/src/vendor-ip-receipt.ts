import type { VendorIpEvidence } from './vendor-ip.js';

function cacheReceipt(cache: VendorIpEvidence['checks'][number]['cache']) {
  if (cache === null) return { status: 'not-applicable' as const };
  return { status: 'recorded' as const, access: cache.access,
    policy: cache.policy === null ? { status: 'unavailable' as const } : {
      status: 'recorded' as const, assessedAt: cache.policy.assessedAt, lifetimeSource: cache.policy.lifetimeSource,
      blockerCount: cache.policy.blockers.length, blockerNames: cache.policy.blockers.join(',') || 'none',
    } };
}

/** A snapshot of stored method facts, not a new address or identity verdict.
 * Named sources and scalar absence states survive the observed null/array export loss.
 * sourceNames preserves evaluation order, including the request-budget boundary.
 */
export function vendorIpReceipt(evidence: VendorIpEvidence | undefined) {
  if (evidence === undefined) return { status: 'not-recorded' as const };
  return {
    status: 'recorded' as const,
    profile: evidence.profile,
    method: evidence.method,
    source: evidence.source,
    checkedAt: evidence.checkedAt,
    addressState: evidence.address.state,
    addressHeader: evidence.address.header ?? 'none',
    addressFamily: evidence.address.family ?? 'none',
    declarationCount: evidence.declarationCount,
    configuredDeclarationCount: evidence.configuredDeclarationCount,
    unmappedDeclarationCount: evidence.unmappedDeclarationCount,
    checkCount: evidence.checks.length,
    sourceNames: evidence.checks.map(check => check.source).join(',') || 'none',
    summary: {
      listed: evidence.summary.listed,
      notListed: evidence.summary.notListed,
      unavailable: evidence.summary.unavailable,
      notAssessed: evidence.summary.notAssessed,
    },
    checks: evidence.checks.length === 0 ? { status: 'none' as const } : {
      status: 'recorded' as const,
      sources: Object.fromEntries(evidence.checks.map(check => [check.source, {
        outcome: check.outcome,
        reason: check.reason ?? 'none',
        // Historical callers keep their original projection; do not manufacture a policy.
        ...('cache' in check ? { cache: cacheReceipt(check.cache) } : {}),
        snapshot: check.snapshot === null ? { status: 'unavailable' as const } : {
          status: 'recorded' as const,
          sha256: check.snapshot.sha256,
          fetchedAt: check.snapshot.fetchedAt,
          validatedAt: check.snapshot.validatedAt,
          freshUntil: check.snapshot.freshUntil,
          publisherVersionStatus: check.snapshot.publisherVersion === null ? 'unavailable' as const : 'recorded' as const,
          publisherVersion: check.snapshot.publisherVersion ?? 'none',
          prefixCount: check.snapshot.prefixCount,
        },
      }])),
    },
  };
}
