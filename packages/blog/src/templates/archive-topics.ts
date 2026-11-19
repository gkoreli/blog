import { html } from '@nisli/core';
import type { PostMeta, Section } from '../lib/frontmatter.js';

export function archiveTopicIndex(section: Section, posts: readonly Pick<PostMeta, 'tags'>[]) {
  const names = new Set(posts.flatMap(post => post.tags));
  if (names.size === 0) return '';
  const topics = [...names].sort((a, b) => a.localeCompare(b, 'en'));

  const links = topics.map(topic => {
    const query = new URLSearchParams({ q: topic, section });
    return html`<li><a href=${`/search?${query}`}><span class="topic-hash" aria-hidden="true">#</span>${topic}</a></li>`;
  });

  return html`<details class="archive-topics">
    <summary>Browse topics <span>(${topics.length})</span></summary>
    <ul>${links}</ul>
  </details>`;
}
