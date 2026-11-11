import { decodeVendorCacheRows } from './vendor-cache-report.js';
import { decodeFetchMetadataRows } from './fetch-metadata-report.js';
import { consistentVendorNetworkSummary } from './vendor-network-summary.js';
import { measuredReportBatch, type ReportCalculationObserver } from './report-cost.js';
import { consistentSignatureSummary } from './signature-summary.js';
import {
  READER_GROUPS,
  isReaderKind,
  readerGroupOf,
  type ReaderKind,
  type StatsRange,
  type StatsQuery,
  type StatsResponse,
  type TimeSeriesPoint,
  type TrafficFilter,
} from './contracts.js';
import type { Env } from './db.js';
import { KNOWN_AGENT_NAMES } from './classify.js';
import { isReportedClientForm } from './client-form.js';
import { agentReaderKinds } from './readerkind.js';
import { isPublicSignerName } from './signers.js';
import {
  completeTimeSeries,
  createStatsWindow,
  parseStatsRange,
  type StatsWindow,
} from './dates.js';
import { CLASSIFICATION_REASON_UNAVAILABLE } from './reporting-kind.js';
import { publicReferrers } from './referrals.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { isSignatureBasis } from './signature-basis.js';
import { isReportedVerifierProfile, CURRENT_VERIFIER_PROFILE } from './verifier-profile.js';
import { isNativeCategoryBasis } from './native-bot-evidence.js';
import { isDirectoryPublicationBasis } from './directory-publication.js';
import { decodeClientEvidenceRows, clientNameCoverage, consistentClientEvidence } from './client-evidence.js';
import type { ReferralPolicy } from './referral-policy.js';

import { buildStatsQueryPlan, buildProjectedStatsQueryPlan } from './stats-query.js';

export type { StatsQuery, StatsResponse, TrafficFilter } from './contracts.js';

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

/** Required COUNT projections never turn absent or malformed data into zero. */
function countField(row: Record<string, unknown> | undefined, field: string, minimum = 0): number {
  const value = row?.[field];
  return row && Object.hasOwn(row,field) && typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum
    ? value : malformedReport();
}

function requiredString(row: Record<string, unknown>, field: string): string {
  return Object.hasOwn(row,field) && typeof row[field] === 'string' ? row[field] : malformedReport();
}

function nullableString(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];
  return Object.hasOwn(row,field) && (value === null || typeof value === 'string') ? value : malformedReport();
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
    const path = requiredString(row, 'key1');
    if (!path.startsWith('/')) return malformedReport();
    result.push({ path, views: countField(row, 'views',1), dailyClients: countField(row, 'dailyClients',1) });
  }
  return result;
}

function countryRows(rows: Record<string, unknown>[]): StatsResponse['byCountry'] {
  const result: StatsResponse['byCountry'] = [];
  for (const row of rows) {
    const country = requiredString(row, 'key1');
    result.push({ country, views: countField(row, 'views',1) });
  }
  return result;
}

function kindSignatureRows(rows: Record<string, unknown>[], total: number): StatsResponse['byKindSignature'] {
  const result: StatsResponse['byKindSignature'] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    const kind = nullableString(row, 'key1');
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
    const bucket = requiredString(row, 'key1');
    result.push({ bucket, views: countField(row, 'views',1), dailyClients: countField(row, 'dailyClients',1) });
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
    const referrerHost = requiredString(row, 'key1');
    result.push({ referrerHost, views: countField(row, 'views',1) });
  }
  return result;
}

function referrerStateRows(rows: Record<string, unknown>[]): StatsResponse['byReferrerState'] {
  const result: StatsResponse['byReferrerState'] = [];
  for (const row of rows) {
    const state = stringField(row, 'key1');
    if (state === 'external' || state === 'internal' || state === 'absent'
      || state === 'unusable' || state === 'legacy-unknown') {
      result.push({ state, views: countField(row, 'views',1) });
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
    result.push({ fromPath, toPath, views: countField(row, 'views',1) });
  }
  return result;
}

function clientFormRows(rows: Record<string, unknown>[]): { rows: StatsResponse['byClientForm']; evidence: StatsResponse['clientFormEvidence'] } {
  const result: StatsResponse['byClientForm'] = [];
  const evidence: StatsResponse['clientFormEvidence'] = { recordedViews: 0, historicalViews: 0, unrecognizedRecordViews: 0, unsupportedHintViews: 0, differingSignalsViews: 0, legacyDefaultedViews: 0 };
  for (const row of rows) {
    const form = stringField(row, 'key1');
    if (form === null || !isReportedClientForm(form)) return malformedReport();
    const views = countField(row, 'views',1);
    const recorded = countField(row, 'recordedViews');
    if (recorded > views) return malformedReport();
    result.push({ form, views });
    evidence.recordedViews += recorded;
    evidence.historicalViews += form === 'unrecognized-record' ? 0 : views - recorded;
    if (form === 'unrecognized-record') evidence.unrecognizedRecordViews += views;
    const unsupportedHintViews = summaryNumberField(row, 'unsupportedHintViews');
    if (unsupportedHintViews > views) return malformedReport();
    evidence.unsupportedHintViews += unsupportedHintViews;
    const differingSignalsViews = summaryNumberField(row, 'differingSignalsViews');
    if (differingSignalsViews > views) return malformedReport();
    evidence.differingSignalsViews += differingSignalsViews;
    const legacyDefaultedViews = summaryNumberField(row, 'legacyDefaultedViews');
    if (legacyDefaultedViews > views) return malformedReport();
    evidence.legacyDefaultedViews += legacyDefaultedViews;
  }
  return { rows: result, evidence };
}

function agentRows(rows: Record<string, unknown>[]): StatsResponse['byAgent'] {
  const result: StatsResponse['byAgent'] = [];
  for (const row of rows) {
    const agentName = stringField(row, 'key1');
    const trafficClass = stringField(row, 'key2');
    if (agentName === null || trafficClass !== 'bot' && trafficClass !== 'ai') return malformedReport();
    result.push({ agentName, trafficClass, views: countField(row, 'views',1) });
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
    'referrer-state', 'transitions', 'referrer-details', 'signer', 'verification', 'vendor-ip', 'vendor-cache', 'kind-signature', 'native-category', 'directory-publication', 'fetch-metadata', 'client-evidence',
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

function sumViews(rows: readonly { views: number }[]): number {
  let total = 0;
  for (const row of rows) {
    total += row.views;
    if (!Number.isSafeInteger(total)) return malformedReport();
  }
  return total;
}

function uniqueRows<T>(rows: readonly T[], key: (row: T) => string): void {
  const keys = new Set<string>();
  for (const row of rows) {
    const value = key(row);
    if (keys.has(value)) return malformedReport();
    keys.add(value);
  }
}

/** These are event partitions, not additive unique-audience estimates. */
function validateReportCounts(
  report: StatsResponse, populatedSeries: TimeSeriesPoint[],
  rawReferrers: Array<{ referrerHost: string; views: number }>,
): void {
  const { totals, byPath, byCountry, byReferrerState, byClientForm, byAgent, bySigner, timeSeries } = report;
  if (totals.dailyClients > totals.views || totals.unattributedViews > totals.views
    || (totals.views > 0 && totals.dailyClients === 0)) return malformedReport();
  uniqueRows(byPath, row => row.path);
  uniqueRows(byCountry, row => row.country);
  uniqueRows(rawReferrers, row => row.referrerHost);
  uniqueRows(populatedSeries, row => row.bucket);
  uniqueRows(byReferrerState, row => row.state);
  uniqueRows(byClientForm, row => row.form);
  uniqueRows(byAgent, row => JSON.stringify([row.agentName,row.trafficClass]));
  uniqueRows(bySigner, row => row.signatureAgent);
  uniqueRows(report.internalTransitions, row => JSON.stringify([row.fromPath,row.toPath]));
  for (const partition of [byPath, populatedSeries, timeSeries, byReferrerState, byClientForm]) {
    if (sumViews(partition) !== totals.views) return malformedReport();
  }
  for (const subset of [byCountry, byAgent, bySigner, rawReferrers]) {
    if (sumViews(subset) > totals.views) return malformedReport();
  }
  if (sumViews(rawReferrers) + totals.unattributedViews !== totals.views
    || sumViews(report.byReferrer) + report.otherReferrerViews !== sumViews(rawReferrers)) return malformedReport();
  // The same daily ID can occur in several paths/hours. Only bounds are additive here.
  for (const partition of [byPath,populatedSeries]) {
    let clients = 0;
    for (const row of partition) {
      if (row.dailyClients > row.views || row.dailyClients > totals.dailyClients) return malformedReport();
      clients += row.dailyClients;
      if (!Number.isSafeInteger(clients)) return malformedReport();
    }
    if (clients < totals.dailyClients) return malformedReport();
  }
  const forms = report.clientFormEvidence;
  if (forms.recordedViews + forms.historicalViews + forms.unrecognizedRecordViews !== totals.views
    || !Object.values(forms).every(value => Number.isSafeInteger(value) && value >= 0 && value <= totals.views)) return malformedReport();
  // Transitions and their details may include outgoing requests outside the selected path.
  sumViews(report.internalTransitions);
}

export async function queryStats(db: D1Database, query: StatsQuery, now = new Date(), policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY, observeCalculation?: ReportCalculationObserver): Promise<StatsResponse> {
  const initialWindow = createStatsWindow(query.range, now);
  const statements = buildStatsQueryPlan(query, initialWindow, policy)
    .map(statement => db.prepare(statement.sql).bind(...statement.values));
  const results = await measuredReportBatch(db, statements, observeCalculation);
  const rows = results.flatMap(result => result.results ?? []);
  return reportFromRows(query, now, rows, policy);
}

/** The read model is accepted only with transactional source coverage. */
export async function queryProjectedStats(db: D1Database, query: StatsQuery, now = new Date(), policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY, observeCalculation?: ReportCalculationObserver): Promise<StatsResponse> {
  const statements = buildProjectedStatsQueryPlan(query, createStatsWindow(query.range, now), policy)
    .map(statement => db.prepare(statement.sql).bind(...statement.values));
  const results = await measuredReportBatch(db, statements, event => observeCalculation?.({ ...event, readModel: 'projection' }));
  const rows = results.flatMap(result => result.results ?? []);
  const complete = rows[0]?.projection_complete;
  if (complete !== 0 && complete !== 1) return malformedReport();
  if (complete === 0) return queryStats(db, query, now, policy, event => observeCalculation?.({ ...event, readModel: 'source-fallback' }));
  return reportFromRows(query, now, rows, policy);
}

function reportFromRows(query: StatsQuery, now: Date, rows: Record<string, unknown>[], policy: ReferralPolicy): StatsResponse {
  const sections = reportSections(rows, query.range === 'all');
  const firstObservedRow = query.range === 'all' ? requiredSection(sections, 'boundary')[0] : undefined;
  const firstObservedAt = firstObservedRow ? nullableString(firstObservedRow, 'firstObservedAt') : null;
  const window = createStatsWindow(query.range, now, firstObservedAt ?? undefined);
  const totalsRow = requiredSection(sections, 'totals')[0];
  const populatedSeries = seriesRows(requiredSection(sections, 'series'));
  const rawReferrers = referrerRows(requiredSection(sections, 'referrer'));
  const referrals = publicReferrers(rawReferrers, policy);
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
    nativeAvailableViews: summaryNumberField(verificationRow, 'nativeAvailableViews'),
    nativeVerifiedBotAvailableViews: summaryNumberField(verificationRow, 'nativeVerifiedBotAvailableViews'),
    nativeSignedAgentAvailableViews: summaryNumberField(verificationRow, 'nativeSignedAgentAvailableViews'),
    nativeVerifiedBotViews: summaryNumberField(verificationRow, 'nativeVerifiedBotViews'), nativeSignedAgentViews: summaryNumberField(verificationRow, 'nativeSignedAgentViews'), localVerifiedNativeNotVerifiedViews: summaryNumberField(verificationRow, 'localVerifiedNativeNotVerifiedViews'),
  };
  const signatureRows = kindSignatureRows(requiredSection(sections, 'kind-signature'), countField(totalsRow, 'views'));
  if (!consistentSignatureSummary(verification, countField(totalsRow, 'views'), signatureRows)) return malformedReport();

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
  if (!consistentVendorNetworkSummary(vendorNetwork, countField(totalsRow, 'views'))) return malformedReport();
  const clientEvidence = decodeClientEvidenceRows(requiredSection(sections, 'client-evidence'), countField(totalsRow, 'views'));
  const response: StatsResponse = {
    period: {
      start: window.start,
      end: window.end,
      timeZone: 'UTC',
      granularity: window.granularity,
      updatedAt: window.updatedAt,
    },
    totals: {
      views: countField(totalsRow, 'views'),
      dailyClients: countField(totalsRow, 'dailyClients'),
      unattributedViews: summaryNumberField(totalsRow, 'unattributedViews'),
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
      unrecognizedPathViews: summaryNumberField(referrerDetails, 'unrecognizedPathViews'),
      selfReferrals: summaryNumberField(referrerDetails, 'selfReferrals'),
      firstCapturedAt: nullableString(referrerDetails, 'firstCapturedAt'),
    },
    referralPolicy: {
      version: policy.version,
      sha256: policy.sha256,
      evaluator: policy.evaluator,
      source: { provider: policy.source.provider, revision: policy.source.revision, sha256: policy.source.sha256 },
      excludedViews: countField(requiredSection(sections, 'excluded')[0], 'views'),
    },
    byClientForm: clientForms.rows,
    clientFormEvidence: clientForms.evidence,
    byAgent: agentRows(requiredSection(sections, 'agent')),
    clientNameCoverage: clientNameCoverage(clientEvidence),
    byKindClientEvidence: clientEvidence,
    bySigner: requiredSection(sections, 'signer').map(row => {
      const signatureAgent = stringField(row, 'key1');
      if (!isPublicSignerName(signatureAgent)) return malformedReport();
      return { signatureAgent, views: countField(row, 'views',1) };
    }),
    byKind: kindRows(requiredSection(sections, 'kind'), countField(totalsRow, 'views')),
    byKindSignature: signatureRows,
    verifierProfile: { current: CURRENT_VERIFIER_PROFILE, assessment: 'stored-profile-not-reverified' },
    byKindNativeCategory: nativeCategoryRows(requiredSection(sections, 'native-category'), countField(totalsRow, 'views')),
    byDirectoryPublication: directoryPublicationRows(requiredSection(sections, 'directory-publication'), countField(totalsRow, 'views')),
    vendorNetwork,
    vendorCache: decodeVendorCacheRows(requiredSection(sections, 'vendor-cache'), countField(totalsRow, 'views')),
    fetchMetadata: decodeFetchMetadataRows(requiredSection(sections, 'fetch-metadata'), countField(totalsRow, 'views')),
    verification,
  };
  if (!consistentClientEvidence(response.byKindClientEvidence, response.clientNameCoverage, response.totals.views,
    response.byKindSignature, response.byKindNativeCategory, response.byAgent)) return malformedReport();
  validateReportCounts(response, populatedSeries, rawReferrers);
  return response;
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
  const traffic = trafficValue === null
    ? 'all'
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
  const response = await queryProjectedStats(env.DB, query, new Date(), ACTIVE_REFERRAL_POLICY, observeCalculation);
  return Response.json(response, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
