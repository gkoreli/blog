import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { app, build, config, metadata, runtime } from './common.mjs';

const results = [];
for (const variant of ['lit', 'lit-signals', 'solid', 'nisli']) {
  const extension = variant === 'solid' ? 'tsx' : 'ts';
  await writeFile(join(app, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>${variant} size fixture</title></head><body><script type="module" src="/src/size-${variant}.${extension}"></script></body></html>`);
  const outDir = join(runtime, `publication-size-${variant}`);
  await build({ ...config, build: { outDir, emptyOutDir: true, target: 'es2024', minify: true, sourcemap: false } });
  const files = (await readdir(join(outDir, 'assets'))).filter(file => file.endsWith('.js'));
  let bytes = 0; let gzipBytes = 0;
  for (const file of files) { const data = await readFile(join(outDir, 'assets', file)); bytes += data.length; gzipBytes += gzipSync(data).length; }
  results.push({ variant, bytes, gzipBytes, javascriptFiles: files.length });
}
const record = { capturedAt: new Date().toISOString(), artifact: metadata, method: 'Independent production counter builds; sum emitted JS and gzip each file with Node defaults. Same fixture and dependency lock as the original comparison. Excludes HTML, source maps, tooling, and transfer headers.', results };
await writeFile(join(runtime, 'publication-size-results.json'), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify(record, null, 2));
