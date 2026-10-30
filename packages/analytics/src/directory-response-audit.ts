import { parseDictionary, parameter, serializeItem, serializeInnerList, signatureCandidates,
  malformedSignatureParameterReason, directoryKey, ed25519JwkThumbprint, type SignatureCandidate } from './webbotauth.js';

export const DIRECTORY_RESPONSE_AUDIT_VERSION = '2026-10-30.1';
type Outcome = 'verified' | 'invalid' | 'policy-rejected' | 'unsupported';
type DigestState = 'not-assessed' | 'absent' | 'matched' | 'mismatch' | 'malformed' | 'unsupported';
export interface DirectoryProofAudit {
  /** Signature/admission result only; body integrity is evaluated separately. */
  outcome: Outcome;
  reason: 'verified' | 'signature-mismatch' | 'key-unavailable' | 'key-rejected' | 'invalid-parameters'
    | 'outside-validity' | 'different-tag' | 'algorithm-unsupported' | 'component-unsupported' | 'duplicate-component';
  authorityCovered: boolean | null;
  digestCovered: boolean | null;
}
interface ProfileCoverage {
  /** Distinct admitted Ed25519 keys, never requests, operators or readers. */
  verifiedKeys: number;
  /** Null when no key is admitted or incomplete/unsupported evidence prevents a negative. */
  allAdmittedKeysVerified: boolean | null;
}
export interface DirectoryResponseAudit {
  version: typeof DIRECTORY_RESPONSE_AUDIT_VERSION;
  scope: 'offline-directory-response';
  assessment: 'assessed' | 'partial' | 'not-assessed';
  reason: 'finished' | 'candidate-limit' | 'invalid-context' | 'input-budget' | 'http-status' | 'media-type'
    | 'directory-invalid' | 'fields-malformed' | 'proofs-absent' | 'unsupported-evidence' | 'encoding-unsupported';
  keyEntries: number | null;
  admittedKeys: number;
  rejectedKeyEntries: number;
  unsupportedKeyEntries: number;
  duplicateKeyEntries: number;
  digest: DigestState;
  inputMembers: number | null;
  signatureMembers: number | null;
  pairedCandidates: number | null;
  unpairedMembers: number | null;
  unassessedCandidates: number | null;
  proofs: DirectoryProofAudit[];
  profiles: { cloudflareDirectory03: ProfileCoverage; ietfProtocol01DomainBinding: ProfileCoverage };
}
export interface DirectoryResponseContext {
  /** Exact HTTPS URL requested, before any redirects. Redirect handling is external. */
  requestUrl: string;
  status: number;
  headers: HeadersInit;
  /** Caller-supplied exact response bytes. No implicit fetch or text re-encoding. */
  body: Uint8Array;
}
export interface DirectoryResponseAuditOptions {
  /** Required capture/experiment time. No implicit current-time replay. Zero skew. */
  now: Date;
  maxCandidates?: number;
}

const encoder = new TextEncoder();
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function string(value: unknown): value is string { return typeof value === 'string'; }
function canonicalKeyMaterial(value: unknown): boolean {
  if (!record(value) || !string(value.x) || !/^[A-Za-z0-9_-]{43}$/.test(value.x)) return false;
  try {
    const decoded = atob(value.x.replace(/-/g, '+').replace(/_/g, '/') + '=');
    return decoded.length === 32 && btoa(decoded).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') === value.x;
  } catch { return false; }
}
async function digestState(headers: Headers, body: Uint8Array): Promise<DigestState> {
  const field = headers.get('Content-Digest');
  if (field === null) return 'absent';
  const entries = parseDictionary(field);
  if (entries === null) return 'malformed';
  let mismatch = false, unsupported = false;
  for (const entry of entries) {
    if (entry.member.type !== 'item' || entry.member.value.parameters.length || entry.member.value.bare.type !== 'bytes') return 'malformed';
    const algorithm = entry.key === 'sha-256' ? 'SHA-256' : entry.key === 'sha-512' ? 'SHA-512' : null;
    if (algorithm === null) { unsupported = true; continue; }
    const actual = new Uint8Array(await crypto.subtle.digest(algorithm, body));
    const expected = entry.member.value.bare.value;
    if (expected.length !== actual.length || !actual.every((byte, index) => byte === expected[index])) mismatch = true;
  }
  return mismatch ? 'mismatch' : unsupported ? 'unsupported' : 'matched';
}

function base(candidate: SignatureCandidate, authority: string, status: number, headers: Headers):
  { value: string; authority: boolean; digest: boolean } | 'component-unsupported' | 'duplicate-component' {
  const parts: string[] = [], seen = new Set<string>();
  let authorityCovered = false, digestCovered = false;
  for (const item of candidate.input.items) {
    if (item.bare.type !== 'string') return 'component-unsupported';
    const id = serializeItem(item);
    if (seen.has(id)) return 'duplicate-component';
    seen.add(id);
    let value: string;
    if (item.bare.value === '@authority' && item.parameters.length === 1
      && item.parameters[0]?.name === 'req' && item.parameters[0].value.type === 'boolean' && item.parameters[0].value.value) {
      value = authority; authorityCovered = true;
    } else if (item.bare.value === '@status' && !item.parameters.length) value = String(status);
    else if (item.bare.value === 'content-digest' && !item.parameters.length) {
      const field = headers.get('Content-Digest');
      if (field === null || /[^\x20-\x7e\t]/.test(field)) return 'component-unsupported';
      value = field.replace(/^[ \t]+|[ \t]+$/g, ''); digestCovered = true;
    } else return 'component-unsupported';
    parts.push(`${id}: ${value}`);
  }
  parts.push(`"@signature-params": ${serializeInnerList(candidate.input)}`);
  return { value: parts.join('\n'), authority: authorityCovered, digest: digestCovered };
}

/** Bounded, caller-supplied evidence only. Does not establish transport authenticity,
 * operator/purpose, provider enrollment, request verification or permission to fetch.
 * Profiles count admitted Ed25519 keys; unsupported/rejected directory entries stay visible.
 */
export async function auditDirectoryResponse(context: DirectoryResponseContext, options: DirectoryResponseAuditOptions): Promise<DirectoryResponseAudit> {
  const result: DirectoryResponseAudit = {
    version: DIRECTORY_RESPONSE_AUDIT_VERSION, scope: 'offline-directory-response', assessment: 'not-assessed', reason: 'invalid-context',
    keyEntries: null, admittedKeys: 0, rejectedKeyEntries: 0, unsupportedKeyEntries: 0, duplicateKeyEntries: 0,
    digest: 'not-assessed', inputMembers: null, signatureMembers: null, pairedCandidates: null, unpairedMembers: null,
    unassessedCandidates: null, proofs: [], profiles: {
      cloudflareDirectory03: { verifiedKeys: 0, allAdmittedKeysVerified: null },
      ietfProtocol01DomainBinding: { verifiedKeys: 0, allAdmittedKeysVerified: null },
    },
  };
  const now = options.now.getTime() / 1000, limit = options.maxCandidates ?? 16, status = context.status;
  let url: URL, headers: Headers;
  try { url = new URL(context.requestUrl); headers = new Headers(context.headers); } catch { return result; }
  if (!Number.isFinite(now) || !Number.isSafeInteger(limit) || limit < 1 || limit > 16
    || url.protocol !== 'https:' || url.username || url.password || url.hash
    || url.pathname !== '/.well-known/http-message-signatures-directory' || url.search) return result;
  // Snapshot before the first await; caller mutation cannot change later candidates.
  if (context.body.byteLength > 65536 || [...headers].reduce((size, [name, value]) => size + name.length + value.length, 0) > 32768) return { ...result, reason: 'input-budget' };
  const body = new Uint8Array(context.body);
  if (status !== 200) return { ...result, reason: 'http-status' };
  if (headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/http-message-signatures-directory+json') return { ...result, reason: 'media-type' };
  const encoding = headers.get('Content-Encoding');
  if (encoding !== null && encoding.trim().toLowerCase() !== 'identity') return { ...result, reason: 'encoding-unsupported' };
  let directory: unknown;
  try { directory = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body)); } catch { return { ...result, reason: 'directory-invalid' }; }
  if (!record(directory) || !Array.isArray(directory.keys) || directory.keys.length > 128) return { ...result, reason: 'directory-invalid' };
  result.keyEntries = directory.keys.length;
  const keys = new Map<string, CryptoKey>(), forbidden = new Set<string>(), seen = new Set<string>(), validity = new Map<string, string>();
  for (const value of directory.keys) {
    if (!record(value) || value.kty !== 'OKP' || value.crv !== 'Ed25519') { result.unsupportedKeyEntries++; continue; }
    const thumbprint = canonicalKeyMaterial(value) ? await ed25519JwkThumbprint(value) : null;
    if (thumbprint === null) { result.rejectedKeyEntries++; continue; }
    if (seen.has(thumbprint)) result.duplicateKeyEntries++;
    seen.add(thumbprint);
    const key = directoryKey(value);
    const nbf = value.nbf, exp = value.exp;
    const window = JSON.stringify([nbf ?? null, exp ?? null]);
    if (validity.has(thumbprint) && validity.get(thumbprint) !== window) {
      result.rejectedKeyEntries++; forbidden.add(thumbprint); continue;
    }
    validity.set(thumbprint, window);
    if (key === null || key.metadataRejected || (nbf !== undefined && (!Number.isSafeInteger(nbf) || typeof nbf !== 'number' || nbf > now))
      || (exp !== undefined && (!Number.isSafeInteger(exp) || typeof exp !== 'number' || exp <= now))
      || (typeof exp === 'number' && typeof nbf === 'number' && exp <= nbf)) {
      result.rejectedKeyEntries++; forbidden.add(thumbprint); continue;
    }
    try { keys.set(thumbprint, await crypto.subtle.importKey('jwk', key.jwk, { name: 'Ed25519' }, false, ['verify'])); }
    catch { result.rejectedKeyEntries++; forbidden.add(thumbprint); }
  }
  for (const id of forbidden) keys.delete(id);
  result.admittedKeys = keys.size;
  result.digest = await digestState(headers, body);
  const inputField = headers.get('Signature-Input'), signatureField = headers.get('Signature');
  if (inputField === null && signatureField === null) return { ...result, reason: 'proofs-absent' };
  const inputs = inputField === null ? null : parseDictionary(inputField), signatures = signatureField === null ? null : parseDictionary(signatureField);
  const candidates = inputField === null || signatureField === null ? null : signatureCandidates(inputField, signatureField);
  if (inputs === null || signatures === null || candidates === null) return { ...result, reason: 'fields-malformed' };
  result.inputMembers = inputs.length; result.signatureMembers = signatures.length; result.pairedCandidates = candidates.length;
  result.unpairedMembers = inputs.length + signatures.length - 2 * candidates.length;
  result.unassessedCandidates = Math.max(0, candidates.length - limit);
  const compatible = new Set<string>(), bound = new Set<string>();
  for (const candidate of candidates.slice(0, limit)) {
    const proof: DirectoryProofAudit = { outcome: 'policy-rejected', reason: 'invalid-parameters', authorityCovered: null, digestCovered: null };
    const p = candidate.input.parameters, created = parameter(p, 'created'), expires = parameter(p, 'expires');
    const tag = parameter(p, 'tag'), keyid = parameter(p, 'keyid'), algorithm = parameter(p, 'alg');
    if (malformedSignatureParameterReason(candidate.input) !== null || created?.type !== 'integer' || expires?.type !== 'integer'
      || keyid?.type !== 'string' || expires.value < created.value) { result.proofs.push(proof); continue; }
    if (tag?.type !== 'string' || tag.value !== 'http-message-signatures-directory') proof.reason = 'different-tag';
    else if (created.value > now || expires.value < now) proof.reason = 'outside-validity';
    else if (algorithm !== undefined && (algorithm.type !== 'string' || algorithm.value !== 'ed25519')) { proof.reason = 'algorithm-unsupported'; proof.outcome = 'unsupported'; }
    else if (!keys.has(keyid.value)) { proof.reason = forbidden.has(keyid.value) ? 'key-rejected' : 'key-unavailable'; }
    else {
      const built = base(candidate, url.host, status, headers), key = keys.get(keyid.value);
      if (typeof built === 'string') { proof.reason = built; proof.outcome = built === 'duplicate-component' ? 'invalid' : 'unsupported'; }
      else if (key !== undefined) {
        proof.authorityCovered = built.authority; proof.digestCovered = built.digest;
        let valid = false;
        try { valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, candidate.signature, encoder.encode(built.value)); } catch { /* Rejected by this crypto profile. */ }
        proof.outcome = valid ? 'verified' : 'invalid'; proof.reason = valid ? 'verified' : 'signature-mismatch';
        if (valid && built.authority) {
          compatible.add(keyid.value);
          if (built.digest && result.digest === 'matched') bound.add(keyid.value);
        }
      }
    }
    result.proofs.push(proof);
  }
  const unsupported = result.digest === 'unsupported' || result.proofs.some(proof => proof.outcome === 'unsupported');
  const incomplete = Boolean(result.unassessedCandidates || result.unpairedMembers || unsupported);
  const allKeys = (count: number): boolean | null => !keys.size ? null : count === keys.size ? true : incomplete ? null : false;
  result.profiles.cloudflareDirectory03 = { verifiedKeys: compatible.size, allAdmittedKeysVerified: allKeys(compatible.size) };
  result.profiles.ietfProtocol01DomainBinding = { verifiedKeys: bound.size, allAdmittedKeysVerified: allKeys(bound.size) };
  result.assessment = incomplete ? 'partial' : 'assessed';
  result.reason = result.unassessedCandidates ? 'candidate-limit' : unsupported ? 'unsupported-evidence' : 'finished';
  return result;
}
