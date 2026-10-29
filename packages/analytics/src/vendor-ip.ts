import { feedEntityTag, feedLastModified, matchingFeedValidation } from './vendor-ip-cache.js';
import ipaddr from 'ipaddr.js';
import type { KnownAgentName } from './classify.js';
import { VENDOR_IP_SOURCES, type VendorIpSource, type VendorIpSourceId } from './vendor-ip-sources.js';
import { decodeVendorIpDocument, VENDOR_IP_MAX_PREFIXES } from './vendor-ip-document.js';
export { VENDOR_IP_MAX_PREFIXES } from './vendor-ip-document.js';

export const VENDOR_IP_PROFILE = '2026-10-29.2';
export const VENDOR_IP_FETCH_DEADLINE_MS = 1500;
export const VENDOR_IP_MAX_REQUEST_SOURCES = 4;
export const VENDOR_IP_MAX_BODY_BYTES = 262144;
const REFRESH_COOLDOWN_MS = 30000;
const DEFAULT_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 3600;
type Address = ipaddr.IPv4 | ipaddr.IPv6;
type Prefix = [Address, number];
type AddressState = 'usable' | 'missing' | 'invalid' | 'special-range' | 'worker-subrequest' | 'edge-context-unavailable';
type Failure = 'revalidation-mismatch' | 'fetch-failed' | 'fetch-timeout' | 'http-status' | 'media-type' | 'body-limit' | 'invalid-feed' | 'refresh-cooldown' | 'address-unavailable' | 'request-budget';
interface Snapshot {
  sha256: string;
  fetchedAt: string;
  validatedAt: string;
  freshUntil: string;
  publisherVersion: string | null;
  prefixCount: number;
}
interface Feed { snapshot: Snapshot; prefixes: Prefix[]; etag: string | null; modified: string | null; cacheControl: string; expires: string | null; }
type FeedResult = { feed: Feed } | { reason: Failure };
export interface VendorIpCache {
  feeds: Map<VendorIpSourceId, Feed>;
  attemptedAt: Map<VendorIpSourceId, number>;
  pending: Map<VendorIpSourceId, Promise<FeedResult>>;
}
export function createVendorIpCache(): VendorIpCache { return { feeds: new Map(), attemptedAt: new Map(), pending: new Map() }; }
const sharedCache = createVendorIpCache();
export interface VendorIpCheck {
  source: VendorIpSourceId;
  outcome: 'listed' | 'not-listed' | 'unavailable' | 'not-assessed';
  reason: Failure | null;
  snapshot: Snapshot | null;
}
export interface VendorIpEvidence {
  profile: typeof VENDOR_IP_PROFILE;
  method: 'published-ip-feed';
  source: 'local-vendor-ip';
  checkedAt: string;
  address: { state: AddressState; header: 'cf-connecting-ip' | 'cf-connecting-ipv6' | null; family: 'ipv4' | 'ipv6' | null };
  declarationCount: number;
  configuredDeclarationCount: number;
  unmappedDeclarationCount: number;
  summary: { listed: boolean; notListed: boolean; unavailable: boolean; notAssessed: boolean };
  checks: VendorIpCheck[];
}

function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
/** Library grammar is intentionally permissive; the collection boundary is not. */
export function strictIp(value: string): Address | null {
  if (!value || value.length > 45 || !/^[0-9a-f:.]+$/i.test(value)) return null;
  if (!value.includes(':') && !ipaddr.IPv4.isValidFourPartDecimal(value)) return null;
  if (value.includes('.') && !ipaddr.IPv4.isValidFourPartDecimal(value.slice(value.lastIndexOf(':') + 1))) return null;
  try { const parsed = ipaddr.parse(value); return parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress() ? parsed.toIPv4Address() : parsed; }
  catch { return null; }
}

function requestAddress(request: Request): { address: Address | null; evidence: VendorIpEvidence['address'] } {
  const none = (state: AddressState) => ({ address: null, evidence: { state, header: null, family: null } });
  if (typeof request.cf !== 'object' || request.cf === null) return none('edge-context-unavailable');
  const primary = request.headers.get('CF-Connecting-IP')?.trim() ?? '';
  if (!primary) return none('missing');
  let address = strictIp(primary);
  if (address === null) return none('invalid');
  if (request.headers.has('CF-Worker') || address.toString() === '2a06:98c0:3600::103') return none('worker-subrequest');
  let header: VendorIpEvidence['address']['header'] = 'cf-connecting-ip';
  if (address instanceof ipaddr.IPv4 && address.octets[0] >= 240 && request.headers.has('CF-Connecting-IPv6')) {
    const original = strictIp(request.headers.get('CF-Connecting-IPv6')?.trim() ?? '');
    if (!(original instanceof ipaddr.IPv6)) return none('invalid');
    address = original; header = 'cf-connecting-ipv6';
    if (address.toString() === '2a06:98c0:3600::103') return none('worker-subrequest');
  }
  if (address.range() !== 'unicast') return none('special-range');
  return { address, evidence: { state: 'usable', header, family: address.kind() } };
}

export function parseVendorIpFeed(value: unknown): { prefixes: Prefix[]; publisherVersion: string | null } | null {
  if (!object(value) || !Array.isArray(value.prefixes) || value.prefixes.length === 0 || value.prefixes.length > VENDOR_IP_MAX_PREFIXES) return null;
  const prefixes: Prefix[] = [];
  for (const entry of value.prefixes) {
    if (!object(entry) || Object.keys(entry).length !== 1) return null;
    const v4 = typeof entry.ipv4Prefix === 'string'; const raw = v4 ? entry.ipv4Prefix : entry.ipv6Prefix;
    if (typeof raw !== 'string' || raw.length > 49) return null;
    const split = raw.split('/'); const address = strictIp(split[0]);
    if (split.length !== 2 || address === null || !/^(0|[1-9][0-9]{0,2})$/.test(split[1])) return null;
    if ((address.kind() === 'ipv4') !== v4 || address.range() !== 'unicast') return null;
    const bits = Number(split[1]); if (bits < 1 || bits > (v4 ? 32 : 128)) return null;
    // Require a network address; do not silently normalize host bits in source data.
    const bytes = address.toByteArray();
    if (bytes.some((byte, index) => index * 8 >= bits ? byte !== 0 : index * 8 + 8 > bits && (byte & ((1 << (8 - bits % 8)) - 1)) !== 0)) return null;
    prefixes.push([address, bits]);
  }
  const version = typeof value.creationTime === 'string' && /^\d{4}-\d{2}-\d{2}T[0-9:.]+Z?$/.test(value.creationTime) ? Date.parse(value.creationTime.endsWith('Z') ? value.creationTime : value.creationTime + 'Z') : NaN;
  return { prefixes, publisherVersion: Number.isFinite(version) && typeof value.creationTime === 'string' && value.creationTime.length <= 32 ? value.creationTime : null };
}

function freshness(response: Response, now: number, previous?: Feed): { until: number; store: boolean; cacheControl: string; expires: string | null } {
  const policy = response.headers.get('Cache-Control') ?? previous?.cacheControl ?? '';
  const store = !/(?:^|,)\s*(?:no-store|private)\b/i.test(policy);
  const ageValue = response.headers.get('Age');
  const headerAge = ageValue === null ? 0 : /^\d+$/.test(ageValue) ? Number(ageValue) : Infinity;
  const responseDate = Date.parse(response.headers.get('Date') ?? '');
  const apparentAge = Number.isFinite(responseDate) ? Math.max(0, (now - responseDate) / 1000) : 0;
  const age = Math.max(headerAge, apparentAge);
  const expires = response.headers.get('Expires') ?? previous?.expires ?? null;
  const maxAgeNames = policy.match(/(?:^|,)\s*max-age\b/gi) ?? [];
  const maxAge = /(?:^|,)\s*max-age\s*=\s*(?:"(\d+)"|(\d+))\s*(?=,|$)/i.exec(policy);
  let ttl = DEFAULT_TTL_SECONDS;
  if (maxAgeNames.length > 0) ttl = maxAgeNames.length === 1 && maxAge !== null ? Number(maxAge[1] ?? maxAge[2]) : 0;
  else if (expires !== null) {
    const expiry = Date.parse(expires);
    ttl = Number.isFinite(expiry) ? Math.max(0, (expiry - (Number.isFinite(responseDate) ? responseDate : now)) / 1000) : 0;
  }
  const seconds = /(?:^|,)\s*no-cache\b/i.test(policy) || !store ? 0 : Math.max(0, Math.min(ttl, MAX_TTL_SECONDS) - age);
  return { until: now + seconds * 1000, store, cacheControl: policy, expires };
}

async function bodyBytes(response: Response): Promise<Uint8Array | null> {
  if (Number(response.headers.get('Content-Length')) > VENDOR_IP_MAX_BODY_BYTES) { await response.body?.cancel(); return null; }
  const reader = response.body?.getReader(); if (!reader) return null;
  const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const result = await reader.read(); if (result.done) break; size += result.value.byteLength; if (size > VENDOR_IP_MAX_BODY_BYTES) { await reader.cancel(); return null; } parts.push(result.value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; } return bytes;
}

async function fetchFeed(source: VendorIpSource, cache: VendorIpCache, fetcher: typeof fetch, now: number): Promise<FeedResult> {
  const old = cache.feeds.get(source.id);
  if (old && Date.parse(old.snapshot.freshUntil) > now) return { feed: old };
  const pending = cache.pending.get(source.id); if (pending) return pending;
  if (now - (cache.attemptedAt.get(source.id) ?? -Infinity) < REFRESH_COOLDOWN_MS) return { reason: 'refresh-cooldown' };
  cache.attemptedAt.set(source.id, now);
  const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
  const work = (async (): Promise<FeedResult> => {
    try {
      const headers = new Headers({ Accept: 'format' in source ? 'text/html' : 'application/json' });
      if (old?.etag) headers.set('If-None-Match', old.etag);
      if (old?.modified) headers.set('If-Modified-Since', old.modified);
      const response = await fetcher(source.url, { headers, redirect: 'manual', signal: controller.signal });
      const policy = freshness(response, now, response.status === 304 ? old : undefined);
      if (response.status === 304) {
        await response.body?.cancel();
        if (controller.signal.aborted) return { reason: 'fetch-timeout' };
        if (old === undefined || !matchingFeedValidation(response, headers, old)) {
          cache.feeds.delete(source.id);
          return { reason: 'revalidation-mismatch' };
        }
        const feed = { ...old, snapshot: { ...old.snapshot, validatedAt: new Date(now).toISOString(), freshUntil: new Date(policy.until).toISOString() }, cacheControl: policy.cacheControl, expires: policy.expires, etag: feedEntityTag(response) ?? old.etag, modified: feedLastModified(response) ?? old.modified };
        if (!controller.signal.aborted) { if (policy.store) cache.feeds.set(source.id, feed); else cache.feeds.delete(source.id); }
        return controller.signal.aborted ? { reason: 'fetch-timeout' } : { feed };
      }
      if (response.status !== 200) { await response.body?.cancel(); return { reason: 'http-status' }; }
      const media = (response.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
      if (!source.mediaTypes.some(type => type === media)) { await response.body?.cancel(); return { reason: 'media-type' }; }
      const bytes = await bodyBytes(response); if (bytes === null) return { reason: 'body-limit' };
      const parsed = await decodeVendorIpDocument(source, bytes);
      const parsedFeed = parseVendorIpFeed(parsed); if (parsedFeed === null) return { reason: 'invalid-feed' };
      const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
      const feed: Feed = { snapshot: { sha256, fetchedAt: new Date(now).toISOString(), validatedAt: new Date(now).toISOString(), freshUntil: new Date(policy.until).toISOString(), publisherVersion: parsedFeed.publisherVersion, prefixCount: parsedFeed.prefixes.length }, prefixes: parsedFeed.prefixes, etag: feedEntityTag(response), modified: feedLastModified(response), cacheControl: policy.cacheControl, expires: policy.expires };
      if (controller.signal.aborted) return { reason: 'fetch-timeout' };
      if (policy.store) cache.feeds.set(source.id, feed); else cache.feeds.delete(source.id);
      return { feed };
    } catch { return { reason: controller.signal.aborted ? 'fetch-timeout' : 'fetch-failed' }; }
  })();
  const deadline = new Promise<FeedResult>(resolve => { timer = setTimeout(() => { controller.abort(); resolve({ reason: 'fetch-timeout' }); }, VENDOR_IP_FETCH_DEADLINE_MS); });
  const result = Promise.race([work, deadline]); cache.pending.set(source.id, result);
  try { return await result; }
  finally { if (timer !== undefined) clearTimeout(timer); cache.pending.delete(source.id); }
}

/** No reader address, raw UA, arbitrary URL or per-address cache leaves this function. */
export async function verifyVendorIp(request: Request, names: readonly KnownAgentName[], options: { cache?: VendorIpCache; fetcher?: typeof fetch; now?: Date } = {}): Promise<VendorIpEvidence> {
  const now = (options.now ?? new Date()).getTime(); const declarations = new Set(names);
  const sources = VENDOR_IP_SOURCES.filter(source => source.declarations.some(name => declarations.has(name)));
  const mapped = new Set(sources.flatMap(source => source.declarations.filter(name => declarations.has(name))));
  const selected = requestAddress(request);
  const checks = await Promise.all(sources.map(async (source, index): Promise<VendorIpCheck> => {
    if (selected.address === null) return { source: source.id, outcome: 'unavailable', reason: 'address-unavailable', snapshot: null };
    if (index >= VENDOR_IP_MAX_REQUEST_SOURCES) return { source: source.id, outcome: 'not-assessed', reason: 'request-budget', snapshot: null };
    const result = await fetchFeed(source, options.cache ?? sharedCache, options.fetcher ?? fetch, now);
    if ('reason' in result) return { source: source.id, outcome: result.reason === 'refresh-cooldown' ? 'not-assessed' : 'unavailable', reason: result.reason, snapshot: null };
    const listed = result.feed.prefixes.some(([network, bits]) => selected.address !== null && network.kind() === selected.address.kind() && selected.address.match(network, bits));
    return { source: source.id, outcome: listed ? 'listed' : 'not-listed', reason: null, snapshot: result.feed.snapshot };
  }));
  return { profile: VENDOR_IP_PROFILE, method: 'published-ip-feed', source: 'local-vendor-ip', checkedAt: new Date(now).toISOString(), address: selected.evidence, declarationCount: declarations.size, configuredDeclarationCount: mapped.size, unmappedDeclarationCount: declarations.size - mapped.size, summary: { listed: checks.some(c => c.outcome === 'listed'), notListed: checks.some(c => c.outcome === 'not-listed'), unavailable: checks.some(c => c.outcome === 'unavailable'), notAssessed: checks.some(c => c.outcome === 'not-assessed') }, checks };
}
