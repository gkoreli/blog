/**
 * Date utilities for the blog package.
 *
 * Build templates run at build time (Node/tsx). Client code runs in the browser.
 * Both need to format YYYY-MM-DD date strings for display.
 *
 * All dates from the CMS (frontmatter) and API (by_day) are YYYY-MM-DD strings.
 * Parsing rule: append 'T00:00:00' (no Z) so JS interprets as local midnight,
 * not UTC midnight. This prevents off-by-one display errors near midnight.
 */

/** Parse a YYYY-MM-DD string as local midnight. Never use new Date(dateStr) alone — it parses as UTC. */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/** Format a YYYY-MM-DD string as "March 5, 2026" in local time. */
export function formatDateLong(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format a Date as YYYY-MM-DD in local time. For chart padding, period display, etc. */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today as YYYY-MM-DD in local time. */
export function localToday(): string {
  return localDateStr(new Date());
}

/** Yesterday as YYYY-MM-DD in local time. */
export function localYesterday(): string {
  const d = new Date();
  return localDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/** The day before a YYYY-MM-DD string, as YYYY-MM-DD in local time. */
export function prevDay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return localDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/** Convert a YYYY-MM-DD string to a unix timestamp (seconds) at local midnight. For uPlot x-axis. */
export function toUnixLocal(dateStr: string): number {
  return parseLocalDate(dateStr).getTime() / 1000;
}
