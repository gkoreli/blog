import { createMemo, createSignal, Loading, onCleanup, type Accessor, type Setter } from 'solid-js';
import { render } from '@solidjs/web';
import { check, deferred, drain, until, type Adapter, type Counts } from './shared';

function Panel(props: { cells: Accessor<number>[]; counts: Counts; instrument: boolean }) {
  props.counts.setups++;
  const read = (cell: Accessor<number>) => {
    if (props.instrument) props.counts.reads++;
    return cell();
  };
  return <section>{props.cells.map((cell, index) =>
    <div class="row"><span>row {index}</span><output data-cell={index}>{read(cell)}</output></div>
  )}</section>;
}

export const solid: Adapter = {
  name: 'Solid 2: compiled signals',
  async mount(host, size, instrument) {
    const counts = { reads: 0, setups: 0 };
    const cells: Accessor<number>[] = [];
    const setters: Setter<number>[] = [];
    const dispose = render(() => {
      for (let i = 0; i < size; i++) {
        const [value, set] = createSignal(0);
        cells.push(value); setters.push(set);
      }
      return <Panel cells={cells} counts={counts} instrument={instrument} />;
    }, host);
    await drain();
    return {
      counts,
      set(index, value) {
        const set = setters[index];
        if (!set) throw new Error('Unknown cell');
        set(value);
      },
      async dispose() { dispose(); await drain(); },
    };
  },
};

export async function solidRace(host: HTMLElement) {
  const requests = new Map<string, ReturnType<typeof deferred<string>>>();
  for (const key of ['A', 'B', 'C']) requests.set(key, deferred<string>());
  const started: string[] = [];
  let setKey: Setter<string> = () => { throw new Error('Solid not mounted'); };
  let cleanups = 0;
  const dispose = render(() => {
    const [key, set] = createSignal('A'); setKey = set;
    onCleanup(() => { cleanups++; });
    const data = createMemo(() => {
      const value = key(); started.push(value);
      const request = requests.get(value);
      if (!request) throw new Error('Missing request');
      return request.promise;
    });
    return <Loading fallback={<output>pending</output>}><output>{data()}</output></Loading>;
  }, host);
  await until(() => started.includes('A'), 'Solid A');
  setKey('B'); await until(() => started.includes('B'), 'Solid B');
  requests.get('B')?.resolve('B'); await until(() => host.textContent === 'B', 'Solid B result');
  requests.get('A')?.resolve('A'); await drain();
  check(host.textContent === 'B', 'Solid stale result replaced B');
  setKey('C'); await until(() => started.includes('C'), 'Solid C');
  dispose(); await drain();
  return { staleResultSuppressed: true, abortSignalProvidedByAsyncMemo: false, ownerCleanupCount: cleanups };
}

export async function solidConsistency(host: HTMLElement) {
  const requests = new Map<string, ReturnType<typeof deferred<string>>>();
  for (const value of ['fast:A', 'slow:A', 'fast:B', 'slow:B']) requests.set(value, deferred<string>());
  const started = new Set<string>();
  let setKey: Setter<string> = () => { throw new Error('Solid not mounted'); };
  const load = (name: string, key: string) => {
    started.add(`${name}:${key}`);
    const request = requests.get(`${name}:${key}`);
    if (!request) throw new Error('Missing request');
    return request.promise;
  };
  const dispose = render(() => {
    const [key, set] = createSignal('A'); setKey = set;
    const fast = createMemo(() => load('fast', key()));
    const slow = createMemo(() => load('slow', key()));
    return <div><output data-selected>{key()}</output><Loading fallback={<span>pending</span>}>
      <output data-fast>{fast()}</output><output data-slow>{slow()}</output>
    </Loading></div>;
  }, host);
  await until(() => started.has('slow:A'), 'Solid initial requests');
  requests.get('fast:A')?.resolve('fast A'); requests.get('slow:A')?.resolve('slow A');
  await until(() => host.querySelector('[data-slow]')?.textContent === 'slow A', 'Solid initial coherence');
  setKey('B'); await until(() => started.has('slow:B'), 'Solid B requests');
  requests.get('fast:B')?.resolve('fast B'); await drain();
  // A task turn allows promise processing, not just initial microtask queuing.
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  const halfway = {
    selected: host.querySelector('[data-selected]')?.textContent,
    fast: host.querySelector('[data-fast]')?.textContent,
    slow: host.querySelector('[data-slow]')?.textContent,
  };
  requests.get('slow:B')?.resolve('slow B');
  await until(() => host.querySelector('[data-slow]')?.textContent === 'slow B', 'Solid final coherence');
  dispose(); await drain();
  return halfway;
}
