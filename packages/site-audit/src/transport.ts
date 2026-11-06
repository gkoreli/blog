import type { ResourceEvidence, ResourceKind, ResourceOutcome } from './contracts.js';
import { isPublicAddress, normalizeTarget } from './target.js';

export const MAX_RESOURCE_BYTES = 524_288;
export const MAX_TARGET_REQUESTS = 12;
export const AUDIT_TIMEOUT_MS = 22_000;
export const RESOURCE_TIMEOUT_MS = 5_000;
const AUDIT_USER_AGENT = 'GkoreliSiteAudit/1.0 (+https://gkoreli.com/ai-check)';
export interface ResourceRequest { kind: ResourceKind; url: string; accept?: string; probeAgent?: string }
export interface RetrievedResource { evidence: ResourceEvidence; text: string | null }
export interface AuditTransport { retrieve(request: ResourceRequest): Promise<RetrievedResource> }
export type FetchOperation = (input: string, init: RequestInit) => Promise<Response>;
export interface TransportDependencies { fetch?: FetchOperation; now?: () => number; resolve?: (hostname: string, signal: AbortSignal) => Promise<readonly string[]> }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
class RetrievalError extends Error { constructor(readonly outcome: ResourceOutcome) { super(outcome); } }

/** Enforce our deadline even if an injected adapter fails to honor AbortSignal. */
function abortable<T>(operation: Promise<T>, signal: AbortSignal, discard?: (value: T) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    const abort = () => { if (!done) { done = true; reject(new RetrievalError('timeout')); } };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    operation.then(value => {
      signal.removeEventListener('abort', abort);
      if (done) discard?.(value);
      else { done = true; resolve(value); }
    }, error => {
      signal.removeEventListener('abort', abort);
      if (!done) { done = true; reject(error); }
    });
  });
}

async function readBounded(response: Response, signal: AbortSignal, maxBytes = MAX_RESOURCE_BYTES): Promise<Uint8Array> {
  const contentLength = response.headers.get('Content-Length');
  if (contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    await response.body?.cancel(); throw new RetrievalError('too-large');
  }
  if (response.body === null) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const abort = () => { void reader.cancel(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new RetrievalError('timeout');
      const chunk = await reader.read();
      if (signal.aborted) throw new RetrievalError('timeout');
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new RetrievalError('too-large'); }
      chunks.push(chunk.value);
    }
  } finally { signal.removeEventListener('abort', abort); reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

/** Fixed resolver origin. Preflight rejects mixed/private DNS responses but is
 * not address pinning. Production MUST use Workers global fetch with
 * global_fetch_strictly_public, whose connection-time filtering is the DNS
 * rebinding boundary. Do not replace this with a private service binding. */
async function publicDns(hostname: string, signal: AbortSignal, fetchOperation: FetchOperation): Promise<readonly string[]> {
  const values = await Promise.all(['A', 'AAAA'].map(async type => {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`;
    const response = await fetchOperation(url, { method: 'GET', redirect: 'manual', headers: { Accept: 'application/dns-json' }, signal });
    if (!response.ok) { await response.body?.cancel(); throw new RetrievalError('dns-error'); }
    let document: unknown;
    try { document = JSON.parse(new TextDecoder().decode(await readBounded(response, signal, 32_768))); } catch (error) {
      if (error instanceof RetrievalError) throw error;
      throw new RetrievalError('dns-error');
    }
    if (!record(document) || document.Status !== 0 || document.TC === true) throw new RetrievalError('dns-error');
    if (document.Answer === undefined) return [];
    if (!Array.isArray(document.Answer) || document.Answer.length > 64) throw new RetrievalError('dns-error');
    const addresses: string[] = [];
    for (const answer of document.Answer) {
      if (!record(answer)) throw new RetrievalError('dns-error');
      if (answer.type === 1 || answer.type === 28) {
        if (typeof answer.data !== 'string') throw new RetrievalError('dns-error');
        addresses.push(answer.data);
      }
    }
    return addresses;
  }));
  return values.flat();
}

/** One transport instance per audit: global deadline and target-request budget
 * include redirects and every resource/probe. DNS requests have separate fixed
 * bounds; every redirect hop gets a fresh DNS preflight. */
export function createWorkersTransport(dependencies: TransportDependencies = {}): AuditTransport {
  const fetchOperation = dependencies.fetch ?? ((input, init) => fetch(input, init));
  const now = dependencies.now ?? Date.now;
  const started = now();
  let targetRequests = 0;
  return {
    async retrieve(request) {
      const begun = now();
      const evidence: ResourceEvidence = { kind: request.kind, requestedUrl: request.url, finalUrl: request.url,
        outcome: 'network-error', status: null, contentType: null, bytes: 0, elapsedMs: 0, redirects: 0,
        probeAgent: request.probeAgent ?? null, headers: { robots: null, link: null, contentLocation: null, vary: null } };
      const controller = new AbortController();
      const remaining = Math.min(RESOURCE_TIMEOUT_MS, AUDIT_TIMEOUT_MS - (now() - started));
      if (remaining <= 0) return { evidence: { ...evidence, outcome: 'timeout' }, text: null };
      const timer = setTimeout(() => controller.abort(), remaining);
      let text: string | null = null;
      try {
        let current: URL;
        try { current = normalizeTarget(request.url); } catch { throw new RetrievalError('blocked-target'); }
        while (true) {
          if (controller.signal.aborted) throw new RetrievalError('timeout');
          if (targetRequests >= MAX_TARGET_REQUESTS) throw new RetrievalError('budget-exhausted');
          const addresses = await abortable(dependencies.resolve ? dependencies.resolve(current.hostname, controller.signal) : publicDns(current.hostname, controller.signal, fetchOperation), controller.signal);
          if (addresses.length === 0) throw new RetrievalError('dns-error');
          if (!addresses.every(isPublicAddress)) throw new RetrievalError('blocked-target');
          if (controller.signal.aborted) throw new RetrievalError('timeout');
          if (targetRequests >= MAX_TARGET_REQUESTS) throw new RetrievalError('budget-exhausted');
          targetRequests++;
          const headers = new Headers({ Accept: request.accept ?? '*/*', 'User-Agent': request.probeAgent
            ? `Mozilla/5.0 (compatible; ${request.probeAgent}/1.0; +https://gkoreli.com/ai-check)` : AUDIT_USER_AGENT });
          const response = await abortable(fetchOperation(current.href, { method: 'GET', redirect: 'manual', headers, signal: controller.signal }), controller.signal, value => { void value.body?.cancel(); });
          evidence.finalUrl = current.href;
          evidence.status = response.status;
          evidence.contentType = boundedHeader(response.headers.get('Content-Type'));
          evidence.headers = { robots: boundedHeader(response.headers.get('X-Robots-Tag')), link: boundedHeader(response.headers.get('Link')),
            contentLocation: boundedHeader(response.headers.get('Content-Location')), vary: boundedHeader(response.headers.get('Vary')) };
          if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('Location');
            await response.body?.cancel();
            if (location === null) { evidence.outcome = 'received'; break; }
            if (evidence.redirects >= 3) throw new RetrievalError('redirect-limit');
            let next: URL;
            try { next = normalizeTarget(new URL(location, current).href); } catch { throw new RetrievalError('blocked-target'); }
            current = next;
            evidence.redirects++;
            continue;
          }
          const bytes = await readBounded(response, controller.signal);
          evidence.bytes = bytes.byteLength;
          text = new TextDecoder().decode(bytes);
          evidence.outcome = 'received';
          break;
        }
      } catch (error) {
        evidence.outcome = controller.signal.aborted ? 'timeout' : error instanceof RetrievalError ? error.outcome : 'network-error';
      } finally { clearTimeout(timer); evidence.elapsedMs = Math.max(0, now() - begun); }
      return { evidence, text };
    },
  };
}
function boundedHeader(value: string | null): string | null { return value === null || value.length > 2048 ? null : value; }
