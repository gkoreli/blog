import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod/v4';
import { PROMPTS_DIR } from './paths.js';
import { localDateStr } from './dates.js';

export const sectionSchema = z.enum(['essays', 'engineering', 'oss-radar', 'frames']);
export type Section = z.infer<typeof sectionSchema>;

export const SECTION_LABELS: Record<Section, string> = {
  essays: 'Essays',
  engineering: 'Engineering',
  'oss-radar': 'OSS Radar',
  frames: 'Frames',
};

export const SECTION_DESCRIPTIONS: Record<Section, string> = {
  essays: 'Personal reflections, slow thinking, and long-form writing.',
  engineering: 'Building with agents, tools, and systems. Technical depth.',
  'oss-radar': 'Open source ecosystem analysis. Serialised issues.',
  frames: 'Visual journals. Photography and presence.',
};

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.union([z.string(), z.date()]),
  description: z.string(),
  section: sectionSchema,
  tags: z.array(z.string()).optional().default([]),
  layout: z.enum(['default', 'immersive', 'frames']).default('default'),
  featured: z.boolean().optional().default(false),
  seoTitle: z.string().optional(),
  alternativeHeadline: z.string().optional(),
  lastModified: z.string().optional(),
  series: z.object({ name: z.string(), order: z.number() }).optional(),
  relatedPosts: z.array(z.string()).optional().default([]),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
  })).optional().default([]),
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
  const slug = filename.replace(/^\d+-/, '').replace(/\.(md|ts|html)$/, '');
  const date = result.data.date instanceof Date
    ? localDateStr(result.data.date)
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
  const filename = readdirSync(PROMPTS_DIR).find(f => f.endsWith(`${slug}.prompts.md`));
  if (!filename) return null;

  const raw = readFileSync(join(PROMPTS_DIR, filename), 'utf-8');
  const prompts = raw.split(/^---$/m).map(s => s.trim()).filter(Boolean);
  if (!prompts.length) return null;

  const preview = prompts[0]!.slice(0, 200) + (prompts[0]!.length > 200 ? '…' : '');
  return { count: prompts.length, prompts, preview };
}
