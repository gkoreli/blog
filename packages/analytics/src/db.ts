import type { DeviceType, TrafficClass } from './contracts.js';

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
  observed_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
    observation.observedAt,
  ).run();
}
