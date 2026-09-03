import type { DeviceType, SignatureStatus, TrafficClass } from './contracts.js';
import type { ReaderKind } from './readerkind.js';

export interface Env {
  DB: D1Database;
  ANALYTICS_HASH_KEY: string;
  OWNER_IPS?: string;
}

export interface PageObservation {
  path: string;
  referrerHost: string | null;
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
  signatureAgent: string | null;
  signatureStatus: SignatureStatus | null;
  readerKind: ReaderKind;
  readerReason: string;
  observedAt: string;
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
  signature_agent,
  signature_status,
  reader_kind,
  reader_reason,
  observed_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordPageObservation(db: D1Database, observation: PageObservation): Promise<void> {
  await db.prepare(INSERT_OBSERVATION).bind(
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
    observation.signatureAgent,
    observation.signatureStatus,
    observation.readerKind,
    observation.readerReason,
    observation.observedAt,
  ).run();
}
