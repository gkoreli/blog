import { timePresentation, utcInstant, type InstantInput } from '@gkoreli/time';

const fallback = timePresentation({ timeZone: 'UTC', locale: 'en-US' });

export function timeFallback(value: InstantInput): { instant: string; label: string } {
  const instant = utcInstant(value);
  return { instant, label: fallback.instant(instant) };
}

/** Complete SSR text, with a canonical instant for progressive localization.
 * Both interpolations are produced by the time core, never arbitrary HTML.
 */
export function localTimeHtml(value: InstantInput): string {
  const { instant, label } = timeFallback(value);
  return `<time datetime="${instant}" data-local-time>${label}</time>`;
}
