import { calendarDateValue, parseTimeZone, utcInstant, viewerTimeZone, type InstantInput } from './instants.js';
export { addCalendarDays, calendarDateKey, calendarDaysBetween, databaseTimestamp, parseTimeZone, utcDateKey, utcInstant, viewerTimeZone, type InstantInput } from './instants.js';

/** One presentation policy for instants and already-selected civil dates.
 * Calendar arithmetic and database representations never enter UI callers.
 */
export function timePresentation(options: { timeZone?: string; locale?: string } = {}) {
  const zone = parseTimeZone(options.timeZone ?? viewerTimeZone());
  if (zone === null) throw new RangeError('Unsupported timezone');
  const instant = new Intl.DateTimeFormat(options.locale, {
    timeZone: zone, year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  const day = new Intl.DateTimeFormat(options.locale, { timeZone: zone, dateStyle: 'medium' });
  const civil = new Intl.DateTimeFormat(options.locale, { timeZone: 'UTC', dateStyle: 'medium' });
  const offset = (timeZone: string) => new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' });
  return {
    timeZone: zone,
    instant: (value: InstantInput): string => instant.format(new Date(utcInstant(value))),
    date: (value: InstantInput): string => day.format(new Date(utcInstant(value))),
    calendarDate: (value: string): string => civil.format(calendarDateValue(value)),
    dateRange: (start: string, end: string): string => civil.formatRange(calendarDateValue(start), calendarDateValue(end)),
    matchesCalendar(other: unknown, instants: readonly InstantInput[]): boolean {
      const candidate = parseTimeZone(other);
      if (candidate === null) return false;
      if (candidate === zone) return true;
      // IANA aliases can resolve to different names across browser/server ICU
      // versions. Compare their actual offsets over the selected report.
      const left = offset(zone), right = offset(candidate);
      const label = (format: Intl.DateTimeFormat, date: Date) => format.formatToParts(date).find(p => p.type === 'timeZoneName')?.value;
      return instants.every(value => { const date = new Date(utcInstant(value)); return label(left, date) === label(right, date); });
    },
  };
}
