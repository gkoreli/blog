/**
 * Date utilities for the analytics package.
 *
 * Invariant: D1 stores UTC. All server-side date operations are either
 * UTC (for storage/salt) or explicitly shifted to the viewer's timezone
 * (for grouping/display). These functions make the intent unambiguous.
 */

const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;

/** Today's date in UTC as YYYY-MM-DD. Used for daily salt rotation. */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's date in the viewer's timezone as YYYY-MM-DD.
 * @param tzOffsetMin - `getTimezoneOffset()` value (minutes behind UTC, e.g. 480 for PST)
 */
export function localToday(tzOffsetMin: number): string {
  return toDateString(shiftToLocal(Date.now(), tzOffsetMin));
}

/**
 * Subtract N days from a timestamp and return YYYY-MM-DD.
 * The timestamp should already be in the desired timezone frame (use shiftToLocal first).
 */
export function daysAgo(fromMs: number, days: number): string {
  return toDateString(fromMs - days * MS_PER_DAY);
}

/**
 * Shift a UTC timestamp to simulate the viewer's local time.
 *
 * Returns a ms value that, when formatted via toISOString(), produces
 * the viewer's local date. The Date object doesn't represent a real UTC
 * instant — it's a number-line trick so toISOString().slice(0,10) gives
 * the local date string.
 *
 * @param utcMs - UTC timestamp (e.g. Date.now())
 * @param tzOffsetMin - getTimezoneOffset() value (minutes behind UTC)
 */
export function shiftToLocal(utcMs: number, tzOffsetMin: number): number {
  return utcMs - tzOffsetMin * MS_PER_MINUTE;
}

/** Extract YYYY-MM-DD from a ms timestamp via toISOString. */
function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
