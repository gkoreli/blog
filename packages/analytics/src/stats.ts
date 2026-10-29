import { boundedJsonObjectSql } from './sql-json.js';
import { vendorNetworkStateSql, consistentVendorNetworkSummary } from './vendor-network-summary.js';
import { signatureCoverageRecordedSql } from './signature-coverage-report.js';
import { measuredReportBatch, type ReportCalculationObserver } from './report-cost.js';
import { nativeBooleanStateSql, vendorSignatureStateSql, consistentSignatureSummary } from './signature-summary.js';
import { signatureSelectionRecordedSql } from './signature-selection.js';
import {
  READER_GROUPS,
  READER_KINDS,
  isReaderKind,
  readerGroupOf,
  type ReaderKind,
  type StatsRange,
  type StatsResponse,
  type TimeSeriesPoint,
  type TrafficFilter,
} from './contracts.js';
import type { Env } from './db.js';
import { KNOWN_AGENT_NAMES } from './classify.js';
import { CLIENT_FORMS, CLIENT_FORM_PROFILE, isReportedClientForm } from './client-form.js';
import { agentReaderKinds } from './readerkind.js';
import { PUBLIC_SIGNERS, isPublicSignerName } from './signers.js';
import {
  completeTimeSeries,
  createStatsWindow,
  parseStatsRange,
  type StatsWindow,
} from './dates.js';
import { partitionPredicate } from './partition.js';
import { reportedKindSql, reportedReasonSql, unresolvedKindSql, CLASSIFICATION_REASON_UNAVAILABLE } from './reporting-kind.js';
import { publicReferrers } from './referrals.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { signatureBasisSql, signatureLocalStateSql, isSignatureBasis } from './signature-basis.js';
import { verifierProfileSql, isReportedVerifierProfile, CURRENT_VERIFIER_PROFILE } from './verifier-profile.js';
import { nativeCategoryBasisSql, isNativeCategoryBasis } from './native-bot-evidence.js';
import { directoryPublicationBasisSql, isDirectoryPublicationBasis } from './directory-publication.js';
import type { ReferralPolicy } from './referral-policy.js';

export type { StatsResponse, TrafficFilter } from './contracts.js';

export interface StatsQuery {
  range: StatsRange;
  traffic: TrafficFilter;
  path?: string;
  agent?: string;
  kind?: ReaderKind;
}

interface QueryPredicate {
  sql: string;
  values: unknown[];
}

const PUBLIC_OBSERVATION_PREDICATE = `is_owner = 0 AND NOT EXISTS (
  SELECT 1 FROM owner_clients
  WHERE owner_clients.daily_client_id = page_observations.daily_client_id
)`;

function parseTrafficFilter(value: string | null): TrafficFilter | null {
  switch (value) {
    case 'browser':
    case 'agents':
    case 'crawlers':
    case 'automation':
    case 'unresolved':
    case 'all':
      return value;
    default:
      return null;
  }
}

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

function numberField(row: Record<string, unknown> | undefined, field: string): number {
  const value = row?.[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** SUM over an empty selection is null; a missing or mistyped API field is not zero. */
function summaryNumberField(row: Record<string, unknown> | undefined, field: string): number {
  if (!row || !Object.hasOwn(row,field)) return malformedReport();
  const value = row[field];
  if (value === null) return 0;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : malformedReport();
}

function stringField(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];
  return typeof value === 'string' ? value : null;
}

function pathRows(rows: Record<string, unknown>[]): StatsResponse['byPath'] {
  const result: StatsResponse['byPath'] = [];
  for (const row of rows) {
    const path = stringField(row, 'key1');
    if (path !== null) result.push({ path, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function countryRows(rows: Record<string, unknown>[]): StatsResponse['byCountry'] {
  const result: StatsResponse['byCountry'] = [];
  for (const row of rows) {
    const country = stringField(row, 'key1');
    if (country !== null) result.push({ country, views: numberField(row, 'views') });
  }
  return result;
}

function kindSignatureRows(rows: Record<string, unknown>[], total: number): StatsResponse['byKindSignature'] {
  const result: StatsResponse['byKindSignature'] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    const kind = stringField(row, 'key1');
    const basis = stringField(row, 'key2');
    const profile = row.key3;
    if ((kind !== null && !isReaderKind(kind)) || basis === null || !isSignatureBasis(basis) || !isReportedVerifierProfile(profile)) return malformedReport();
    const views = row.views;
    const key = JSON.stringify([kind, basis, profile]);
    if (typeof views !== 'number' || !Number.isSafeInteger(views) || views <= 0 || keys.has(key)) return malformedReport();
    keys.add(key);
    result.push({ kind, basis, profile, views });
  }
  if (result.reduce((sum, row) => sum + row.views, 0) !== total) return malformedReport();
  return result;
}

function nativeCategoryRows(rows: Record<string, unknown>[], total: number): StatsResponse['byKindNativeCategory'] {
  const result: StatsResponse['byKindNativeCategory'] = [], keys = new Set<string>();
  for (const row of rows) {
    const kind = row.key1, basis = row.key2, views = row.views;
    const key = JSON.stringify([kind, basis]);
    if ((kind !== null && (typeof kind !== 'string' || !isReaderKind(kind))) || !isNativeCategoryBasis(basis) || typeof views !== 'number' || !Number.isSafeInteger(views) || views <= 0 || keys.has(key)) return malformedReport();
    keys.add(key); result.push({ kind, basis, views });
  }
  if (result.reduce((sum, row) => sum + row.views, 0) !== total) return malformedReport();
  return result;
}

function seriesRows(rows: Record<string, unknown>[]): TimeSeriesPoint[] {
  const result: TimeSeriesPoint[] = [];
  for (const row of rows) {
    const bucket = stringField(row, 'key1');
    if (bucket !== null) result.push({ bucket, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function directoryPublicationRows(rows: Record<string, unknown>[], total: number): StatsResponse['byDirectoryPublication'] {
  const result: StatsResponse['byDirectoryPublication'] = [], keys = new Set<string>();
  for (const row of rows) {
    const basis = row.key1, views = row.views;
    if (!isDirectoryPublicationBasis(basis) || typeof views !== 'number' || !Number.isSafeInteger(views) || views <= 0 || keys.has(basis)) return malformedReport();
    keys.add(basis); result.push({ basis, views });
  }
  if (result.reduce((sum, row) => sum + row.views, 0) !== total) return malformedReport();
  return result;
}

function referrerRows(rows: Record<string, unknown>[]): StatsResponse['byReferrer'] {
  const result: StatsResponse['byReferrer'] = [];
  for (const row of rows) {
    const referrerHost = stringField(row, 'key1');
    if (referrerHost !== null) result.push({ referrerHost, views: numberField(row, 'views') });
  }
  return result;
}

function referrerStateRows(rows: Record<string, unknown>[]): StatsResponse['byReferrerState'] {
  const result: StatsResponse['byReferrerState'] = [];
  for (const row of rows) {
    const state = stringField(row, 'key1');
    if (state === 'external' || state === 'internal' || state === 'absent'
      || state === 'unusable' || state === 'legacy-unknown') {
      result.push({ state, views: numberField(row, 'views') });
    } else return malformedReport();
  }
  return result;
}

function transitionRows(rows: Record<string, unknown>[]): StatsResponse['internalTransitions'] {
  const result: StatsResponse['internalTransitions'] = [];
  for (const row of rows) {
    const fromPath = stringField(row, 'key1');
    const toPath = stringField(row, 'key2');
    if (fromPath === null || toPath === null) return malformedReport();
    result.push({ fromPath, toPath, views: numberField(row, 'views') });
  }
  return result;
}

function clientFormRows(rows: Record<string, unknown>[]): { rows: StatsResponse['byClientForm']; evidence: StatsResponse['clientFormEvidence'] } {
  const result: StatsResponse['byClientForm'] = [];
  const evidence: StatsResponse['clientFormEvidence'] = { recordedViews: 0, historicalViews: 0, unrecognizedRecordViews: 0, unsupportedHintViews: 0, differingSignalsViews: 0, legacyDefaultedViews: 0 };
  for (const row of rows) {
    const form = stringField(row, 'key1');
    if (form === null || !isReportedClientForm(form)) return malformedReport();
    const views = numberField(row, 'views');
    const recorded = numberField(row, 'recordedViews');
    if (recorded > views) return malformedReport();
    result.push({ form, views });
    evidence.recordedViews += recorded;
    evidence.historicalViews += form === 'unrecognized-record' ? 0 : views - recorded;
    if (form === 'unrecognized-record') evidence.unrecognizedRecordViews += views;
    evidence.unsupportedHintViews += numberField(row, 'unsupportedHintViews');
    evidence.differingSignalsViews += numberField(row, 'differingSignalsViews');
    evidence.legacyDefaultedViews += numberField(row, 'legacyDefaultedViews');
  }
  return { rows: result, evidence };
}

function agentRows(rows: Record<string, unknown>[]): StatsResponse['byAgent'] {
  const result: StatsResponse['byAgent'] = [];
  for (const row of rows) {
    const agentName = stringField(row, 'key1');
    const trafficClass = stringField(row, 'key2');
    if (agentName !== null && (trafficClass === 'bot' || trafficClass === 'ai')) {
      result.push({ agentName, trafficClass, views: numberField(row, 'views') });
    }
  }
  return result;
}

function kindRows(rows: Record<string, unknown>[], total: number): StatsResponse['byKind'] {
  const result: StatsResponse['byKind'] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    const kind = stringField(row, 'key1');
    const reason = stringField(row, 'key2');
    if (kind === null || !isReaderKind(kind) || reason === null || reason.length === 0) return malformedReport();
    if (kind === 'signed-agent' && !isPublicSignerName(reason) && reason !== CLASSIFICATION_REASON_UNAVAILABLE) return malformedReport();
    const views = row.views, dailyClients = row.dailyClients, key = JSON.stringify([kind, reason]);
    if (typeof views !== 'number' || !Number.isSafeInteger(views) || views <= 0
      || typeof dailyClients !== 'number' || !Number.isSafeInteger(dailyClients) || dailyClients < 1 || dailyClients > views || keys.has(key)) return malformedReport();
    keys.add(key); result.push({ kind, reason, views, dailyClients });
  }
  if (result.reduce((sum, row) => sum + row.views, 0) !== total) return malformedReport();
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function malformedReport(): never {
  throw new Error('Malformed statistics report');
}

function payloadRows(row: Record<string, unknown>): Record<string, unknown>[] {
  const payload = stringField(row, 'payload');
  if (payload === null) return malformedReport();
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return malformedReport();
  }
  if (!Array.isArray(parsed) || !parsed.every(isRecord)) return malformedReport();
  return parsed;
}

function reportSections(rows: Record<string, unknown>[], includeBoundary: boolean): Map<string, Record<string, unknown>[]> {
  const expected = new Set([
    'totals', 'path', 'country', 'series', 'referrer', 'device', 'agent', 'kind', 'excluded',
    'referrer-state', 'transitions', 'referrer-details', 'signer', 'verification', 'vendor-ip', 'kind-signature', 'native-category', 'directory-publication',
  ]);
  if (includeBoundary) expected.add('boundary');
  const sections = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const section = stringField(row, 'section');
    if (section === null || !expected.has(section) || sections.has(section)) return malformedReport();
    const payload = payloadRows(row);
    if ((section === 'totals' || section === 'excluded' || section === 'boundary' || section === 'referrer-details' || section === 'verification' || section === 'vendor-ip') && payload.length !== 1) {
      return malformedReport();
    }
    sections.set(section, payload);
  }
  if (sections.size !== expected.size) return malformedReport();
  return sections;
}

function requiredSection(sections: Map<string, Record<string, unknown>[]>, section: string): Record<string, unknown>[] {
  return sections.get(section) ?? malformedReport();
}

/** Exact origins only: no suffix matching, normalization or caller-controlled SQL. */
function signerLabelSql(column: 'signature_agent' | 'reader_reason'): string {
  const cases = PUBLIC_SIGNERS.map(({ origin, name }) =>
    `WHEN '${origin.replaceAll("'", "''")}' THEN '${name.replaceAll("'", "''")}'`);
  return `CASE ${column} ${cases.join(' ')} ELSE 'Other' END`;
}

function reportSql(selected: QueryPredicate, bucketSql: string, includeBoundary: boolean): QueryPredicate {
  const publicReason = reportedReasonSql();
  const publicKind = reportedKindSql();
  const publicSigner = signerLabelSql('signature_agent');
  const boundaryCte = includeBoundary
    ? `, boundary AS MATERIALIZED (
        SELECT MIN(observed_at) AS first_observed_at
        FROM page_observations WHERE ${PUBLIC_OBSERVATION_PREDICATE}
      )`
    : '';
  const boundaryProjection = includeBoundary
    ? `WHEN 'boundary' THEN (
        SELECT json_array(json_object('firstObservedAt', first_observed_at)) FROM boundary
      )`
    : '';
  const formProfile = `json_extract(client_form_evidence, '$.profile') = '${CLIENT_FORM_PROFILE}'`;
  const currentForm = `${formProfile} AND json_extract(client_form_evidence, '$.form') IN (${CLIENT_FORMS.map(value => `'${value}'`).join(', ')})`;
  const form = `CASE WHEN client_form_evidence IS NOT NULL THEN
    CASE WHEN ${currentForm}
      THEN json_extract(client_form_evidence, '$.form') ELSE 'unrecognized-record' END
    WHEN device_type = 'desktop' THEN 'historical-desktop-default'
    WHEN device_type = 'mobile' THEN 'historical-mobile-heuristic'
    WHEN device_type = 'tablet' THEN 'historical-tablet-heuristic' ELSE 'unrecognized-record' END`;
  const sectionValues = [
    "('totals', 0)", "('path', 1)", "('country', 2)", "('series', 3)", "('referrer', 4)",
    "('device', 5)", "('agent', 6)", "('kind', 7)", "('excluded', 8)",
    "('referrer-state', 9)", "('transitions', 10)", "('referrer-details', 11)",
    "('signer', 12)", "('verification', 14)", "('vendor-ip', 15)", "('kind-signature', 16)", "('native-category', 17)", "('directory-publication', 18)",
  ];
  if (includeBoundary) sectionValues.push("('boundary', 13)");

  return {
    sql: `WITH RECURSIVE
      selected AS MATERIALIZED (
        SELECT path, country, daily_client_id, traffic_class, agent_name, device_type,
               reader_kind, reader_reason, referrer_host, observed_at,
               referrer_state, internal_referrer_path, representation, signature_status, signature_agent, signature_evidence, vendor_ip_evidence, client_form_evidence
        FROM page_observations WHERE ${selected.sql}
      ),
      ${referralAssessmentCtes(`
        SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
        FROM selected
        WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253
      `)},
      assessed AS MATERIALIZED (
        SELECT selected.*,
          COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) AS referral_excluded
        FROM selected
      ),
      report_scope AS MATERIALIZED (
        SELECT * FROM assessed WHERE (? IS NULL OR path = ?)
      ),
      included AS MATERIALIZED (
        SELECT * FROM report_scope WHERE referral_excluded = 0
      ),
      vendor_network_facts AS MATERIALIZED (
        SELECT vendor_ip_evidence, ${vendorNetworkStateSql()} AS network_state FROM included
      ),
      signature_facts AS MATERIALIZED (
        SELECT signature_evidence, signature_status,
          ${signatureLocalStateSql()} AS local_state,
          ${signatureCoverageRecordedSql()} AS coverage_valid,
          ${nativeBooleanStateSql()} AS native_state
        FROM included
      ),
      signature_summary AS MATERIALIZED (
        SELECT *, ${vendorSignatureStateSql()} AS vendor_state,
          ${signatureSelectionRecordedSql()} AS selection_valid FROM signature_facts
      )
      ${boundaryCte},
      sections(section, section_order) AS MATERIALIZED (
        VALUES ${sectionValues.join(', ')}
      )
    SELECT section,
      CASE section
        WHEN 'directory-publication' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', basis, 'views', COUNT(*)) AS row_json
            FROM (SELECT ${directoryPublicationBasisSql()} AS basis FROM included)
            GROUP BY basis ORDER BY COUNT(*) DESC, basis
          )
        )
        WHEN 'native-category' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', CASE WHEN reader_kind IN (${READER_KINDS.map(kind => "'" + kind + "'").join(',')}) THEN reader_kind ELSE NULL END, 'key2', ${nativeCategoryBasisSql()}, 'views', COUNT(*)) AS row_json
            FROM included GROUP BY CASE WHEN reader_kind IN (${READER_KINDS.map(kind => "'" + kind + "'").join(',')}) THEN reader_kind ELSE NULL END, ${nativeCategoryBasisSql()} ORDER BY COUNT(*) DESC, reader_kind, ${nativeCategoryBasisSql()}
          )
        )
        WHEN 'totals' THEN (
          SELECT json_array(json_object(
            'views', COUNT(*), 'dailyClients', COUNT(DISTINCT daily_client_id),
            'unattributedViews', SUM(CASE WHEN referrer_host IS NULL THEN 1 ELSE 0 END)
          )) FROM included
        )
        WHEN 'path' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', path, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY path ORDER BY COUNT(*) DESC, path
          )
        )
        WHEN 'country' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', country, 'views', COUNT(*)) AS row_json
            FROM included WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC, country
          )
        )
        WHEN 'series' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${bucketSql}, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY ${bucketSql} ORDER BY ${bucketSql}
          )
        )
        WHEN 'referrer' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', referrer_host, 'views', COUNT(*)) AS row_json
            FROM included WHERE referrer_host IS NOT NULL
            GROUP BY referrer_host ORDER BY COUNT(*) DESC, referrer_host
          )
        )
        WHEN 'device' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${form}, 'views', COUNT(*),
              'recordedViews', SUM(COALESCE(${currentForm}, 0)),
              'unsupportedHintViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.mobileHint') = 'unsupported'),
              'differingSignalsViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.comparison') = 'different-indicators'),
              'legacyDefaultedViews', SUM(${formProfile} AND json_extract(client_form_evidence, '$.legacyCompatibility.defaulted') = 1)) AS row_json
            FROM included GROUP BY ${form} ORDER BY COUNT(*) DESC, ${form}
          )
        )
        WHEN 'agent' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', agent_name, 'key2', traffic_class, 'views', COUNT(*)) AS row_json
            FROM included WHERE agent_name IS NOT NULL
            GROUP BY agent_name, traffic_class ORDER BY COUNT(*) DESC, agent_name
          )
        )
        WHEN 'kind' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${publicKind}, 'key2', ${publicReason}, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included
            GROUP BY ${publicKind}, ${publicReason} ORDER BY COUNT(*) DESC, ${publicKind}, ${publicReason}
          )
        )
        WHEN 'signer' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${publicSigner}, 'views', COUNT(*)) AS row_json
            FROM included WHERE signature_status = 'verified' AND signature_agent IS NOT NULL
            GROUP BY ${publicSigner} ORDER BY COUNT(*) DESC, ${publicSigner}
          )
        )
        WHEN 'kind-signature' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', evidence_kind, 'key2', basis, 'key3', profile, 'views', COUNT(*)) AS row_json
            FROM (SELECT CASE WHEN reader_kind IN (${READER_KINDS.map(kind => `'${kind}'`).join(', ')})
              THEN reader_kind ELSE NULL END AS evidence_kind, ${signatureBasisSql()} AS basis, ${verifierProfileSql()} AS profile FROM included)
            GROUP BY evidence_kind, basis, profile ORDER BY COUNT(*) DESC, evidence_kind, basis, profile
          )
        )
        WHEN 'excluded' THEN (
          SELECT json_array(json_object('views', COUNT(*)))
          FROM report_scope WHERE referral_excluded = 1
        )
        WHEN 'vendor-ip' THEN (
          SELECT json_array(json_object(
            'recordedViews', SUM(vendor_ip_evidence IS NOT NULL),
            'notRecordedViews', SUM(network_state = 'not-recorded'),
            'recognizedViews', SUM(network_state = 'recognized'),
            'unrecognizedViews', SUM(network_state = 'unrecognized'),
            'configuredDeclarationViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.configuredDeclarationCount') > 0),
            'unmappedDeclarationViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.unmappedDeclarationCount') > 0),
            'noDeclarationViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.declarationCount') = 0),
            'listedViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.listed') = 1),
            'notListedViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.notListed') = 1),
            'unavailableViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.unavailable') = 1),
            'notAssessedViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.summary.notAssessed') = 1),
            'addressUnavailableViews', SUM(network_state = 'recognized' AND json_extract(vendor_ip_evidence, '$.configuredDeclarationCount') > 0 AND json_extract(vendor_ip_evidence, '$.address.state') <> 'usable')
          )) FROM vendor_network_facts
        )
        WHEN 'verification' THEN (
          SELECT json_array(${boundedJsonObjectSql({
            localInvalidViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'invalid')",
            localUnsupportedViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'unsupported')",
            localUnavailableViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'unavailable')",
            localPolicyRejectedViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'policy-rejected')",
            localNotApplicableViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'not-applicable')",
            localIndeterminateViews: "SUM(local_state = 'unverified' AND json_extract(signature_evidence, '$.localOutcome') = 'indeterminate')",
            unverifiedOutcomeNotRecordedViews: "SUM(local_state = 'unverified' AND json_type(signature_evidence, '$.localOutcome') IS NULL)",
            vendorDocumentedViews: "SUM(vendor_state NOT IN ('not-recorded','unrecognized','test-injected') AND json_extract(signature_evidence, '$.vendor.documentedDeclarationCount') > 0)",
            vendorMatchingOriginViews: "SUM(vendor_state = 'matching-origin')",
            vendorDifferentOriginViews: "SUM(vendor_state = 'different-origin')",
            vendorOriginConflictViews: "SUM(vendor_state = 'conflicting-origins')",
            vendorConflictWithMatchingOriginViews: "SUM(vendor_state = 'conflicting-origins' AND local_state = 'verified' AND json_extract(signature_evidence, '$.vendor.matchingDeclarationCount') > 0)",
            vendorNotVerifiedViews: "SUM(vendor_state = 'not-verified')",
            vendorUnmappedDeclarationViews: "SUM(vendor_state NOT IN ('not-recorded','unrecognized','test-injected') AND json_extract(signature_evidence, '$.vendor.unmappedDeclarationCount') > 0)",
            vendorUserAgentBoundViews: "SUM(vendor_state = 'matching-origin' AND json_type(signature_evidence, '$.vendor.userAgentCovered') = 'true')",
            vendorCheckNotRecordedViews: "SUM(vendor_state = 'not-recorded')",
            vendorCheckUnrecognizedViews: "SUM(vendor_state = 'unrecognized')",
            vendorCheckRecognizedViews: "SUM(vendor_state NOT IN ('unrecognized','not-recorded'))",
            recordedViews: "SUM(signature_evidence IS NOT NULL)",
            notRecordedViews: "SUM(signature_evidence IS NULL)",
            localVerifiedViews: "SUM(local_state = 'verified')",
            localUnverifiedViews: "SUM(local_state = 'unverified')",
            localAbsentViews: "SUM(local_state = 'absent')",
            unrecognizedLocalViews: "SUM(local_state = 'unrecognized')",
            testVerdictViews: "SUM(local_state = 'test-injected')",
            coverageRecordedViews: "SUM(local_state = 'verified' AND coverage_valid = 1)",
            coverageNotRecordedVerifiedViews: "SUM(local_state = 'verified' AND COALESCE(json_type(signature_evidence, '$.coverage'), 'null') = 'null')",
            coverageUnrecognizedVerifiedViews: "SUM(local_state = 'verified' AND coverage_valid = 0 AND COALESCE(json_type(signature_evidence, '$.coverage'), 'null') <> 'null')",
            selectionRecordedViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1)",
            selectionNotRecordedVerifiedViews: "SUM(local_state = 'verified' AND json_type(signature_evidence, '$.coverage.selection') IS NULL AND COALESCE(json_extract(signature_evidence, '$.coverage.version'), '2026-10-27.1') = '2026-10-27.1')",
            selectionUnrecognizedVerifiedViews: "SUM(local_state = 'verified' AND NOT (coverage_valid = 1 AND selection_valid = 1) AND NOT (json_type(signature_evidence, '$.coverage.selection') IS NULL AND COALESCE(json_extract(signature_evidence, '$.coverage.version'), '2026-10-27.1') = '2026-10-27.1'))",
            multipleTaggedCandidateViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1 AND json_extract(signature_evidence, '$.coverage.selection.taggedCandidates') > 1)",
            unassessedCandidateViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND selection_valid = 1 AND json_extract(signature_evidence, '$.coverage.selection.unassessedCandidates') > 0)",
            userAgentBoundViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.userAgent') = 'true')",
            resourceBoundViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND (json_type(signature_evidence, '$.coverage.covered.path') = 'true' OR json_type(signature_evidence, '$.coverage.covered.targetUri') = 'true'))",
            methodBoundViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.method') = 'true')",
            authorityOnlyViews: "SUM(local_state = 'verified' AND coverage_valid = 1 AND json_type(signature_evidence, '$.coverage.covered.authority') = 'true' AND json_type(signature_evidence, '$.coverage.covered.targetUri') = 'false' AND json_type(signature_evidence, '$.coverage.covered.path') = 'false' AND json_type(signature_evidence, '$.coverage.covered.method') = 'false' AND json_type(signature_evidence, '$.coverage.covered.query') = 'false')",
            nativeAvailableViews: "SUM(native_state = 'available')",
            nativeUnavailableViews: "SUM(native_state = 'unavailable')",
            nativeNotRecordedViews: "SUM(native_state = 'not-recorded')",
            nativeUnrecognizedViews: "SUM(native_state = 'unrecognized')",
            nativeVerifiedBotViews: "SUM(native_state = 'available' AND json_type(signature_evidence, '$.native.verifiedBot') = 'true')",
            nativeSignedAgentViews: "SUM(native_state = 'available' AND json_type(signature_evidence, '$.native.signedAgent') = 'true')",
            localVerifiedNativeNotVerifiedViews: "SUM(local_state = 'verified' AND native_state = 'available' AND json_type(signature_evidence, '$.native.verifiedBot') = 'false')",
          })}) FROM signature_summary
        )
        WHEN 'referrer-state' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', COALESCE(referrer_state,
              CASE WHEN referrer_host IS NOT NULL THEN 'external' ELSE 'legacy-unknown' END),
              'views', COUNT(*)) AS row_json
            FROM included GROUP BY COALESCE(referrer_state,
              CASE WHEN referrer_host IS NOT NULL THEN 'external' ELSE 'legacy-unknown' END)
          )
        )
        WHEN 'transitions' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', internal_referrer_path, 'key2', path, 'views', COUNT(*)) AS row_json
            FROM assessed WHERE referral_excluded = 0 AND representation = 'html'
              AND referrer_state = 'internal' AND internal_referrer_path IS NOT NULL
              AND internal_referrer_path <> path
            GROUP BY internal_referrer_path, path ORDER BY COUNT(*) DESC, internal_referrer_path, path
          )
        )
        WHEN 'referrer-details' THEN (
          SELECT json_array(json_object(
            'firstCapturedAt', MIN(CASE WHEN referrer_state IS NOT NULL THEN observed_at END),
            'unrecognizedPathViews', SUM(CASE WHEN referrer_state = 'internal'
              AND internal_referrer_path IS NULL AND representation = 'html' THEN 1 ELSE 0 END),
            'selfReferrals', SUM(CASE WHEN referrer_state = 'internal'
              AND internal_referrer_path = path AND representation = 'html' THEN 1 ELSE 0 END)
          )) FROM assessed WHERE referral_excluded = 0
        )
        ${boundaryProjection}
        ELSE json('[]')
      END AS payload
    FROM sections ORDER BY section_order`,
    values: selected.values,
  };
}

export async function queryStats(db: D1Database, query: StatsQuery, now = new Date(), policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY, observeCalculation?: ReportCalculationObserver): Promise<StatsResponse> {
  const initialWindow = createStatsWindow(query.range, now);
  const selected = predicateFor(initialWindow, query, true);
  const bucketSql = initialWindow.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00:00Z', observed_at)"
    : "strftime('%Y-%m-%d', observed_at)";
  const report = reportSql(selected, bucketSql, query.range === 'all');
  const statement = db.prepare(report.sql).bind(...report.values, referralRulesJson(policy), query.path ?? null, query.path ?? null);
  const results = await measuredReportBatch(db, statement, observeCalculation);
  const rows = results[0]?.results ?? [];
  const sections = reportSections(rows, query.range === 'all');
  const firstObservedRow = query.range === 'all' ? requiredSection(sections, 'boundary')[0] : undefined;
  const firstObservedAt = firstObservedRow ? stringField(firstObservedRow, 'firstObservedAt') : null;
  const window = createStatsWindow(query.range, now, firstObservedAt ?? undefined);
  const totalsRow = requiredSection(sections, 'totals')[0];
  const populatedSeries = seriesRows(requiredSection(sections, 'series'));
  const referrals = publicReferrers(referrerRows(requiredSection(sections, 'referrer')), policy);
  const referrerDetails = requiredSection(sections, 'referrer-details')[0];
  const verificationRow = requiredSection(sections, 'verification')[0];
  const vendorNetworkRow = requiredSection(sections, 'vendor-ip')[0];
  const clientForms = clientFormRows(requiredSection(sections, 'device'));

  const verification = {
    vendorCheckUnrecognizedViews: summaryNumberField(verificationRow, 'vendorCheckUnrecognizedViews'),
    vendorCheckRecognizedViews: summaryNumberField(verificationRow, 'vendorCheckRecognizedViews'),
    unrecognizedLocalViews: summaryNumberField(verificationRow, 'unrecognizedLocalViews'),
    coverageNotRecordedVerifiedViews: summaryNumberField(verificationRow, 'coverageNotRecordedVerifiedViews'),
    coverageUnrecognizedVerifiedViews: summaryNumberField(verificationRow, 'coverageUnrecognizedVerifiedViews'),
    nativeUnavailableViews: summaryNumberField(verificationRow, 'nativeUnavailableViews'),
    nativeNotRecordedViews: summaryNumberField(verificationRow, 'nativeNotRecordedViews'),
    nativeUnrecognizedViews: summaryNumberField(verificationRow, 'nativeUnrecognizedViews'),
    localInvalidViews: summaryNumberField(verificationRow, 'localInvalidViews'),
    localUnsupportedViews: summaryNumberField(verificationRow, 'localUnsupportedViews'),
    localUnavailableViews: summaryNumberField(verificationRow, 'localUnavailableViews'),
    localPolicyRejectedViews: summaryNumberField(verificationRow, 'localPolicyRejectedViews'),
    localNotApplicableViews: summaryNumberField(verificationRow, 'localNotApplicableViews'),
    localIndeterminateViews: summaryNumberField(verificationRow, 'localIndeterminateViews'),
    unverifiedOutcomeNotRecordedViews: summaryNumberField(verificationRow, 'unverifiedOutcomeNotRecordedViews'),
    vendorDocumentedViews: summaryNumberField(verificationRow, 'vendorDocumentedViews'),
    vendorMatchingOriginViews: summaryNumberField(verificationRow, 'vendorMatchingOriginViews'),
    vendorDifferentOriginViews: summaryNumberField(verificationRow, 'vendorDifferentOriginViews'),
    vendorOriginConflictViews: summaryNumberField(verificationRow, 'vendorOriginConflictViews'),
    vendorConflictWithMatchingOriginViews: summaryNumberField(verificationRow, 'vendorConflictWithMatchingOriginViews'),
    vendorNotVerifiedViews: summaryNumberField(verificationRow, 'vendorNotVerifiedViews'),
    vendorUnmappedDeclarationViews: summaryNumberField(verificationRow, 'vendorUnmappedDeclarationViews'),
    vendorUserAgentBoundViews: summaryNumberField(verificationRow, 'vendorUserAgentBoundViews'),
    vendorCheckNotRecordedViews: summaryNumberField(verificationRow, 'vendorCheckNotRecordedViews'),

    recordedViews: summaryNumberField(verificationRow, 'recordedViews'), notRecordedViews: summaryNumberField(verificationRow, 'notRecordedViews'),
    localVerifiedViews: summaryNumberField(verificationRow, 'localVerifiedViews'), localUnverifiedViews: summaryNumberField(verificationRow, 'localUnverifiedViews'), localAbsentViews: summaryNumberField(verificationRow, 'localAbsentViews'),
    testVerdictViews: summaryNumberField(verificationRow, 'testVerdictViews'),
    selectionUnrecognizedVerifiedViews: summaryNumberField(verificationRow, 'selectionUnrecognizedVerifiedViews'), selectionRecordedViews: summaryNumberField(verificationRow, 'selectionRecordedViews'), selectionNotRecordedVerifiedViews: summaryNumberField(verificationRow, 'selectionNotRecordedVerifiedViews'), multipleTaggedCandidateViews: summaryNumberField(verificationRow, 'multipleTaggedCandidateViews'), unassessedCandidateViews: summaryNumberField(verificationRow, 'unassessedCandidateViews'),
    coverageRecordedViews: summaryNumberField(verificationRow, 'coverageRecordedViews'), userAgentBoundViews: summaryNumberField(verificationRow, 'userAgentBoundViews'), resourceBoundViews: summaryNumberField(verificationRow, 'resourceBoundViews'), methodBoundViews: summaryNumberField(verificationRow, 'methodBoundViews'), authorityOnlyViews: summaryNumberField(verificationRow, 'authorityOnlyViews'),
    nativeAvailableViews: summaryNumberField(verificationRow, 'nativeAvailableViews'), nativeVerifiedBotViews: summaryNumberField(verificationRow, 'nativeVerifiedBotViews'), nativeSignedAgentViews: summaryNumberField(verificationRow, 'nativeSignedAgentViews'), localVerifiedNativeNotVerifiedViews: summaryNumberField(verificationRow, 'localVerifiedNativeNotVerifiedViews'),
  };
  const signatureRows = kindSignatureRows(requiredSection(sections, 'kind-signature'), numberField(totalsRow, 'views'));
  if (!consistentSignatureSummary(verification, numberField(totalsRow, 'views'), signatureRows)) return malformedReport();

  const vendorNetwork = {
    recognizedViews: summaryNumberField(vendorNetworkRow, 'recognizedViews'),
    unrecognizedViews: summaryNumberField(vendorNetworkRow, 'unrecognizedViews'),
    recordedViews: summaryNumberField(vendorNetworkRow, 'recordedViews'),
    notRecordedViews: summaryNumberField(vendorNetworkRow, 'notRecordedViews'),
    configuredDeclarationViews: summaryNumberField(vendorNetworkRow, 'configuredDeclarationViews'),
    unmappedDeclarationViews: summaryNumberField(vendorNetworkRow, 'unmappedDeclarationViews'),
    noDeclarationViews: summaryNumberField(vendorNetworkRow, 'noDeclarationViews'),
    listedViews: summaryNumberField(vendorNetworkRow, 'listedViews'),
    notListedViews: summaryNumberField(vendorNetworkRow, 'notListedViews'),
    unavailableViews: summaryNumberField(vendorNetworkRow, 'unavailableViews'),
    notAssessedViews: summaryNumberField(vendorNetworkRow, 'notAssessedViews'),
    addressUnavailableViews: summaryNumberField(vendorNetworkRow, 'addressUnavailableViews'),
  };
  if (!consistentVendorNetworkSummary(vendorNetwork, numberField(totalsRow, 'views'))) return malformedReport();
  return {
    period: {
      start: window.start,
      end: window.end,
      timeZone: 'UTC',
      granularity: window.granularity,
      updatedAt: window.updatedAt,
    },
    totals: {
      views: numberField(totalsRow, 'views'),
      dailyClients: numberField(totalsRow, 'dailyClients'),
      unattributedViews: numberField(totalsRow, 'unattributedViews'),
    },
    filters: {
      traffic: query.traffic,
      range: query.range,
      path: query.path ?? null,
      agent: query.agent ?? null,
      kind: query.kind ?? null,
    },
    byPath: pathRows(requiredSection(sections, 'path')),
    byCountry: countryRows(requiredSection(sections, 'country')),
    timeSeries: completeTimeSeries(window, populatedSeries, now),
    byReferrer: referrals.byReferrer,
    otherReferrerViews: referrals.otherReferrerViews,
    byReferrerState: referrerStateRows(requiredSection(sections, 'referrer-state')),
    internalTransitions: transitionRows(requiredSection(sections, 'transitions')),
    internalReferrerDetails: {
      unrecognizedPathViews: numberField(referrerDetails, 'unrecognizedPathViews'),
      selfReferrals: numberField(referrerDetails, 'selfReferrals'),
      firstCapturedAt: stringField(referrerDetails, 'firstCapturedAt'),
    },
    referralPolicy: {
      version: policy.version,
      sha256: policy.sha256,
      evaluator: policy.evaluator,
      source: { provider: policy.source.provider, revision: policy.source.revision, sha256: policy.source.sha256 },
      excludedViews: numberField(requiredSection(sections, 'excluded')[0], 'views'),
    },
    byClientForm: clientForms.rows,
    clientFormEvidence: clientForms.evidence,
    byAgent: agentRows(requiredSection(sections, 'agent')),
    bySigner: requiredSection(sections, 'signer').map(row => {
      const signatureAgent = stringField(row, 'key1');
      if (!isPublicSignerName(signatureAgent)) return malformedReport();
      return { signatureAgent, views: numberField(row, 'views') };
    }),
    byKind: kindRows(requiredSection(sections, 'kind'), numberField(totalsRow, 'views')),
    byKindSignature: signatureRows,
    verifierProfile: { current: CURRENT_VERIFIER_PROFILE, assessment: 'stored-profile-not-reverified' },
    byKindNativeCategory: nativeCategoryRows(requiredSection(sections, 'native-category'), numberField(totalsRow, 'views')),
    byDirectoryPublication: directoryPublicationRows(requiredSection(sections, 'directory-publication'), numberField(totalsRow, 'views')),
    vendorNetwork,
    verification,
  };
}

function jsonError(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function parseStatsQuery(params: URLSearchParams): StatsQuery | string {
  const rangeValue = params.get('range');
  const trafficValue = params.get('traffic');
  const rawAgent = params.get('agent');
  const rawKind = params.get('kind');
  const agent = rawAgent === null ? undefined : rawAgent;
  const range = rangeValue === null ? '30d' : parseStatsRange(rangeValue);
  if (range === null) return 'range must be 7d, 30d, 90d, or all';
  if (agent !== undefined && !KNOWN_AGENT_NAMES.has(agent)) {
    return 'agent must be a known matched User-Agent rule name';
  }
  if (rawKind !== null && !isReaderKind(rawKind)) {
    return 'kind must be one of the reader kinds';
  }
  const kind = rawKind === null ? undefined : rawKind;
  const scoped = agent !== undefined || kind !== undefined;
  const traffic = trafficValue === null
    ? scoped ? 'all' : 'browser'
    : parseTrafficFilter(trafficValue);
  if (traffic === null) return 'traffic must be browser, agents, crawlers, automation, unresolved, or all';
  if (agent !== undefined && kind !== undefined && kind !== 'signed-agent' && kind !== 'unresolved' && !agentReaderKinds(agent).includes(kind)) {
    return `agent ${agent} cannot be combined with kind=${kind}`;
  }
  if (kind !== undefined && traffic !== 'all' && !READER_GROUPS[traffic].includes(kind)) {
    return `kind ${kind} cannot be combined with traffic=${traffic}`;
  }
  // Historical named/signed rows retain their original fallback classification.
  if (agent !== undefined && traffic !== 'all' && traffic !== 'agents' && traffic !== 'unresolved' && !agentReaderKinds(agent).some(kind => readerGroupOf(kind) === traffic)) {
    return `agent ${agent} cannot be combined with traffic=${traffic}`;
  }

  const rawPath = params.get('path');
  const path = rawPath === null || rawPath.length === 0 ? undefined : rawPath;
  const query: StatsQuery = { range, traffic };
  if (path !== undefined) query.path = path;
  if (agent !== undefined) query.agent = agent;
  if (kind !== undefined) query.kind = kind;
  return query;
}

export async function handleStats(request: Request, env: Pick<Env, 'DB'>, observeCalculation?: ReportCalculationObserver): Promise<Response> {
  const query = parseStatsQuery(new URL(request.url).searchParams);
  if (typeof query === 'string') return jsonError(query);
  const response = await queryStats(env.DB, query, new Date(), ACTIVE_REFERRAL_POLICY, observeCalculation);
  return Response.json(response, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
