import { assessProjectedReferral, REFERRAL_REPORT_RULE_SHA256 } from './referral-report-projection.js';
import { signatureLocalStateSql, signatureBasisSql } from './signature-basis.js';
import { signatureCoverageRecordedSql } from './signature-coverage-report.js';
import { signatureSelectionRecordedSql } from './signature-selection.js';
import { nativeBooleanStateSql, vendorSignatureStateSql } from './signature-summary.js';
import { verifierProfileSql } from './verifier-profile.js';
import { nativeCategoryBasisSql } from './native-bot-evidence.js';
import { directoryPublicationBasisSql } from './directory-publication.js';
import { vendorNetworkStateSql } from './vendor-network-summary.js';
import { fetchMetadataRecordStateSql } from './fetch-metadata-report.js';
import { vendorCacheRecordColumnsSql } from './vendor-cache-report.js';
import { SIGNATURE_REPORT_FACTS, NETWORK_REPORT_FACTS } from './report-fact-expressions.js';
import { CLIENT_FORMS, CLIENT_FORM_PROFILES } from './client-form.js';

/** Retained dimensions only. Owner/publication policies stay live; referral rules have a separate fingerprint. */
export const REPORT_SOURCE_COLUMNS = [
  'path', 'referrer_host', 'referrer_state', 'internal_referrer_path', 'country',
  'daily_client_id', 'traffic_class', 'agent_name', 'is_owner', 'representation',
  'signature_agent', 'signature_status', 'reader_kind', 'reader_reason', 'observed_at',
] as const;
export const REPORT_DERIVED_COLUMNS = [
  'report_form', 'report_form_recorded', 'report_form_unsupported', 'report_form_differing', 'report_form_defaulted',
  'report_directory', 'report_native_category', 'report_signature_basis', 'report_verifier_profile',
  'report_verification', 'report_network', 'report_metadata', 'report_cache',
] as const;

// Pinned to reportProjectionSelectSql(); a change requires a rebuild decision.
export const REPORT_PROJECTION_RULE_SHA256 = '2ca641b0fed3defaeb8bcc0556ec88a47abda3a7a8d4918655269007978569d2';

/** One event's immutable reporting interpretation, shared with the source fallback.
 * Materialization keeps expensive validation out of repeated leaf expressions.
 */
export function reportProjectionSelectSql(predicate: string): string {
  const profile = `json_extract(client_form_evidence, '$.profile') IN (${CLIENT_FORM_PROFILES.map(p => `'${p}'`).join(',')})`;
  const currentForm = `${profile} AND json_extract(client_form_evidence, '$.form') IN (${CLIENT_FORMS.map(p => `'${p}'`).join(',')})`;
  return `WITH inputs AS MATERIALIZED (
    SELECT *, classification_evidence IS NULL AS metadata_missing,
      CASE WHEN typeof(classification_evidence) = 'text' AND json_valid(classification_evidence) THEN classification_evidence ELSE '{}' END AS metadata_json
    FROM page_observations WHERE ${predicate}
  ), evidence AS MATERIALIZED (
    SELECT *, ${signatureLocalStateSql()} AS local_state,
      ${signatureCoverageRecordedSql()} AS coverage_valid, ${nativeBooleanStateSql()} AS native_state,
      ${vendorNetworkStateSql()} AS network_state, ${fetchMetadataRecordStateSql()} AS metadata_state
    FROM inputs
  ), selection AS MATERIALIZED (
    SELECT *, ${vendorSignatureStateSql()} AS vendor_state, ${signatureSelectionRecordedSql()} AS selection_valid,
      ${nativeCategoryBasisSql()} AS report_native_category, ${signatureBasisSql()} AS report_signature_basis,
      ${verifierProfileSql()} AS report_verifier_profile, ${directoryPublicationBasisSql()} AS report_directory
    FROM evidence
  ), cache AS MATERIALIZED (
    SELECT *, ${vendorCacheRecordColumnsSql()} FROM selection
  )
  SELECT id AS observation_id, ${REPORT_SOURCE_COLUMNS.join(', ')},
    CASE WHEN client_form_evidence IS NOT NULL THEN CASE WHEN ${currentForm} THEN json_extract(client_form_evidence, '$.form') ELSE 'unrecognized-record' END
      WHEN device_type = 'desktop' THEN 'historical-desktop-default'
      WHEN device_type = 'mobile' THEN 'historical-mobile-heuristic'
      WHEN device_type = 'tablet' THEN 'historical-tablet-heuristic' ELSE 'unrecognized-record' END AS report_form,
    COALESCE(${currentForm},0) AS report_form_recorded,
    (${profile} AND json_extract(client_form_evidence,'$.mobileHint') = 'unsupported') AS report_form_unsupported,
    (${profile} AND json_extract(client_form_evidence,'$.comparison') = 'different-indicators') AS report_form_differing,
    (${profile} AND json_extract(client_form_evidence,'$.legacyCompatibility.defaulted') = 1) AS report_form_defaulted,
    report_directory, report_native_category, report_signature_basis, report_verifier_profile,
    json_array(${Object.values(SIGNATURE_REPORT_FACTS).join(', ')}) /* ${Object.keys(SIGNATURE_REPORT_FACTS).join(',')} */ AS report_verification,
    json_array(${Object.values(NETWORK_REPORT_FACTS).join(', ')}) /* ${Object.keys(NETWORK_REPORT_FACTS).join(',')} */ AS report_network,
    json_object('state',metadata_state,'bits',CASE WHEN metadata_state='recognized' THEN json_extract(metadata_json,'$.fetchMetadataBits') ELSE NULL END,
      'activation',CASE WHEN metadata_state='recognized' AND ((json_extract(metadata_json,'$.fetchMetadataBits') >> 9) & 7)=2 THEN sec_fetch_user ELSE NULL END) AS report_metadata,
    json_object('state',cache_state,'applicable',applicable,'access',json_extract(cache_masks,'$.access'),
      'policy',json_extract(cache_masks,'$.policy'),'blockers',json_extract(cache_masks,'$.blockers')) AS report_cache
  FROM cache`;
}

export function reportProjectionSql(scope: 'observation' | 'range'): string {
  const columns = ['observation_id', ...REPORT_SOURCE_COLUMNS, ...REPORT_DERIVED_COLUMNS];
  const selected = reportProjectionSelectSql(`${scope === 'observation' ? 'id = ?1 AND referrer_host IS ?3' : 'id > ?1 AND id <= ?2'}
    AND NOT EXISTS (SELECT 1 FROM page_observation_report_facts AS current WHERE current.observation_id=page_observations.id AND current.rule_sha256='${REPORT_PROJECTION_RULE_SHA256}'${scope === 'observation' ? ` AND current.report_referral_rule_sha256='${REFERRAL_REPORT_RULE_SHA256}' AND current.report_referral_excluded IS NOT NULL` : ''})`);
  return `INSERT INTO page_observation_report_facts(${columns.join(', ')},rule_sha256,report_referral_excluded,report_referral_rule_sha256)
    SELECT ${columns.join(', ')}, '${REPORT_PROJECTION_RULE_SHA256}', ${scope === 'observation' ? `?2, '${REFERRAL_REPORT_RULE_SHA256}'` : 'NULL, NULL'} FROM (${selected}) WHERE 1
    ON CONFLICT(observation_id) DO UPDATE SET ${[...REPORT_SOURCE_COLUMNS,...REPORT_DERIVED_COLUMNS].map(c => `${c}=excluded.${c}`).join(', ')},rule_sha256=excluded.rule_sha256,report_referral_excluded=excluded.report_referral_excluded,report_referral_rule_sha256=excluded.report_referral_rule_sha256`;
}

/** A derived-write failure cannot revoke or replay an acknowledged observation. */
export async function projectReportObservation(db: D1Database, observationId: string, referrerHost: string | null): Promise<void> {
  const result = await db.prepare(reportProjectionSql('observation')).bind(observationId, Number(assessProjectedReferral(referrerHost).action === 'exclude'), referrerHost).run();
  if (result.success !== true) throw new Error('Report projection unavailable');
}
