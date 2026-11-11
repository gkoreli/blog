import { html } from '@nisli/core';

export const utilityIconNames = ['menu', 'close', 'sun', 'moon', 'clock', 'mail', 'pen', 'posts', 'desktop', 'tablet', 'phone'] as const;
export type UtilityIconName = typeof utilityIconNames[number];

export function utilityIconStyle(name: UtilityIconName): string {
  return `--ui-icon-image:url('/icons/${name}.svg')`;
}

/** Decorative glyph only. The containing control or adjacent text names it. */
export function utilityIcon(name: UtilityIconName) {
  return html`<span class="ui-icon" aria-hidden="true" style=${utilityIconStyle(name)}></span>`;
}
