import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliProvider } from './cli-provider.ts';
import { object, parseJson, sha256 } from '../capture/capture-provider.ts';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: node run.ts <new-private-capture-directory>');
const directory = resolve(destination);
await mkdir(directory, { recursive: true });
const prompt = (await readFile(new URL('prompt.txt', import.meta.url), 'utf8')).trimEnd();
const packageInfo = parseJson(await readFile(new URL('../../package.json', import.meta.resolve('promptfoo')), 'utf8'));
assert.ok(object(packageInfo) && packageInfo.version === '0.122.2', 'This experiment is pinned to Promptfoo 0.122.2');
// Exclude Promptfoo network activity, while the official CLI subprocess uses its
// normal supported connection. This is a fetch guard, not OS network isolation.
Object.assign(process.env, { PROMPTFOO_DISABLE_TELEMETRY: '1', PROMPTFOO_DISABLE_UPDATE: '1',
  PROMPTFOO_CONFIG_DIR: join(directory, 'config'), PROMPTFOO_CACHE_PATH: join(directory, 'cache'),
  PROMPTFOO_CACHE_TYPE: 'disk', LOG_LEVEL: 'error' });
const sourceUrl = 'https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript';
const source = await fetch(sourceUrl, { headers: { 'user-agent': 'gkoreli-publication-check/1.0' } });
const sourceBytes = await source.text();
await writeFile(join(directory, 'source.html'), sourceBytes, { flag: 'wx' });
await writeFile(join(directory, 'source.json'), JSON.stringify({ url: sourceUrl, finalUrl: source.url,
  capturedAt: new Date().toISOString(), status: source.status, representation: 'UTF-8 HTML',
  sha256: sha256(sourceBytes), suppliedToModel: false }, null, 2) + '\n', { flag: 'wx' });
if (!source.ok) throw new Error('Reviewer source snapshot failed before any model submission');
const blockedFetches: string[] = [];
globalThis.fetch = async input => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  blockedFetches.push(url.origin + url.pathname);
  throw new Error('Promptfoo network disabled; model access is through the official CLI subprocess');
};
const { evaluate, cache } = await import('promptfoo');
const observations: Record<string, unknown>[] = [];
try {
  for (const client of ['codex', 'claude'] as const) {
    const evaluation = await evaluate({
      prompts: [() => prompt], providers: [cliProvider(client, directory)], tests: [{ metadata: { case: 'directed-source-support' } }],
      writeLatestResults: true, sharing: false, author: 'OSS Radar subscription CLI experiment',
      outputPath: join(directory, `${client}-library-export.json`),
    }, { cache: false, maxConcurrency: 1 });
    const summary = await evaluation.toEvaluateSummary();
    await writeFile(join(directory, `${client}-summary.json`), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
    const first = summary.results[0];
    assert.ok(first?.response);
    const cli = fileURLToPath(new URL('entrypoint.js', import.meta.resolve('promptfoo')));
    execFileSync(process.execPath, ['--import', fileURLToPath(new URL('../capture/offline-cli.ts', import.meta.url)),
      cli, 'export', 'eval', evaluation.id, '--output', join(directory, `${client}-cli-export.json`)],
    { env: process.env, timeout: 30_000, stdio: 'pipe' });
    for (const kind of ['library', 'cli']) {
      const saved = parseJson(await readFile(join(directory, `${client}-${kind}-export.json`), 'utf8'));
      assert.ok(object(saved) && object(saved.results) && Array.isArray(saved.results.results));
      const savedResult: unknown = saved.results.results[0];
      assert.ok(object(savedResult) && object(savedResult.response));
      assert.deepEqual(savedResult.response, first.response);
      assert.equal(saved.evalId, evaluation.id);
    }
    const evidence = parseJson(await readFile(join(directory, client, 'evidence.json'), 'utf8'));
    assert.ok(object(evidence));
    assert.equal(first.response.raw, await readFile(join(directory, client, 'stdout.jsonl'), 'utf8'));
    observations.push({ client, evaluationId: evaluation.id, outcome: evidence.outcome,
      summaryLibraryAndRestartedCliEqual: true, rawStdoutPreserved: true, sourceSupportScored: false });
    await writeFile(join(directory, 'result.json'), JSON.stringify({ promptfooVersion: '0.122.2',
      promptSha256: sha256(prompt), observations, blockedFetches, measuredAt: new Date().toISOString(),
      limits: ['CLI invocations can contain multiple model/tool requests.', 'No assertion here scores source support; review is separate.',
        'No raw model-service HTTP response or remote retrieval trace captured.', 'Two directed cases do not estimate organic discovery or population accuracy.'],
    }, null, 2) + '\n');
  }
  process.stdout.write(JSON.stringify({ directory, observations }, null, 2) + '\n');
} finally { await cache.getCache().disconnect(); }
