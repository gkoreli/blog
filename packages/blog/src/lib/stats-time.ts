import type { StatsResponse } from '@gkoreli/analytics/contracts';

type Granularity = StatsResponse['period']['granularity'];

/** Localize instants without relabeling an aggregate's UTC reporting day. */
export function statsTimePresentation(
  timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale?: string,
) {
  const instant = new Intl.DateTimeFormat(locale, {
    timeZone, year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  const day = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', dateStyle: 'medium' });
  function formatDate(date: Date, granularity: Granularity): string {
    return granularity === 'hour' ? instant.format(date) : day.format(date);
  }
  return {
    timeZone,
    formatInstant(value: string | number): string {
      return instant.format(new Date(value));
    },
    formatBucket(bucket: string, granularity: Granularity): string {
      return formatDate(new Date(granularity === 'hour' ? bucket : `${bucket}T00:00:00Z`), granularity);
    },
    formatChartValue(timestamp: number, granularity: Granularity): string {
      return formatDate(new Date(timestamp * 1000), granularity);
    },
    chartTimeZone(granularity: Granularity): string {
      return granularity === 'hour' ? timeZone : 'Etc/UTC';
    },
  };
}
