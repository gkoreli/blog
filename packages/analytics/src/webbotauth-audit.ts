import { inspectWebBotAuthCandidates, verifyWebBotAuthCandidate, createWebBotAuthCache, type WebBotAuthResult } from './webbotauth.js';
import { verificationOutcome } from './signature-evidence.js';
import { VERIFIER_PROFILE_VERSION } from './versions.js';

export interface SignatureAuditOptions {
  /** Explicit resolver transport is required. No implicit remote discovery. */
  fetcher: typeof fetch;
  now?: Date;
  maxAgeSeconds?: number;
  maxCandidates?: number;
  deadlineMs?: number;
}

const MAX_HEADER_UNITS = 32768;
export interface SignatureAudit {
  version: '2026-10-28.1';
  verifierProfile: string;
  policy: { maxCandidates: number; deadlineMs: number; maxAgeSeconds: number; headerBudgetUnits: number; clockSource: 'caller-supplied' | 'current-at-start' } | null;
  scope: 'paired-web-bot-auth-candidates';
  assessment: 'complete' | 'partial' | 'absent' | 'not-applicable' | 'not-assessed';
  termination: 'exhausted' | 'candidate-limit' | 'deadline' | 'invalid-options' | 'header-budget' | 'input-not-assessed' | 'no-eligible-candidate';
  inputMembers: number | null;
  signatureMembers: number | null;
  unpairedInputs: number | null;
  unpairedSignatures: number | null;
  matchedCandidates: number | null;
  taggedCandidates: number | null;
  attemptedCandidates: number;
  verifiedCandidates: number;
  notVerifiedByProfileCandidates: number;
  unavailableCandidates: number;
  unsupportedCandidates: number;
  indeterminateCandidates: number;
  unassessedCandidates: number | null;
  unresolvedCandidates: number | null;
  /** A lower bound on publisher origins, never people, signers, keys or actions. */
  verifiedPublisherOriginLowerBound: number;
  directoryFetches: number;
}

/** Offline/controlled diagnostic capability, not called by the page collector.
 * Every eligible proof is attempted within one global deadline/candidate cap.
 * Never call an exhausted traversal complete while verdicts remain unresolved.
 * Summaries contain no labels, key IDs, origins, signatures or message values.
 */
export async function auditWebBotAuth(request: Request, options: SignatureAuditOptions): Promise<SignatureAudit> {
  const result: SignatureAudit = {
    version: '2026-10-28.1', verifierProfile: VERIFIER_PROFILE_VERSION, policy: null, scope: 'paired-web-bot-auth-candidates',
    assessment: 'not-assessed', termination: 'invalid-options', inputMembers: null, signatureMembers: null, unpairedInputs: null, unpairedSignatures: null, matchedCandidates: null, taggedCandidates: null,
    attemptedCandidates: 0, verifiedCandidates: 0, notVerifiedByProfileCandidates: 0,
    unavailableCandidates: 0, unsupportedCandidates: 0, indeterminateCandidates: 0,
    unassessedCandidates: null, unresolvedCandidates: null, verifiedPublisherOriginLowerBound: 0, directoryFetches: 0,
  };
  const maxCandidates = options.maxCandidates ?? 8, deadlineMs = options.deadlineMs ?? 2000;
  const now = new Date((options.now ?? new Date()).getTime()), maxAgeSeconds = options.maxAgeSeconds ?? 86400;
  if (typeof options.fetcher !== 'function' || !Number.isSafeInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 16
    || !Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 10000
    || !Number.isFinite(now.getTime()) || !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 0) return result;
  result.policy = { maxCandidates, deadlineMs, maxAgeSeconds, headerBudgetUnits: MAX_HEADER_UNITS, clockSource: options.now === undefined ? 'current-at-start' : 'caller-supplied' };
  const headerUnits = ['Signature-Agent', 'Signature-Input', 'Signature'].reduce((size, name) => size + (request.headers.get(name)?.length ?? 0), 0);
  if (headerUnits > MAX_HEADER_UNITS) return { ...result, termination: 'header-budget' };
  // Copy only the context this verifier supports; it does not compare body bytes
  // with Content-Digest. Do not let the caller mutate a later candidate's context.
  const snapshot = new Request(request.url, { method: request.method, headers: new Headers(request.headers) });
  const inspected = inspectWebBotAuthCandidates(snapshot);
  if (inspected.status === 'absent') return { ...result, assessment: 'absent', termination: 'input-not-assessed', inputMembers: 0, signatureMembers: 0, unpairedInputs: 0, unpairedSignatures: 0, matchedCandidates: 0, taggedCandidates: 0, unassessedCandidates: 0, unresolvedCandidates: 0 };
  if (inspected.status !== 'ready') return { ...result, termination: 'input-not-assessed' };
  result.inputMembers = inspected.inputMembers; result.signatureMembers = inspected.signatureMembers;
  result.unpairedInputs = inspected.inputMembers - inspected.matchedCandidates;
  result.unpairedSignatures = inspected.signatureMembers - inspected.matchedCandidates;
  const unpairedContext = result.unpairedInputs + result.unpairedSignatures > 0;
  result.matchedCandidates = inspected.matchedCandidates;
  result.taggedCandidates = inspected.labels.length;
  result.unassessedCandidates = inspected.labels.length;
  result.unresolvedCandidates = inspected.labels.length;
  if (!inspected.labels.length) return { ...result, assessment: unpairedContext ? 'partial' : 'not-applicable', termination: 'no-eligible-candidate' };
  const controller = new AbortController(), cache = createWebBotAuthCache(), origins = new Set<string>();
  let timedOut = false, timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<WebBotAuthResult>(resolve => {
    timer = setTimeout(() => { timedOut = true; controller.abort(); resolve({ status: 'unverified', reason: 'verification-timeout' }); }, deadlineMs);
  });
  const fetcher: typeof fetch = (url, init) => {
    if (controller.signal.aborted) return Promise.reject(new Error('Audit deadline elapsed'));
    result.directoryFetches++;
    return options.fetcher(url, { ...init, signal: controller.signal });
  };
  try {
    for (const label of inspected.labels.slice(0, maxCandidates)) {
      if (timedOut) break;
      result.attemptedCandidates++;
      const verdict = await Promise.race([verifyWebBotAuthCandidate(snapshot, label, { now, maxAgeSeconds, includeEvidence: true, cache, fetcher }), deadline]);
      if (verdict.status === 'verified') { result.verifiedCandidates++; origins.add(verdict.agent); }
      else {
        const outcome = verificationOutcome(verdict);
        if (outcome === 'invalid' || outcome === 'policy-rejected' || outcome === 'not-applicable') result.notVerifiedByProfileCandidates++;
        else if (outcome === 'unavailable') result.unavailableCandidates++;
        else if (outcome === 'unsupported') result.unsupportedCandidates++;
        else result.indeterminateCandidates++;
      }
    }
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    controller.abort();
  }
  result.verifiedPublisherOriginLowerBound = origins.size;
  result.unassessedCandidates = inspected.labels.length - result.attemptedCandidates;
  result.unresolvedCandidates = result.unassessedCandidates + result.unavailableCandidates + result.unsupportedCandidates + result.indeterminateCandidates;
  result.termination = timedOut ? 'deadline' : result.unassessedCandidates > 0 ? 'candidate-limit' : 'exhausted';
  result.assessment = result.unresolvedCandidates === 0 && !unpairedContext ? 'complete' : 'partial';
  return result;
}
