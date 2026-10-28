import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { analyzeTraffic } from '../../../../analytics/.test-dist/classify.js';
import { verifyWebBotAuth, createWebBotAuthCache } from '../../../../analytics/.test-dist/webbotauth.js';
import { nativeCategoryEvidence } from '../../../../analytics/.test-dist/native-bot-evidence.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const declarations = new Set(['ExaSearchBot', 'ExaUser']);
const directoryUrl = 'https://crawler.exa.ai/.well-known/http-message-signatures-directory';
const add = (counts, value) => { counts[value] = (counts[value] ?? 0) + 1; };

/** A native export may contain spans and unrelated invocations despite its UI search.
 * Select actual invocation request declarations, then join custom logs by requestId.
 * Never use time/path proximity, a shared operationId, or a replay as a D1 identity join.
 */
export function reconcileInvocations(rows, declaredNames = declarations) {
  assert.ok(Array.isArray(rows));
  const ids = new Map();
  let missingIds = 0, duplicateIds = 0, truncatedRecords = 0;
  for (const row of rows) {
    const id = row?.$metadata?.id;
    if (typeof id !== 'string' || !id) missingIds++;
    else {
      if (ids.has(id)) duplicateIds++;
      ids.set(id, (ids.get(id) ?? 0) + 1);
    }
    if (row?.$workers?.truncated === true) truncatedRecords++;
  }
  const candidates = rows.filter(row => {
    if (row?.$metadata?.type !== 'cf-worker-event') return false;
    const request = row?.$workers?.event?.request;
    if (!request || typeof request.url !== 'string' || typeof request.method !== 'string') return false;
    const ua = new Headers(request.headers).get('user-agent') ?? '';
    return analyzeTraffic(ua).declarations.candidates.some(name => declaredNames.has(name));
  });
  const requestIds = new Map();
  for (const row of candidates) {
    const id = row.$metadata.requestId;
    if (typeof id === 'string' && id) requestIds.set(id, (requestIds.get(id) ?? 0) + 1);
  }
  const integrity = { missingIds, duplicateIds, truncatedRecords };
  const reconciliations = candidates.map(row => {
    const id = row.$metadata.requestId;
    const joinable = typeof id === 'string' && id && requestIds.get(id) === 1;
    const logs = joinable ? rows.filter(log => log?.$metadata?.type === 'cf-worker' && log.$metadata.requestId === id) : [];
    // Other invocations' ID collisions do not invalidate this scoped pair, but a
    // selected ID colliding anywhere in the export does. Never deduplicate it.
    const scoped = [row, ...logs];
    const scopedIntegrity = {
      missingIds: scoped.filter(log => typeof log?.$metadata?.id !== 'string' || !log.$metadata.id).length,
      collidingIdRecords: scoped.filter(log => (ids.get(log?.$metadata?.id) ?? 0) > 1).length,
      truncatedRecords: scoped.filter(log => log?.$workers?.truncated === true).length,
    };
    const attempts = logs.filter(log => log.source?.message === 'analytics.observation_attempt');
    const stored = logs.filter(log => log.source?.message === 'analytics.observation_stored');
    const failures = logs.filter(log => log.source?.message === 'analytics.observation_write_failed');
    const matched = attempts.length === 1 && stored.length === 1 && failures.length === 0
      && typeof attempts[0].source.operationId === 'string' && attempts[0].source.operationId.length > 0
      && attempts[0].source.operationId === stored[0].source.operationId
      && typeof attempts[0].source.collectionVersion === 'string'
      && attempts[0].source.collectionVersion === stored[0].source.collectionVersion
      && Date.parse(attempts[0].timestamp) <= Date.parse(stored[0].timestamp);
    return { row, complete: matched && Object.values(scopedIntegrity).every(count => count === 0), scopedIntegrity,
      collectionVersion: matched ? stored[0].source.collectionVersion : null,
      receipt: matched ? stored[0].source.receipt : undefined,
      attempts: attempts.length, stored: stored.length, failures: failures.length };
  });
  return { integrity, reconciliations };
}

export async function analyzeExport(bytes, directoryBytes) {
  const rows = JSON.parse(bytes.toString());
  const { integrity, reconciliations } = reconcileInvocations(rows);
  const counts = { replayStatus: {}, coverage: {}, categories: {}, nativeVerifiedBot: {}, nativeSignedAgent: {}, collections: {}, storedReceiptVersions: {}, storedReceiptOutcomes: {} };
  let complete = 0, matchingOrigins = 0;
  const times = [];
  for (const item of reconciliations) {
    const row = item.row, data = row.$workers.event.request, at = new Date(row.timestamp);
    assert.ok(Number.isFinite(at.getTime())); times.push(at.toISOString());
    const request = new Request(data.url, { method: data.method, headers: new Headers(data.headers) });
    const result = await verifyWebBotAuth(request, { now: at, includeEvidence: true, maxAgeSeconds: 86400,
      cache: createWebBotAuthCache(), async fetcher(url) {
        assert.equal(String(url), directoryUrl);
        return new Response(directoryBytes, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json', 'Cache-Control': 'max-age=300' } });
      } });
    add(counts.replayStatus, result.status);
    if (result.status === 'verified') {
      if (result.agent === 'https://crawler.exa.ai') matchingOrigins++;
      for (const [key, value] of Object.entries(result.evidence?.covered ?? {})) if (value) add(counts.coverage, key);
    }
    const category = nativeCategoryEvidence(data.cf);
    add(counts.categories, category.value ?? category.status);
    for (const [key, field] of [['nativeVerifiedBot', 'verifiedBot'], ['nativeSignedAgent', 'signedAgent']]) {
      const value = data.cf?.botManagement?.[field];
      add(counts[key], typeof value === 'boolean' ? String(value) : 'unavailable');
    }
    add(counts.collections, typeof item.collectionVersion === 'string' && /^2026-\d{2}-\d{2}\.\d{1,4}$/.test(item.collectionVersion)
      ? item.collectionVersion : 'unrecognized-or-unreconciled');
    if (item.complete) complete++;
    const receipt = item.complete ? item.receipt : undefined;
    const knownReceipt = ['2026-10-27.1', '2026-10-27.2', '2026-10-27.3', '2026-10-28.1'].includes(receipt?.version);
    add(counts.storedReceiptVersions, knownReceipt ? receipt.version : 'unavailable-or-unrecognized');
    add(counts.storedReceiptOutcomes, knownReceipt && receipt.signature?.source === 'local-webbotauth'
      && ['absent','verified','invalid','unavailable','policy-rejected','unsupported','not-verified'].includes(receipt.signature?.outcome)
      ? receipt.signature.outcome : 'unavailable-or-unrecognized');
  }
  return { checkedAt: new Date().toISOString(), method: 'Offline declaration selection, native requestId/operationId log reconciliation and recorded-time cryptographic replay; no D1 identity join.',
    input: { records: rows.length, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') },
    integrity, selectedRecordIntegrity: reconciliations.reduce((totals, item) => {
      for (const key of Object.keys(totals)) totals[key] += item.scopedIntegrity[key];
      return totals;
    }, { missingIds: 0, collidingIdRecords: 0, truncatedRecords: 0 }),
    selectedInvocationRecords: reconciliations.length, completeAttemptStoredPairs: complete,
    matchingReplayOrigins: matchingOrigins, observedInvocationTimestampRange: { first: times.sort()[0] ?? null, last: times.at(-1) ?? null },
    counts, verifierProfile: VERIFIER_PROFILE_VERSION,
    directory: { url: directoryUrl, bytes: directoryBytes.length, sha256: createHash('sha256').update(directoryBytes).digest('hex') },
    networkCalls: 0, productionRequests: 0, exactD1Joins: 0,
    limits: ['The dashboard search count and exported record population differ; selection is reapplied to invocation request declarations offline.',
      'Receipt presence/outcomes are counted separately; older success logs have no verdict. This replay tool does not establish an exact D1 row join.',
      'Replay uses recorded invocation times and separately captured later keys, not proof of the original directory or original Worker verdict.',
      'Provider categories do not establish native cryptographic verification; unavailable booleans remain unknown.',
      'No complete retention, unique HTTP delivery, population accuracy, human trigger or citation claim. Current receipt facts require separate field validation.',
      'Raw request context, IDs, addresses, signatures and operation identifiers remain private.'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, directory, output] = process.argv.slice(2);
  assert.ok(input && directory && output, 'Provide private native export, captured directory and new aggregate path');
  const result = await analyzeExport(readFileSync(input), readFileSync(directory));
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ selected: result.selectedInvocationRecords, pairs: result.completeAttemptStoredPairs, replay: result.counts.replayStatus, integrity: result.integrity }));
}
