import { addCalendarDays, calendarDaysBetween, calendarDateKey } from '@gkoreli/time';
import type { StatsResponse } from '@gkoreli/analytics/contracts';

/** Compare equal, adjacent windows inside the returned selection, omitting the open day. */
export function requestTrend({ period, timeSeries }: Pick<StatsResponse, 'period' | 'timeSeries'>) {
  const days = Math.min(7, Math.floor(calendarDaysBetween(period.start, period.end) / 2));
  if (days < 1) return null;
  const start = addCalendarDays(period.end, -days * 2);
  const midpoint = addCalendarDays(period.end, -days);
  let recent = 0;
  let previous = 0;
  // The report includes zero buckets. Count local dates so DST days still weigh one day.
  const covered = new Set<string>();
  for (let index = timeSeries.length - 1; index >= 0; index--) {
    const row = timeSeries[index];
    if (!row) continue;
    const date = calendarDateKey(row.bucket, period.timeZone);
    if (date < start) break;
    if (date >= period.end) continue;
    covered.add(date);
    if (date >= midpoint) recent += row.views;
    else previous += row.views;
  }
  return covered.size === days * 2 ? { days, recent: recent / days, previous: previous / days } : null;
}

/** The daily report supplies contiguous local-day buckets, including observed zeros. */
export function sevenDayRequestAverages({ period, timeSeries }: Pick<StatsResponse, 'period' | 'timeSeries'>) {
  if (period.granularity !== 'day' || calendarDaysBetween(period.start, period.end) < 7) return null;
  let sum = 0;
  return timeSeries.map((row, index) => {
    sum += row.views;
    const expired = timeSeries[index - 7];
    if (expired) sum -= expired.views;
    if (index < 6 || (index === timeSeries.length - 1 && calendarDateKey(row.bucket, period.timeZone) >= period.end)) return null;
    return sum / 7;
  });
}
