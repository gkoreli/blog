import { utcInstant } from '@gkoreli/time';
import { ZonedCalendar } from '@gkoreli/time/calendar';
import type { Granularity, StatsQuery, StatsRange, TimeSeriesPoint } from './contracts.js';

/** Analytics owns the reporting period; the shared calendar owns time rules. */
export interface StatsWindow {
  readonly range: StatsRange;
  readonly start: string;
  readonly end: string;
  readonly startInclusive: string;
  readonly endExclusive: string;
  readonly granularity: Granularity;
  readonly updatedAt: string;
  readonly calendar: ZonedCalendar;
}

export function parseStatsRange(value: string | null): StatsRange | null {
  switch (value) {
    case '7d': case '30d': case '90d': case 'all': return value;
    default: return null;
  }
}

export function createStatsWindow(selection: Pick<StatsQuery, 'range' | 'timeZone'>, now: Date, allStart?: string): StatsWindow {
  const { range } = selection;
  const calendar = new ZonedCalendar(selection.timeZone ?? 'UTC');
  const today = calendar.dateAt(now);
  const count = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 1;
  const presetStart = calendar.addDays(today, -(count - 1));
  const firstDay = range === 'all' && allStart ? calendar.dateAt(allStart) : presetStart;
  const start = firstDay > today ? today : firstDay;
  return {
    range, start, end: today, calendar,
    startInclusive: range === 'all' && !allStart ? '1970-01-01T00:00:00.000Z' : calendar.startOfDay(start),
    endExclusive: calendar.startOfDay(calendar.addDays(today, 1)),
    granularity: range === '7d' ? 'hour' : 'day', updatedAt: utcInstant(now),
  };
}

/** Source keys become canonical UTC instants once, at the reporting boundary. */
export function completeTimeSeries(window: StatsWindow, rows: readonly TimeSeriesPoint[]): TimeSeriesPoint[] {
  const buckets = window.calendar.buckets(window.startInclusive, window.endExclusive, window.granularity);
  const starts = new Set(buckets.map(bucket => bucket.start));
  const populated = new Map<string, TimeSeriesPoint>();
  for (const row of rows) {
    const bucket = window.granularity === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(row.bucket)
      ? window.calendar.startOfDay(row.bucket) : utcInstant(row.bucket);
    if (window.granularity === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(row.bucket) && window.calendar.dateAt(bucket) !== row.bucket) throw new Error('Malformed statistics report');
    if (!starts.has(bucket) || populated.has(bucket)) throw new Error('Malformed statistics report');
    populated.set(bucket, { ...row, bucket });
  }
  const sampledClock = Date.parse(window.updatedAt);
  const result: TimeSeriesPoint[] = [];
  for (const bucket of buckets) {
    const row = populated.get(bucket.start);
    // Preserve returned observations after a sampled clock boundary, without
    // inventing zero buckets beyond that clock.
    if (row) result.push(row);
    else if (Date.parse(bucket.start) <= sampledClock) result.push({ bucket: bucket.start, views: 0, dailyClients: 0 });
  }
  return result;
}
