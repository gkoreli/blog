import { REPORT_PROJECTION_RULE_SHA256 } from './report-projection.js';
import { SIGNATURE_REPORT_FACTS, NETWORK_REPORT_FACTS } from './report-fact-expressions.js';
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
  let parameter = 0;
  return { sql: sql.replaceAll('?', () => `?${++parameter}`), values };
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

const PROJECTED_INPUTS = {
  ...REPORT_INPUTS,
  'fetch-metadata': ['report_metadata'],
  'vendor-cache': ['report_cache'], 'vendor-ip': ['report_network'],
  'directory-publication': ['report_directory'],
  'native-category': ['reader_kind','agent_name','report_native_category','report_signature_basis','report_verifier_profile'],
  'kind-signature': ['reader_kind','agent_name','report_native_category','report_signature_basis','report_verifier_profile'],
  'client-evidence': ['reader_kind','agent_name','report_native_category','report_signature_basis','report_verifier_profile'],
  verification: ['report_verification'],
  device: ['report_form','report_form_recorded','report_form_unsupported','report_form_differing','report_form_defaulted'],
} as const satisfies Readonly<Record<ReportSection, readonly string[]>>;

function reportSql(selected: QueryPredicate, bucketSql: string, includeBoundary: boolean, sectionNames: readonly ReportSection[], includeOutgoing: boolean, evidenceCohorts: boolean, projected = false): QueryPredicate {
  const scopedPath = `?${selected.values.length + 2}`;
  const pathScope = includeOutgoing ? `(${scopedPath} IS NULL OR path = ${scopedPath})` : '1';
  const inputColumns = [...new Set([...(evidenceCohorts ? [] : ['path']), 'referrer_host', ...sectionNames.flatMap(name => projected ? PROJECTED_INPUTS[name] : REPORT_INPUTS[name])])];
  const selectedColumns = inputColumns.map(column => column === 'report_network_state' ? 'network_projection.network_state AS report_network_state' : column);
  const projectionJoin = inputColumns.includes('report_network_state')
    ? `LEFT JOIN page_observation_network_facts AS network_projection ON network_projection.observation_id = page_observations.id AND network_projection.rule_sha256 = '${NETWORK_REPORT_RULE_SHA256}'` : '';
  const publicReason = reportedReasonSql();
  const publicKind = reportedKindSql();
  const publicSigner = signerLabelSql('signature_agent');
  const boundaryCte = includeBoundary
    ? `boundary AS MATERIALIZED (
        SELECT MIN(observed_at) AS first_observed_at
        FROM ${projected ? 'main.page_observations AS page_observations' : 'page_observations'} WHERE ${PUBLIC_OBSERVATION_PREDICATE}
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
  const projections: Record<ReportSection, string> = {
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
          FROM page_observations WHERE ${selected.sql} AND COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) = 1 AND ${pathScope}
        )`,
    'vendor-cache': `(${vendorCacheReportProjectionSql()})`,
    'vendor-ip': `(
          SELECT json_array(json_object(
            ${Object.entries(NETWORK_REPORT_FACTS).map(([key, expression]) => `'${key}', SUM(network_views * (${expression}))`).join(',\n            ')}
          )) FROM vendor_network_facts
        )`,
    'verification': `(
          SELECT json_array(${boundedJsonObjectSql(Object.fromEntries(Object.entries(SIGNATURE_REPORT_FACTS).map(([key, expression]) => [key, `SUM(signature_views * (${expression}))`])))}) FROM signature_summary
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
  if (projected) {
    const groupedFact = (column: string) => `(SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
      SELECT json_set(${column},'$.views',SUM(event_views)) AS row_json FROM included GROUP BY ${column} ORDER BY ${column}))`;
    projections['fetch-metadata'] = groupedFact('report_metadata');
    projections['vendor-cache'] = groupedFact('report_cache');
    projections['vendor-ip'] = `(SELECT json_array(${boundedJsonObjectSql(Object.fromEntries(Object.keys(NETWORK_REPORT_FACTS).map((key,index) => [key, `SUM(event_views * json_extract(report_network,'$[${index}]'))`])))}) FROM included)`;
    projections.verification = `(SELECT json_array(${boundedJsonObjectSql(Object.fromEntries(Object.keys(SIGNATURE_REPORT_FACTS).map((key,index) => [key, `SUM(event_views * json_extract(report_verification,'$[${index}]'))`])))}) FROM included)`;
    projections.device = `(SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
      SELECT json_object('key1',report_form,'views',COUNT(*),'recordedViews',SUM(report_form_recorded),
        'unsupportedHintViews',SUM(report_form_unsupported),'differingSignalsViews',SUM(report_form_differing),
        'legacyDefaultedViews',SUM(report_form_defaulted)) AS row_json FROM included GROUP BY report_form ORDER BY COUNT(*) DESC,report_form))`;
    projections['directory-publication'] = `(SELECT COALESCE(json_group_array(json(row_json)),json('[]')) FROM (
      SELECT json_object('key1',report_directory,'views',SUM(event_views)) AS row_json FROM included GROUP BY report_directory ORDER BY SUM(event_views) DESC,report_directory))`;
  }

  const names: readonly ReportSection[] = includeBoundary ? [...sectionNames, 'boundary'] : sectionNames;
  const sectionValues = names.map((name,index) => `('${name}', ${index})`);

  // Host assessment reads only its own columns. Keeping it independent of the
  // event projection avoids expanding a wide CTE for every aggregate reference.
  const ctes = [referralAssessmentCtes(`
    SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
    FROM page_observations WHERE ${selected.sql}
      AND referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253
  `, selected.values.length + 1)];
  if (includeOutgoing) {
    ctes.push(`assessed AS MATERIALIZED (
      SELECT ${selectedColumns.join(', ')}, COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) AS referral_excluded
      FROM page_observations ${projectionJoin} WHERE ${selected.sql}
    )`, `included AS (SELECT * FROM assessed WHERE referral_excluded = 0 AND ${pathScope})`);
  } else {
    ctes.push(`included AS MATERIALIZED (
      SELECT ${selectedColumns.join(', ')}${evidenceCohorts ? ', COUNT(*) AS event_views' : ''}
      FROM page_observations ${projectionJoin} WHERE ${selected.sql}
        AND COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) = 0
      ${evidenceCohorts ? `GROUP BY ${inputColumns.join(', ')}` : ''}
    )`);
  }
  if (!projected && sectionNames.includes('directory-publication')) ctes.push(`directory_inputs AS MATERIALIZED (
    SELECT signature_evidence, signature_status, SUM(event_views) AS directory_views
    FROM included GROUP BY signature_evidence, signature_status
  )`);
  if (sectionNames.some(name => name === 'native-category' || name === 'kind-signature' || name === 'client-evidence')) {
    if (projected) ctes.push(`client_evidence_facts AS MATERIALIZED (
      SELECT CASE WHEN reader_kind IN (${READER_KINDS.map(kind => "'" + kind + "'").join(',')}) THEN reader_kind ELSE NULL END AS evidence_kind,
        CASE WHEN agent_name IS NOT NULL THEN 'selected' ELSE 'not-selected' END AS name_selection,
        report_native_category AS native_category,report_signature_basis AS signature_basis,report_verifier_profile AS verifier_profile,event_views AS client_views FROM included
    )`);
    else ctes.push(`client_inputs AS MATERIALIZED (
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
  if (!projected && sectionNames.some(name => name === 'vendor-cache' || name === 'vendor-ip')) {
    ctes.push(`vendor_network_inputs AS MATERIALIZED (
      SELECT vendor_ip_evidence, report_network_state, SUM(event_views) AS network_views FROM included GROUP BY vendor_ip_evidence, report_network_state
    )`, `vendor_network_facts AS MATERIALIZED (
      SELECT vendor_ip_evidence, network_views, CASE WHEN report_network_state IS NOT NULL THEN report_network_state ELSE (${vendorNetworkStateSql()}) END AS network_state FROM vendor_network_inputs
    )`);
  }
  if (!projected && sectionNames.includes('verification')) {
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
  if (!projected && sectionNames.includes('fetch-metadata')) ctes.push(fetchMetadataReportCtes('cohorts'));
  if (!projected && sectionNames.includes('vendor-cache')) ctes.push(vendorCacheReportCtes('cohorts'));
  if (includeBoundary) ctes.push(boundaryCte);
  ctes.push(`sections(section, section_order) AS MATERIALIZED (VALUES ${sectionValues.join(', ')})`);

  return {
    sql: `WITH RECURSIVE ${projected ? `page_observations AS (SELECT observation_id AS id,* FROM page_observation_report_facts WHERE rule_sha256='${REPORT_PROJECTION_RULE_SHA256}'),` : ''}${ctes.join(',\n')}
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

/** A complete versioned read-model snapshot, with a source coverage guard in
 * the same transaction. Incomplete facts are discarded before source fallback.
 */
export function buildProjectedStatsQueryPlan(query: StatsQuery, window: StatsWindow, policy: ReferralPolicy): QueryPredicate[] {
  const bucketSql = window.granularity === 'hour' ? "strftime('%Y-%m-%dT%H:00:00Z', observed_at)" : "strftime('%Y-%m-%d', observed_at)";
  const rules = referralRulesJson(policy);
  return REPORT_SECTION_GROUPS.map((names,index) => {
    const outgoing = names.some(name => name === 'transitions' || name === 'referrer-details');
    const selected = predicateFor(window,query,outgoing);
    const report = reportSql(selected,bucketSql,query.range==='all' && index===0,names,outgoing,names.some(name => name === 'verification' || name === 'vendor-ip'),true);
    if (index===0) {
      // Cover outgoing context as well as selected paths; policy-excluded missing
      // rows conservatively trigger fallback. The owner registry stays live.
      const coverage = predicateFor(window,query,true);
      const start = selected.values.length + (outgoing ? 3 : 2);
      const coverageSql = coverage.sql.replace(/\?(\d+)/g,(_,number) => `?${Number(number)+start-1}`);
      const guard = `NOT EXISTS (SELECT 1 FROM main.page_observations AS page_observations WHERE ${coverageSql}
        AND NOT EXISTS (SELECT 1 FROM page_observation_report_facts AS facts WHERE facts.observation_id=page_observations.id AND facts.rule_sha256='${REPORT_PROJECTION_RULE_SHA256}'))`;
      report.sql = report.sql.replace('SELECT section, CASE section', `SELECT ${guard} AS projection_complete, section, CASE section`);
      return {sql:report.sql,values:[...report.values,rules,...(outgoing?[query.path??null]:[]),...coverage.values]};
    }
    return {sql:report.sql,values:[...report.values,rules,...(outgoing?[query.path??null]:[])]};
  });
}
