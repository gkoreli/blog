import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('quoted and YAML-coerced publication dates retain the authored day across build timezones', () => {
  const root = mkdtempSync(join(tmpdir(), 'publication-date-'));
  try {
    const paths = ['2026-10-28', '"2026-10-28"', '2024-02-29'].map((date, index) => {
      const path = join(root, `${index}-fixture.md`);
      writeFileSync(path, `---\ntitle: Fixture\ndate: ${date}\ndescription: Fixture\nsection: engineering\n---\n# Fixture\n`);
      return path;
    });
    const script = `import {parsePost} from ${JSON.stringify(new URL('../src/lib/frontmatter.ts', import.meta.url).href)}; console.log(JSON.stringify(process.argv.slice(1).map(path=>parsePost(path).meta.date)));`;
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script, ...paths], { encoding: 'utf8', env: { ...process.env, TZ: timezone } });
      const dates: unknown = JSON.parse(output);
      assert.deepEqual(dates, ['2026-10-28', '2026-10-28', '2024-02-29'], timezone);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
