import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createLocalProject } from '../scripts/create-local-project.mjs';

test('local project can resolve the package without the blog, with private keys and pinned tools', () => {
  const temp = mkdtempSync(join(tmpdir(), 'analytics-project-'));
  try {
    const target = join(temp, 'project');
    createLocalProject(target);
    const manifest = JSON.parse(readFileSync(join(target, 'package.json')));
    assert.equal(manifest.dependencies['@gkoreli/analytics'], 'file:./vendor/analytics');
    assert.equal(manifest.devDependencies.wrangler, '4.71.0');
    assert.equal(manifest.packageManager, 'pnpm@9.15.4');
    assert.equal(readFileSync(join(target, '.mise.toml'), 'utf8'), '[tools]\nnode = "24.14.1"\n');
    const packaged = JSON.parse(readFileSync(join(target, 'vendor/analytics/package.json')));
    assert.deepEqual(packaged.dependencies, { 'ipaddr.js': '2.5.0' });
    assert.equal(packaged.scripts, undefined);
    assert.deepEqual(readdirSync(join(target, 'vendor/analytics')).sort(), ['LICENSE', 'package.json', 'schema', 'src']);
    assert.match(readFileSync(join(target, 'worker.ts'), 'utf8'), /from '@gkoreli\/analytics'/);
    const secrets = readFileSync(join(target, '.dev.vars'), 'utf8');
    const keys = [...secrets.matchAll(/="([0-9a-f]{64})"/g)].map(match => match[1]);
    assert.equal(keys.length, 2);
    assert.notEqual(keys[0], keys[1]);
    assert.equal(statSync(join(target, '.dev.vars')).mode & 0o777, 0o600);
    assert.match(readFileSync(join(target, '.gitignore'), 'utf8'), /^\.dev\.vars$/m);
    const config = JSON.parse(readFileSync(join(target, 'wrangler.jsonc')));
    assert.equal(config.compatibility_date, '2026-03-01');
    assert.equal(config.d1_databases[0].migrations_dir, './vendor/analytics/schema');
    assert.equal(config.d1_databases[0].database_id, '00000000-0000-0000-0000-000000000000');
    assert.equal(config.routes, undefined);
    assert.throws(() => createLocalProject(target), /EEXIST/);
    assert.equal(readFileSync(join(target, '.dev.vars'), 'utf8'), secrets);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
