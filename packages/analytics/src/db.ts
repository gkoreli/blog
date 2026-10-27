import { recordDiagnostic, type ObservationDiagnostic } from './diagnostics.js';
import type { RequestEvidence } from './request-evidence.js';
import { COLLECTION_VERSION, CLASSIFIER_VERSION } from './versions.js';
import type { DeviceType, ReferrerState, Representation, SignatureStatus, TrafficClass } from './contracts.js';
import type { ReaderKind } from './readerkind.js';
import type { VerificationEvidence } from './signature-evidence.js';
import type { ClassificationEvidence } from './classification-evidence.js';

export interface Env {
  DB: D1Database;
  ANALYTICS_HASH_KEY: string;
  ADMIN_SECRET?: string;
  OWNER_MARK_GRANT?: string;
  OWNER_IPS?: string;
  ANALYTICS_DIAGNOSTICS?: string;
}

export interface PageObservation {
  path: string;
  referrerHost: string | null;
  referrerState: ReferrerState;
  internalReferrerPath: string | null;
  country: string | null;
  dailyClientId: string;
  trafficClass: TrafficClass;
  agentName: string | null;
  deviceType: DeviceType;
  isOwner: boolean;
  asn: number | null;
  asOrg: string | null;
  secFetchMode: string | null;
  secFetchDest: string | null;
  secFetchSite: string | null;
  secFetchUser: number | null;
  acceptsHtml: number | null;
  hasAcceptLanguage: number;
  representation: Representation;
  signatureAgent: string | null;
  signatureStatus: SignatureStatus | null;
  readerKind: ReaderKind;
  readerReason: string;
  observedAt: string;
  requestEvidence?: RequestEvidence;
  signatureEvidence?: VerificationEvidence;
  classificationEvidence?: ClassificationEvidence;
}

const INSERT_OBSERVATION = `INSERT INTO page_observations (
  path,
  referrer_host,
  country,
  daily_client_id,
  traffic_class,
  agent_name,
  device_type,
  is_owner,
  asn,
  as_org,
  sec_fetch_mode,
  sec_fetch_dest,
  sec_fetch_site,
  sec_fetch_user,
  accepts_html,
  has_accept_language,
  representation,
  signature_agent,
  signature_status,
  reader_kind,
  reader_reason,
  observed_at,
  asn_source,
  referrer_state,
  internal_referrer_path,
  collection_version,
  classifier_version,
  request_evidence,
  signature_evidence,
  classification_evidence
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordPageObservation(db: D1Database, observation: PageObservation, diagnostic?: ObservationDiagnostic): Promise<void> {
  const result = await db.prepare(INSERT_OBSERVATION).bind(
    observation.path,
    observation.referrerHost,
    observation.country,
    observation.dailyClientId,
    observation.trafficClass,
    observation.agentName,
    observation.deviceType,
    observation.isOwner ? 1 : 0,
    observation.asn,
    observation.asOrg,
    observation.secFetchMode,
    observation.secFetchDest,
    observation.secFetchSite,
    observation.secFetchUser,
    observation.acceptsHtml,
    observation.hasAcceptLanguage,
    observation.representation,
    observation.signatureAgent,
    observation.signatureStatus,
    observation.readerKind,
    observation.readerReason,
    observation.observedAt,
    observation.asn === null ? null : 'request',
    observation.referrerState,
    observation.internalReferrerPath,
    COLLECTION_VERSION,
    CLASSIFIER_VERSION,
    observation.requestEvidence === undefined ? null : JSON.stringify(observation.requestEvidence),
    observation.signatureEvidence === undefined ? null : JSON.stringify(observation.signatureEvidence),
    observation.classificationEvidence === undefined ? null : JSON.stringify(observation.classificationEvidence),
  ).run();
  if (diagnostic !== undefined) {
    // Preserve the acknowledged base observation if its optional diagnostic fails.
    try {
      await recordDiagnostic(db, result.meta.last_row_id, observation.observedAt, diagnostic);
    } catch {
      console.warn('analytics.diagnostic_write_failed', { operationId: diagnostic.operationId, collectionVersion: COLLECTION_VERSION });
    }
  }
}
