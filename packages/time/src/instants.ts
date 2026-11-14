export type InstantInput = string | number | Date;

/** An instant must carry an offset. The established SQLite UTC grammar is the
 * sole offset-free storage form; civil dates are deliberately a separate input.
 */
export function utcInstant(value: InstantInput): string {
  let input = value;
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) input = input.replace(' ', 'T') + 'Z';
    else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(input)) throw new RangeError('An instant requires an explicit UTC offset');
    calendarDateValue(input.slice(0, 10));
    if (Number(input.slice(11, 13)) > 23 || Number(input.slice(14, 16)) > 59
      || (input[16] === ':' && Number(input.slice(17, 19)) > 59)) throw new RangeError('Invalid instant');
  }
  const date = input instanceof Date ? input : new Date(input);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 0 || date.getUTCFullYear() > 9999) throw new RangeError('Invalid instant');
  return date.toISOString();
}

/** Fixed-width UTC seconds keep existing SQLite indexes and lexical bounds. */
export function databaseTimestamp(value: InstantInput): string {
  return utcInstant(value).replace('T', ' ').slice(0, 19);
}

export function utcDateKey(value: InstantInput): string { return utcInstant(value).slice(0, 10); }

export function calendarDateValue(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Invalid calendar date');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new RangeError('Invalid calendar date');
  return date;
}

/** Calendar-date arithmetic counts labels, never elapsed local-day durations. */
export function addCalendarDays(date: string, count: number): string {
  if (!Number.isSafeInteger(count)) throw new RangeError('Invalid calendar-day count');
  const value = calendarDateValue(date); value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
export function calendarDaysBetween(start: string, end: string): number {
  return (calendarDateValue(end).getTime() - calendarDateValue(start).getTime()) / 86_400_000;
}
export function calendarDateKey(value: InstantInput, timeZone: string): string {
  const format = new Intl.DateTimeFormat('en', { timeZone, calendar: 'iso8601', numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = format.formatToParts(new Date(utcInstant(value)));
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`;
}

/** Canonicalize supported named zones; never accept arbitrary SQL modifiers. */
export function parseTimeZone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 1 || value.length > 100
    || !/^[A-Za-z_][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)*$/.test(value)) return null;
  try { return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone; }
  catch { return null; }
}

export function viewerTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
