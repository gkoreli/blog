import { classifyDevice, classifyTraffic } from './classify.js';
import type { Representation } from './contracts.js';
import { recordPageObservation, type Env, type PageObservation } from './db.js';
import { isEligiblePageResponse } from './eligibility.js';
import { createDailyClientId } from './hash.js';
import { extractRequestMetadata } from './metadata.js';
import { classifyReaderKind } from './readerkind.js';
import { verifyWebBotAuth, type WebBotAuthResult } from './webbotauth.js';

export type { Env } from './db.js';
export { ANALYTICS_EVIDENCE_SINCE } from './contracts.js';
export type { Representation, StatsResponse, TrafficFilter } from './contracts.js';
export { READER_KINDS } from './readerkind.js';
export type { ReaderKind } from './readerkind.js';
export { handleStats } from './stats.js';

function sqliteTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

async function verifyRequestSignature(request: Request, headersPresent: boolean): Promise<WebBotAuthResult> {
  if (!headersPresent) return { status: 'absent' };
  return verifyWebBotAuth(request);
}

async function persistObservation(
  request: Request,
  representation: Representation,
  env: Env,
  observedAt: Date,
): Promise<void> {
  const hashKey = env.ANALYTICS_HASH_KEY;
  if (typeof hashKey !== 'string' || hashKey.length === 0) {
    throw new Error('ANALYTICS_HASH_KEY must not be empty');
  }

  const metadata = extractRequestMetadata(request, env.OWNER_IPS);
  const classification = classifyTraffic(metadata.userAgent);
  const utcDate = observedAt.toISOString().slice(0, 10);
  const [dailyClientId, signature] = await Promise.all([
    createDailyClientId({
      masterKey: hashKey,
      siteHost: metadata.siteHost,
      utcDate,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    }),
    verifyRequestSignature(request, metadata.hasSignatureHeaders),
  ]);
  const reader = classifyReaderKind({
    trafficClass: classification.trafficClass,
    agentName: classification.agentName,
    observationSource: 'edge',
    asn: metadata.asn,
    secFetchMode: metadata.secFetchMode,
    secFetchDest: metadata.secFetchDest,
    secFetchSite: metadata.secFetchSite,
    secFetchUser: metadata.secFetchUser,
    acceptsHtml: metadata.acceptsHtml,
    hasAcceptLanguage: metadata.hasAcceptLanguage,
    signature,
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
    asn: metadata.asn,
    asOrg: metadata.asOrg,
    secFetchMode: metadata.secFetchMode,
    secFetchDest: metadata.secFetchDest,
    secFetchSite: metadata.secFetchSite,
    secFetchUser: metadata.secFetchUser,
    acceptsHtml: metadata.acceptsHtml,
    hasAcceptLanguage: metadata.hasAcceptLanguage,
    representation,
    signatureAgent: signature.status === 'verified' ? signature.agent : null,
    signatureStatus: signature.status === 'absent' ? null : signature.status,
    readerKind: reader.kind,
    readerReason: reader.reason,
    observedAt: sqliteTimestamp(observedAt),
  };
  await recordPageObservation(env.DB, observation);
}

export function observePageResponse(
  request: Request,
  response: Response,
  representation: Representation,
  env: Env,
  ctx: ExecutionContext,
): void {
  if (!isEligiblePageResponse(request, response, representation)) return;
  ctx.waitUntil(persistObservation(request, representation, env, new Date()));
}
