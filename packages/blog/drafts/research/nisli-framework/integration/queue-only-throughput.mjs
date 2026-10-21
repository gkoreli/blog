/** Bounded queue-only DOM throughput check; uses an isolated Nisli dependency runtime. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = process.env.NISLI_CORE_WORKTREE;
assert.ok(root, 'Set NISLI_CORE_WORKTREE to a frozen-installed Nisli worktree');
const require = createRequire(join(root, 'package.json'));
const { build } = require(require.resolve('esbuild', { paths: [join(root, 'node_modules/.pnpm/node_modules')] }));
const { chromium, firefox, webkit } = require('playwright');
const baseline = '4fa636031a3dc0796fb2172e1bada15391299d1d';
const snapshot = await mkdtemp(join(tmpdir(), 'nisli-queue-throughput-'));
execFileSync('tar', ['-x', '-C', snapshot], { input: execFileSync('git', ['archive', baseline, 'packages/core/src'], { cwd: root }) });
const bundles = {};
for (const [name, source] of [['baseline', snapshot], ['queueOnly', root]]) {
  const result = await build({
    stdin: { contents: `import { signal, effect } from ${JSON.stringify(join(source, 'packages/core/src/signal.ts'))}; globalThis.__queueApi = { signal, effect };`, resolveDir: source },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  bundles[name] = result.outputFiles[0].text;
}
const report = {
  baseline, candidate: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim(),
  candidateSignalSha256: createHash('sha256').update(await readFile(join(root, 'packages/core/src/signal.ts'))).digest('hex'),
  node: process.version, platform: process.platform, arch: process.arch,
  method: { writes: 10000, warmups: 3, rounds: 7, effectsPerWrite: [1, 8], sharedMicrotaskTurns: 6, order: 'alternating baseline/candidate by round', production: true, headed: false, measures: 'DOM text writes and microtask throughput; no layout, paint, input or whole-application result' },
  browsers: [],
};
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
for (const [engine, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  const pages = {};
  try {
    for (const name of ['baseline', 'queueOnly']) {
      pages[name] = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      await pages[name].setContent('<!doctype html><body></body>');
      await pages[name].addScriptTag({ content: bundles[name] });
    }
    const measure = (name, effects) => pages[name].evaluate(async count => {
      const { signal, effect } = globalThis.__queueApi;
      const source = signal(0);
      const host = document.createElement('div');
      const cells = Array.from({ length: count }, () => document.createElement('output'));
      host.append(...cells); document.body.append(host);
      const runs = Array(count).fill(0);
      const stops = cells.map((cell, i) => effect(() => { cell.textContent = String(source.value); runs[i]++; }));
      await new Promise(resolve => setTimeout(resolve, 0));
      const start = performance.now();
      for (let i = 1; i <= 10000; i++) {
        source.value = i;
        for (let turn = 0; turn < 6; turn++) await Promise.resolve();
        if (cells[0].textContent !== String(i) || cells[count - 1].textContent !== String(i)) throw new Error('stale DOM');
      }
      const elapsed = performance.now() - start;
      if (!runs.every(n => n === 10001) || cells.some(cell => cell.parentNode !== host)) throw new Error('effect count or host identity changed');
      stops.forEach(stop => stop()); host.remove();
      return { elapsed, visibility: document.visibilityState };
    }, effects);
    const cases = [];
    for (const effects of [1, 8]) {
      const samples = { baseline: [], queueOnly: [] };
      const visibility = new Set();
      for (let warmup = 0; warmup < 3; warmup++) for (const name of ['baseline', 'queueOnly']) await measure(name, effects);
      for (let round = 0; round < 7; round++) {
        for (const name of round % 2 ? ['queueOnly', 'baseline'] : ['baseline', 'queueOnly']) {
          const result = await measure(name, effects);
          samples[name].push(result.elapsed); visibility.add(result.visibility);
        }
      }
      const result = { effects, samples, medianBaselineMs: median(samples.baseline), medianQueueOnlyMs: median(samples.queueOnly), visibility: [...visibility] };
      cases.push(result); console.log(engine, JSON.stringify(result));
    }
    report.browsers.push({ engine, version: browser.version(), cases });
  } finally { await browser.close(); }
}
report.checkedAt = new Date().toISOString();
await writeFile(join(dirname(fileURLToPath(import.meta.url)), 'queue-only-throughput-results.json'), JSON.stringify(report, null, 2) + '\n');
