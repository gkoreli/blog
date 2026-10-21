import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const here = dirname(fileURLToPath(import.meta.url));
export const runtime = process.env.NISLI_BENCH_RUNTIME;
export const artifact = process.env.NISLI_ARTIFACT_ROOT;
if (!runtime || !artifact) throw new Error('Set NISLI_BENCH_RUNTIME and NISLI_ARTIFACT_ROOT (extracted npm package directory)');
export const app = join(runtime, 'publication-app');
export const entry = join(artifact, 'dist/bundler/index.js');
const pkg = JSON.parse(await readFile(join(artifact, 'package.json'), 'utf8'));
if (pkg.version !== '0.57.0') throw new Error('This reproduction pins @nisli/core 0.57.0');
const original = await readFile(join(here, '../repro/src/app.ts'), 'utf8');
const versionText = "nisli: '0.56.0', nisliCommit: '4afde49c728a330e10ce887a38b8013d63b58498'";
if (original.split(versionText).length !== 2) throw new Error('Original harness metadata changed; inspect before adapting');
export const metadata = {
  version: pkg.version,
  sourceCommit: '1d055cabdffbea8ff8d82cbfd88a6081882ca8b2',
  artifact: 'Published npm tarball; dist/bundler/index.js; standard production define',
  bundledEntrySha256: createHash('sha256').update(await readFile(entry)).digest('hex'),
  originalHarnessSha256: createHash('sha256').update(original).digest('hex'),
};
await mkdir(app, { recursive: true });
await cp(join(here, '../repro/src'), join(app, 'src'), { recursive: true });
const adapted = 'declare const __PUBLICATION_ARTIFACT__: Record<string, unknown>;\n' + original
  .replace(versionText, "nisli: '0.57.0', nisliCommit: '1d055cabdffbea8ff8d82cbfd88a6081882ca8b2'")
  .replace('capturedAt: new Date().toISOString(),', 'capturedAt: new Date().toISOString(),\n      artifact: __PUBLICATION_ARTIFACT__,');
await writeFile(join(app, 'src/app.ts'), adapted);
export const { build } = await import(pathToFileURL(join(runtime, 'node_modules/vite/dist/node/index.js')).href);
const { default: solid } = await import(pathToFileURL(join(runtime, 'node_modules/@solidjs/vite-plugin/dist/esm/index.mjs')).href);
export const config = {
  root: app, configFile: false, plugins: [solid()],
  resolve: { alias: { '@nisli/core': entry } },
  define: { 'process.env.NODE_ENV': JSON.stringify('production'), __PUBLICATION_ARTIFACT__: JSON.stringify(metadata) },
};
export function inside(base, relative) {
  const target = resolve(base, relative);
  if (!target.startsWith(base + '/')) throw new Error('Invalid path');
  return target;
}
