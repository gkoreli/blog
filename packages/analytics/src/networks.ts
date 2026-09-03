// ADR-0016.2: never add AS15169 (Google), AS13335 (Cloudflare), AS36183 or
// AS20940 (Akamai), or AS54113 (Fastly). Those networks carry consumer services,
// iCloud Private Relay, or Cloudflare WARP traffic and are not hosting-only evidence.
//
// Also not added, seen carrying automation in the 2026-09-03 Workers Logs sample
// (research artifact 09): AS9009 M247, AS60068 and AS212238 Datacamp/CDN77,
// AS210558 1337 Services. All four sell consumer VPN exits, so a person behind a
// VPN would be convicted by the network alone. The MRC standard excludes
// "routing artifacts of legitimate users" from data-center filtration for this
// reason. Automation from those networks is still caught by the request-shape
// and Fetch Metadata rules in readerkind.ts.
//
// Every entry is verified against Team Cymru whois (`whois -h whois.cymru.com
// " -v AS<n>"`) on checkedOn. Migration 0006 inlines the same numbers; the
// analytics test suite asserts the two lists match.

export const HOSTING_NETWORKS = [
  { asn: 16509, provider: 'Amazon Web Services', checkedOn: '2026-09-02' },
  { asn: 14618, provider: 'Amazon Web Services', checkedOn: '2026-09-02' },
  { asn: 396982, provider: 'Google Cloud', checkedOn: '2026-09-02' },
  { asn: 8075, provider: 'Microsoft Azure', checkedOn: '2026-09-02' },
  { asn: 14061, provider: 'DigitalOcean', checkedOn: '2026-09-02' },
  { asn: 24940, provider: 'Hetzner', checkedOn: '2026-09-02' },
  { asn: 16276, provider: 'OVH', checkedOn: '2026-09-02' },
  { asn: 20473, provider: 'Vultr', checkedOn: '2026-09-02' },
  { asn: 63949, provider: 'Linode / Akamai Connected Cloud', checkedOn: '2026-09-02' },
  { asn: 31898, provider: 'Oracle Cloud', checkedOn: '2026-09-02' },
  { asn: 45102, provider: 'Alibaba Cloud', checkedOn: '2026-09-02' },
  { asn: 45090, provider: 'Tencent Cloud', checkedOn: '2026-09-02' },
  { asn: 132203, provider: 'Tencent Cloud', checkedOn: '2026-09-02' },
  { asn: 51167, provider: 'Contabo', checkedOn: '2026-09-02' },
  { asn: 40021, provider: 'Contabo', checkedOn: '2026-09-02' },
  { asn: 141995, provider: 'Contabo', checkedOn: '2026-09-02' },
  { asn: 12876, provider: 'Scaleway', checkedOn: '2026-09-02' },
  { asn: 16265, provider: 'Leaseweb', checkedOn: '2026-09-02' },
  { asn: 60781, provider: 'Leaseweb', checkedOn: '2026-09-02' },
  { asn: 8560, provider: 'IONOS', checkedOn: '2026-09-02' },
  { asn: 30058, provider: 'FDCservers', checkedOn: '2026-09-03' },
  { asn: 211590, provider: 'Bucklog', checkedOn: '2026-09-03' },
  { asn: 18779, provider: 'EGIHosting', checkedOn: '2026-09-03' },
] as const;

export const HOSTING_ASNS: ReadonlySet<number> = new Set(
  HOSTING_NETWORKS.map((network) => network.asn),
);

export function isHostingAsn(asn: number | null): boolean {
  return asn !== null && HOSTING_ASNS.has(asn);
}
