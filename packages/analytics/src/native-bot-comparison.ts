/** Optional offline interpretation of reviewed registry metadata. This is not
 * identity verification, a managed-verifier oracle, or a collection dependency.
 * Source review: analytics-retrospective research 77, 2026-10-29.
 */
export const REVIEWED_NATIVE_BOTS = [
  { declaration: 'ExaSearchBot', access: 'direct', behavior: 'search',
    source: 'https://radar.cloudflare.com/bots/directory/exasearchbot', signatureDirectoryShown: true },
  { declaration: 'AhrefsBot', access: 'direct', behavior: 'seo',
    source: 'https://radar.cloudflare.com/bots/directory/ahrefsbot', signatureDirectoryShown: false },
  { declaration: 'AhrefsSiteAudit', access: 'direct', behavior: 'seo',
    source: 'https://radar.cloudflare.com/bots/directory/ahrefssiteaudit', signatureDirectoryShown: false },
] as const;

export type NativeComparisonBasis = 'no-declarations' | 'registry-unreviewed' | 'registry-partial'
  | 'test-injected' | 'provenance-unestablished' | 'native-unavailable' | 'native-unrecognized'
  | 'direct-native-true-review' | 'direct-field-not-crypto-oracle';
export interface NativeBotComparison {
  profile: '2026-10-29.1';
  reviewedOn: '2026-10-29';
  scope: 'reviewed-registry-contract';
  nameBasis: 'supplied-declarations-only';
  declarations: number;
  reviewedDirectDeclarations: number;
  unreviewedDeclarations: number;
  nativeSignedAgent: 'true' | 'false' | 'unavailable' | 'unrecognized';
  declaredProvenance: 'request-cf' | 'test-injected' | 'unestablished';
  basis: NativeComparisonBasis;
  managedCryptographicAgreement: null;
  requestOperatorAuthenticated: false;
  humanTriggerEstablished: false;
}

/** Exact declaration lookup, not UA substring matching. A caller's provenance
 * claim is preserved explicitly; this function cannot attest its transport.
 * Registry omission is unreviewed, not evidence of an unregistered/spoofed bot.
 */
export function assessNativeBotComparison(
  declarations: readonly string[], nativeSignedAgent: unknown,
  provenance: 'request-cf' | 'test-injected' | 'unestablished',
): NativeBotComparison {
  const unique = new Set(declarations);
  const mapped = REVIEWED_NATIVE_BOTS.filter(bot => unique.has(bot.declaration)).length;
  const state = nativeSignedAgent === true ? 'true' : nativeSignedAgent === false ? 'false'
    : nativeSignedAgent === null || nativeSignedAgent === undefined ? 'unavailable' : 'unrecognized';
  const declaredProvenance = provenance === 'request-cf' || provenance === 'test-injected' ? provenance : 'unestablished';
  const basis: NativeComparisonBasis = unique.size === 0 ? 'no-declarations'
    : mapped === 0 ? 'registry-unreviewed' : mapped < unique.size ? 'registry-partial'
      : declaredProvenance === 'test-injected' ? 'test-injected'
        : declaredProvenance !== 'request-cf' ? 'provenance-unestablished'
          : state === 'unavailable' ? 'native-unavailable'
            : state === 'unrecognized' ? 'native-unrecognized'
              : state === 'true' ? 'direct-native-true-review' : 'direct-field-not-crypto-oracle';
  return {
    profile: '2026-10-29.1', reviewedOn: '2026-10-29', scope: 'reviewed-registry-contract',
    nameBasis: 'supplied-declarations-only', declarations: unique.size,
    reviewedDirectDeclarations: mapped, unreviewedDeclarations: unique.size - mapped,
    nativeSignedAgent: state, declaredProvenance, basis,
    managedCryptographicAgreement: null, requestOperatorAuthenticated: false, humanTriggerEstablished: false,
  };
}
