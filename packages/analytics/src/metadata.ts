export interface RequestMetadata {
  path: string;
  siteHost: string;
  referrerHost: string | null;
  ip: string;
  country: string | null;
  userAgent: string;
  isOwner: boolean;
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

  return {
    path: url.pathname,
    siteHost,
    referrerHost: referrerHost(request, url.hostname.toLowerCase()),
    ip,
    country: typeof country === 'string' && country.length > 0 ? country : null,
    userAgent: request.headers.get('User-Agent') ?? '',
    isOwner: owners.includes(ip),
  };
}
