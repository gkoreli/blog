import { staticHtml as html } from '@nisli/core/static';
import type { Section } from '../../lib/frontmatter.js';
import { SECTION_LABELS } from '../../lib/frontmatter.js';

export function SectionLabel({ section }: { section: Section }) {
  return html`<a href="/${section}" class="section-label section-label--${section}">← ${SECTION_LABELS[section]}</a>`;
}
