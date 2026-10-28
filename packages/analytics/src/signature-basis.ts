import { signatureCoverageRecordedSql } from './signature-coverage-report.js';
/** Reporting vocabulary, not confidence scores, vendor identity or purpose. */
export const SIGNATURE_BASES = [
  'verified-ua-covered', 'verified-ua-uncovered', 'verified-coverage-unknown',
  'not-verified', 'unsigned', 'verified-outcome-only', 'not-recorded',
  'test-injected', 'unrecognized-record',
] as const;
export type SignatureBasis = typeof SIGNATURE_BASES[number];

export const SIGNATURE_BASIS_LABELS: Record<SignatureBasis, string> = {
  'verified-ua-covered': 'Stored verified result covers User-Agent',
  'verified-ua-uncovered': 'Stored verified result leaves User-Agent unsigned',
  'verified-coverage-unknown': 'Stored verified result; coverage detail unknown',
  'not-verified': 'Local result not verified',
  unsigned: 'No signature headers recorded',
  'verified-outcome-only': 'Stored verified outcome; proof detail unrecorded',
  'not-recorded': 'Verification detail not recorded',
  'test-injected': 'Test-injected verdict; no cryptographic proof',
  'unrecognized-record': 'Unrecognized or inconsistent verification record',
};

export function isSignatureBasis(value: string): value is SignatureBasis {
  return SIGNATURE_BASES.some(basis => basis === value);
}

/** The current envelope records an outcome; an explicit contradiction or
 * missing required outcome cannot support a detailed verification claim.
 */
export function signatureOutcomeConflictSql(): string {
  return `((json_extract(signature_evidence, '$.version') = '2026-10-27.5' OR json_type(signature_evidence, '$.localOutcome') IS NOT NULL) AND COALESCE((
    json_extract(signature_evidence, '$.localStatus') = 'verified' AND json_extract(signature_evidence, '$.localOutcome') = 'verified'
    OR json_extract(signature_evidence, '$.localStatus') = 'absent' AND json_extract(signature_evidence, '$.localOutcome') = 'absent'
    OR json_extract(signature_evidence, '$.localStatus') = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') IN ('invalid','unsupported','unavailable','policy-rejected','not-applicable','indeterminate')
  ), 0) = 0)`;
}

/** Coherence of the stored local result, not current cryptographic acceptance. */
export function signatureLocalStateSql(): string {
  return `CASE
    WHEN signature_evidence IS NULL THEN CASE WHEN signature_status = 'verified' THEN 'outcome-only' ELSE 'not-recorded' END
    WHEN COALESCE(json_extract(signature_evidence, '$.version'), '') NOT IN ('2026-10-27.1','2026-10-27.3','2026-10-27.4','2026-10-27.5') THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.source') = 'test-injected' THEN 'test-injected'
    WHEN COALESCE(json_extract(signature_evidence, '$.source'), '') <> 'local-webbotauth' THEN 'unrecognized'
    WHEN ${signatureOutcomeConflictSql()} THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'verified' AND signature_status IS NOT 'verified' THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'unverified' AND signature_status IS NOT 'unverified' THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'absent' AND signature_status IS NOT NULL THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.localStatus') <> 'verified' AND json_type(signature_evidence, '$.coverage') NOT IN ('null') THEN 'unrecognized'
    WHEN json_extract(signature_evidence, '$.localStatus') IN ('verified','unverified','absent') THEN json_extract(signature_evidence, '$.localStatus')
    ELSE 'unrecognized' END`;
}

/** Fixed internal columns only; no caller-supplied SQL or raw field projection. */
export function signatureBasisSql(): string {
  return `CASE (${signatureLocalStateSql()})
    WHEN 'verified' THEN CASE WHEN ${signatureCoverageRecordedSql()} THEN
      CASE WHEN json_type(signature_evidence, '$.coverage.covered.userAgent') = 'true' THEN 'verified-ua-covered' ELSE 'verified-ua-uncovered' END
      ELSE 'verified-coverage-unknown' END
    WHEN 'unverified' THEN 'not-verified'
    WHEN 'absent' THEN 'unsigned'
    WHEN 'outcome-only' THEN 'verified-outcome-only'
    WHEN 'not-recorded' THEN 'not-recorded'
    WHEN 'test-injected' THEN 'test-injected'
    ELSE 'unrecognized-record' END`;
}
