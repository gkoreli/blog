/** D1 read adapter. Query-specific projections preserve one complete report
 * while keeping raw evidence out of unrelated materialized populations.
 */
import { NETWORK_REPORT_RULE_SHA256 } from './network-report-projection.js';
import { READER_KINDS, type StatsQuery } from './contracts.js';
import type { StatsWindow } from './dates.js';
import { partitionPredicate } from './partition.js';
import { reportedKindSql, reportedReasonSql, unresolvedKindSql } from './reporting-kind.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';
import type { ReferralPolicy } from './referral-policy.js';
import { PUBLIC_SIGNERS } from './signers.js';
import { CLIENT_FORMS, CLIENT_FORM_PROFILES } from './client-form.js';
import { signatureBasisSql, signatureLocalStateSql } from './signature-basis.js';
import { signatureCoverageRecordedSql } from './signature-coverage-report.js';
import { signatureSelectionRecordedSql } from './signature-selection.js';
import { nativeBooleanStateSql, vendorSignatureStateSql } from './signature-summary.js';
import { verifierProfileSql } from './verifier-profile.js';
import { nativeCategoryBasisSql } from './native-bot-evidence.js';
import { directoryPublicationBasisSql } from './directory-publication.js';
import { vendorNetworkStateSql } from './vendor-network-summary.js';
import { fetchMetadataReportCtes, fetchMetadataReportProjectionSql } from './fetch-metadata-report.js';
import { vendorCacheReportCtes, vendorCacheReportProjectionSql } from './vendor-cache-report.js';
import { boundedJsonObjectSql } from './sql-json.js';

interface QueryPredicate {
  sql: string;
  values: unknown[];
}

const PUBLIC_OBSERVATION_PREDICATE = `is_owner = 0 AND NOT EXISTS (
  SELECT 1 FROM owner_clients
  WHERE owner_clients.daily_client_id = page_observations.daily_client_id
)`;

function predicateFor(window: StatsWindow, query: StatsQuery, includeOutgoing = false): QueryPredicate {
  let sql = `observed_at >= ? AND observed_at < ? AND ${PUBLIC_OBSERVATION_PREDICATE}`;
  const values: unknown[] = [window.startInclusive, window.endExclusive];
  const partition = partitionPredicate(query.traffic);
  if (partition.sql.length > 0) {
    sql += ` AND (${partition.sql})`;
    values.push(...partition.values);
  }
  if (query.path !== undefined) {
    sql += includeOutgoing ? ' AND (path = ? OR internal_referrer_path = ?)' : ' AND path = ?';
    values.push(query.path);
    if (includeOutgoing) values.push(query.path);
  }
  if (query.agent !== undefined) {
    sql += ' AND agent_name = ?';
    values.push(query.agent);
  }
  if (query.kind !== undefined) {
    if (query.kind === 'unresolved') sql += ` AND ${unresolvedKindSql()}`;
    else { sql += ' AND reader_kind = ?'; values.push(query.kind); }
  }
  return { sql, values };
}

/** Exact origins only: no suffix matching, normalization or caller-controlled SQL. */
function signerLabelSql(column: 'signature_agent' | 'reader_reason'): string {
  const cases = PUBLIC_SIGNERS.map(({ origin, name }) =>
    `WHEN '${origin.replaceAll("'", "''")}' THEN '${name.replaceAll("'", "''")}'`);
  return `CASE ${column} ${cases.join(' ')} ELSE 'Other' END`;
}

/** Keep each statement below the affected D1 engine's CTE expansion counter.
 * One transactional batch preserves the common population; section decoders
 * still reject a missing, duplicate or inconsistent result. See D1 incident 05.
 */
const REPORT_SECTION_GROUPS = [
  ['totals', 'path', 'country', 'series', 'referrer', 'excluded'],
  ['device', 'agent', 'kind', 'signer'],
  ['referrer-details', 'referrer-state', 'transitions'],
  ['directory-publication', 'native-category', 'kind-signature', 'client-evidence', 'verification'],
  ['fetch-metadata', 'vendor-cache', 'vendor-ip'],
] as const;
type ReportSection = typeof REPORT_SECTION_GROUPS[number][number] | 'boundary';

// Storage projection dependencies, never fields supplied by an HTTP caller.
const REPORT_INPUTS = {
  'fetch-metadata': ['classification_evidence', 'observation_source', 'collection_version', 'classifier_version', 'sec_fetch_mode', 'sec_fetch_dest', 'sec_fetch_site', 'sec_fetch_user'],
  'directory-publication': ['signature_evidence', 'signature_status'],
  'native-category': ['reader_kind', 'agent_name', 'signature_evidence', 'signature_status'],
  totals: ['daily_client_id'], path: ['daily_client_id'], country: ['country'],
  series: ['observed_at', 'daily_client_id'], referrer: [],
  device: ['client_form_evidence', 'device_type'], agent: ['agent_name', 'traffic_class'],
  kind: ['reader_kind', 'reader_reason', 'daily_client_id'], signer: ['signature_agent', 'signature_status'],
  'kind-signature': ['reader_kind', 'agent_name', 'signature_evidence', 'signature_status'],
  'client-evidence': ['reader_kind', 'agent_name', 'signature_evidence', 'signature_status'],
  excluded: [], 'vendor-cache': ['vendor_ip_evidence', 'report_network_state'], 'vendor-ip': ['vendor_ip_evidence', 'report_network_state'],
  verification: ['signature_evidence', 'signature_status'], 'referrer-state': ['referrer_state'],
  transitions: ['internal_referrer_path', 'representation', 'referrer_state'],
  'referrer-details': ['internal_referrer_path', 'representation', 'referrer_state', 'observed_at'],
  boundary: [],
} as const satisfies Readonly<Record<ReportSection, readonly string[]>>;

function reportSql(selected: QueryPredicate, bucketSql: string, includeBoundary: boolean, sectionNames: readonly ReportSection[], includeOutgoing: boolean, evidenceCohorts: boolean): QueryPredicate {
  const scopedPath = `?${selected.values.length + 2}`;
  const pathScope = includeOutgoing ? `(${scopedPath} IS NULL OR path = ${scopedPath})` : '1';
  const inputColumns = [...new Set([...(evidenceCohorts ? [] : ['path']), 'referrer_host', ...sectionNames.flatMap(name => REPORT_INPUTS[name])])];
  const selectedColumns = inputColumns.map(column => column === 'report_network_state' ? 'network_projection.network_state AS report_network_state' : column);
  const projectionJoin = inputColumns.includes('report_network_state')
    ? `LEFT JOIN page_observation_network_facts AS network_projection ON network_projection.observation_id = page_observations.id AND network_projection.rule_sha256 = '${NETWORK_REPORT_RULE_SHA256}'` : '';
  const publicReason = reportedReasonSql();
  const publicKind = reportedKindSql();
  const publicSigner = signerLabelSql('signature_agent');
  const boundaryCte = includeBoundary
    ? `boundary AS MATERIALIZED (
        SELECT MIN(observed_at) AS first_observed_at
        FROM page_observations WHERE ${PUBLIC_OBSERVATION_PREDICATE}
      )`
    : '';
  const formProfile = `json_extract(client_form_evidence, '$.profile') IN (${CLIENT_FORM_PROFILES.map(profile => `'${profile}'`).join(',')})`;
  const currentForm = `${formProfile} AND json_extract(client_form_evidence, '$.form') IN (${CLIENT_FORMS.map(value => `'${value}'`).join(', ')})`;
  const form = `CASE WHEN client_form_evidence IS NOT NULL THEN
    CASE WHEN ${currentForm}
      THEN json_extract(client_form_evidence, '$.form') ELSE 'unrecognized-record' END
    WHEN device_type = 'desktop' THEN 'historical-desktop-default'
    WHEN device_type = 'mobile' THEN 'historical-mobile-heuristic'
    WHEN device_type = 'tablet' THEN 'historical-tablet-heuristic' ELSE 'unrecognized-record' END`;
  const projections: Readonly<Record<ReportSection, string>> = {
    'fetch-metadata': `(${fetchMetadataReportProjectionSql()})`,
    'directory-publication': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', basis, 'views', SUM(directory_views)) AS row_json
            FROM (SELECT ${directoryPublicationBasisSql()} AS basis, directory_views FROM directory_inputs)
            GROUP BY basis ORDER BY SUM(directory_views) DESC, basis
          )
        )`,
    'native-category': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', evidence_kind, 'key2', native_category, 'views', SUM(client_views)) AS row_json
            FROM client_evidence_facts GROUP BY evidence_kind, native_category ORDER BY SUM(client_views) DESC, evidence_kind, native_category
          )
        )`,
    'totals': `(
          SELECT json_array(json_object(
            'views', COUNT(*), 'dailyClients', COUNT(DISTINCT daily_client_id),
            'unattributedViews', SUM(CASE WHEN referrer_host IS NULL THEN 1 ELSE 0 END)
          )) FROM included
        )`,
    'path': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', path, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY path ORDER BY COUNT(*) DESC, path
          )
        )`,
    'country': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', country, 'views', COUNT(*)) AS row_json
            FROM included WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC, country
          )
        )`,
    'series': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${bucketSql}, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY ${bucketSql} ORDER BY ${bucketSql}
          )
        )`,
    'referrer': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', referrer_host, 'views', COUNT(*)) AS row_json
            FROM included WHERE referrer_host IS NOT NULL
            GROUP BY referrer_host ORDER BY COUNT(*) DESC, referrer_host
          )
        )`,
    'device': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${form}, 'views', COUNT(*),
              'recordedViews', SUM(COALESCE(${currentForm}, 0)),
              'unsupportedHintViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.mobileHint') = 'unsupported'),
              'differingSignalsViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.comparison') = 'different-indicators'),
              'legacyDefaultedViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.legacyCompatibility.defaulted') = 1)) AS row_json
            FROM included GROUP BY ${form} ORDER BY COUNT(*) DESC, ${form}
          )
        )`,
    'agent': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', agent_name, 'key2', traffic_class, 'views', COUNT(*)) AS row_json
            FROM included WHERE agent_name IS NOT NULL
            GROUP BY agent_name, traffic_class ORDER BY COUNT(*) DESC, agent_name
          )
        )`,
    'kind': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${publicKind}, 'key2', ${publicReason}, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included
            GROUP BY ${publicKind}, ${publicReason} ORDER BY COUNT(*) DESC, ${publicKind}, ${publicReason}
          )
        )`,
    'signer': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${publicSigner}, 'views', COUNT(*)) AS row_json
            FROM included WHERE signature_status = 'verified' AND signature_agent IS NOT NULL
            GROUP BY ${publicSigner} ORDER BY COUNT(*) DESC, ${publicSigner}
          )
        )`,
    'kind-signature': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', evidence_kind, 'key2', signature_basis, 'key3', verifier_profile, 'views', SUM(client_views)) AS row_json
            FROM client_evidence_facts
            GROUP BY evidence_kind, signature_basis, verifier_profile ORDER BY SUM(client_views) DESC, evidence_kind, signature_basis, verifier_profile
          )
        )`,
    'client-evidence': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', evidence_kind, 'key2', name_selection, 'key3', native_category,
              'key4', signature_basis, 'key5', verifier_profile, 'views', SUM(client_views)) AS row_json
            FROM client_evidence_facts GROUP BY evidence_kind, name_selection, native_category, signature_basis, verifier_profile
            ORDER BY SUM(client_views) DESC, evidence_kind, name_selection, native_category, signature_basis, verifier_profile
          )
        )`,
    'excluded': `(
          SELECT json_array(json_object('views', COUNT(*)))
          FROM assessed WHERE referral_excluded = 1 AND ${pathScope}
        )`,
    'vendor-cache': `(${vendorCacheReportProjectionSql()})`,
    'vendor-ip': `(
          SELECT json_array(json_object(
            'recordedViews', SUM(network_views * (vendor_ip_evidence IS NOT NULL)),
            'notRecordedViews', SUM(network_views * (network_state = 'not-recorded')),
            'recognizedViews', SUM(network_views * (network_state = 'recognized')),
            'unrecognizedViews', SUM(network_views * (network_state = 'unrecognized')),
            'configuredDeclarationViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.configuredDeclarationCount') > 0)),
            'unmappedDeclarationViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.unmappedDeclarationCount') > 0)),
            'noDeclarationViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.declarationCount') = 0)),
            'listedViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.listed') = 1)),
            'notListedViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.notListed') = 1)),
            'unavailableViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.unavailable') = 1)),
            'notAssessedViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.notAssessed') = 1)),
            'addressUnavailableViews', SUM(network_views * (network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.configuredDeclarationCount') > 0 AND json_extract(vendor_ip_evidence, '$.address.state') <> 'usable'))
          )) FROM vendor_network_facts
        )`,
    'verification': `(
          SELECT json_array(${boundedJsonObjectSql({
            localInvalidViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'invalid'))",
            localUnsupportedViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'unsupported'))",
            localUnavailableViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'unavailable'))",
            localPolicyRejectedViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'policy-rejected'))",
            localNotApplicableViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'not-applicable'))",
            localIndeterminateViews: "SUM(signature_views * (local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'indeterminate'))",
            unverifiedOutcomeNotRecordedViews: "SUM(signature_views * (local_state = 'unverified' AND json_type(signature_evidence, '$.localOutcome') IS NULL))",
            vendorDocumentedViews: "SUM(signature_views * (vendor_state NOT IN ('not-recorded','unrecognized','test-injected') AND json_extract(signature_evidence, '$.vendor.documentedDeclarationCount') > 0))",
            vendorMatchingOriginViews: "SUM(signature_views * (vendor_state = 'matching-origin'))",
            vendorDifferentOriginViews: "SUM(signature_views * (vendor_state = 'different-origin'))",
            vendorOriginConflictViews: "SUM(signature_views * (vendor_state = 'conflicting-origins'))",
            vendorConflictWithMatchingOriginViews: "SUM(signature_views * (vendor_state = 'conflicting-origins' AND local_state = 'verified' AND json_extract(signature_evidence, '$.vendor.matchingDeclarationCount') > 0))",
            vendorNotVerifiedViews: "SUM(signature_views * (vendor_state = 'not-verified'))",
            vendorUnmappedDeclarationViews: "SUM(signature_views * (vendor_state NOT IN ('not-recorded','unrecognized','test-injected') AND json_extract(signature_evidence, '$.vendor.unmappedDeclarationCount') > 0))",
            vendorUserAgentBoundViews: "SUM(signature_views * (vendor_state = 'matching-origin' AND json_type(signature_evidence, '$.vendor.userAgentCovered') = 'true'))",
            vendorCheckNotRecordedViews: "SUM(signature_views * (vendor_state = 'not-recorded'))",
            vendorCheckUnrecognizedViews: "SUM(signature_views * (vendor_state = 'unrecognized'))",
            vendorCheckRecognizedViews: "SUM(signature_views * (vendor_state NOT IN ('unrecognized','not-recorded')))",
            recordedViews: "SUM(signature_views * (signature_evidence IS NOT NULL))",
            notRecordedViews: "SUM(signature_views * (signature_evidence IS NULL))",
            localVerifiedViews: "SUM(signature_views * (local_state = 'verified'))",
            localUnverifiedViews: "SUM(signature_views * (local_state = 'unverified'))",
            localAbsentViews: "SUM(signature_views * (local_state = 'absent'))",
            unrecognizedLocalViews: "SUM(signature_views * (local_state = 'unrecognized'))",
            testVerdictViews: "SUM(signature_views * (local_state = 'test-injected'))",
            coverageRecordedViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1))",
            coverageNotRecordedVerifiedViews: "SUM(signature_views * (local_state = 'verified' AND COALESCE(json_type(signature_evidence, '$.coverage'), 'null') = 'null'))",
            coverageUnrecognizedVerifiedViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 0 AND COALESCE(json_type(signature_evidence, '$.coverage'), 'null') <> 'null'))",
            selectionRecordedViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1))",
            selectionNotRecordedVerifiedViews: "SUM(signature_views * (local_state = 'verified' AND json_type(signature_evidence, '$.coverage.selection') IS NULL AND COALESCE(json_extract(signature_evidence, '$.coverage.version'), '2026-10-27.1') = '2026-10-27.1'))",
            selectionUnrecognizedVerifiedViews: "SUM(signature_views * (local_state = 'verified' AND NOT (coverage_valid = 1 AND selection_valid = 1) AND NOT (json_type(signature_evidence, '$.coverage.selection') IS NULL AND COALESCE(json_extract(signature_evidence, '$.coverage.version'), '2026-10-27.1') = '2026-10-27.1')))",
            multipleTaggedCandidateViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1 AND json_extract(signature_evidence, '$.coverage.selection.taggedCandidates') > 1))",
            unassessedCandidateViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1 AND json_extract(signature_evidence, '$.coverage.selection.unassessedCandidates') > 0))",
            userAgentBoundViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.userAgent') = 'true'))",
            resourceBoundViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND (json_type(signature_evidence, '$.coverage.covered.path') = 'true' OR json_type(signature_evidence, '$.coverage.covered.targetUri') = 'true')))",
            methodBoundViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.method') = 'true'))",
            authorityOnlyViews: "SUM(signature_views * (local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.authority') = 'true' AND json_type(signature_evidence, '$.coverage.covered.targetUri') = 'false' AND json_type(signature_evidence, '$.coverage.covered.path') = 'false' AND json_type(signature_evidence, '$.coverage.covered.method') = 'false' AND json_type(signature_evidence, '$.coverage.covered.query') = 'false'))",
            nativeAvailableViews: "SUM(signature_views * (native_state = 'available'))",
            nativeVerifiedBotAvailableViews: "SUM(signature_views * (native_state = 'available' AND json_type(signature_evidence, '$.native.verifiedBot') IN ('true','false')))",
            nativeSignedAgentAvailableViews: "SUM(signature_views * (native_state = 'available' AND json_type(signature_evidence, '$.native.signedAgent') IN ('true','false')))",
            nativeUnavailableViews: "SUM(signature_views * (native_state = 'unavailable'))",
            nativeNotRecordedViews: "SUM(signature_views * (native_state = 'not-recorded'))",
            nativeUnrecognizedViews: "SUM(signature_views * (native_state = 'unrecognized'))",
            nativeVerifiedBotViews: "SUM(signature_views * (native_state = 'available' AND json_type(signature_evidence, '$.native.verifiedBot') = 'true'))",
            nativeSignedAgentViews: "SUM(signature_views * (native_state = 'available' AND json_type(signature_evidence, '$.native.signedAgent') = 'true'))",
            localVerifiedNativeNotVerifiedViews: "SUM(signature_views * (local_state = 'verified' AND native_state = 'available' AND json_type(signature_evidence, '$.native.verifiedBot') = 'false'))",
          })}) FROM signature_summary
        )`,
    'referrer-state': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', COALESCE(referrer_state,
              CASE WHEN referrer_host IS NOT NULL THEN 'external' ELSE 'legacy-unknown' END),
              'views', COUNT(*)) AS row_json
            FROM included GROUP BY COALESCE(referrer_state,
              CASE WHEN referrer_host IS NOT NULL THEN 'external' ELSE 'legacy-unknown' END)
          )
        )`,
    'transitions': `(
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', internal_referrer_path, 'key2', path, 'views', COUNT(*)) AS row_json
            FROM assessed WHERE referral_excluded = 0 AND representation = 'html'
              AND referrer_state = 'internal' AND internal_referrer_path IS NOT NULL
              AND internal_referrer_path <> path
            GROUP BY internal_referrer_path, path ORDER BY COUNT(*) DESC, internal_referrer_path, path
          )
        )`,
    'referrer-details': `(
          SELECT json_array(json_object(
            'firstCapturedAt', MIN(CASE WHEN referrer_state IS NOT NULL THEN observed_at END),
            'unrecognizedPathViews', SUM(CASE WHEN referrer_state = 'internal'
              AND internal_referrer_path IS NULL AND representation = 'html' THEN 1 ELSE 0 END),
            'selfReferrals', SUM(CASE WHEN referrer_state = 'internal'
              AND internal_referrer_path = path AND representation = 'html' THEN 1 ELSE 0 END)
          )) FROM assessed WHERE referral_excluded = 0
        )`,
    boundary: `(SELECT json_array(json_object('firstObservedAt', first_observed_at)) FROM boundary)`,
  };
  const names: readonly ReportSection[] = includeBoundary ? [...sectionNames, 'boundary'] : sectionNames;
  const sectionValues = names.map((name,index) => `('${name}', ${index})`);

  const ctes = [
    `selected AS MATERIALIZED (
      SELECT ${selectedColumns.join(', ')}${evidenceCohorts ? ', COUNT(*) AS event_views' : ''}
      FROM page_observations ${projectionJoin} WHERE ${selected.sql}
      ${evidenceCohorts ? `GROUP BY ${inputColumns.join(', ')}` : ''}
    )`,
    referralAssessmentCtes(`
      SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
      FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253
    `),
    `assessed AS MATERIALIZED (
      SELECT selected.*, COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) AS referral_excluded
      FROM selected
    )`,
    `included AS (SELECT * FROM assessed WHERE referral_excluded = 0 AND ${pathScope})`,
  ];
  if (sectionNames.includes('directory-publication')) ctes.push(`directory_inputs AS MATERIALIZED (
    SELECT signature_evidence, signature_status, SUM(event_views) AS directory_views
    FROM included GROUP BY signature_evidence, signature_status
  )`);
  if (sectionNames.some(name => name === 'native-category' || name === 'kind-signature' || name === 'client-evidence')) {
    ctes.push(`client_inputs AS MATERIALIZED (
      SELECT reader_kind, agent_name IS NOT NULL AS name_selected, signature_evidence, signature_status, SUM(event_views) AS client_views
      FROM included GROUP BY reader_kind, agent_name IS NOT NULL, signature_evidence, signature_status
    )`, `client_evidence_facts AS MATERIALIZED (
      SELECT CASE WHEN reader_kind IN (${READER_KINDS.map(kind => "'" + kind + "'").join(',')}) THEN reader_kind ELSE NULL END AS evidence_kind,
        CASE WHEN name_selected THEN 'selected' ELSE 'not-selected' END AS name_selection,
        ${nativeCategoryBasisSql()} AS native_category,
        ${signatureBasisSql()} AS signature_basis, ${verifierProfileSql()} AS verifier_profile,
        client_views FROM client_inputs
    )`);
  }
  if (sectionNames.some(name => name === 'vendor-cache' || name === 'vendor-ip')) {
    ctes.push(`vendor_network_inputs AS MATERIALIZED (
      SELECT vendor_ip_evidence, report_network_state, SUM(event_views) AS network_views FROM included GROUP BY vendor_ip_evidence, report_network_state
    )`, `vendor_network_facts AS MATERIALIZED (
      SELECT vendor_ip_evidence, network_views, CASE WHEN report_network_state IS NOT NULL THEN report_network_state ELSE (${vendorNetworkStateSql()}) END AS network_state FROM vendor_network_inputs
    )`);
  }
  if (sectionNames.includes('verification')) {
    ctes.push(`signature_inputs AS MATERIALIZED (
      SELECT signature_evidence, signature_status, SUM(event_views) AS signature_views
      FROM included GROUP BY signature_evidence, signature_status
    )`, `signature_facts AS MATERIALIZED (
      SELECT signature_evidence, signature_status, signature_views,
        ${signatureLocalStateSql()} AS local_state,
        ${signatureCoverageRecordedSql()} AS coverage_valid,
        ${nativeBooleanStateSql()} AS native_state FROM signature_inputs
    )`, `signature_summary AS MATERIALIZED (
      SELECT *, ${vendorSignatureStateSql()} AS vendor_state,
        ${signatureSelectionRecordedSql()} AS selection_valid FROM signature_facts
    )`);
  }
  if (sectionNames.includes('fetch-metadata')) ctes.push(fetchMetadataReportCtes('cohorts'));
  if (sectionNames.includes('vendor-cache')) ctes.push(vendorCacheReportCtes('cohorts'));
  if (includeBoundary) ctes.push(boundaryCte);
  ctes.push(`sections(section, section_order) AS MATERIALIZED (VALUES ${sectionValues.join(', ')})`);

  return {
    sql: `WITH RECURSIVE ${ctes.join(',\n')}
    SELECT section, CASE section
      ${names.map(name => `WHEN '${name}' THEN ${projections[name]}`).join('\n')}
      ELSE json('[]') END AS payload FROM sections ORDER BY section_order`,
    values: selected.values,
  };
}

/** Prepared values belong to storage; report policy and HTTP parsing stay outside. */
export function buildStatsQueryPlan(query: StatsQuery, window: StatsWindow, policy: ReferralPolicy): QueryPredicate[] {
  const bucketSql = window.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00:00Z', observed_at)"
    : "strftime('%Y-%m-%d', observed_at)";
  const rules = referralRulesJson(policy);
  return REPORT_SECTION_GROUPS.map((names, index) => {
    const includeOutgoing = names.some(name => name === 'transitions' || name === 'referrer-details');
    const evidenceCohorts = names.some(name => name === 'verification' || name === 'vendor-ip');
    const selected = predicateFor(window, query, includeOutgoing);
    const report = reportSql(selected, bucketSql, query.range === 'all' && index === 0, names, includeOutgoing, evidenceCohorts);
    return { sql: report.sql, values: [...report.values, rules, ...(includeOutgoing ? [query.path ?? null] : [])] };
  });
}
