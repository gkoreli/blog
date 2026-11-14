import { timePresentation, utcInstant, type InstantInput } from '@gkoreli/time';

type PresentationOptions = Parameters<typeof timePresentation>[0];

/** Only marked instants are enhanced; publication dates and raw evidence stay intact. */
export function localizeTimeElements(root: ParentNode = document, options?: PresentationOptions): number {
  const presentation = timePresentation(options);
  let count = 0;
  for (const time of root.querySelectorAll('time[data-local-time]')) {
    const instant = time.getAttribute('datetime');
    if (instant === null) continue;
    try { time.textContent = presentation.instant(instant); count++; }
    catch { /* Keep the readable fallback when a saved instant is malformed. */ }
  }
  return count;
}

export function localTimeElement(value: InstantInput, options?: PresentationOptions): HTMLElement {
  const time = document.createElement('time');
  time.setAttribute('datetime', utcInstant(value));
  time.setAttribute('data-local-time', '');
  time.textContent = timePresentation(options).instant(value);
  return time;
}
