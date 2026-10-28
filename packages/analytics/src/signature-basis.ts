/** Reporting vocabulary, not confidence scores, vendor identity or purpose. */
export const SIGNATURE_BASES = [
  'verified-ua-covered', 'verified-ua-uncovered', 'verified-coverage-unknown',
  'not-verified', 'unsigned', 'verified-outcome-only', 'not-recorded',
  'test-injected', 'unrecognized-record',
] as const;
export type SignatureBasis = typeof SIGNATURE_BASES[number];

export const SIGNATURE_BASIS_LABELS: Record<SignatureBasis, string> = {
  'verified-ua-covered': 'Verified signature covers User-Agent',
  'verified-ua-uncovered': 'Verified signature leaves User-Agent unsigned',
  'verified-coverage-unknown': 'Verified result; coverage detail unknown',
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

/** Fixed internal column only; no caller-supplied SQL or raw field projection. */
export function signatureBasisSql(): string {
  return `CASE
    WHEN signature_evidence IS NULL THEN CASE WHEN signature_status = 'verified'
      THEN 'verified-outcome-only' ELSE 'not-recorded' END
    WHEN COALESCE(json_extract(signature_evidence, '$.version'), '') NOT IN ('2026-10-27.1', '2026-10-27.3', '2026-10-27.4', '2026-10-27.5') THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.source') = 'test-injected' THEN 'test-injected'
    WHEN COALESCE(json_extract(signature_evidence, '$.source'), '') <> 'local-webbotauth' THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'verified' AND signature_status IS NOT 'verified' THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'unverified' AND signature_status IS NOT 'unverified' THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'absent' AND signature_status IS NOT NULL THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.localStatus') <> 'verified' AND json_type(signature_evidence, '$.coverage') NOT IN ('null') THEN 'unrecognized-record'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'verified' THEN CASE
      WHEN json_extract(signature_evidence, '$.coverage.version') IN ('2026-10-27.1','2026-10-28.1')
        AND json_type(signature_evidence, '$.coverage.covered.userAgent') = 'true' THEN 'verified-ua-covered'
      WHEN json_extract(signature_evidence, '$.coverage.version') IN ('2026-10-27.1','2026-10-28.1')
        AND json_type(signature_evidence, '$.coverage.covered.userAgent') = 'false' THEN 'verified-ua-uncovered'
      ELSE 'verified-coverage-unknown' END
    WHEN json_extract(signature_evidence, '$.localStatus') = 'unverified' THEN 'not-verified'
    WHEN json_extract(signature_evidence, '$.localStatus') = 'absent' THEN 'unsigned'
    ELSE 'unrecognized-record' END`;
}
