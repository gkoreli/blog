import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { z } from 'zod/v4';

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.union([z.string(), z.date()]),
  description: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export type PostMeta = z.infer<typeof frontmatterSchema> & { slug: string; date: string };

export interface Post {
  meta: PostMeta;
  content: string;
}

export function parsePost(filePath: string): Post {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const parsed = frontmatterSchema.parse(data);

  const filename = filePath.split('/').pop() ?? '';
  const slug = filename.replace(/^\d+-/, '').replace(/\.md$/, '');
  const date = parsed.date instanceof Date
    ? parsed.date.toISOString().split('T')[0]!
    : parsed.date;

  return {
    meta: { ...parsed, date, slug },
    content,
  };
}
