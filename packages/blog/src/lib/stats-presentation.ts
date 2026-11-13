import { HOSTING_NETWORKS } from '@gkoreli/analytics/networks';
import { readerGroupOf, type ReaderKind, type StatsResponse, type TrafficFilter } from '@gkoreli/analytics/contracts';

export const TRAFFIC_LABELS: Record<TrafficFilter, string> = {
  all: 'All request categories', browser: 'Browser signals', agents: 'Assistants & signed clients',
  crawlers: 'Crawlers', automation: 'Automation & legacy rules', unresolved: 'Unresolved',
};
export const TRAFFIC_GROUPS = ['browser', 'agents', 'crawlers', 'automation', 'unresolved'] as const;

/** Existing disjoint request groups, derived from the same included rows as the headline. */
export function trafficMix(rows: StatsResponse['byKind']): Array<{ group: Exclude<TrafficFilter, 'all'>; label: string; views: number }> {
  return TRAFFIC_GROUPS.map(group => ({ group, label: TRAFFIC_LABELS[group],
    views: rows.filter(row => readerGroupOf(row.kind) === group).reduce((sum, row) => sum + row.views, 0),
  }));
}

/** Public wording for the reason codes that are not agent names. */
const REASON_LABELS: Record<string, string> = {
  'classification-not-recorded': 'stored classification not recorded',
  'unrecognized-stored-classification': 'unrecognized stored classification',
  'classification-reason-unavailable': 'stored reason missing or empty',
  'navigation-shaped': 'navigation headers; network unlisted or unavailable (earlier rule)',
  'navigation-shaped-network-unlisted': 'browser claim and navigation headers; network not on hosting list',
  'multiple-client-declarations': 'multiple recognized client declarations; no name selected',
  'multiple-declarations-same-category': 'multiple names declare this category; no single identity selected',
  'request-context-conflict': 'external referrer with same-origin Fetch Metadata',
  'fetch-metadata-unrecognized': 'unrecognized Fetch Metadata value',
  'fetch-metadata-invalid': 'invalid Fetch Metadata syntax or type',
  'fetch-metadata-policy-limit': 'Fetch Metadata exceeded the parsing budget',
  'fetch-metadata-unassessed': 'Fetch Metadata facts could not be assessed',
  'unrecognized-browser-claim': 'no recognized browser-family product claim',
  'network-evidence-missing': 'navigation-shaped browser claim; network evidence missing',
  'fetch-metadata-absent': 'supporting browser-version claim; Fetch Metadata absent',
  'fetch-metadata-support-unknown': 'browser/version support unresolved; Fetch Metadata absent',
  'beacon-script-ran': 'site script ran in the page (before Aug 26, 2026)',
  'user-agent-only': 'User-Agent only (Aug 26 to Sep 3, 2026)',
  'not-navigation-shaped': 'not shaped like a page navigation',
  'no-fetch-metadata': 'modern browser claim without Fetch Metadata',
  'pre-fetch-metadata-ua': 'browser version that predates Fetch Metadata',
  'generic-bot': 'generic bot token in the User-Agent',
};

export function classificationReasonLabel(kind: ReaderKind, reason: string): string {
  const compound = /^(.+); signature:(.+)$/.exec(reason);
  if (compound) {
    const primary = compound[1], signature = compound[2];
    if (primary && signature) {
      const details: Record<string, string> = {
        'missing-signature-agent': 'Signature-Agent missing',
        'bare-uri-signature-agent': 'unsupported bare-URI Signature-Agent',
        'key-unavailable': 'key unavailable',
      };
      return `${classificationReasonLabel(kind, primary)} · Signature: ${details[signature] ?? signature.replace(/-/g, ' ')}`;
    }
  }
  const archive = /^archiver-asn:(\d+)$/.exec(reason);
  if (archive) return `Archive network AS${archive[1]}`;
  const known = REASON_LABELS[reason];
  if (known !== undefined) return known;
  const hosting = /^hosting-asn:(\d+)$/.exec(reason);
  if (hosting) {
    const asn = Number(hosting[1]);
    const provider = HOSTING_NETWORKS.find((network) => network.asn === asn)?.provider;
    return provider === undefined ? `hosting network AS${asn}` : `${provider} (AS${asn})`;
  }
  if (kind === 'signed-agent') return reason === 'Other'
    ? 'stored verified outcome; signer not publicly named'
    : `stored signing outcome: ${reason}`;
  if (reason.startsWith('signature-') || reason.startsWith('missing-') || reason.startsWith('invalid-')) {
    return `signature not verified: ${reason.replace(/-/g, ' ')}`;
  }
  return reason;
}
