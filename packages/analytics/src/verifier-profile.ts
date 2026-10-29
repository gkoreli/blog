import { VERIFIER_PROFILE_VERSION } from './versions.js';
import { signatureOutcomeConflictSql } from './signature-basis.js';

/** Reviewed from the repository's recorded verifier constants, not inferred
 * from date-like client strings. These identifiers do not promise conformance.
 */
export const REVIEWED_VERIFIER_PROFILES = [
  '2026-10-26.1', '2026-10-27.1', '2026-10-27.3', '2026-10-27.4',
  '2026-10-27.5', '2026-10-27.6', '2026-10-27.7',
  '2026-10-28.1', '2026-10-28.2', '2026-10-28.3', '2026-10-28.4',
  '2026-10-28.5', '2026-10-28.6', '2026-10-28.7',
  '2026-10-29.1',
] as const;
export type ReportedVerifierProfile = typeof REVIEWED_VERIFIER_PROFILES[number] | 'not-recorded' | 'unrecognized-record' | 'test-injected';
export function isReportedVerifierProfile(value: unknown): value is ReportedVerifierProfile {
  return value === 'not-recorded' || value === 'unrecognized-record' || value === 'test-injected'
    || REVIEWED_VERIFIER_PROFILES.some(profile => profile === value);
}
export function verifierProfileLabel(profile: ReportedVerifierProfile, current: string): string {
  if (profile === 'not-recorded') return 'Verifier profile not recorded';
  if (profile === 'unrecognized-record') return 'Unrecognized or inconsistent profile record';
  if (profile === 'test-injected') return 'Injected verdict; no local verifier profile';
  return `${profile === current ? 'Current' : 'Historical'} stored profile ${profile}`;
}
export const CURRENT_VERIFIER_PROFILE = VERIFIER_PROFILE_VERSION;

/** Closed provenance projection only. No re-verification or arbitrary profile
 * strings leave this CASE. Current means the stored identifier matches today.
 */
export function verifierProfileSql(): string {
  const value = (key: string) => `json_extract(signature_evidence, '$.${key}')`;
  const status = value('localStatus');
  return `CASE
    WHEN signature_evidence IS NULL THEN 'not-recorded'
    WHEN COALESCE(${value('version')}, '') NOT IN ('2026-10-27.1','2026-10-27.3','2026-10-27.4','2026-10-27.5') THEN 'unrecognized-record'
    WHEN ${value('source')} = 'test-injected' THEN 'test-injected'
    WHEN COALESCE(${value('source')}, '') <> 'local-webbotauth' THEN 'unrecognized-record'
    WHEN COALESCE(${status}, '') NOT IN ('verified','unverified','absent') THEN 'unrecognized-record'
    WHEN ${status} = 'verified' AND signature_status IS NOT 'verified' THEN 'unrecognized-record'
    WHEN ${status} = 'unverified' AND signature_status IS NOT 'unverified' THEN 'unrecognized-record'
    WHEN ${status} = 'absent' AND signature_status IS NOT NULL THEN 'unrecognized-record'
    WHEN ${status} <> 'verified' AND json_type(signature_evidence, '$.coverage') NOT IN ('null') THEN 'unrecognized-record'
    WHEN ${signatureOutcomeConflictSql()} THEN 'unrecognized-record'
    WHEN json_type(signature_evidence, '$.verifierProfile') IS NULL OR json_type(signature_evidence, '$.verifierProfile') = 'null' THEN 'not-recorded'
    WHEN ${value('verifierProfile')} IN (${REVIEWED_VERIFIER_PROFILES.map(profile => `'${profile}'`).join(',')}) THEN ${value('verifierProfile')}
    ELSE 'unrecognized-record' END`;
}
