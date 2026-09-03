export type TrafficClass = 'browser' | 'bot' | 'ai';
/** Public stats filters: what the client was doing, not how confident we are. */
export type TrafficFilter = 'browser' | 'agents' | 'crawlers' | 'automation' | 'all';

/** Closed set of reader kinds, one per row, with one reason (ADR-0016.3 section A). */
export const READER_KINDS = [
  'signed-agent',
  'ai-assistant',
  'ai-search',
  'ai-crawler',
  'search-crawler',
  'preview-or-feed',
  'headless-browser',
  'other-bot',
  'cloud-browser',
  'http-client',
  'legacy-browser',
  'browser',
] as const;
export type ReaderKind = typeof READER_KINDS[number];

/** How the public filters group the reader kinds. */
export const READER_GROUPS: Record<Exclude<TrafficFilter, 'all'>, readonly ReaderKind[]> = {
  browser: ['browser'],
  agents: ['signed-agent', 'ai-assistant'],
  crawlers: ['search-crawler', 'ai-search', 'ai-crawler', 'preview-or-feed'],
  automation: ['cloud-browser', 'headless-browser', 'http-client', 'other-bot', 'legacy-browser'],
};

export function isReaderKind(value: string): value is ReaderKind {
  return (READER_KINDS as readonly string[]).includes(value);
}

export function readerGroupOf(kind: ReaderKind): Exclude<TrafficFilter, 'all'> {
  for (const [group, kinds] of Object.entries(READER_GROUPS)) {
    if (kinds.includes(kind)) {
      if (group === 'browser' || group === 'agents' || group === 'crawlers' || group === 'automation') return group;
    }
  }
  throw new Error(`Reader kind ${kind} belongs to no group`);
}
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Representation = 'html' | 'markdown';
export type StatsRange = '7d' | '30d' | '90d' | 'all';
export type Granularity = 'hour' | 'day';
export type SignatureStatus = 'verified' | 'unverified';

export interface TimeSeriesPoint {
  bucket: string;
  views: number;
  dailyClients: number;
}

export const ANALYTICS_EVIDENCE_SINCE = '2026-09-03';

export interface StatsResponse {
  period: {
    start: string;
    end: string;
    timeZone: 'UTC';
    granularity: Granularity;
    updatedAt: string;
  };
  totals: { views: number; dailyClients: number; unattributedViews: number };
  filters: {
    traffic: TrafficFilter;
    range: StatsRange;
    path: string | null;
    agent: string | null;
    kind: ReaderKind | null;
  };
  byPath: Array<{ path: string; views: number; dailyClients: number }>;
  byCountry: Array<{ country: string; views: number }>;
  timeSeries: TimeSeriesPoint[];
  byReferrer: Array<{ referrerHost: string; views: number }>;
  byDevice: Array<{ deviceType: DeviceType; views: number }>;
  byAgent: Array<{ agentName: string; trafficClass: Exclude<TrafficClass, 'browser'>; views: number }>;
  byKind: Array<{ kind: ReaderKind; reason: string; views: number; dailyClients: number }>;
}
