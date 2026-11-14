import { existsSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod/v4';
import { parsePost } from './frontmatter.js';
import { parsePostModule } from './post-module.js';

const articleSchema = z.object({
  date: z.iso.date(),
  file: z.string().regex(/^\d+-[a-z0-9]+(?:-[a-z0-9]+)*\.(md|ts)$/),
  prompts: z.literal(false).optional(),
});

const scheduleSchema = z.object({
  timeZone: z.literal('America/Los_Angeles'),
  cadence: z.literal('weekly'),
  releaseDay: z.literal('monday'),
  section: z.literal('oss-radar'),
  startDate: z.iso.date(),
  releaseTime: z.literal('08:00'),
  articles: z.array(articleSchema),
});

function isMonday(date: string): boolean {
  return new Date(`${date}T12:00:00Z`).getUTCDay() === 1;
}

export function readPublicationSchedule(root: string) {
  const json: unknown = JSON.parse(readFileSync(join(root, 'publication-schedule.json'), 'utf8'));
  const schedule = scheduleSchema.parse(json);
  if (!isMonday(schedule.startDate)) throw new Error('The weekly schedule must start on a Monday');
  const dates = new Set<string>();
  const slugs = new Set<string>();
  for (const article of schedule.articles) {
    const slug = articleSlug(article.file);
    if (article.date < schedule.startDate || !isMonday(article.date)) {
      throw new Error(`${article.file}: date must be a Monday on or after the weekly schedule starts`);
    }
    if (dates.has(article.date) || slugs.has(slug)) {
      throw new Error(`${article.file}: schedule must contain one unique article per Monday`);
    }
    dates.add(article.date);
    slugs.add(slug);
    const source = join(root, 'scheduled', article.date, article.file);
    const target = join(root, 'posts', article.file);
    if (existsSync(source) === existsSync(target)) {
      throw new Error(`${article.file}: expected exactly one queued or published source`);
    }
    if (article.file.endsWith('.md')) {
      const post = parsePost(existsSync(source) ? source : target);
      if (post.meta.date !== article.date) throw new Error(`${article.file}: date must match its schedule`);
      if (post.meta.section !== schedule.section) throw new Error(`${article.file}: weekly releases must be OSS Radar articles`);
    }
  }
  return schedule;
}

function articleSlug(file: string): string {
  return file.replace(/^\d+-/, '').replace(/\.(md|ts)$/, '');
}

async function readArticleMeta(file: string) {
  return file.endsWith('.md')
    ? parsePost(file).meta
    : parsePostModule(await import(pathToFileURL(file).href), file).meta;
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
  if (date < schedule.startDate || !isMonday(date) || time < schedule.releaseTime) {
    return { changed: false, date, slug: '', message: 'Outside the Monday 08:00 Pacific release window.' };
  }
  const article = schedule.articles.find(value => value.date === date);
  if (!article) throw new Error(`No reviewed OSS Radar article queued for ${date}. Nothing was published.`);
  const slug = articleSlug(article.file);
  const source = join(root, 'scheduled', date, article.file);
  const target = join(root, 'posts', article.file);
  if (!existsSync(source)) {
    return { changed: false, date, slug, message: 'Article already promoted; verify its live deployment.' };
  }
  if (readdirSync(join(root, 'posts')).some(file => articleSlug(file) === slug)) {
    throw new Error(`${slug}: a published article already uses this slug`);
  }
  for (const file of readdirSync(join(root, 'posts')).filter(file => /\.(md|ts)$/.test(file))) {
    const meta = await readArticleMeta(join(root, 'posts', file));
    if (meta.section === schedule.section && meta.date === date) {
      throw new Error(`${date}: an OSS Radar article is already published for this Monday`);
    }
  }
  const moves = [[source, target]];
  const completed: { from: string; to: string }[] = [];
  try {
    for (const move of moves) {
      const [from, to] = move;
      if (!from || !to) throw new Error('Invalid publication move');
      renameSync(from, to);
      completed.push({ from, to });
    }
    const meta = await readArticleMeta(target);
    if (meta.date !== date || meta.slug !== slug) {
      throw new Error(`${article.file}: published date and slug must match its schedule`);
    }
    if (meta.section !== schedule.section) throw new Error(`${article.file}: weekly releases must be OSS Radar articles`);
  } catch (error) {
    for (const move of completed.reverse()) renameSync(move.to, move.from);
    throw error;
  }
  return { changed: true, date, slug, message: `Promoted ${article.file} for publication.` };
}
