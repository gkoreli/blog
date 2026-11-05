import { strict as assert } from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { publishScheduledArticle, readPublicationSchedule } from '../src/lib/publication-schedule.js';

const roots: string[] = [];
const filename = '042-scheduled-test.md';
const date = '2026-11-06';
const atEight = new Date('2026-11-06T16:00:00Z');

function fixture(options: { prompts?: boolean; file?: string; contentDate?: string } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'blog-publication-'));
  roots.push(root);
  for (const directory of ['posts', 'prompts', `scheduled/${date}`]) mkdirSync(join(root, directory), { recursive: true });
  const file = options.file ?? filename;
  const config = {
    timeZone: 'America/Los_Angeles', startDate: date, endDate: '2026-11-30', releaseTime: '08:00',
    articles: [{ date, file, prompts: options.prompts ?? false }],
  };
  const source = join(root, 'scheduled', date, file);
  writeFileSync(join(root, 'publication-schedule.json'), JSON.stringify(config));
  writeFileSync(source, `---\ntitle: Scheduled test\ndate: "${options.contentDate ?? date}"\ndescription: Test article\nsection: engineering\n---\n\n# Scheduled test\n`);
  if (options.prompts) writeFileSync(join(root, 'scheduled', date, 'scheduled-test.prompts.md'), 'Exact shaping prompt.\n');
  return { root, source, config };
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

test('uses Pacific time and never promotes before 08:00', async () => {
  const { root, source } = fixture();
  assert.equal((await publishScheduledArticle(root, new Date('2026-11-06T15:59:59Z'))).changed, false);
  assert.ok(existsSync(source));
  assert.equal((await publishScheduledArticle(root, atEight)).changed, true);
  assert.ok(!existsSync(source));
  assert.ok(existsSync(join(root, 'posts', filename)));
});

test('moves exact article and prompt bytes and is idempotent on retry', async () => {
  const { root, source } = fixture({ prompts: true });
  const original = readFileSync(source, 'utf8');
  const result = await publishScheduledArticle(root, atEight);
  assert.deepEqual({ changed: result.changed, date: result.date, slug: result.slug }, {
    changed: true, date, slug: 'scheduled-test',
  });
  assert.equal(readFileSync(join(root, 'posts', filename), 'utf8'), original);
  assert.equal(readFileSync(join(root, 'prompts', 'scheduled-test.prompts.md'), 'utf8'), 'Exact shaping prompt.\n');
  assert.equal((await publishScheduledArticle(root, atEight)).changed, false);
});

test('never publishes before the campaign or in December or a later year', async () => {
  const { root, source } = fixture();
  for (const instant of ['2026-11-05T18:00:00Z', '2026-12-01T16:00:00Z', '2027-11-06T16:00:00Z']) {
    assert.equal((await publishScheduledArticle(root, new Date(instant))).changed, false);
  }
  assert.ok(existsSync(source));
});

test('a missing day fails without publishing yesterday’s queued article', async () => {
  const { root, source } = fixture();
  await assert.rejects(publishScheduledArticle(root, new Date('2026-11-07T16:00:00Z')), /No approved article queued/);
  assert.ok(existsSync(source));
});

test('requires the frontmatter date to match the scheduled day', () => {
  const { root, source } = fixture({ contentDate: '2026-11-07' });
  assert.throws(() => readPublicationSchedule(root), /date must match/);
  assert.ok(existsSync(source));
});

test('rejects duplicate dates and path traversal', () => {
  const { root, config } = fixture();
  config.articles.push({ date, file: '043-another-test.md', prompts: false });
  writeFileSync(join(root, 'publication-schedule.json'), JSON.stringify(config));
  assert.throws(() => readPublicationSchedule(root), /one unique article per day/);
  config.articles = [{ date, file: '../outside.md', prompts: false }];
  writeFileSync(join(root, 'publication-schedule.json'), JSON.stringify(config));
  assert.throws(() => readPublicationSchedule(root));
});

test('refuses collisions and missing declared prompts without moving the article', async () => {
  const { root, source } = fixture({ prompts: true });
  writeFileSync(join(root, 'posts', '001-scheduled-test.ts'), 'existing article');
  await assert.rejects(publishScheduledArticle(root, atEight), /already uses this slug/);
  assert.ok(existsSync(source));
  rmSync(join(root, 'scheduled', date, 'scheduled-test.prompts.md'));
  assert.throws(() => readPublicationSchedule(root), /missing scheduled-test.prompts.md/);
});

test('checks TypeScript metadata after moving and restores files on failure', async () => {
  const { root, source } = fixture({ file: '042-scheduled-test.ts', prompts: true });
  writeFileSync(source, `export const meta = { title: 'Test', description: 'Test', section: 'engineering', date: '2026-11-07', slug: 'scheduled-test' };\nexport const article = () => null;\n`);
  await assert.rejects(publishScheduledArticle(root, atEight), /date and slug must match/);
  assert.ok(existsSync(source));
  assert.ok(existsSync(join(root, 'scheduled', date, 'scheduled-test.prompts.md')));
  assert.ok(!existsSync(join(root, 'posts', '042-scheduled-test.ts')));
});
