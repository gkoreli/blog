import { extractFetchMetadata } from './fetch-metadata.js';
import { htmlAcceptance } from './accept.js';
import { parseReferrer } from './referrals.js';
import type { ReferrerState } from './contracts.js';

export interface RequestMetadata {
  path: string;
  siteHost: string;
  referrerHost: string | null;
  referrerState: ReferrerState;
  internalReferrerPath: string | null;
  ip: string;
  country: string | null;
  userAgent: string;
  isOwner: boolean;
  asn: number | null;
  asOrg: string | null;
  fetchMetadataBits: number;
  secFetchMode: string | null;
  secFetchDest: string | null;
  secFetchSite: string | null;
  secFetchUser: number | null;
  acceptsHtml: number | null;
  hasAcceptLanguage: number;
  hasSignatureHeaders: boolean;
}

export function extractRequestMetadata(request: Request, ownerIps: string | undefined, publicPaths?: ReadonlySet<string>): RequestMetadata {
  const url = new URL(request.url);
  const siteHost = url.host.toLowerCase();
  const ip = request.headers.get('CF-Connecting-IP')?.trim() ?? '';
  const owners = ownerIps?.split(',').map((owner) => owner.trim()).filter(Boolean) ?? [];
  const country = request.cf?.country;
  const asn = request.cf?.asn;
  const asOrganization = request.cf?.asOrganization;
  const accept = request.headers.get('Accept');
  const acceptLanguage = request.headers.get('Accept-Language');
  const hasSignatureHeaders = ['Signature-Agent', 'Signature-Input', 'Signature']
    .some((name) => request.headers.has(name));

  return {
    path: url.pathname,
    siteHost,
    ...parseReferrer(request.headers.get('Referer'), url.hostname, publicPaths),
    ip,
    country: typeof country === 'string' && country.length > 0 ? country : null,
    userAgent: request.headers.get('User-Agent') ?? '',
    isOwner: owners.includes(ip),
    asn: typeof asn === 'number' && Number.isInteger(asn) && asn > 0 && asn < 4_294_967_295 ? asn : null,
    asOrg: typeof asOrganization === 'string' ? asOrganization.trim().slice(0, 128) : null,
    ...extractFetchMetadata(request.headers),
    acceptsHtml: htmlAcceptance(accept),
    hasAcceptLanguage: acceptLanguage !== null && acceptLanguage.trim().length > 0 ? 1 : 0,
    hasSignatureHeaders,
  };
}
