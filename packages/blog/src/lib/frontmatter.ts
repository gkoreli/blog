import { readFileSync } from 'node:fs';
import matter from 'gray-matter';

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  slug: string;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export function parsePost(filePath: string): Post {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const filename = filePath.split('/').pop() ?? '';
  // 001-hello-world.md → hello-world
  const slug = filename.replace(/^\d+-/, '').replace(/\.md$/, '');

  const rawDate = data['date'];
  const date = rawDate instanceof Date ? rawDate.toISOString().split('T')[0]!
    : typeof rawDate === 'string' ? rawDate
    : '';

  return {
    meta: {
      title: data['title'] as string ?? 'Untitled',
      date,
      description: data['description'] as string ?? '',
      tags: (data['tags'] as string[] | undefined) ?? [],
      slug,
    },
    content,
  };
}
