// Source-run diagnostic of the real registered action and timeout contract.
import path from 'node:path';
const lab = process.argv[2];
if (!lab) throw new Error('Pass the lab directory');
const realSet = globalThis.setTimeout;
const realClear = globalThis.clearTimeout;
const active = new Map<unknown, number>();
Object.defineProperty(globalThis, 'setTimeout', { value(callback: unknown, delay: number, ...args: unknown[]) {
  if (typeof callback !== 'function') throw new Error('Unexpected timer callback');
  let handle: unknown;
  const wrapped = (...values: unknown[]) => { active.delete(handle); return Reflect.apply(callback, globalThis, values); };
  handle = Reflect.apply(realSet, globalThis, [wrapped, delay, ...args]);
  if (delay === 300_000 || delay === 100) active.set(handle, delay);
  return handle;
} });
Object.defineProperty(globalThis, 'clearTimeout', { value(handle: unknown) { active.delete(handle); return Reflect.apply(realClear, globalThis, [handle]); } });
const pending = (delay: number) => [...active.values()].filter(value => value === delay).length;
const { api } = await import(path.join(lab, 'keryx/example/backend/index.ts'));
await api.start();
const action = api.actions.actions.find((candidate: { name: string }) => candidate.name === 'greeting:prompt');
if (!action) throw new Error('Actual greeting action missing');
const originalRun = action.run;
const originalTimeout = action.timeout;
const port = process.env.WEB_SERVER_PORT;
const url = `http://127.0.0.1:${port}/api/greeting/prompt?name=Goga`;
let cookie = '';
const get = async () => {
  const response = await fetch(url, { headers: cookie ? { Cookie: cookie } : {} });
  cookie ||= response.headers.get('set-cookie')?.split(';')[0] ?? '';
  return { status: response.status, value: await response.json() };
};
try {
  const before = pending(300_000);
  for (let n = 0; n < 20; n++) {
    const result = await get();
    if (result.status !== 200 || result.value.messages[0].content.text !== 'Hello, Goga! How can I help you today?') throw new Error('Greeting failed');
  }
  const defaultTimersAfter20Successes = pending(300_000) - before;
  action.timeout = 100;
  action.run = async () => ({ ok: true });
  const fast = await get();
  if (fast.status !== 200 || fast.value.ok !== true) throw new Error('Fast action failed');
  const fastTimers = pending(100);
  let aborted = false;
  action.run = async (_params: unknown, _connection: unknown, signal: AbortSignal) => {
    signal.addEventListener('abort', () => { aborted = true; }, { once: true });
    await new Promise(resolve => realSet(resolve, 200));
    return { tooLate: true };
  };
  const slow = await get();
  if (slow.status !== 408 || slow.value.error.type !== 'CONNECTION_ACTION_TIMEOUT' || !aborted) throw new Error('Deadline/abort contract failed');
  action.run = async () => { throw new Error('expected timer-contract failure'); };
  const thrown = await get();
  if (thrown.status !== 500 || !thrown.value.error) throw new Error('Thrown action contract failed');
  const thrownTimers = pending(100);
  console.log(JSON.stringify({ defaultTimersAfter20Successes, fastTimers, fastStatus: fast.status, slowStatus: slow.status, abortObserved: aborted, thrownStatus: thrown.status, thrownTimers }));
} finally {
  action.run = originalRun;
  action.timeout = originalTimeout;
  await api.stop();
}
process.exit(0);
