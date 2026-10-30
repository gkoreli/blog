// Explicit upstream-policy fixtures, not observations of a live publisher.
export const CACHE_POLICY_CLOCK = '2026-10-30T09:00:00.000Z';
export const CACHE_POLICY_CASES = [
  ['positive-max-age', { 'Cache-Control': 'max-age=300' }],
  ['no-cache', { 'Cache-Control': 'no-cache' }],
  ['no-store', { 'Cache-Control': 'no-store' }],
  ['private', { 'Cache-Control': 'private, max-age=300' }],
  ['max-age-zero', { 'Cache-Control': 'max-age=0' }],
  ['age-exhausted', { 'Cache-Control': 'max-age=300', Age: '300' }],
];

export async function cachePolicyCases(verifyVendorIp, createVendorIpCache) {
  const results = [], now = new Date(CACHE_POLICY_CLOCK);
  for (const [label, headers] of CACHE_POLICY_CASES) {
    const cache = createVendorIpCache(); let calls = 0;
    const fetcher = async () => {
      calls++;
      return Response.json({ creationTime: '2026-10-29T00:00:00', prefixes: [{ ipv4Prefix: '66.249.66.0/24' }] }, {
        headers: { Date: now.toUTCString(), ETag: '"fixture-v1"', ...headers },
      });
    };
    // Google's documented example address is supplied in memory, never contacted.
    const request = new Request('https://fixture.invalid/article', { headers: { 'CF-Connecting-IP': '66.249.66.1' } });
    Object.defineProperty(request, 'cf', { value: { asn: 64512 } });
    const first = await verifyVendorIp(request, ['Googlebot'], { cache, fetcher, now });
    const second = await verifyVendorIp(request, ['Googlebot'], { cache, fetcher, now: new Date(now.getTime() + 1000) });
    results.push({ label, first, second, fetchCalls: calls, cacheStored: cache.feeds.size > 0 });
  }
  return results;
}
