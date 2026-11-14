import { Temporal } from '@js-temporal/polyfill';
import { addCalendarDays, calendarDateKey, calendarDaysBetween, parseTimeZone, utcInstant, type InstantInput } from './instants.js';

export type CalendarUnit = 'hour' | 'day';
export interface OffsetSegment { start: string; end: string; offsetSeconds: number }
export interface CalendarBucket { start: string; end: string }
const iso = (epochMilliseconds: number): string => new Date(epochMilliseconds).toISOString();
const HOUR = 3_600_000;

/** A named-zone calendar owns civil boundaries, variable-length days and offset
 * transitions. It exposes UTC intervals to repositories, never SQL or UI text.
 */
export class ZonedCalendar {
  readonly timeZone: string;
  constructor(timeZone: string) {
    const zone = parseTimeZone(timeZone);
    if (zone === null) throw new RangeError('Unsupported timezone');
    this.timeZone = zone;
  }
  dateAt(value: InstantInput): string {
    return calendarDateKey(value, this.timeZone);
  }
  addDays(date: string, count: number): string {
    return addCalendarDays(date, count);
  }
  daysBetween(start: string, end: string): number {
    return calendarDaysBetween(start, end);
  }
  startOfDay(date: string): string {
    return iso(Temporal.PlainDate.from(date).toZonedDateTime(this.timeZone).epochMilliseconds);
  }
  nextDayStart(value: InstantInput): string {
    return this.startOfDay(this.addDays(this.dateAt(value), 1));
  }
  offsetSegments(start: InstantInput, end: InstantInput): OffsetSegment[] {
    const first = Temporal.Instant.from(utcInstant(start));
    const limit = Temporal.Instant.from(utcInstant(end));
    if (Temporal.Instant.compare(first, limit) >= 0) return [];
    const result: OffsetSegment[] = [];
    let at = first.toZonedDateTimeISO(this.timeZone);
    while (at.epochMilliseconds < limit.epochMilliseconds) {
      const next = at.getTimeZoneTransition('next');
      const stop = next && next.epochMilliseconds < limit.epochMilliseconds ? next : limit;
      result.push({ start: iso(at.epochMilliseconds), end: iso(stop.epochMilliseconds), offsetSeconds: at.offsetNanoseconds / 1_000_000_000 });
      at = Temporal.Instant.fromEpochMilliseconds(stop.epochMilliseconds).toZonedDateTimeISO(this.timeZone);
    }
    return result;
  }
  buckets(start: InstantInput, end: InstantInput, unit: CalendarUnit): CalendarBucket[] {
    const first = Date.parse(utcInstant(start)), limit = Date.parse(utcInstant(end));
    if (first >= limit) return [];
    const starts = new Set<number>([first]);
    if (unit === 'hour') {
      for (const segment of this.offsetSegments(start, end)) {
        const begin = Date.parse(segment.start), stop = Date.parse(segment.end), offset = segment.offsetSeconds * 1000;
        starts.add(begin);
        for (let at = (Math.floor((begin + offset) / HOUR) + 1) * HOUR - offset; at < stop; at += HOUR) starts.add(at);
      }
    } else {
      for (let day = this.addDays(this.dateAt(start), 1); ; day = this.addDays(day, 1)) {
        const at = Date.parse(this.startOfDay(day));
        if (at >= limit) break;
        if (at > first) starts.add(at);
      }
    }
    const ordered = [...starts].sort((a, b) => a - b);
    return ordered.map((at, index) => ({ start: iso(at), end: iso(ordered[index + 1] ?? limit) }));
  }
}
