import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod/v4';
import { PROMPTS_DIR } from './paths.js';

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.union([z.string(), z.date()]),
  description: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export type PostMeta = z.infer<typeof frontmatterSchema> & { slug: string; date: string; promptCount?: number };

export interface Post {
  meta: PostMeta;
  content: string;
}

export function parsePost(filePath: string): Post {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new FrontmatterError(filePath, issues);
  }

  const filename = filePath.split('/').pop() ?? '';
  const slug = filename.replace(/^\d+-/, '').replace(/\.md$/, '');
  const date = result.data.date instanceof Date
    ? result.data.date.toISOString().split('T')[0]!
    : result.data.date;

  return {
    meta: { ...result.data, date, slug },
    content,
  };
}

export class FrontmatterError extends Error {
  constructor(public filePath: string, details: string) {
    super(`Invalid frontmatter in ${filePath}:\n${details}`);
    this.name = 'FrontmatterError';
  }
}

export interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string;
}

export function validatePosts(files: string[]): ValidationResult[] {
  return files.map(f => {
    try {
      parsePost(f);
      return { file: f, valid: true };
    } catch (e) {
      if (e instanceof FrontmatterError) return { file: f, valid: false, errors: e.message };
      throw e;
    }
  });
}

export interface PromptsData {
  count: number;
  prompts: string[];
  preview: string;
}

/** Parse prompts file for a given post slug. Returns null if no prompts file exists. */
export function parsePrompts(slug: string): PromptsData | null {
  // Find file matching *-{slug}.prompts.md pattern
  const filename = readdirSync(PROMPTS_DIR).find(f => f.endsWith(`${slug}.prompts.md`));
  if (!filename) return null;

  const raw = readFileSync(join(PROMPTS_DIR, filename), 'utf-8');
  const prompts = raw.split(/^---$/m).map(s => s.trim()).filter(Boolean);
  if (!prompts.length) return null;

  const preview = prompts[0]!.slice(0, 200) + (prompts[0]!.length > 200 ? '…' : '');
  return { count: prompts.length, prompts, preview };
}
