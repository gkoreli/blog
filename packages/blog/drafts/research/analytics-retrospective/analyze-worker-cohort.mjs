import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { analyzeTraffic } from '../../../../analytics/.test-dist/classify.js';
import { extractRequestMetadata } from '../../../../analytics/.test-dist/metadata.js';
import { classifyReaderKind } from '../../../../analytics/.test-dist/readerkind.js';
import { extractRequestEvidence } from '../../../../analytics/.test-dist/request-evidence.js';
import { classificationEvidence } from '../../../../analytics/.test-dist/classification-evidence.js';
import { clientFormEvidence } from '../../../../analytics/.test-dist/client-form.js';
import { CLASSIFIER_VERSION } from '../../../../analytics/.test-dist/versions.js';

function vocabulary(value, allowed) { return value === null ? null : allowed.includes(value) ? value : 'unrecognized'; }

function increment(map, value) { const key = value === null || value === undefined || value === '' ? 'not-present' : String(value); map[key] = (map[key] ?? 0) + 1; }

/** An aggregate-only report: no original UA, origin, IP, IDs, URLs or per-request rows. */
export function analyzeWorkerCohort(rows) {
  if (!Array.isArray(rows)) throw new Error('Expected a native JSON event array');
  const dimensions = { day: {}, status: {}, method: {}, dataset: {}, trafficClass: {}, readerKind: {}, successfulReaderKind: {}, browserFamily: {}, osFamily: {}, clientForm: {}, mobilePreference: {}, legacyDeviceCompatibility: {}, fetchMode: {}, fetchDest: {}, fetchSite: {}, fetchUser: {}, knownClient: {}, declarationStatus: {}, categoryAgreement: {}, networkEvidence: {}, referrerContext: {} };
  const userAgents = new Set(), addresses = new Set(), networks = new Set(), countries = new Set(), referrerHosts = new Set(), eventIds = new Set();
  let invalidRows = 0, duplicateEventIds = 0, missingEventIds = 0, truncatedEvents = 0, signatureHeaderEvents = 0, populatedVerifiedBotCategoryEvents = 0;
  for (const row of rows) {
    const worker = row?.$workers, requestData = worker?.event?.request, status = worker?.event?.response?.status;
    if (!requestData || typeof requestData.url !== 'string' || typeof requestData.method !== 'string' || !Number.isInteger(status) || status < 200 || status > 599 || !/^\d{4}-\d{2}-\d{2}T/.test(String(row.timestamp))) { invalidRows++; continue; }
    const headers = new Headers();
    for (const [name, value] of Object.entries(requestData.headers ?? {})) if (typeof value === 'string') headers.set(name, value);
    let request;
    try { request = new Request(requestData.url, { method: requestData.method, headers }); }
    catch { invalidRows++; continue; }
    const cf = requestData.cf ?? {};
    // Use only the fields required by the actual extractor; don't copy cf wholesale.
    Object.defineProperty(request, 'cf', { value: { asn: cf.asn, country: cf.country, asOrganization: cf.asOrganization } });
    const metadata = extractRequestMetadata(request);
    const classification = analyzeTraffic(metadata.userAgent);
    const clientForm = clientFormEvidence(metadata.userAgent, headers.get('sec-ch-ua-mobile'), classification.declarations.browserFamily);
    const signaturePresent = metadata.hasSignatureHeaders;
    const signature = signaturePresent ? { status: 'unverified', reason: 'historical-not-reverified' } : { status: 'absent' };
    const facts = { ...classification, observationSource: 'edge', asn: metadata.asn,
      secFetchMode: metadata.secFetchMode, secFetchDest: metadata.secFetchDest, secFetchSite: metadata.secFetchSite,
      secFetchUser: metadata.secFetchUser, acceptsHtml: metadata.acceptsHtml, hasAcceptLanguage: metadata.hasAcceptLanguage,
      signature, userAgent: metadata.userAgent, referrerState: metadata.referrerState };
    const reader = classifyReaderKind(facts);
    const derived = classificationEvidence(facts, classification.declarations);
    const evidence = extractRequestEvidence(request, new Response(null, { status }));
    const pairs = [ ['day', String(row.timestamp).slice(0,10)], ['status', status], ['method', vocabulary(requestData.method, ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'])], ['dataset', vocabulary(row.dataset, ['cloudflare-workers'])],
      ['declarationStatus', classification.declarations.status], ['categoryAgreement', derived.categoryAgreement], ['networkEvidence', derived.network], ['referrerContext', derived.referrerContext],
      ['trafficClass', classification.trafficClass], ['readerKind', reader.kind], ['browserFamily', evidence.browserFamily],
      ['osFamily', evidence.osFamily], ['clientForm', clientForm.form], ['mobilePreference', clientForm.mobileHint], ['legacyDeviceCompatibility', clientForm.legacyCompatibility.value], ['knownClient', classification.agentName],
      ['fetchMode', vocabulary(metadata.secFetchMode, ['navigate','cors','no-cors','same-origin','websocket'])], ['fetchDest', vocabulary(metadata.secFetchDest, ['document','empty','iframe','script','style','image','font','worker','sharedworker','serviceworker','audio','video','manifest','object','embed','report','track'])], ['fetchSite', vocabulary(metadata.secFetchSite, ['same-origin','same-site','cross-site','none'])], ['fetchUser', metadata.secFetchUser] ];
    for (const [key, value] of pairs) increment(dimensions[key], value);
    if (status >= 200 && status < 300) increment(dimensions.successfulReaderKind, reader.kind);
    userAgents.add(metadata.userAgent); addresses.add(metadata.ip); networks.add(metadata.asn); countries.add(metadata.country);
    try { referrerHosts.add(new URL(headers.get('referer')).hostname); } catch { referrerHosts.add(null); }
    const eventId = row.$metadata?.id;
    if (typeof eventId !== 'string') missingEventIds++;
    else { if (eventIds.has(eventId)) duplicateEventIds++; eventIds.add(eventId); }
    if (worker.truncated === true) truncatedEvents++;
    if (signaturePresent) signatureHeaderEvents++;
    if (typeof cf.verifiedBotCategory === 'string' && cf.verifiedBotCategory.length > 0) populatedVerifiedBotCategoryEvents++;
  }
  return { checkedAt: new Date().toISOString(), source: 'Native Workers event export; not a D1 or RUM event join', inputRows: rows.length, invalidRows,
    duplicateEventIds, missingEventIds, truncatedEvents, classifierVersion: CLASSIFIER_VERSION, dimensions,
    distinctDeclaredUserAgents: userAgents.size, distinctObservedAddresses: addresses.size, distinctObservedAsns: networks.size,
    distinctObservedCountries: countries.size, distinctReferrerHosts: referrerHosts.size, signatureHeaderEvents, populatedVerifiedBotCategoryEvents,
    limits: ['Current-rule replay on retained request inputs, not a historical classification rewrite or measured human/bot error rate.',
      'Native log retention/sampling and original eligibility/representation are not proven by this export. No raw content type is inferred from a 200 response.',
      'A declaration, header consistency or source network does not establish the operator, purpose or human trigger.',
      'Distinct source addresses, daily clients and people are different units.'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const input = process.argv[2], output = process.argv[3];
  if (!input || !output) throw new Error('Usage: node analyze-worker-cohort.mjs PRIVATE_EXPORT_JSON OUTPUT_JSON');
  const bytes = readFileSync(input); const summary = analyzeWorkerCohort(JSON.parse(bytes.toString()));
  summary.sourceSha256 = Object.fromEntries(['classify.ts', 'client-form.ts', 'readerkind.ts', 'classification-evidence.ts', 'networks.ts', 'metadata.ts'].map(name => [name, createHash('sha256').update(readFileSync(`packages/analytics/src/${name}`)).digest('hex')]));
  summary.inputSha256 = createHash('sha256').update(bytes).digest('hex'); summary.inputBytes = bytes.length;
  writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(summary, null, 2));
}
