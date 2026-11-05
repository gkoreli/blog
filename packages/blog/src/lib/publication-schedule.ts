import { existsSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod/v4';
import { parsePost } from './frontmatter.js';
import { parsePostModule } from './post-module.js';

const articleSchema = z.object({
  date: z.iso.date(),
  file: z.string().regex(/^\d+-[a-z0-9]+(?:-[a-z0-9]+)*\.(md|ts)$/),
  prompts: z.boolean().default(false),
});

const scheduleSchema = z.object({
  timeZone: z.literal('America/Los_Angeles'),
  startDate: z.literal('2026-11-06'),
  endDate: z.literal('2026-11-30'),
  releaseTime: z.literal('08:00'),
  articles: z.array(articleSchema),
});

export function readPublicationSchedule(root: string) {
  const json: unknown = JSON.parse(readFileSync(join(root, 'publication-schedule.json'), 'utf8'));
  const schedule = scheduleSchema.parse(json);
  const dates = new Set<string>();
  const slugs = new Set<string>();
  for (const article of schedule.articles) {
    const slug = articleSlug(article.file);
    if (article.date < schedule.startDate || article.date > schedule.endDate) {
      throw new Error(`${article.file}: date must be within the November campaign`);
    }
    if (dates.has(article.date) || slugs.has(slug)) {
      throw new Error(`${article.file}: schedule must contain one unique article per day`);
    }
    dates.add(article.date);
    slugs.add(slug);
    const source = join(root, 'scheduled', article.date, article.file);
    const target = join(root, 'posts', article.file);
    if (existsSync(source) === existsSync(target)) {
      throw new Error(`${article.file}: expected exactly one queued or published source`);
    }
    if (article.prompts) {
      const prompts = `${slug}.prompts.md`;
      const directory = existsSync(source) ? join(root, 'scheduled', article.date) : join(root, 'prompts');
      if (!existsSync(join(directory, prompts))) throw new Error(`${article.file}: missing ${prompts}`);
    }
    if (article.file.endsWith('.md')) {
      const post = parsePost(existsSync(source) ? source : target);
      if (post.meta.date !== article.date) throw new Error(`${article.file}: date must match its schedule`);
    }
  }
  return schedule;
}

function articleSlug(file: string): string {
  return file.replace(/^\d+-/, '').replace(/\.(md|ts)$/, '');
}

export async function publishScheduledArticle(root: string, now = new Date()) {
  const schedule = readPublicationSchedule(root);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: schedule.timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)?.value ?? '';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const time = `${part('hour')}:${part('minute')}`;
  if (date < schedule.startDate || date > schedule.endDate || time < schedule.releaseTime) {
    return { changed: false, date, slug: '', message: 'Outside the November release window.' };
  }
  const article = schedule.articles.find(value => value.date === date);
  if (!article) throw new Error(`No approved article queued for ${date}. Nothing was published.`);
  const slug = articleSlug(article.file);
  const source = join(root, 'scheduled', date, article.file);
  const target = join(root, 'posts', article.file);
  if (!existsSync(source)) {
    return { changed: false, date, slug, message: 'Article already promoted; verify its live deployment.' };
  }
  if (readdirSync(join(root, 'posts')).some(file => articleSlug(file) === slug)) {
    throw new Error(`${slug}: a published article already uses this slug`);
  }
  const moves = [[source, target]];
  if (article.prompts) {
    const filename = `${slug}.prompts.md`;
    const promptsTarget = join(root, 'prompts', filename);
    if (existsSync(promptsTarget)) throw new Error(`${filename}: published prompt file already exists`);
    moves.push([join(root, 'scheduled', date, filename), promptsTarget]);
  }
  const completed: { from: string; to: string }[] = [];
  try {
    for (const move of moves) {
      const [from, to] = move;
      if (!from || !to) throw new Error('Invalid publication move');
      renameSync(from, to);
      completed.push({ from, to });
    }
    const meta = article.file.endsWith('.md')
      ? parsePost(target).meta
      : parsePostModule(await import(pathToFileURL(target).href), target).meta;
    if (meta.date !== date || meta.slug !== slug) {
      throw new Error(`${article.file}: published date and slug must match its schedule`);
    }
  } catch (error) {
    for (const move of completed.reverse()) renameSync(move.to, move.from);
    throw error;
  }
  return { changed: true, date, slug, message: `Promoted ${article.file} for publication.` };
}
