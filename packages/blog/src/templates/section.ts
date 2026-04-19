import type { PostMeta, Section } from '../lib/frontmatter.js';
import { SectionArchive } from '../components/index.js';

export { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';

export function sectionArchiveTemplate(section: Section, posts: PostMeta[]) {
  return SectionArchive({ section, posts });
}
