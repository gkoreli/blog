import type { PostMeta, Section } from './frontmatter.js';

/** Topics lead to the existing publication search, with an explicit section scope. */
export function topicSearchHref(topic: string, section: Section): string {
  return `/search?${new URLSearchParams({ q: topic, section })}`;
}

export function archiveTopics(posts: readonly PostMeta[]): readonly { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of new Set(post.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
