import type { PublicSignerName } from './signers.js';
import type { ReportedClientForm } from './client-form.js';
import type { SignatureBasis } from './signature-basis.js';
import type { NativeCategoryBasis } from './native-bot-evidence.js';
import type { DirectoryPublicationBasis } from './directory-publication-contract.js';

/** Prepared private-evidence policy shared by collector and disclosure. */
export const DIAGNOSTIC_RETENTION_DAYS = 60;

export type TrafficClass = 'browser' | 'bot' | 'ai';
/** Public filters group stored request evidence and declared roles. */
export type TrafficFilter = 'browser' | 'agents' | 'crawlers' | 'automation' | 'unresolved' | 'all';

/** Closed set of reader kinds, one per row, with one reason (ADR-0016.3 section A). */
export const READER_KINDS = [
  'signed-agent',
  'ai-assistant',
  'ai-search',
  'ai-crawler',
  'search-crawler',
  'seo-crawler',
  'preview-or-feed',
  'headless-browser',
  'other-bot',
  'cloud-browser',
  'http-client',
  'legacy-browser',
  'browser',
  'unresolved',
] as const;
export type ReaderKind = typeof READER_KINDS[number];

/** How the public filters group the reader kinds. */
export const READER_GROUPS: Record<Exclude<TrafficFilter, 'all'>, readonly ReaderKind[]> = {
  browser: ['browser'],
  agents: ['signed-agent', 'ai-assistant'],
  crawlers: ['search-crawler', 'seo-crawler', 'ai-search', 'ai-crawler', 'preview-or-feed'],
  automation: ['cloud-browser', 'headless-browser', 'http-client', 'other-bot', 'legacy-browser'],
  unresolved: ['unresolved'],
};

const readerKindNames: ReadonlySet<string> = new Set(READER_KINDS);

export function isReaderKind(value: string): value is ReaderKind {
  return readerKindNames.has(value);
}

export function readerGroupOf(kind: ReaderKind): Exclude<TrafficFilter, 'all'> {
  for (const [group, kinds] of Object.entries(READER_GROUPS)) {
    if (kinds.includes(kind)) {
      if (group === 'browser' || group === 'agents' || group === 'crawlers' || group === 'automation' || group === 'unresolved') return group;
    }
  }
  throw new Error(`Reader kind ${kind} belongs to no group`);
}
/** Deprecated storage heuristic, not a current physical-device claim. */
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Representation = 'html' | 'markdown';
export type StatsRange = '7d' | '30d' | '90d' | 'all';
export type Granularity = 'hour' | 'day';
export type SignatureStatus = 'verified' | 'unverified';
export type ReferrerState = 'external' | 'internal' | 'absent' | 'unusable';
export type ReportedReferrerState = ReferrerState | 'legacy-unknown';

export interface TimeSeriesPoint {
  bucket: string;
  views: number;
  dailyClients: number;
}

export const ANALYTICS_EVIDENCE_SINCE = '2026-09-03';

export interface VendorNetworkSummary {
  recordedViews: number;
  notRecordedViews: number;
  configuredDeclarationViews: number;
  unmappedDeclarationViews: number;
  noDeclarationViews: number;
  listedViews: number;
  notListedViews: number;
  unavailableViews: number;
  notAssessedViews: number;
  addressUnavailableViews: number;
}

export interface VerificationSummary {
  localInvalidViews: number;
  localUnsupportedViews: number;
  localUnavailableViews: number;
  localPolicyRejectedViews: number;
  localNotApplicableViews: number;
  localIndeterminateViews: number;
  unverifiedOutcomeNotRecordedViews: number;
  vendorDocumentedViews: number;
  vendorMatchingOriginViews: number;
  vendorDifferentOriginViews: number;
  vendorNotVerifiedViews: number;
  vendorUnmappedDeclarationViews: number;
  vendorUserAgentBoundViews: number;
  vendorCheckNotRecordedViews: number;
  recordedViews: number;
  notRecordedViews: number;
  localVerifiedViews: number;
  localUnverifiedViews: number;
  localAbsentViews: number;
  testVerdictViews: number;
  coverageRecordedViews: number;
  selectionRecordedViews: number;
  selectionNotRecordedVerifiedViews: number;
  selectionUnrecognizedVerifiedViews: number;
  multipleTaggedCandidateViews: number;
  unassessedCandidateViews: number;
  userAgentBoundViews: number;
  resourceBoundViews: number;
  methodBoundViews: number;
  authorityOnlyViews: number;
  nativeAvailableViews: number;
  nativeVerifiedBotViews: number;
  nativeSignedAgentViews: number;
  localVerifiedNativeNotVerifiedViews: number;
}

export interface StatsResponse {
  period: {
    start: string;
    end: string;
    timeZone: 'UTC';
    granularity: Granularity;
    updatedAt: string;
  };
  totals: { views: number; dailyClients: number; unattributedViews: number };
  filters: {
    traffic: TrafficFilter;
    range: StatsRange;
    path: string | null;
    agent: string | null;
    kind: ReaderKind | null;
  };
  byPath: Array<{ path: string; views: number; dailyClients: number }>;
  byCountry: Array<{ country: string; views: number }>;
  /** Provider category only, independent of local crypto and nullable native booleans. */
  byKindNativeCategory: Array<{ kind: ReaderKind | null; basis: NativeCategoryBasis; views: number }>;
  /** Reviewed publisher origin, independent of documented per-client signing promises. */
  byDirectoryPublication: Array<{ basis: DirectoryPublicationBasis; views: number }>;
  timeSeries: TimeSeriesPoint[];
  byReferrer: Array<{ referrerHost: string; views: number }>;
  /** Included views with a referrer whose name is not approved for public display. */
  otherReferrerViews: number;
  byReferrerState: Array<{ state: ReportedReferrerState; views: number }>;
  /** HTML requests reporting a recognized, different internal source page. */
  internalTransitions: Array<{ fromPath: string; toPath: string; views: number }>;
  internalReferrerDetails: {
    unrecognizedPathViews: number;
    selfReferrals: number;
    firstCapturedAt: string | null;
  };
  /** Same selection as totals, after owner exclusions, before referral exclusions. */
  referralPolicy: {
    version: string;
    sha256: string;
    evaluator: 'host-suffix-v1';
    source: { provider: 'matomo'; revision: string; sha256: string };
    excludedViews: number;
  };
  /** Client-form claims and explicit historical heuristic groups; no hardware authentication. */
  byClientForm: Array<{ form: ReportedClientForm; views: number }>;
  clientFormEvidence: { recordedViews: number; historicalViews: number; unrecognizedRecordViews: number; unsupportedHintViews: number; differingSignalsViews: number; legacyDefaultedViews: number };
  byAgent: Array<{ agentName: string; trafficClass: Exclude<TrafficClass, 'browser'>; views: number }>;
  /** Reviewed display names or Other, never arbitrary signing origins; independent of role. */
  bySigner: Array<{ signatureAgent: PublicSignerName; views: number }>;
  /** Independent local and native outcomes; overlapping counts, never people. */
  verification: VerificationSummary;
  vendorNetwork: VendorNetworkSummary;
  /** Missing/unrecognized stored kinds report as Unresolved with closed provenance reasons.
   * Original values remain unchanged; the raw-kind intersections below retain null.
   */
  byKind: Array<{ kind: ReaderKind; reason: string; views: number; dailyClients: number }>;
  /** Disjoint event counts by classification and signature basis; no person/intent claim. */
  byKindSignature: Array<{ kind: ReaderKind | null; basis: SignatureBasis; views: number }>;
}
