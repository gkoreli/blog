import type { Granularity, StatsRange, TimeSeriesPoint } from './contracts.js';

export interface StatsWindow {
  range: StatsRange;
  start: string;
  end: string;
  startInclusive: string;
  endExclusive: string;
  granularity: Granularity;
  updatedAt: string;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function utcMidnight(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function dateLabel(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function sqlTimestamp(value: Date): string {
  return value.toISOString().replace('T', ' ').slice(0, 19);
}

export function parseStatsRange(value: string | null): StatsRange | null {
  switch (value) {
    case '7d':
    case '30d':
    case '90d':
    case 'all':
      return value;
    default:
      return null;
  }
}

export function createStatsWindow(range: StatsRange, now: Date, allStart?: string): StatsWindow {
  const today = utcMidnight(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 1;
  const presetStart = new Date(today.getTime() - (dayCount - 1) * DAY_MS);
  const requestedStart = range === 'all' && allStart ? new Date(`${allStart.slice(0, 10)}T00:00:00Z`) : presetStart;
  const startDate = Number.isNaN(requestedStart.getTime()) || requestedStart > today ? today : requestedStart;

  return {
    range,
    start: dateLabel(startDate),
    end: dateLabel(today),
    startInclusive: range === 'all' && !allStart ? '1970-01-01 00:00:00' : sqlTimestamp(startDate),
    endExclusive: sqlTimestamp(tomorrow),
    granularity: range === '7d' ? 'hour' : 'day',
    updatedAt: now.toISOString(),
  };
}

export function completeTimeSeries(window: StatsWindow, rows: readonly TimeSeriesPoint[], now: Date): TimeSeriesPoint[] {
  const byBucket = new Map<string, TimeSeriesPoint>();
  for (const row of rows) byBucket.set(row.bucket, row);

  const result: TimeSeriesPoint[] = [];
  const start = new Date(`${window.start}T00:00:00Z`).getTime();
  const current = window.granularity === 'hour'
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())
    : utcMidnight(now).getTime();
  const step = window.granularity === 'hour' ? HOUR_MS : DAY_MS;

  for (let time = start; time <= current; time += step) {
    const instant = new Date(time);
    const bucket = window.granularity === 'hour'
      ? `${instant.toISOString().slice(0, 13)}:00:00Z`
      : dateLabel(instant);
    result.push(byBucket.get(bucket) ?? { bucket, views: 0, dailyClients: 0 });
  }

  return result;
}
