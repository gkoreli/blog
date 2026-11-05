import { appendFileSync } from 'node:fs';
import { ROOT } from '../lib/paths.js';
import { publishScheduledArticle, readPublicationSchedule } from '../lib/publication-schedule.js';

const mode = process.argv[2] ?? 'check';
if (mode === 'check') {
  const schedule = readPublicationSchedule(ROOT);
  console.log(`${schedule.articles.length} scheduled article(s); November 6–30 at 08:00 ${schedule.timeZone}.`);
} else if (mode === 'publish') {
  const result = await publishScheduledArticle(ROOT);
  console.log(result.message);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${result.changed}\ndate=${result.date}\nslug=${result.slug}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${result.message}\n`);
} else if (mode === 'verify') {
  const [slug, date] = process.argv.slice(3);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !date || !/^2026-11-\d{2}$/.test(date)) {
    throw new Error('verify requires an article slug and November 2026 date');
  }
  const base = 'https://gkoreli.com';
  let accepted = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const paths = [`/${slug}`, `/${slug}.md`, '/posts.json', '/feed.xml', '/sitemap.xml'];
      const responses = await Promise.all(paths.map(path => fetch(`${base}${path}`, {
        cache: 'no-store', signal: AbortSignal.timeout(15_000),
      })));
      const bodies = await Promise.all(responses.map(response => response.text()));
      const index: unknown = JSON.parse(bodies[2] ?? '');
      const indexed = Array.isArray(index) && index.some((entry: unknown) => (
        typeof entry === 'object' && entry !== null && 'slug' in entry && entry.slug === slug
        && 'date' in entry && entry.date === date
      ));
      if (responses.every(response => response.ok) && indexed
        && bodies[0]?.includes(`${base}/${slug}`)
        && bodies[3]?.includes(`${base}/${slug}`) && bodies[4]?.includes(`${base}/${slug}`)) {
        accepted = true;
        break;
      }
    } catch {
      // Deployment and transient network failures are retried within this run.
    }
    if (attempt < 39) await new Promise(resolve => setTimeout(resolve, 15_000));
  }
  if (!accepted) throw new Error(`Source may be delivered, but live publication is not verified: ${base}/${slug}`);
  const message = `Verified article, Markdown, index date, RSS and sitemap: ${base}/${slug}`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
} else {
  throw new Error('Expected check, publish or verify');
}
