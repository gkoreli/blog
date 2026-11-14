// Exercise the unchanged recording-priority queue with an authored abort-aware job.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const [queueFile, output] = process.argv.slice(2).map(value => resolve(value));
assert(queueFile && output);
const { createQueue, isSmallMac } = await import(pathToFileURL(queueFile));
assert.equal(isSmallMac(24 * 2 ** 30), true);
assert.equal(isSmallMac(32 * 2 ** 30), false);
let recording = true;
let attempts = 0;
let unloadRequests = 0;
let began;
let stopped;
const started = new Promise(yes => { began = yes; });
const aborted = new Promise(yes => { stopped = yes; });
const events = [];
const queue = createQueue({ recording: () => recording, smallMac: true,
  idleMs: 1, onIdle: () => { unloadRequests++; events.push('unload-requested'); } });
const done = queue.enqueue(async signal => {
  const attempt = ++attempts;
  events.push(`started-${attempt}`);
  if (attempt === 1) {
    began();
    await new Promise((_, reject) => signal.addEventListener('abort', () => {
      events.push('aborted-1'); stopped(); reject(new Error('synthetic job interrupted'));
    }, { once: true }));
  }
  events.push(`completed-${attempt}`);
}, 'enhance', 'synthetic-meeting');
await Promise.resolve();
assert.equal(attempts, 0);
const whileFirstRecording = attempts;
recording = false; queue.recordingChanged();
await started;
recording = true; queue.recordingChanged();
await aborted;
// Let the interrupted job's catch/finally return it to the queue.
await new Promise(yes => setImmediate(yes));
assert.equal(attempts, 1);
assert.equal(unloadRequests, 1);
const whileSecondRecording = attempts;
const unloadRequestedAtInterruption = unloadRequests;
recording = false; queue.recordingChanged();
await done;
assert.equal(attempts, 2);
assert.deepEqual(events.slice(0, 3).sort(), ['aborted-1', 'started-1', 'unload-requested'].sort());
assert(events.includes('completed-2'));
await writeFile(output, JSON.stringify({
  sourceCommit: 'ada44ea930d34b11742e2febc5b4f129261124cb', node: process.version,
  input: { smallMac: true, actualRecording: false, job: 'authored abort-aware enhancement stand-in' },
  thresholds: { GiB24IsSmall: true, GiB32IsSmall: false },
  whileFirstRecording, whileSecondRecording, attemptsAfterBothStop: attempts,
  unloadRequestedAtInterruption, events: [...events],
  modelServiceCalls: 0, microphoneUsed: false, actualMemoryMeasured: false,
  actualModelUnloaded: false, scope: 'Queue scheduling and callback requests only; no full application, audio, model quality or memory/throughput measurement.',
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ whileFirstRecording, whileSecondRecording, attemptsAfterBothStop: attempts, unloadRequestedAtInterruption }));
