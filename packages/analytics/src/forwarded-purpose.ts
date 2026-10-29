import { buildSignatureBase, createWebBotAuthCache, inspectWebBotAuthCandidates, verifyWebBotAuthCandidate, type WebBotAuthResult } from './webbotauth.js';
import { verificationOutcome } from './signature-evidence.js';
import { verificationTime } from './verification-clock.js';
import { publicSignerName, type PublicSignerName } from './signers.js';
import { VERIFIER_PROFILE_VERSION } from './versions.js';
import type { SignatureAuditOptions } from './webbotauth-audit.js';

/** Experimental Cloudflare vocabulary, reviewed 2026-10-29. These are claims,
 * not approved operators, permissions, delegation, actual use or human intent.
 * https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
 * https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
 */
export const FORWARDED_PURPOSE_PROFILE = '2026-10-29.1';
export const FORWARDED_USE_CLAIMS = ['immediate', 'reference', 'full'] as const;
export type ForwardedUseClaim = typeof FORWARDED_USE_CLAIMS[number];
type ClaimStatus = 'absent' | 'known-claim' | 'unrecognized';
interface ForwardedElementFacts {
  operator: { status: ClaimStatus; value: 'openai' | null };
  use: { status: ClaimStatus; value: ForwardedUseClaim | null };
  otherParameterCount: number;
}
export interface ForwardedClaimFacts {
  profile: typeof FORWARDED_PURPOSE_PROFILE;
  syntax: 'absent' | 'empty' | 'parsed' | 'malformed' | 'policy-rejected';
  reason: 'none' | 'header-budget' | 'element-limit' | 'parameter-limit' | 'invalid-pair' | 'invalid-value' | 'invalid-separator' | 'duplicate-parameter' | 'empty-element-not-supported';
  duplicate: 'none' | 'same-value' | 'different-values';
  elements: ForwardedElementFacts[];
  chainSelection: 'not-performed';
}
const MAX_HEADER_UNITS = 4096, MAX_ELEMENTS = 8, MAX_PARAMETERS = 16;
function token(code: number): boolean {
  return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122
    || code < 128 && "!#$%&'*+-.^_`|~".includes(String.fromCharCode(code));
}
function quoted(code: number): boolean {
  return code === 9 || code === 32 || code === 33 || code >= 35 && code <= 91 || code >= 93 && code <= 126 || code >= 128 && code <= 255;
}
function useClaim(value: string | undefined): ForwardedUseClaim | null {
  return FORWARDED_USE_CLAIMS.find(candidate => candidate === value) ?? null;
}

/** Bounded syntax subset, not node-address validation or proxy-chain trust.
 * Parse quoting/escapes before delimiters; never use last-wins duplicates.
 * Raw values, IPs and extension strings do not escape this function.
 */
export function forwardedClaimFacts(header: string | null): ForwardedClaimFacts {
  const facts: ForwardedClaimFacts = { profile: FORWARDED_PURPOSE_PROFILE, syntax: 'absent', reason: 'none', duplicate: 'none', elements: [], chainSelection: 'not-performed' };
  if (header === null) return facts;
  const fail = (syntax: ForwardedClaimFacts['syntax'], reason: ForwardedClaimFacts['reason']) => ({ ...facts, syntax, reason, elements: [] });
  if (header.length > MAX_HEADER_UNITS) return fail('policy-rejected', 'header-budget');
  const text = header.replace(/^[ \t]+|[ \t]+$/g, '');
  if (text.length === 0) return { ...facts, syntax: 'empty' };
  let at = 0;
  const skipSpace = () => { while (text[at] === ' ' || text[at] === '\t') at++; };
  while (at < text.length) {
    if (facts.elements.length >= MAX_ELEMENTS) return fail('policy-rejected', 'element-limit');
    const pairs = new Map<string, string>();
    while (at < text.length) {
      skipSpace();
      const start = at;
      while (token(text.charCodeAt(at))) at++;
      if (at === start || text[at] !== '=') return fail('malformed', 'invalid-pair');
      const name = text.slice(start, at).toLowerCase(); at++;
      let value = '';
      if (text[at] === '"') {
        at++; let closed = false;
        while (at < text.length) {
          const code = text.charCodeAt(at++);
          if (code === 34) { closed = true; break; }
          if (code === 92) {
            const escaped = text.charCodeAt(at++);
            if (!(escaped === 9 || escaped >= 32 && escaped <= 126 || escaped >= 128 && escaped <= 255)) return fail('malformed', 'invalid-value');
            value += String.fromCharCode(escaped);
          } else {
            if (!quoted(code)) return fail('malformed', 'invalid-value');
            value += String.fromCharCode(code);
          }
        }
        if (!closed) return fail('malformed', 'invalid-value');
      } else {
        const start = at; while (token(text.charCodeAt(at))) at++;
        if (at === start) return fail('malformed', 'invalid-value');
        value = text.slice(start, at);
      }
      if (pairs.has(name)) { facts.duplicate = pairs.get(name) === value ? 'same-value' : 'different-values'; return fail('malformed', 'duplicate-parameter'); }
      pairs.set(name, value);
      if (pairs.size > MAX_PARAMETERS) return fail('policy-rejected', 'parameter-limit');
      skipSpace();
      if (at === text.length || text[at] === ',') break;
      if (text[at] !== ';') return fail('malformed', 'invalid-separator');
      at++;
      if (at === text.length) return fail('malformed', 'invalid-pair');
    }
    const operator = pairs.get('for'), use = pairs.get('use'), knownUse = useClaim(use);
    facts.elements.push({ operator: { status: operator === undefined ? 'absent' : operator === 'openai' ? 'known-claim' : 'unrecognized', value: operator === 'openai' ? 'openai' : null },
      use: { status: use === undefined ? 'absent' : knownUse === null ? 'unrecognized' : 'known-claim', value: knownUse }, otherParameterCount: pairs.size - Number(pairs.has('for')) - Number(pairs.has('use')) });
    if (text[at] === ',') { at++; skipSpace(); if (at === text.length || text[at] === ',') return fail('policy-rejected', 'empty-element-not-supported'); }
  }
  return { ...facts, syntax: 'parsed' };
}

export interface ForwardedPurposeAudit {
  version: typeof FORWARDED_PURPOSE_PROFILE;
  verifierProfile: string;
  claims: ForwardedClaimFacts;
  policy: { maxCandidates: number; deadlineMs: number; maxAgeSeconds: number; signatureHeaderUnits: number; forwardedHeaderUnits: number; elementLimit: number; parameterLimit: number; clockSource: 'caller-supplied' | 'current-at-start' } | null;
  assessment: 'not-assessed' | 'absent' | 'complete' | 'partial';
  termination: 'invalid-options' | 'no-header' | 'header-not-parsed' | 'signature-budget' | 'input-not-assessed' | 'exhausted' | 'candidate-limit' | 'deadline';
  signatureScope: 'paired-web-bot-auth-candidates';
  attempted: number; verified: number; invalid: number; policyRejected: number; unavailable: number; unsupported: number; indeterminate: number;
  unassessedCandidates: number | null; unpairedMembers: number | null;
  verifiedWholeFieldCoverage: number; verifiedWithoutFieldCoverage: number;
  assertingPublishers: PublicSignerName[];
  claimAuthentication: 'not-established' | 'verified-signer-assertion';
  nativeHeaderProvenance: 'not-established';
  delegation: 'not-established'; actualUse: 'not-established'; humanTrigger: 'not-established';
  directoryFetches: number;
}

/** Offline diagnostic, deliberately absent from the collector/report graph.
 * Verify each exact candidate against an immutable request before inspecting
 * its canonical base. A provider bot boolean never authenticates this header.
 */
export async function auditForwardedPurpose(request: Request, options: SignatureAuditOptions): Promise<ForwardedPurposeAudit> {
  const result: ForwardedPurposeAudit = { version: FORWARDED_PURPOSE_PROFILE, verifierProfile: VERIFIER_PROFILE_VERSION,
    claims: forwardedClaimFacts(request.headers.get('Forwarded')), policy: null, assessment: 'not-assessed', termination: 'invalid-options', signatureScope: 'paired-web-bot-auth-candidates',
    attempted: 0, verified: 0, invalid: 0, policyRejected: 0, unavailable: 0, unsupported: 0, indeterminate: 0, unassessedCandidates: null, unpairedMembers: null,
    verifiedWholeFieldCoverage: 0, verifiedWithoutFieldCoverage: 0, assertingPublishers: [], claimAuthentication: 'not-established',
    nativeHeaderProvenance: 'not-established', delegation: 'not-established', actualUse: 'not-established', humanTrigger: 'not-established', directoryFetches: 0 };
  const maxCandidates = options.maxCandidates ?? 8, deadlineMs = options.deadlineMs ?? 2000, maxAgeSeconds = options.maxAgeSeconds ?? 86400, now = verificationTime(options.now);
  if (typeof options.fetcher !== 'function' || now === null || !Number.isSafeInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 16
    || !Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 10000 || !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 0) return result;
  result.policy = { maxCandidates, deadlineMs, maxAgeSeconds, signatureHeaderUnits: 32768, forwardedHeaderUnits: MAX_HEADER_UNITS, elementLimit: MAX_ELEMENTS, parameterLimit: MAX_PARAMETERS,
    clockSource: options.now === undefined ? 'current-at-start' : 'caller-supplied' };
  if (result.claims.syntax === 'absent') return { ...result, assessment: 'absent', termination: 'no-header' };
  if (result.claims.syntax !== 'parsed') return { ...result, termination: 'header-not-parsed' };
  if (['signature-agent', 'signature-input', 'signature'].reduce((n, name) => n + (request.headers.get(name)?.length ?? 0), 0) > 32768) return { ...result, termination: 'signature-budget' };
  const snapshot = new Request(request.url, { method: request.method, headers: new Headers(request.headers) });
  const inspected = inspectWebBotAuthCandidates(snapshot);
  if (inspected.status === 'absent') return { ...result, assessment: 'complete', termination: 'exhausted', unassessedCandidates: 0, unpairedMembers: 0 };
  if (inspected.status !== 'ready') return { ...result, termination: 'input-not-assessed' };
  result.unpairedMembers = inspected.inputMembers + inspected.signatureMembers - 2 * inspected.matchedCandidates;
  result.unassessedCandidates = inspected.labels.length;
  const controller = new AbortController(), cache = createWebBotAuthCache(); let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<WebBotAuthResult>(resolve => {
    timer = setTimeout(() => { timedOut = true; controller.abort(); resolve({ status: 'unverified', reason: 'verification-timeout' }); }, deadlineMs);
  });
  const fetcher: typeof fetch = (url, init) => {
    if (controller.signal.aborted) return Promise.reject(new Error('Purpose audit deadline'));
    result.directoryFetches++; return options.fetcher(url, { ...init, signal: controller.signal });
  };
  try {
    for (const label of inspected.labels.slice(0, maxCandidates)) {
      if (timedOut) break;
      result.attempted++; result.unassessedCandidates--;
      const verdict = await Promise.race([verifyWebBotAuthCandidate(snapshot, label, { now: new Date(now), maxAgeSeconds, cache, fetcher }), deadline]);
      if (verdict.status === 'verified') {
        result.verified++;
        // This profile only supports plain whole request fields. Field content
        // cannot inject lines: canonicalization/verification reject controls.
        const base = buildSignatureBase(snapshot, label);
        if (base === null) { result.indeterminate++; continue; }
        if (base.split('\n').some(line => line.startsWith('"forwarded": '))) {
          result.verifiedWholeFieldCoverage++;
          const publisher = publicSignerName(verdict.agent);
          if (!result.assertingPublishers.includes(publisher)) result.assertingPublishers.push(publisher);
        } else result.verifiedWithoutFieldCoverage++;
      } else {
        const outcome = verificationOutcome(verdict);
        if (outcome === 'invalid') result.invalid++;
        else if (outcome === 'policy-rejected') result.policyRejected++;
        else if (outcome === 'unavailable') result.unavailable++;
        else if (outcome === 'unsupported') result.unsupported++;
        else result.indeterminate++;
      }
    }
  } finally { if (timer !== undefined) clearTimeout(timer); controller.abort(); }
  result.claimAuthentication = result.verifiedWholeFieldCoverage > 0 ? 'verified-signer-assertion' : 'not-established';
  result.assertingPublishers.sort();
  result.assessment = result.unassessedCandidates || result.unpairedMembers || result.unavailable || result.unsupported || result.indeterminate ? 'partial' : 'complete';
  result.termination = timedOut ? 'deadline' : result.unassessedCandidates ? 'candidate-limit' : 'exhausted';
  return result;
}
