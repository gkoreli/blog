import { allowsDiagnostics } from './diagnostics.js';
import { extractRequestEvidence, extractDiagnosticInputs } from './request-evidence.js';
import { COLLECTION_VERSION, VERIFIER_PROFILE_VERSION } from './versions.js';
import { analyzeTraffic } from './classify.js';
import { classificationEvidence } from './classification-evidence.js';
import { clientFormEvidence } from './client-form.js';
import type { Representation } from './contracts.js';
import { recordPageObservation, ObservationAcknowledgementError, type Env, type PageObservation } from './db.js';
import { isEligiblePageResponse } from './eligibility.js';
import { createDailyClientId } from './hash.js';
import { extractRequestMetadata } from './metadata.js';
import { classifyReaderKind } from './readerkind.js';
import { parseReferrer } from './referrals.js';
import { verifyWebBotAuth, type WebBotAuthResult } from './webbotauth.js';
import { verificationEvidence } from './signature-evidence.js';
import { verifyVendorIp } from './vendor-ip.js';
import { storedObservationReceipt, type StoredObservationReceipt } from './observation-receipt.js';
import type { ObservationStorageReference } from './observation-storage.js';

export type { Env } from './db.js';
export { ANALYTICS_EVIDENCE_SINCE } from './contracts.js';
export type { ReaderKind, Representation, StatsResponse, TrafficFilter } from './contracts.js';
export { READER_GROUPS, READER_KINDS, isReaderKind, readerGroupOf } from './contracts.js';
export { purgeExpiredDiagnostics, DIAGNOSTIC_RETENTION_DAYS } from './diagnostics.js';
export { handleOwner } from './owner.js';
export { handleStats, parseStatsQuery } from './stats.js';
export type { ReportCalculation, ReportCalculationObserver } from './report-cost.js';
export { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
export { handleCalibration, purgeExpiredCalibration } from './calibration.js';

function sqliteTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export const SIGNATURE_DEADLINE_MS = 2000;
export const PUBLIC_PATHS_DEADLINE_MS = 500;

class ObservationConfigurationError extends Error {}

async function verifyRequestSignature(request: Request, headersPresent: boolean, verifier?: ObservationOptions['verifySignature']): Promise<WebBotAuthResult> {
  if (!headersPresent) return { status: 'absent' };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<WebBotAuthResult>(resolve => {
    timer = setTimeout(() => {
      resolve({ status: 'unverified', reason: 'verification-timeout' });
      controller.abort();
    }, SIGNATURE_DEADLINE_MS);
  });
  const verification = Promise.resolve().then(() => verifier
    ? verifier(request)
    : verifyWebBotAuth(request, { includeEvidence: true, maxAgeSeconds: 86400,
      fetcher: (input, init) => fetch(input, { ...init, signal: controller.signal }) }))
    .catch((): WebBotAuthResult => ({ status: 'unverified', reason: 'verification-error' }));
  try { return await Promise.race([verification, deadline]); }
  finally {
    if (timer !== undefined) clearTimeout(timer);
    controller.abort();
  }
}

async function persistObservation(
  request: Request,
  representation: Representation,
  response: Response,
  env: Env,
  observedAt: Date,
  operationId: string,
  options: ObservationOptions,
): Promise<{ receipt: StoredObservationReceipt; storage: ObservationStorageReference }> {
  const hashKey = env.ANALYTICS_HASH_KEY;
  if (typeof hashKey !== 'string' || hashKey.length === 0) {
    throw new ObservationConfigurationError('ANALYTICS_HASH_KEY must not be empty');
  }

  const internal = parseReferrer(request.headers.get('Referer'), new URL(request.url).hostname).referrerState === 'internal';
  const diagnosticsRequested = allowsDiagnostics(env.ANALYTICS_DIAGNOSTICS, request);
  let publicPaths: ReadonlySet<string> | undefined;
  if ((internal || diagnosticsRequested) && options.publicPagePaths) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), PUBLIC_PATHS_DEADLINE_MS);
      });
      publicPaths = await Promise.race([options.publicPagePaths(), timeout]);
      if (publicPaths === undefined) console.warn('analytics.public_path_index_timeout', { operationId, collectionVersion: COLLECTION_VERSION });
    } catch { console.warn('analytics.public_path_index_unavailable', { operationId, collectionVersion: COLLECTION_VERSION }); }
    finally { if (timer !== undefined) clearTimeout(timer); }
  }
  const captureEvidence = diagnosticsRequested && publicPaths?.has(new URL(request.url).pathname) === true;
  const metadata = extractRequestMetadata(request, env.OWNER_IPS, publicPaths);
  const classification = analyzeTraffic(metadata.userAgent);
  const utcDate = observedAt.toISOString().slice(0, 10);
  const [dailyClientId, signature, vendorIp] = await Promise.all([
    createDailyClientId({
      masterKey: hashKey,
      siteHost: metadata.siteHost,
      utcDate,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    }),
    verifyRequestSignature(request, metadata.hasSignatureHeaders, options.verifySignature),
    verifyVendorIp(request, classification.declarations.candidates),
  ]);
  const readerFacts = {
    trafficClass: classification.trafficClass,
    agentName: classification.agentName,
    observationSource: 'edge' as const,
    asn: metadata.asn,
    secFetchMode: metadata.secFetchMode,
    secFetchDest: metadata.secFetchDest,
    secFetchSite: metadata.secFetchSite,
    secFetchUser: metadata.secFetchUser,
    acceptsHtml: metadata.acceptsHtml,
    hasAcceptLanguage: metadata.hasAcceptLanguage,
    signature,
    userAgent: metadata.userAgent,
    declarations: classification.declarations,
    referrerState: metadata.referrerState,
  };
  const reader = classifyReaderKind(readerFacts);
  const clientForm = clientFormEvidence(metadata.userAgent, request.headers.get('Sec-CH-UA-Mobile'), classification.declarations.browserFamily);
  const observation = {
    path: metadata.path,
    referrerHost: metadata.referrerHost,
    referrerState: metadata.referrerState,
    internalReferrerPath: metadata.internalReferrerPath,
    country: metadata.country,
    dailyClientId,
    trafficClass: classification.trafficClass,
    agentName: classification.agentName,
    deviceType: clientForm.legacyCompatibility.value,
    isOwner: metadata.isOwner || options.verifiedOwnerExclusion === true,
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
    signatureEvidence: verificationEvidence(request, signature, options.verifySignature !== undefined, classification.declarations.candidates),
    classificationEvidence: classificationEvidence(readerFacts, classification.declarations),
    vendorIpEvidence: vendorIp,
    clientFormEvidence: clientForm,
    ...(captureEvidence ? { requestEvidence: extractRequestEvidence(request, response) } : {}),
  } satisfies PageObservation;
  const diagnostic = captureEvidence ? {
    ...extractDiagnosticInputs(request),
    operationId,
    requestRayId: /^[a-f0-9]{16,32}(?:-[A-Z]{3})?$/i.test(request.headers.get('CF-Ray') ?? '') ? request.headers.get('CF-Ray') : null,
    verifierProfile: VERIFIER_PROFILE_VERSION,
    signatureOutcome: signature.status,
    signatureReason: signature.status === 'unverified' ? signature.reason : null,
  } : undefined;
  const receipt = storedObservationReceipt(observation);
  const storage = await recordPageObservation(env.DB, observation, diagnostic);
  return { receipt, storage };
}

export interface ObservationOptions {
  /** Internal calibration route only, after the same request's owner mark is verified. */
  verifiedOwnerExclusion?: boolean;
  publicPagePaths?: () => Promise<ReadonlySet<string>>;
  /** Dependency injection for controlled acceptance; production uses the native verifier. */
  verifySignature?: (request: Request) => Promise<WebBotAuthResult>;
}

export function observePageResponse(
  request: Request,
  response: Response,
  representation: Representation,
  env: Env,
  ctx: ExecutionContext,
  options: ObservationOptions = {},
): void {
  if (!isEligiblePageResponse(request, response, representation)) return;
  const operationId = crypto.randomUUID();
  console.log('analytics.observation_attempt', { operationId, collectionVersion: COLLECTION_VERSION });
  const work = persistObservation(request, representation, response, env, new Date(), operationId, options)
    .then(({ receipt, storage }) => { console.log('analytics.observation_stored', { operationId, collectionVersion: COLLECTION_VERSION, receipt, storage }); })
    .catch((error: unknown) => {
      const reason = error instanceof ObservationConfigurationError ? 'missing-hash-key'
        : error instanceof ObservationAcknowledgementError ? 'unacknowledged-insert' : 'persistence-or-processing';
      console.warn('analytics.observation_write_failed', { operationId, collectionVersion: COLLECTION_VERSION, reason });
      // Keep failure observable to waitUntil and fixtures without serializing private DB errors.
      if (error instanceof ObservationConfigurationError) throw error;
      throw new Error('Analytics observation could not be stored');
    });
  ctx.waitUntil(work);
}
