import test from 'node:test';
import assert from 'node:assert/strict';
import { statsTimePresentation } from '../src/lib/stats-time.js';

test('report updates and hourly buckets use the viewer timezone with an explicit zone', () => {
  const time = statsTimePresentation('America/Los_Angeles', 'en-US');
  const instant = '2026-11-14T16:23:48.617Z';
  assert.match(time.formatInstant(instant), /Nov 14, 2026, 8:23 AM PST/);
  assert.match(time.formatBucket('2026-11-14T16:00:00Z', 'hour'), /Nov 14, 2026, 8:00 AM PST/);
  assert.equal(time.chartTimeZone('hour'), 'America/Los_Angeles');
  assert.equal(time.formatChartValue(Date.parse(instant) / 1000, 'hour'), time.formatInstant(instant));
});

test('local timestamps can cross a date boundary without moving the UTC reporting day', () => {
  const time = statsTimePresentation('America/Los_Angeles', 'en-US');
  assert.match(time.formatBucket('2026-11-14T00:00:00Z', 'hour'), /Nov 13, 2026, 4:00 PM PST/);
  assert.equal(time.formatBucket('2026-11-14', 'day'), 'Nov 14, 2026');
  assert.equal(time.formatChartValue(Date.parse('2026-11-14T00:00:00Z') / 1000, 'day'), 'Nov 14, 2026');
  assert.equal(time.chartTimeZone('day'), 'Etc/UTC');
});

test('repeated fall-back hours remain distinguishable by their actual offset', () => {
  const time = statsTimePresentation('America/Los_Angeles', 'en-US');
  assert.match(time.formatBucket('2026-11-01T08:00:00Z', 'hour'), /1:00 AM PDT/);
  assert.match(time.formatBucket('2026-11-01T09:00:00Z', 'hour'), /1:00 AM PST/);
});

test('spring-forward hours skip the nonexistent local hour', () => {
  const time = statsTimePresentation('America/Los_Angeles', 'en-US');
  assert.match(time.formatBucket('2026-03-08T09:00:00Z', 'hour'), /1:00 AM PST/);
  assert.match(time.formatBucket('2026-03-08T10:00:00Z', 'hour'), /3:00 AM PDT/);
});

test('fractional-offset zones retain their bucket minute and date', () => {
  assert.match(statsTimePresentation('Asia/Kolkata', 'en-US').formatBucket('2026-11-14T16:00:00Z', 'hour'), /Nov 14, 2026, 9:30 PM GMT\+5:30/);
  assert.match(statsTimePresentation('Asia/Kathmandu', 'en-US').formatBucket('2026-11-14T16:00:00Z', 'hour'), /Nov 14, 2026, 9:45 PM GMT\+5:45/);
  assert.match(statsTimePresentation('Asia/Tokyo', 'en-US').formatBucket('2026-11-14T16:00:00Z', 'hour'), /Nov 15, 2026, 1:00 AM GMT\+9/);
});

test('daily aggregates keep the same UTC date for viewers on either side of midnight', () => {
  for (const zone of ['America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati', 'UTC']) {
    assert.equal(statsTimePresentation(zone, 'en-US').formatBucket('2026-11-14', 'day'), 'Nov 14, 2026');
  }
});

test('formatting honors the viewer locale and resolves their timezone by default', () => {
  assert.match(statsTimePresentation('America/Los_Angeles', 'en-GB').formatInstant('2026-11-14T16:23:00Z'), /14 Nov 2026, 08:23 GMT-8/);
  assert.equal(statsTimePresentation().timeZone, new Intl.DateTimeFormat().resolvedOptions().timeZone);
});
