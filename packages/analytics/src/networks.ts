// ADR-0016.2: never add AS15169 (Google), AS13335 (Cloudflare), AS36183 or
// AS20940 (Akamai), or AS54113 (Fastly). Those networks carry consumer services,
// iCloud Private Relay, or Cloudflare WARP traffic and are not hosting-only evidence.

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
] as const;

export const HOSTING_ASNS: ReadonlySet<number> = new Set(
  HOSTING_NETWORKS.map((network) => network.asn),
);

export function isHostingAsn(asn: number | null): boolean {
  return asn !== null && HOSTING_ASNS.has(asn);
}
