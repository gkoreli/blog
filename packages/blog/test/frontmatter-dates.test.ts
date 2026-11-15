import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { postMetaSchema } from '../src/lib/frontmatter.js';
import { bibtex, cslJson } from '../src/templates/citation.js';

test('quoted and YAML-coerced publication dates retain the authored day across build timezones', () => {
  const root = mkdtempSync(join(tmpdir(), 'publication-date-'));
  try {
    const paths = ['2026-10-28', '"2026-10-28"', '2024-02-29'].map((date, index) => {
      const path = join(root, `${index}-fixture.md`);
      writeFileSync(path, `---\ntitle: Fixture\ndate: ${date}\ndescription: Fixture\nsection: engineering\n---\n# Fixture\n`);
      return path;
    });
    const script = `import {formatDateLong} from ${JSON.stringify(new URL('../src/lib/dates.ts', import.meta.url).href)}; import {rssFeed} from ${JSON.stringify(new URL('../src/templates/rss.ts', import.meta.url).href)}; import {parsePost} from ${JSON.stringify(new URL('../src/lib/frontmatter.ts', import.meta.url).href)}; const posts=process.argv.slice(1).map(path=>parsePost(path).meta); console.log(JSON.stringify({dates:posts.map(post=>post.date),labels:posts.map(post=>formatDateLong(post.date)),feed:rssFeed(posts)}));`;
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script, ...paths], { encoding: 'utf8', env: { ...process.env, TZ: timezone } });
      const dates: unknown = JSON.parse(output);
      assert.ok(typeof dates === 'object' && dates !== null && 'dates' in dates && 'labels' in dates && 'feed' in dates);
      assert.deepEqual(dates.dates, ['2026-10-28', '2026-10-28', '2024-02-29'], timezone);
      assert.deepEqual(dates.labels, ['October 28, 2026', 'October 28, 2026', 'February 29, 2024'], timezone);
      assert.equal(typeof dates.feed, 'string');
      assert.match(String(dates.feed), /<pubDate>Wed, 28 Oct 2026 00:00:00 GMT<\/pubDate>/);
      assert.match(String(dates.feed), /<pubDate>Thu, 29 Feb 2024 00:00:00 GMT<\/pubDate>/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('citation dates share real-calendar validation while retaining protocol date parts', () => {
  const metadata = (date: string) => postMetaSchema.parse({ title: 'Fixture', slug: 'fixture', date, description: 'Fixture', section: 'engineering' });
  const leapDay = metadata('2024-02-29');
  assert.match(cslJson(leapDay), /"date-parts": \[\s*\[\s*2024,\s*2,\s*29/);
  assert.match(bibtex(leapDay), /year=\{2024\},\s*month=\{February\}/);
  for (const date of ['2026-02-29', '2026-04-31', '2026-11-14T00:00:00Z', '2026-13-01']) {
    assert.throws(() => cslJson(metadata(date)), /Invalid citation date/);
    assert.throws(() => bibtex(metadata(date)), /Invalid citation date/);
  }
});
