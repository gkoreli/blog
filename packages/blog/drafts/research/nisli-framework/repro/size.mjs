import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const runtime = process.env.NISLI_BENCH_RUNTIME;
const nisliRoot = process.env.NISLI_SOURCE_ROOT;
if (!runtime || !nisliRoot) throw new Error('Set NISLI_BENCH_RUNTIME and NISLI_SOURCE_ROOT');
const appRoot = join(runtime, 'app');
await mkdir(appRoot, { recursive: true });
await cp(join(here, 'src'), join(appRoot, 'src'), { recursive: true });
const { build } = await import(pathToFileURL(join(runtime, 'node_modules/vite/dist/node/index.js')).href);
const { default: solid } = await import(pathToFileURL(join(runtime, 'node_modules/@solidjs/vite-plugin/dist/esm/index.mjs')).href);
const results = [];
for (const variant of ['lit', 'lit-signals', 'solid', 'nisli']) {
  const extension = variant === 'solid' ? 'tsx' : 'ts';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${variant} size fixture</title></head><body><script type="module" src="/src/size-${variant}.${extension}"></script></body></html>`;
  await writeFile(join(appRoot, 'index.html'), html);
  const outDir = join(runtime, `size-${variant}`);
  await build({
    root: appRoot, configFile: false, plugins: [solid()],
    resolve: { alias: { '@nisli/core': join(nisliRoot, 'packages/core/src/index.ts') } },
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { outDir, emptyOutDir: true, target: 'es2024', minify: true, sourcemap: false },
  });
  const files = (await readdir(join(outDir, 'assets'))).filter(file => file.endsWith('.js'));
  let bytes = 0; let gzipBytes = 0;
  for (const file of files) {
    const data = await readFile(join(outDir, 'assets', file));
    bytes += data.length; gzipBytes += gzipSync(data).length;
  }
  results.push({ variant, bytes, gzipBytes, javascriptFiles: files.length });
}
const output = { capturedAt: new Date().toISOString(), method: 'One counter application per independent Vite production build. Sum emitted JS bytes; gzip each file with Node default zlib options. Excludes HTML, source maps, transfer headers, server compression variation, and build tool dependencies.', results };
await writeFile(join(runtime, 'size-results.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
