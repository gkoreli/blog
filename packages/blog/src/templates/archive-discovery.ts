import { html } from '@nisli/core';
import { archiveTopics, topicSearchHref } from '../lib/discovery.js';
import { SECTION_LABELS, type PostMeta, type Section } from '../lib/frontmatter.js';

export function topicLinks(tags: readonly string[], section: Section, className = 'topic-links') {
  return html`<div class=${className}>${tags.map(tag => html`<a class="topic-link" href=${topicSearchHref(tag, section)} title=${`Search ${tag} in ${SECTION_LABELS[section]}`}><span class="topic-hash" aria-hidden="true">#</span>${tag}</a>`)}</div>`;
}

/** Discovery adds routes into the full archive; it never replaces the chronology. */
export function archiveDiscovery(section: Section, posts: readonly PostMeta[]) {
  const topics = archiveTopics(posts);
  if (!topics.length) return '';
  return html`<section class="archive-discovery" aria-label=${`Explore ${SECTION_LABELS[section]}`}>
    <div class="archive-topic-browser"><p>Explore topics</p>${topicLinks(topics.slice(0, 6).map(topic => topic.name), section)}
      ${topics.length > 6 ? html`<details><summary>All ${topics.length} topics</summary>${topicLinks(topics.slice(6).map(topic => topic.name), section)}</details>` : ''}
    </div>
  </section>`;
}
