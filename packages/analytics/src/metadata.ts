export interface RequestMetadata {
  path: string;
  siteHost: string;
  referrerHost: string | null;
  ip: string;
  country: string | null;
  userAgent: string;
  isOwner: boolean;
  asn: number | null;
  asOrg: string | null;
  secFetchMode: string | null;
  secFetchDest: string | null;
  secFetchSite: string | null;
  secFetchUser: number | null;
  acceptsHtml: number | null;
  hasAcceptLanguage: number;
}

function boundedHeader(request: Request, name: string): string | null {
  const value = request.headers.get(name);
  return value === null ? null : value.trim().toLowerCase().slice(0, 32);
}

function referrerHost(request: Request, siteHostname: string): string | null {
  const raw = request.headers.get('Referer');
  if (raw === null) return null;

  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
    const selfHost = siteHostname.replace(/^www\./, '');
    return host === selfHost ? null : host;
  } catch {
    return null;
  }
}

export function extractRequestMetadata(request: Request, ownerIps: string | undefined): RequestMetadata {
  const url = new URL(request.url);
  const siteHost = url.host.toLowerCase();
  const ip = request.headers.get('CF-Connecting-IP')?.trim() ?? '';
  const owners = ownerIps?.split(',').map((owner) => owner.trim()).filter(Boolean) ?? [];
  const country = request.cf?.country;
  const asn = request.cf?.asn;
  const asOrganization = request.cf?.asOrganization;
  const secFetchUser = request.headers.get('Sec-Fetch-User');
  const accept = request.headers.get('Accept');
  const acceptLanguage = request.headers.get('Accept-Language');

  return {
    path: url.pathname,
    siteHost,
    referrerHost: referrerHost(request, url.hostname.toLowerCase()),
    ip,
    country: typeof country === 'string' && country.length > 0 ? country : null,
    userAgent: request.headers.get('User-Agent') ?? '',
    isOwner: owners.includes(ip),
    asn: typeof asn === 'number' && Number.isFinite(asn) ? asn : null,
    asOrg: typeof asOrganization === 'string' ? asOrganization.trim().slice(0, 128) : null,
    secFetchMode: boundedHeader(request, 'Sec-Fetch-Mode'),
    secFetchDest: boundedHeader(request, 'Sec-Fetch-Dest'),
    secFetchSite: boundedHeader(request, 'Sec-Fetch-Site'),
    secFetchUser: secFetchUser === null ? null : secFetchUser === '?1' ? 1 : 0,
    acceptsHtml: accept === null
      ? null
      : accept.toLowerCase().includes('text/html') || accept.includes('*/*') ? 1 : 0,
    hasAcceptLanguage: acceptLanguage !== null && acceptLanguage.trim().length > 0 ? 1 : 0,
  };
}
