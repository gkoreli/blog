// Real kernel + process bridge, retained upstream memory store, owned file side effects.
// This interrupts/reopens a drive; it does not kill a process or exercise disk recovery.
import assert from 'node:assert/strict';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkout, fixture, output] = process.argv.slice(2).map(value => resolve(value));
assert(checkout && fixture && output);
await mkdir(fixture);
const moduleAt = path => import(pathToFileURL(join(checkout, 'packages/run-adapters/dist', path)));
const { openDrive } = await moduleAt('kernel/drive.js');
const { toolBridge } = await moduleAt('process/tools.js');
const { memorySessionStore } = await moduleAt('testing.js');
const results = [];

for (const [name, replay, interrupted] of [
  ['interrupted-never', 'never', true],
  ['interrupted-safe', 'safe', true],
  ['completed-never', 'never', false],
]) {
  const store = memorySessionStore();
  const journal = join(fixture, `${name}.txt`);
  const controller = new AbortController();
  let notifyStarted;
  const started = new Promise(resolveStarted => { notifyStarted = resolveStarted; });
  let calls = 0;
  const tool = {
    name: 'fixture_append', description: 'Append only to the owned synthetic journal.',
    inputSchema: { type: 'object' }, replay,
    async execute(_input, io) {
      calls++;
      await appendFile(journal, `invocation-${calls}\n`);
      notifyStarted();
      if (interrupted && calls === 1) {
        await new Promise((_, reject) => {
          if (io.signal.aborted) return reject(io.signal.reason);
          io.signal.addEventListener('abort', () => reject(io.signal.reason), { once: true });
        });
      }
      return `fixture-result-${calls}`;
    },
  };
  const first = await openDrive({ writer: await store.open(name), signal: controller.signal });
  const firstCall = toolBridge(first, [tool], { live: false }).call(tool.name, {}, 'stable-call');
  // Attach rejection handling before deliberately interrupting the callback.
  const firstOutcome = firstCall.then(value => ({ result: value }), error => ({ error: error.message }));
  await Promise.race([started, new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('Side effect did not start')), 5000); timer.unref();
  })]);
  assert.equal((await readFile(journal, 'utf8')).trim(), 'invocation-1');
  if (interrupted) controller.abort(new Error('authored drive interruption'));
  const before = await firstOutcome;
  const beforeEffect = first.state().effects.get('tool:stable-call');
  assert.equal(beforeEffect.status, interrupted ? 'running' : 'completed');
  const second = await openDrive({ writer: await store.open(name), signal: new AbortController().signal });
  const afterReopen = second.state().effects.get('tool:stable-call');
  const reopenedStatus = afterReopen.status;
  const again = await toolBridge(second, [tool], { live: false }).call(tool.name, {}, 'stable-call');
  const lines = (await readFile(journal, 'utf8')).trim().split('\n');
  const expectedCalls = interrupted && replay === 'safe' ? 2 : 1;
  assert.equal(calls, expectedCalls);
  assert.equal(lines.length, expectedCalls);
  if (interrupted && replay === 'never') {
    assert.equal(reopenedStatus, 'failed');
    assert.equal(again.isError, true);
    assert.equal(again.interrupted, true);
  } else {
    assert.equal(again.isError, false);
    assert.equal(again.text, `fixture-result-${expectedCalls}`);
    assert.equal(reopenedStatus, interrupted ? 'pending' : 'completed');
  }
  results.push({ case: name, replay, interruptionAfterSideEffect: interrupted,
    beforeReopenStatus: beforeEffect.status, afterReopenStatus: reopenedStatus,
    firstReturnedError: 'error' in before, callbackInvocations: calls,
    independentlyReadJournalLines: lines, resumedResult: again,
    finalStatus: second.state().effects.get('tool:stable-call').status,
    recordKinds: (await store.read(name)).map(row => row.kind) });
}

const receipt = { sourceCommit: 'b98a6c025b9795ec452431114a18a66c6160ef7d',
  node: process.version, platform: process.platform, architecture: process.arch,
  store: 'upstream memorySessionStore retained across drive reopen', results,
  processKilled: false, diskStoreRecoveryTested: false, modelServiceCalls: 0,
  actualExternalServiceSideEffects: false, userConfigurationChanged: false,
  scope: 'Three authored real-kernel/process-bridge controls with local journal side effects; no full service, disk durability, real CLI/model or exactly-once guarantee.' };
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(results.map(({ case: name, callbackInvocations, afterReopenStatus }) =>
  ({ case: name, callbackInvocations, afterReopenStatus }))));
