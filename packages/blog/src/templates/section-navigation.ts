import { html } from '@nisli/core';

export interface SectionDestination {
  readonly href: string;
  readonly label: string;
}

/** Intrinsic labels, native links and one selected destination at every width. */
export function sectionNavigation(label: string, destinations: readonly SectionDestination[], options: {
  className?: string;
  currentHref?: string;
  currentKind?: 'page' | 'location';
  hidden?: boolean;
} = {}) {
  return html`<nav data-section-navigation class=${options.className} aria-label=${label} hidden=${options.hidden}>${destinations.map(destination => html`<a href=${destination.href} aria-current=${destination.href === options.currentHref ? options.currentKind ?? 'location' : undefined}>${destination.label}</a>`)}</nav>`;
}
