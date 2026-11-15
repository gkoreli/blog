import { timePresentation, utcInstant, type InstantInput } from '@gkoreli/time';

const fallback = timePresentation({ timeZone: 'UTC', locale: 'en-US' });

export function timeFallback(value: InstantInput): { instant: string; label: string } {
  const instant = utcInstant(value);
  return { instant, label: fallback.instant(instant) };
}

/** UTC SSR fallback or an explicit report presentation, with the same canonical
 * instant retained for progressive localization and native time semantics.
 */
export function localTimeHtml(value: InstantInput, presentation = fallback): string {
  const instant = utcInstant(value);
  const label = presentation.instant(instant).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<time datetime="${instant}" data-local-time>${label}</time>`;
}
