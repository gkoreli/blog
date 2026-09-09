import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { normalizeReportedHost, type ReferralPolicy } from './referral-policy.js';
import type { ReferrerState } from './contracts.js';

export const REFERRAL_POLICY_VERSION = ACTIVE_REFERRAL_POLICY.version;

/** Also used on historical host-only values; never expands into a network lookup. */
export function normalizeReferrerHost(host: string): string {
  return normalizeReportedHost(host).replace(/^www\./, '');
}

export function parseReferrerHost(raw: string | null, siteHostname: string): string | null {
  return parseReferrer(raw, siteHostname).referrerHost;
}

export interface ReferrerEvidence {
  referrerState: ReferrerState;
  referrerHost: string | null;
  internalReferrerPath: string | null;
}

/** Preserve why a hostname is absent without storing arbitrary URLs or internal tokens. */
export function parseReferrer(raw: string | null, siteHostname: string, publicPaths: ReadonlySet<string> = new Set()): ReferrerEvidence {
  const empty = { referrerHost: null, internalReferrerPath: null };
  if (raw === null || raw.trim().length === 0) return { ...empty, referrerState: 'absent' };
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'android-app:') {
      return { ...empty, referrerState: 'unusable' };
    }
    const host = normalizeReportedHost(url.hostname);
    if (host.length === 0 || host.length > 253) return { ...empty, referrerState: 'unusable' };
    if (normalizeReferrerHost(host) === normalizeReferrerHost(siteHostname)) {
      const path = url.pathname.replace(/\/+$/, '') || '/';
      return {
        ...empty, referrerState: 'internal',
        internalReferrerPath: publicPaths.has(path) ? path : null,
      };
    }
    return { ...empty, referrerState: 'external', referrerHost: host };
  } catch {
    return { ...empty, referrerState: 'unusable' };
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
