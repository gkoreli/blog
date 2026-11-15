import { html, raw } from '@nisli/core';

export interface ReadingSection {
  readonly id: string;
  readonly title: string;
  readonly level: 2 | 3;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

/** The same outline serves native phone contents and the persistent reading rail. */
export function readingContentsHtml(outline: readonly ReadingSection[], presentation: 'inline' | 'rail'): string {
  const chapters = outline.filter(section => section.level === 2);
  const sections = chapters.length >= 4 ? chapters : outline;
  if (sections.length < 4) return '';
  const links = sections.map(section => `<li><a href="#${escape(encodeURIComponent(section.id))}">${escape(section.title)}</a></li>`).join('');
  const navigation = `<nav data-reading-contents aria-label="On this page"><ol>${links}</ol></nav>`;
  return presentation === 'inline'
    ? `<details class="reading-contents reading-contents--inline" data-reading-outline="inline" data-search-ignore><summary>On this page <span>${sections.length} sections</span></summary>${navigation}</details>`
    : `<aside class="reading-contents reading-contents--rail" data-search-ignore><p class="reading-contents-label">On this page</p>${navigation}</aside>`;
}

export function readingRail(outline: readonly ReadingSection[]) {
  return html`<div class="reading-rail-host" html:inner=${raw(readingContentsHtml(outline, 'rail'))}></div>`;
}

/** Only trusted rendered table HTML belongs here; labels remain escaped. */
export function tableRegionHtml(label: string, table: string, retainIdentity = true): string {
  return `<div class="reading-table${retainIdentity ? ' reading-table--identified' : ''}" data-reading-table><p class="reading-table-cue" data-search-ignore>Scroll to compare all columns</p><div class="reading-table-scroll" role="region" aria-label="${escape(label)}; scroll horizontally if needed" tabindex="0">${table}</div></div>`;
}
