import { classifyDevice, classifyTraffic } from './classify.js';
import { recordPageObservation, type Env, type PageObservation } from './db.js';
import { isEligiblePageResponse } from './eligibility.js';
import { createDailyClientId } from './hash.js';
import { extractRequestMetadata } from './metadata.js';

export type { Env } from './db.js';
export type { StatsResponse, TrafficFilter } from './contracts.js';
export { handleStats } from './stats.js';

function sqliteTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

async function persistObservation(request: Request, env: Env, observedAt: Date): Promise<void> {
  const hashKey = env.ANALYTICS_HASH_KEY;
  if (typeof hashKey !== 'string' || hashKey.length === 0) {
    throw new Error('ANALYTICS_HASH_KEY must not be empty');
  }

  const metadata = extractRequestMetadata(request, env.OWNER_IPS);
  const classification = classifyTraffic(metadata.userAgent);
  const utcDate = observedAt.toISOString().slice(0, 10);
  const dailyClientId = await createDailyClientId({
    masterKey: hashKey,
    siteHost: metadata.siteHost,
    utcDate,
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  });
  const observation: PageObservation = {
    path: metadata.path,
    referrerHost: metadata.referrerHost,
    country: metadata.country,
    dailyClientId,
    trafficClass: classification.trafficClass,
    agentName: classification.agentName,
    deviceType: classifyDevice(metadata.userAgent),
    isOwner: metadata.isOwner,
    observedAt: sqliteTimestamp(observedAt),
  };
  await recordPageObservation(env.DB, observation);
}

export function observePageResponse(
  request: Request,
  response: Response,
  env: Env,
  ctx: ExecutionContext,
): void {
  if (!isEligiblePageResponse(request, response)) return;
  ctx.waitUntil(persistObservation(request, env, new Date()));
}
