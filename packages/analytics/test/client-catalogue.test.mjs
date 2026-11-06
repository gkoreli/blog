import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CLIENT_REGISTRY, CLIENT_REGISTRY_SOURCES, CLIENT_REGISTRY_PROFILE } from '../.test-dist/client-registry.js';
import { catalogueCommand, DEFAULT_CATALOGUE_PATH, renderClientCatalogue } from '../scripts/client-catalogue.mjs';

test('generated client documentation matches the compiled registry with its aliases, roles and source basis', async () => {
  const expected = renderClientCatalogue(CLIENT_REGISTRY, CLIENT_REGISTRY_SOURCES, CLIENT_REGISTRY_PROFILE);
  assert.equal(await readFile(DEFAULT_CATALOGUE_PATH, 'utf8'), expected);
  const checked = await catalogueCommand(['--check']);
  assert.equal(checked.clients, CLIENT_REGISTRY.length);
  for (const client of CLIENT_REGISTRY) {
    assert.ok(expected.includes(`| \`${client.name}\` |`));
    for (const alias of client.products) assert.ok(expected.includes(`\`${alias}\``));
    assert.ok(expected.includes(CLIENT_REGISTRY_SOURCES[client.source].url));
  }
  assert.ok(expected.includes('inherited catalogue; no fresh review date'));
  assert.ok(expected.includes('first-party-source; '));
});

test('check mode rejects source-projection drift and leaves the stale file untouched', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'analytics-client-catalogue-'));
  const output = join(scratch, 'CLIENTS.md');
  const changed = CLIENT_REGISTRY.map((client, i) => i === 0 ? { ...client, readerKind: 'other-bot' } : client);
  const stale = renderClientCatalogue(changed, CLIENT_REGISTRY_SOURCES, CLIENT_REGISTRY_PROFILE);
  await writeFile(output, stale);
  await assert.rejects(catalogueCommand(['--check', '--output', output]), /stale/);
  assert.equal(await readFile(output, 'utf8'), stale);
  await catalogueCommand(['--output', output]);
  assert.equal(await readFile(output, 'utf8'), renderClientCatalogue(CLIENT_REGISTRY, CLIENT_REGISTRY_SOURCES, CLIENT_REGISTRY_PROFILE));
  await catalogueCommand(['--check', '--output', output]);
});
