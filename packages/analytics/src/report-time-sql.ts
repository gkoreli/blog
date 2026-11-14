import { databaseTimestamp } from '@gkoreli/time';
import type { StatsWindow } from './dates.js';

/** Repository adapter: only calendar-derived UTC stamps and integer offsets
 * become SQL. A caller's zone identifier never enters a SQL expression.
 */
export function reportBucketSql(window: StatsWindow): string {
  const segments = window.calendar.offsetSegments(window.startInclusive, window.endExclusive);
  if (segments.length === 0) throw new Error('Empty report period');
  const expression = (offsetSeconds: number, start: string): string => {
    if (!Number.isSafeInteger(offsetSeconds) || Math.abs(offsetSeconds) > 86_400) throw new Error('Invalid calendar offset');
    const modifier = `'${offsetSeconds >= 0 ? '+' : ''}${offsetSeconds} seconds'`;
    if (window.granularity === 'day') return `strftime('%Y-%m-%d', observed_at, ${modifier})`;
    const localHour = `CAST(strftime('%s', strftime('%Y-%m-%d %H:00:00', observed_at, ${modifier})) AS INTEGER) - (${offsetSeconds})`;
    return `strftime('%Y-%m-%dT%H:%M:%SZ', max(${localHour}, ${Date.parse(start) / 1000}), 'unixepoch')`;
  };
  const first = segments[0];
  if (!first) throw new Error('Empty report period');
  const fallback = expression(first.offsetSeconds, first.start);
  if (segments.length === 1) return fallback;
  const branches = segments.slice(1).reverse().map(segment =>
    `WHEN observed_at >= '${databaseTimestamp(segment.start)}' THEN ${expression(segment.offsetSeconds, segment.start)}`);
  return `CASE ${branches.join(' ')} ELSE ${fallback} END`;
}
