import { isSignatureBasis } from './signature-basis.js';
import type { StatsResponse, VerificationSummary } from './contracts.js';
/** Closed derived states for public report summaries. These validate the
 * fields used here, not the entire stored envelope or a historical proof.
 */
export function nativeBooleanStateSql(): string {
  return `CASE
    WHEN json_type(signature_evidence, '$.native') IS NULL THEN 'not-recorded'
    WHEN COALESCE(json_extract(signature_evidence, '$.version'), '') NOT IN ('2026-10-27.1','2026-10-27.3','2026-10-27.4','2026-10-27.5')
      OR COALESCE(json_extract(signature_evidence, '$.source'), '') NOT IN ('local-webbotauth','test-injected')
      OR json_type(signature_evidence, '$.native') IS NOT 'object'
      OR COALESCE(json_type(signature_evidence, '$.native.verifiedBot'), '') NOT IN ('true','false','null')
      OR COALESCE(json_type(signature_evidence, '$.native.signedAgent'), '') NOT IN ('true','false','null') THEN 'unrecognized'
    WHEN json_type(signature_evidence, '$.native.verifiedBot') IN ('true','false') OR json_type(signature_evidence, '$.native.signedAgent') IN ('true','false') THEN 'available'
    ELSE 'unavailable' END`;
}

/** Uses the already assessed local_state and coverage_valid columns. Historical
 * method profiles keep their original fields; no current registry replay.
 */
export function vendorSignatureStateSql(): string {
  const v = (key: string) => `json_extract(signature_evidence, '$.vendor.${key}')`;
  const t = (key: string) => `json_type(signature_evidence, '$.vendor.${key}')`;
  const integer = (key: string) => `${t(key)} = 'integer' AND ${v(key)} BETWEEN 0 AND 9007199254740991`;
  const positive = `${v('status')} IN ('matching-origin','different-origin')`;
  return `CASE
    WHEN json_type(signature_evidence, '$.vendor') IS NULL THEN 'not-recorded'
    WHEN NOT COALESCE((local_state IN ('verified','unverified','absent','test-injected')
      AND ${v('profile')} IN ('2026-10-27.1','2026-10-28.1','2026-10-29.1') AND ${v('method')} = 'documented-signing-origin'
      AND ${integer('documentedDeclarationCount')} AND ${integer('unmappedDeclarationCount')}
      AND ${t('userAgentCovered')} IN ('true','false','null')
      AND (${v('status')} = 'test-injected') = (local_state = 'test-injected')
      AND (${v('status')} NOT IN ('no-declaration','not-configured') OR ${v('documentedDeclarationCount')} = 0)
      AND (${v('status')} <> 'no-declaration' OR ${v('unmappedDeclarationCount')} = 0)
      AND (${v('status')} <> 'not-configured' OR ${v('unmappedDeclarationCount')} > 0)
      AND (${v('status')} <> 'not-verified' OR (local_state IN ('unverified','absent') AND ${v('documentedDeclarationCount')} > 0))
      AND (NOT (${positive}) OR (local_state = 'verified' AND ${v('documentedDeclarationCount')} > 0))
      AND ((${t('userAgentCovered')} = 'null' AND (local_state <> 'verified' OR coverage_valid = 0)) OR (local_state = 'verified' AND coverage_valid = 1 AND ${v('userAgentCovered')} = json_extract(signature_evidence, '$.coverage.covered.userAgent')))
      AND (${v('status')} <> 'conflicting-origins' OR (${v('profile')} IN ('2026-10-28.1','2026-10-29.1') AND ${v('documentedDeclarationCount')} >= 2))
      AND (${v('profile')} NOT IN ('2026-10-28.1','2026-10-29.1') OR (
        ${integer('expectedOriginCount')}
        AND ${v('expectedOriginCount')} <= ${v('documentedDeclarationCount')}
        AND (${v('expectedOriginCount')} = 0) = (${v('documentedDeclarationCount')} = 0)
        AND (local_state = 'test-injected' OR (${v('status')} = 'conflicting-origins') = (${v('expectedOriginCount')} > 1))
        AND ((local_state = 'verified' AND ${v('documentedDeclarationCount')} > 0 AND
          ${integer('matchingDeclarationCount')} AND ${integer('differentOriginDeclarationCount')}
          AND ${v('matchingDeclarationCount')} + ${v('differentOriginDeclarationCount')} = ${v('documentedDeclarationCount')}
          AND (${v('status')} <> 'matching-origin' OR ${v('matchingDeclarationCount')} = ${v('documentedDeclarationCount')})
          AND (${v('status')} <> 'different-origin' OR ${v('matchingDeclarationCount')} = 0))
          OR ((local_state <> 'verified' OR ${v('documentedDeclarationCount')} = 0)
            AND ${t('matchingDeclarationCount')} = 'null' AND ${t('differentOriginDeclarationCount')} = 'null'))
      ))
      AND ${v('status')} IN ('no-declaration','not-configured','not-verified','matching-origin','different-origin','conflicting-origins','test-injected')
    ),0) THEN 'unrecognized'
    ELSE ${v('status')} END`;
}

/** Independently reconcile the summary with the selected joint denominator.
 * Per-field bounds allow overlap; only explicitly disjoint families are summed.
 */
export function consistentSignatureSummary(v: VerificationSummary, total: number, rows: StatsResponse['byKindSignature']): boolean {
  if (rows.some(row => !isSignatureBasis(row.basis) || !Number.isSafeInteger(row.views) || row.views <= 0) || rows.reduce((sum,row) => sum + row.views,0) !== total) return false;
  if (Object.values(v).some(value => !Number.isSafeInteger(value) || value < 0 || value > total)) return false;
  const joint = (...bases: StatsResponse['byKindSignature'][number]['basis'][]) => rows.filter(row => bases.includes(row.basis)).reduce((sum,row) => sum + row.views,0);
  return v.recordedViews + v.notRecordedViews === total
    && v.notRecordedViews === joint('not-recorded','verified-outcome-only')
    && v.localVerifiedViews + v.localUnverifiedViews + v.localAbsentViews + v.testVerdictViews + v.unrecognizedLocalViews === v.recordedViews
    && v.localVerifiedViews === joint('verified-ua-covered','verified-ua-uncovered','verified-coverage-unknown')
    && v.localUnverifiedViews === joint('not-verified') && v.localAbsentViews === joint('unsigned')
    && v.testVerdictViews === joint('test-injected') && v.unrecognizedLocalViews === joint('unrecognized-record')
    && v.coverageRecordedViews + v.coverageNotRecordedVerifiedViews + v.coverageUnrecognizedVerifiedViews === v.localVerifiedViews
    && v.selectionRecordedViews + v.selectionNotRecordedVerifiedViews + v.selectionUnrecognizedVerifiedViews === v.localVerifiedViews
    && v.localInvalidViews + v.localUnsupportedViews + v.localUnavailableViews + v.localPolicyRejectedViews + v.localNotApplicableViews + v.localIndeterminateViews + v.unverifiedOutcomeNotRecordedViews === v.localUnverifiedViews
    && v.nativeAvailableViews + v.nativeUnavailableViews + v.nativeNotRecordedViews + v.nativeUnrecognizedViews === total
    && v.nativeVerifiedBotViews <= v.nativeAvailableViews && v.nativeSignedAgentViews <= v.nativeAvailableViews
    && v.localVerifiedNativeNotVerifiedViews <= Math.min(v.nativeAvailableViews,v.localVerifiedViews)
    && v.vendorCheckRecognizedViews + v.vendorCheckUnrecognizedViews + v.vendorCheckNotRecordedViews === total
    && v.vendorDocumentedViews === v.vendorMatchingOriginViews + v.vendorDifferentOriginViews + v.vendorOriginConflictViews + v.vendorNotVerifiedViews
    && v.vendorDocumentedViews <= v.vendorCheckRecognizedViews && v.vendorUnmappedDeclarationViews <= v.vendorCheckRecognizedViews
    && v.vendorUserAgentBoundViews <= Math.min(v.vendorMatchingOriginViews,v.userAgentBoundViews)
    && v.vendorConflictWithMatchingOriginViews <= v.vendorOriginConflictViews
    && [v.userAgentBoundViews,v.resourceBoundViews,v.methodBoundViews,v.authorityOnlyViews].every(value => value <= v.coverageRecordedViews)
    && [v.multipleTaggedCandidateViews,v.unassessedCandidateViews].every(value => value <= v.selectionRecordedViews);
}
