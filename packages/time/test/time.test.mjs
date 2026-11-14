import test from 'node:test';
import assert from 'node:assert/strict';
import { addCalendarDays, calendarDateKey, calendarDaysBetween, databaseTimestamp, parseTimeZone, timePresentation, utcDateKey, utcInstant } from '../dist/index.js';
import { ZonedCalendar } from '../dist/calendar.js';

test('UTC instants and database stamps share an explicit, host-independent boundary', () => {
  for (const input of ['2026-11-14T08:23:48-08:00', '2026-11-14T16:23:48Z', '2026-11-14 16:23:48']) {
    assert.equal(utcInstant(input), '2026-11-14T16:23:48.000Z');
    assert.equal(databaseTimestamp(input), '2026-11-14 16:23:48');
    assert.equal(utcDateKey(input), '2026-11-14');
  }
  for (const input of ['2026-11-14', '2026-11-14T08:23:48', '2026-02-30T00:00:00Z', '2026-11-14T24:00:00Z', 'bad']) assert.throws(() => utcInstant(input), RangeError);
});

test('named timezone aliases canonicalize while invalid or injected selectors fail', () => {
  assert.equal(parseTimeZone('US/Pacific'), 'America/Los_Angeles');
  for (const input of [null, '', '+05:30', "UTC'); DROP TABLE observations;--", 'Moon/Sea', ' UTC ', 'x'.repeat(101)]) assert.equal(parseTimeZone(input), null);
});

test('instants, daily labels and civil ranges use one viewer presentation', () => {
  const view = timePresentation({ timeZone: 'America/Los_Angeles', locale: 'en-US' });
  assert.equal(view.instant('2026-11-14T16:23:00Z'), 'Nov 14, 2026, 8:23 AM PST');
  assert.equal(view.date('2026-11-14T08:00:00Z'), 'Nov 14, 2026');
  assert.equal(view.date('2026-11-14T07:59:59Z'), 'Nov 13, 2026');
  assert.equal(view.calendarDate('2026-11-14'), 'Nov 14, 2026');
  assert.match(view.dateRange('2026-11-08', '2026-11-14'), /Nov 8.*14, 2026/);
  assert.equal(timePresentation({ timeZone: view.timeZone, locale: 'en-GB' }).instant('2026-11-14T16:23:00Z'), '14 Nov 2026, 08:23 GMT-8');
});

test('DST labels disambiguate repeated hours and skip nonexistent hours', () => {
  const view = timePresentation({ timeZone: 'America/Los_Angeles', locale: 'en-US' });
  assert.match(view.instant('2026-11-01T08:00:00Z'), /1:00 AM PDT/);
  assert.match(view.instant('2026-11-01T09:00:00Z'), /1:00 AM PST/);
  assert.match(view.instant('2026-03-08T09:00:00Z'), /1:00 AM PST/);
  assert.match(view.instant('2026-03-08T10:00:00Z'), /3:00 AM PDT/);
});

test('calendar agreement uses report offsets rather than assuming identical zone spellings', () => {
  const view = timePresentation({timeZone:'America/Los_Angeles'});
  assert.equal(view.matchesCalendar('US/Pacific',['2026-11-14T12:00:00Z']),true);
  assert.equal(view.matchesCalendar('Etc/GMT+8',['2026-11-14T12:00:00Z']),true);
  assert.equal(view.matchesCalendar('Etc/GMT+8',['2026-03-07T12:00:00Z','2026-03-09T12:00:00Z']),false);
  assert.equal(view.matchesCalendar('UTC',['2026-11-14T12:00:00Z']),false);
});

test('local days have actual 23/25-hour UTC boundaries', () => {
  const calendar = new ZonedCalendar('America/Los_Angeles');
  assert.equal(calendar.startOfDay('2026-03-08'), '2026-03-08T08:00:00.000Z');
  assert.equal(calendar.startOfDay('2026-03-09'), '2026-03-09T07:00:00.000Z');
  assert.equal(calendar.startOfDay('2026-11-01'), '2026-11-01T07:00:00.000Z');
  assert.equal(calendar.startOfDay('2026-11-02'), '2026-11-02T08:00:00.000Z');
  for (const [day, hours] of [['2026-03-08', 23], ['2026-11-01', 25]]) {
    const buckets = calendar.buckets(calendar.startOfDay(day), calendar.startOfDay(addCalendarDays(day, 1)), 'hour');
    assert.equal(buckets.length, hours);
    assert.equal(new Set(buckets.map(b => b.start)).size, hours);
    assert.ok(buckets.every((b, i) => i === 0 || buckets[i - 1].end === b.start));
  }
});

test('fractional offsets align bucket starts to local midnight and local hours', () => {
  for (const [zone, start] of [['Asia/Kolkata', '2026-11-13T18:30:00.000Z'], ['Asia/Kathmandu', '2026-11-13T18:15:00.000Z']]) {
    const calendar = new ZonedCalendar(zone);
    assert.equal(calendar.startOfDay('2026-11-14'), start);
    const buckets = calendar.buckets(start, calendar.startOfDay('2026-11-15'), 'hour');
    assert.equal(buckets.length, 24);
    assert.equal(buckets[0].start, start);
    assert.equal(calendarDateKey(start, zone), '2026-11-14');
  }
});

test('half-hour DST transitions create contiguous partial-hour buckets', () => {
  const calendar = new ZonedCalendar('Australia/Lord_Howe');
  const spring = calendar.buckets(calendar.startOfDay('2026-10-04'), calendar.startOfDay('2026-10-05'), 'hour');
  assert.ok(spring.some(b => b.start === '2026-10-03T15:30:00.000Z' && b.end === '2026-10-03T16:00:00.000Z'));
  const fall = calendar.buckets(calendar.startOfDay('2026-04-05'), calendar.startOfDay('2026-04-06'), 'hour');
  assert.ok(fall.some(b => b.start === '2026-04-04T15:00:00.000Z' && b.end === '2026-04-04T15:30:00.000Z'));
  assert.ok([...spring, ...fall].every(b => Date.parse(b.end) > Date.parse(b.start)));
});

test('a skipped calendar date does not invent a daily bucket', () => {
  const calendar = new ZonedCalendar('Pacific/Apia');
  const buckets = calendar.buckets(calendar.startOfDay('2011-12-29'), calendar.startOfDay('2012-01-01'), 'day');
  assert.deepEqual(buckets.map(b => calendar.dateAt(b.start)), ['2011-12-29', '2011-12-31']);
});

test('civil arithmetic counts calendar labels across leap years and offset changes', () => {
  assert.equal(addCalendarDays('2024-02-28', 2), '2024-03-01');
  assert.equal(calendarDaysBetween('2026-03-01', '2026-03-29'), 28);
  assert.equal(calendarDaysBetween('2026-10-15', '2026-11-12'), 28);
  assert.throws(() => addCalendarDays('2026-02-30', 1), RangeError);
});
