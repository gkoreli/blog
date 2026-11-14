import { timePresentation } from '@gkoreli/time';

// Authored publication dates are calendar metadata, independent of viewer/host timezone.
const publication = timePresentation({ timeZone: 'UTC', locale: 'en-US' });
export function formatDateShort(date: string): string { return publication.calendarDate(date); }
export function formatDateLong(date: string): string { return publication.calendarDate(date, 'long'); }
