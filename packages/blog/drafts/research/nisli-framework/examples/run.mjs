import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const runtime = process.env.NISLI_CORE_WORKTREE;
const artifact = process.env.NISLI_ARTIFACT_ROOT;
assert.ok(runtime && artifact, 'Set NISLI_CORE_WORKTREE and NISLI_ARTIFACT_ROOT');
const require = createRequire(join(runtime, 'package.json'));
const { build } = require(require.resolve('esbuild', { paths: [join(runtime, 'node_modules/.pnpm/node_modules')] }));
const { chromium, firefox, webkit } = require('playwright');
const compiler = require.resolve('typescript/bin/tsc');
const entry = join(artifact, 'dist/bundler/index.js');
const pkg = JSON.parse(await readFile(join(artifact, 'package.json'), 'utf8'));
assert.equal(pkg.version, '0.57.0');
const article = await readFile(resolve(here, '../../../../posts/029-openclaw-chose-solid-why-id-choose-nisli.md'), 'utf8');
const blocks = [...article.matchAll(/```ts\n([\s\S]*?)\n```/g)].map(match => match[1]);
const reply = blocks.find(code => code.includes("'demo-reply'"));
const preview = blocks.find(code => code.includes("'demo-session-preview'"));
assert.ok(reply && preview, 'Article examples missing');
const app = await mkdtemp(join(tmpdir(), 'nisli-article-examples-'));
await writeFile(join(app, 'reply.ts'), reply + '\nexport { reply, view };\n');
await writeFile(join(app, 'preview.ts'), preview + '\nexport { selected, view };\n');
await copyFile(join(here, 'checks.ts'), join(app, 'checks.ts'));
await writeFile(join(app, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true,
    noEmit: true, skipLibCheck: true, lib: ['ES2022', 'DOM'],
    paths: { '@nisli/core': [join(artifact, 'dist/types/index.d.ts')] },
  }, include: ['*.ts'],
}));
execFileSync(process.execPath, [compiler, '-p', join(app, 'tsconfig.json')], { stdio: 'inherit' });
const bundle = await build({
  entryPoints: [join(app, 'checks.ts')], bundle: true, write: false,
  format: 'iife', globalName: 'ArticleExamples', platform: 'browser',
  alias: { '@nisli/core': entry }, define: { 'process.env.NODE_ENV': '"production"' },
});
const report = {
  checkedAt: new Date().toISOString(), version: pkg.version,
  method: 'Exact article examples; strict typecheck and deterministic browser assertions; fetch stub deliberately ignores abort; no timing claim',
  entrySha256: createHash('sha256').update(await readFile(entry)).digest('hex'),
  exampleSha256: { reply: createHash('sha256').update(reply).digest('hex'), preview: createHash('sha256').update(preview).digest('hex') },
  browsers: [],
};
for (const [engine, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><body></body>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const result = await page.evaluate(() => globalThis.ArticleExamples.run());
    report.browsers.push({ engine, version: browser.version(), result });
    console.log(engine, 'passed');
  } finally { await browser.close(); }
}
await writeFile(join(here, 'results.json'), JSON.stringify(report, null, 2) + '\n');
