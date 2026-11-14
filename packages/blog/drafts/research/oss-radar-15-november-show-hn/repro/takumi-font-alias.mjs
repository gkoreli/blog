// Matched public-release control; public verified font, no browser or remote resources.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [previous, current, fontFile, output] = process.argv.slice(2).map(value => resolve(value));
assert(previous && current && fontFile && output);
const inputMode = process.argv[6] ?? 'copied-buffers';
assert(['copied-buffers', 'shared-buffer', 'same-object'].includes(inputMode));
const bytes = await readFile(fontFile);
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(createHash('sha1').update(Buffer.concat([
  Buffer.from(`blob ${bytes.length}\0`), bytes,
])).digest('hex'), 'd101f19f443c1eb7158f98cb2deebacd97224538');
const results = [];
for (const [name, runtime] of [['previous', previous], ['current', current]]) {
  const requireRuntime = createRequire(join(runtime, 'package.json'));
  const api = await import(pathToFileURL(requireRuntime.resolve('@takumi-rs/core')));
  const renderer = new api.Renderer();
  const registrations = [];
  const sharedBuffer = Uint8Array.from(bytes).buffer;
  const reusedView = new Uint8Array(sharedBuffer);
  for (const family of ['Alpha', 'Beta']) {
    const data = inputMode === 'same-object' ? reusedView
      : inputMode === 'shared-buffer'
        ? (family === 'Alpha' ? sharedBuffer : new Uint8Array(sharedBuffer))
        : new Uint8Array(bytes);
    const registered = await renderer.registerFont({ name: family, data });
    registrations.push({ requested: family, registered: registered.map(value => value.name) });
  }
  const renders = [];
  for (const family of ['Alpha', 'Beta']) {
    try {
      const image = await renderer.render({ type: 'text', text: 'Again',
        style: { fontFamily: family, fontSize: 32 } }, { width: 240, height: 64, format: 'png' });
      renders.push({ family, success: true, bytes: image.length, sha256: sha(image) });
    } catch (error) {
      renders.push({ family, success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const lock = JSON.parse(await readFile(join(runtime, 'package-lock.json'), 'utf8'));
  const pkg = lock.packages['node_modules/@takumi-rs/core'];
  results.push({ condition: name, packageVersion: pkg.version, packageIntegrity: pkg.integrity,
    registrations, renders, identicalImages: renders.every(row => row.success) && renders[0].sha256 === renders[1].sha256 });
}
const receipt = { node: process.version, platform: process.platform, architecture: process.arch,
  inputMode,
  font: { publicSourceCommit: 'ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d',
    blob: 'd101f19f443c1eb7158f98cb2deebacd97224538', bytes: bytes.length, sha256: sha(bytes) },
  results, scope: 'One authored same-font/two-family case across two published native packages; no broad font conformance or performance claim.',
  modelServiceCalls: 0, userConfigurationChanged: false };
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(results.map(({ packageVersion, registrations, identicalImages }) => ({ packageVersion, registrations, identicalImages }))));
