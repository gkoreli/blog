import { createWebBotAuthCache, inspectWebBotAuthCandidates, verifyWebBotAuthCandidate, webBotAuthCandidateReuseTokens, type WebBotAuthResult } from './webbotauth.js';
import { verificationOutcome } from './signature-evidence.js';
import { verificationTime } from './verification-clock.js';
import { VERIFIER_PROFILE_VERSION } from './versions.js';

export interface ReuseObservation {
  /** Exact private request reference supplied by the evidence adapter; never emitted. */
  reference: string;
  request: Request;
  observedAt: Date;
}
export interface ReuseAuditOptions {
  fetcher: typeof fetch;
  maxObservations?: number;
  maxCandidatesPerObservation?: number;
  deadlineMs?: number;
  maxAgeSeconds?: number;
}

/** Bounded offline cohort analysis, not a collector or nonce enforcement store.
 * Repeated proofs/nonces are evidence of reuse within this supplied cohort,
 * never an attack verdict, global prevalence or unique-action count.
 */
export async function auditWebBotAuthReuse(observations: readonly ReuseObservation[], options: ReuseAuditOptions) {
  const maxObservations = options.maxObservations ?? 64, maxCandidates = options.maxCandidatesPerObservation ?? 8;
  const deadlineMs = options.deadlineMs ?? 2000, maxAgeSeconds = options.maxAgeSeconds ?? 86400;
  const referenceCounts: { missingReferenceRecords: number | null; duplicateReferenceRecords: number | null } = {
    missingReferenceRecords: null, duplicateReferenceRecords: null,
  };
  const policy: { policy: { maxObservations: number; maxCandidatesPerObservation: number; deadlineMs: number; maxAgeSeconds: number; headerBudgetUnits: number } | null } = { policy: null };
  const result = {
    version: '2026-10-28.1' as const, verifierProfile: VERIFIER_PROFILE_VERSION,
    scope: 'supplied-observations-publisher-key' as const, enforcement: 'none' as const,
    assessment: 'not-assessed', termination: 'invalid-options',
    ...policy,
    submittedObservations: observations.length, assessedObservations: 0, unassessedObservations: observations.length,
    ...referenceCounts,
    invalidContextRecords: 0, headerBudgetRecords: 0, incompleteObservations: 0,
    verifiedObservations: 0, knownTaggedCandidates: 0, attemptedCandidates: 0, unassessedKnownCandidates: 0, verifiedCandidates: 0,
    notVerifiedByProfileCandidates: 0, unresolvedCandidates: 0,
    nonceStringCandidates: 0, nonceAbsentCandidates: 0, nonceUnusableCandidates: 0,
    distinctVerifiedProofs: 0, repeatedProofGroups: 0, observationsInRepeatedProofGroups: 0,
    repeatedProofGroupsWithChangedMethodUrlOrUserAgent: 0,
    distinctUsableNonces: 0, repeatedNonceGroups: 0, repeatedNonceGroupsWithDifferentProofs: 0,
    directoryFetches: 0,
  };
  if (typeof options.fetcher !== 'function' || !Number.isSafeInteger(maxObservations) || maxObservations < 1 || maxObservations > 128
    || !Number.isSafeInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 16
    || !Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 10000
    || !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 0) return result;
  result.policy = { maxObservations, maxCandidatesPerObservation: maxCandidates, deadlineMs, maxAgeSeconds, headerBudgetUnits: 32768 };
  if (observations.length > maxObservations) return { ...result, termination: 'observation-limit' };
  const references = new Map<string, number>();
  const usableReference = (value: string) => typeof value === 'string' && value.length > 0 && value.length <= 256;
  for (const row of observations) if (usableReference(row.reference)) references.set(row.reference, (references.get(row.reference) ?? 0) + 1);
  result.missingReferenceRecords = observations.filter(row => !usableReference(row.reference)).length;
  result.duplicateReferenceRecords = observations.filter(row => usableReference(row.reference) && references.get(row.reference) !== 1).length;
  // Freeze all contexts before the first asynchronous resolver call.
  const snapshots = observations.map(row => {
    if (!usableReference(row.reference) || references.get(row.reference) !== 1) return null;
    const at = row.observedAt instanceof Date ? verificationTime(row.observedAt) : null;
    if (at === null) { result.invalidContextRecords++; return null; }
    try { return { reference: row.reference, at, request: new Request(row.request.url, { method: row.request.method, headers: new Headers(row.request.headers) }) }; }
    catch { result.invalidContextRecords++; return null; }
  });
  const proofs = new Map<string, { references: Set<string>; contexts: Set<string> }>();
  const nonces = new Map<string, { references: Set<string>; proofs: Set<string> }>();
  const repeatedReferences = new Set<string>(), cache = createWebBotAuthCache(), controller = new AbortController();
  let timedOut = false, candidateLimit = false;
  const deadline = new Promise<WebBotAuthResult>(resolve => {
    controller.signal.addEventListener('abort', () => resolve({ status: 'unverified', reason: 'verification-timeout' }), { once: true });
  });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, deadlineMs);
  const fetcher: typeof fetch = (url, init) => {
    result.directoryFetches++;
    return options.fetcher(url, { ...init, signal: controller.signal });
  };
  try {
    for (const row of snapshots) {
      if (row === null) continue;
      if (timedOut) break;
      const units = ['signature-agent', 'signature-input', 'signature'].reduce((n, name) => n + (row.request.headers.get(name)?.length ?? 0), 0);
      if (units > 32768) { result.headerBudgetRecords++; continue; }
      const inspected = inspectWebBotAuthCandidates(row.request);
      result.assessedObservations++;
      if (inspected.status !== 'ready') { if (inspected.status !== 'absent') result.incompleteObservations++; continue; }
      result.knownTaggedCandidates += inspected.labels.length;
      let incomplete = inspected.inputMembers !== inspected.matchedCandidates || inspected.signatureMembers !== inspected.matchedCandidates;
      if (inspected.labels.length > maxCandidates) { incomplete = true; candidateLimit = true; }
      let verified = false;
      for (const label of inspected.labels.slice(0, maxCandidates)) {
        if (timedOut) { incomplete = true; break; }
        result.attemptedCandidates++;
        const verdict = await Promise.race([verifyWebBotAuthCandidate(row.request, label, { now: new Date(row.at), maxAgeSeconds, cache, fetcher }), deadline]);
        if (verdict.status !== 'verified') {
          const outcome = verificationOutcome(verdict);
          if (outcome === 'invalid' || outcome === 'policy-rejected' || outcome === 'not-applicable') result.notVerifiedByProfileCandidates++;
          else { result.unresolvedCandidates++; incomplete = true; }
          continue;
        }
        const tokens = await webBotAuthCandidateReuseTokens(row.request, label, verdict.agent, cache).catch(() => null);
        if (tokens === null || timedOut) { result.unresolvedCandidates++; incomplete = true; continue; }
        verified = true; result.verifiedCandidates++;
        const group = proofs.get(tokens.proof) ?? { references: new Set<string>(), contexts: new Set<string>() };
        group.references.add(row.reference); group.contexts.add(tokens.context); proofs.set(tokens.proof, group);
        if (tokens.nonceState === 'absent') result.nonceAbsentCandidates++;
        else if (tokens.nonceState === 'unusable') result.nonceUnusableCandidates++;
        else result.nonceStringCandidates++;
        if (tokens.nonce !== null) {
          const group = nonces.get(tokens.nonce) ?? { references: new Set<string>(), proofs: new Set<string>() };
          group.references.add(row.reference); group.proofs.add(tokens.proof); nonces.set(tokens.nonce, group);
        }
      }
      if (incomplete) result.incompleteObservations++;
      if (verified) result.verifiedObservations++;
    }
  } finally { clearTimeout(timer); controller.abort(); }
  result.unassessedObservations = observations.length - result.assessedObservations;
  result.unassessedKnownCandidates = result.knownTaggedCandidates - result.attemptedCandidates;
  result.distinctVerifiedProofs = proofs.size; result.distinctUsableNonces = nonces.size;
  for (const group of proofs.values()) if (group.references.size > 1) {
    result.repeatedProofGroups++;
    for (const reference of group.references) repeatedReferences.add(reference);
    if (group.contexts.size > 1) result.repeatedProofGroupsWithChangedMethodUrlOrUserAgent++;
  }
  result.observationsInRepeatedProofGroups = repeatedReferences.size;
  for (const group of nonces.values()) if (group.references.size > 1) {
    result.repeatedNonceGroups++;
    if (group.proofs.size > 1) result.repeatedNonceGroupsWithDifferentProofs++;
  }
  result.assessment = observations.length === 0 ? 'absent' : result.unassessedObservations || result.incompleteObservations ? 'partial' : 'complete';
  result.termination = timedOut ? 'deadline' : candidateLimit ? 'candidate-limit' : 'exhausted';
  return result;
}
