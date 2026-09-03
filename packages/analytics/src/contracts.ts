export type TrafficClass = 'browser' | 'bot' | 'ai';
export type TrafficFilter = 'browser' | 'browserlike' | 'bot' | 'ai' | 'all';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Representation = 'html' | 'markdown';
export type StatsRange = '7d' | '30d' | '90d' | 'all';
export type Granularity = 'hour' | 'day';

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
  };
  byPath: Array<{ path: string; views: number; dailyClients: number }>;
  byCountry: Array<{ country: string; views: number }>;
  timeSeries: TimeSeriesPoint[];
  byReferrer: Array<{ referrerHost: string; views: number }>;
  byDevice: Array<{ deviceType: DeviceType; views: number }>;
  byAgent: Array<{ agentName: string; trafficClass: Exclude<TrafficClass, 'browser'>; views: number }>;
}
