import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { normalizeReportedHost, type ReferralPolicy } from './referral-policy.js';

export const REFERRAL_POLICY_VERSION = ACTIVE_REFERRAL_POLICY.version;

/** Also used on historical host-only values; never expands into a network lookup. */
export function normalizeReferrerHost(host: string): string {
  return normalizeReportedHost(host).replace(/^www\./, '');
}

export function parseReferrerHost(raw: string | null, siteHostname: string): string | null {
  if (raw === null) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'android-app:') return null;
    const host = normalizeReportedHost(url.hostname);
    if (host.length === 0 || host.length > 253 || normalizeReferrerHost(host) === normalizeReferrerHost(siteHostname)) return null;
    return host;
  } catch {
    return null;
  }
}

/** Suppress unreviewed names at the API boundary, not just in the browser UI. */
export function publicReferrers(rows: readonly { referrerHost: string; views: number }[], policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY): {
  byReferrer: Array<{ referrerHost: string; views: number }>;
  otherReferrerViews: number;
} {
  const approved = new Set(policy.publicHosts);
  const counts = new Map<string, number>();
  let otherReferrerViews = 0;
  for (const row of rows) {
    const host = normalizeReferrerHost(row.referrerHost);
    if (!approved.has(host)) {
      otherReferrerViews += row.views;
      continue;
    }
    counts.set(host, (counts.get(host) ?? 0) + row.views);
  }
  const byReferrer = Array.from(counts, ([referrerHost, views]) => ({ referrerHost, views }))
    .sort((left, right) => right.views - left.views || left.referrerHost.localeCompare(right.referrerHost));
  return { byReferrer, otherReferrerViews };
}
