import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import test from 'node:test';
import { REPO_ROOT } from '../src/lib/paths.js';

async function sources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? sources(join(directory, entry.name))
    : /\.(?:[cm]?[jt]s)$/.test(entry.name) ? [join(directory, entry.name)] : []));
  return nested.flat();
}

test('active site modules share one time implementation', async context => {
  const packages = await readdir(join(REPO_ROOT, 'packages'), { withFileTypes: true });
  const roots: string[] = [];
  for (const entry of packages) {
    if (!entry.isDirectory() || entry.name === 'time') continue;
    const directory = join(REPO_ROOT, 'packages', entry.name);
    if ((await readdir(directory)).includes('src')) roots.push(join(directory, 'src'));
  }
  roots.push(join(REPO_ROOT, 'packages/blog/posts'));
  const files = (await Promise.all(roots.map(sources))).flat();
  // Active TypeScript publication/export tools are covered; frozen research
  // harnesses and historical evidence keep their original recorded conditions.
  files.push(...(await sources(join(REPO_ROOT, 'packages/blog/scripts'))).filter(file => file.endsWith('.ts')));
  const violations: string[] = [];
  const nativeSerialization: string[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const path = relative(REPO_ROOT, file);
    const forbidden = source.match(/Intl\s*\.\s*DateTimeFormat|\.(?:toLocaleDateString|toLocaleTimeString|toUTCString|getTimezoneOffset|formatToParts|get(?:UTC)?(?:FullYear|Month|Date|Day|Hours|Minutes)|set(?:UTC)?(?:FullYear|Month|Date|Hours|Minutes))\s*\(/g);
    if (forbidden) violations.push(`${path}: ${forbidden.join(', ')}`);
    const serializers = source.match(/\.toISOString\s*\(/g);
    if (serializers) nativeSerialization.push(...serializers.map(() => path));
  }
  assert.deepEqual(violations, [], 'Use @gkoreli/time for calendar arithmetic and locale presentation.');
  // This inline reporter must still work if the shared main bundle fails to load.
  assert.deepEqual(nativeSerialization, ['packages/blog/src/templates/client-bootstrap.ts']);
  context.diagnostic(`Checked ${files.length} active source files across ${roots.length} source roots and publication/export tools.`);
});
