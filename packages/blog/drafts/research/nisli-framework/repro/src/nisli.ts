import { component, computed, effect, html, onCleanup, resource, signal, type Signal } from '@nisli/core';
import { check, deferred, drain, requireElement, until, type Adapter, type Counts } from './shared';

interface Model { cells: Signal<number>[]; counts: Counts; instrument: boolean }
const Panel = component<{ model: Model }>('comparison-nisli-panel', props => {
  const model = props.model.value;
  model.counts.setups++;
  return html`<section>${model.cells.map((cell, index) => {
    const value = model.instrument ? computed(() => { model.counts.reads++; return cell.value; }) : cell;
    return html`<div class="row"><span>row ${index}</span><output data-cell=${index}>${value}</output></div>`;
  })}</section>`;
});

export const nisli: Adapter = {
  name: 'Nisli: direct signals',
  async mount(host, size, instrument) {
    const counts = { reads: 0, setups: 0 };
    const model = { cells: Array.from({ length: size }, () => signal(0)), counts, instrument };
    const template = html`${Panel({ model })}`;
    template.mount(host); await drain();
    return {
      counts,
      set(index, value) {
        const cell = model.cells[index];
        if (!cell) throw new Error('Unknown cell');
        cell.value = value;
      },
      async dispose() { host.replaceChildren(); await drain(); template.dispose(); },
    };
  },
};

export async function nisliRace(host: HTMLElement) {
  const requests = new Map<string, ReturnType<typeof deferred<string>>>();
  const aborts = new Map<string, AbortSignal>();
  for (const key of ['A', 'B', 'C']) requests.set(key, deferred<string>());
  const key = signal('A');
  const Race = component(`comparison-nisli-race-${Math.random().toString(36).slice(2)}`, () => {
    const result = resource(() => key.value, (value, abortSignal) => {
      aborts.set(value, abortSignal);
      const pending = requests.get(value);
      if (!pending) throw new Error('Missing request');
      return pending.promise; // Deliberately ignores cancellation.
    });
    return html`<output>${result.data}</output>`;
  });
  const template = html`${Race({})}`; template.mount(host);
  await until(() => aborts.has('A'), 'Nisli A');
  key.value = 'B'; await until(() => aborts.has('B'), 'Nisli B');
  requests.get('B')?.resolve('B'); await until(() => host.textContent === 'B', 'Nisli B result');
  requests.get('A')?.resolve('A'); await drain();
  check(host.textContent === 'B', 'Nisli stale result replaced B');
  key.value = 'C'; await until(() => aborts.has('C'), 'Nisli C');
  host.replaceChildren(); await drain(); template.dispose();
  return {
    staleResultSuppressed: true,
    supersededRequestAborted: aborts.get('A')?.aborted,
    pendingRequestAbortedOnDisconnect: aborts.get('C')?.aborted,
  };
}

export async function nisliLifetimes(host: HTMLElement) {
  let setups = 0; let cleanups = 0; let effectRuns = 0;
  const value = signal(0);
  const tag = `comparison-lifetime-${Math.random().toString(36).slice(2)}`;
  component(tag, () => {
    setups++; effect(() => { value.value; effectRuns++; });
    onCleanup(() => { cleanups++; });
    return html`<input value="hello"><output>${value}</output>`;
  });
  const element = document.createElement(tag);
  const before = document.createElement('div');
  const after = document.createElement('div');
  host.append(before, element, after); await drain();
  const input = requireElement(element.querySelector('input'));
  input.focus(); input.setSelectionRange(1, 3);
  host.insertBefore(element, before); await drain();
  const fallback = {
    setups, cleanups, sameInput: input === element.querySelector('input'),
    focused: document.activeElement === input,
    selectionStart: input.selectionStart, selectionEnd: input.selectionEnd,
  };
  check(setups === 1 && cleanups === 0 && fallback.sameInput, 'Nisli move reset its scope');
  let nativeMove: { supported: boolean; focused?: boolean; sameInput?: boolean; setups?: number; cleanups?: number } = { supported: false };
  if ('moveBefore' in host && typeof host.moveBefore === 'function') {
    input.focus(); input.setSelectionRange(1, 3);
    host.moveBefore(element, null); await drain();
    nativeMove = { supported: true, focused: document.activeElement === input, sameInput: input === element.querySelector('input'), setups, cleanups };
    check(nativeMove.focused === true && setups === 1 && cleanups === 0, 'Native move did not preserve scope/focus');
  }
  element.hidden = true; value.value = 1; await drain();
  const hidden = { effectRuns, text: element.querySelector('output')?.textContent };
  check(hidden.text === '1', 'Hidden pane fixture did not prove retained work');
  element.remove(); await drain();
  const afterRemoval = effectRuns;
  value.value = 2; await drain();
  check(cleanups === 1 && effectRuns === afterRemoval, 'Removal did not dispose effect');
  return { fallbackMove: fallback, nativeMove, hiddenStillUpdates: true, removalCleanupCount: cleanups, noEffectAfterRemoval: true };
}

export async function nisliConsistency(host: HTMLElement) {
  const key = signal('A');
  const requests = new Map<string, ReturnType<typeof deferred<string>>>();
  for (const value of ['fast:A', 'slow:A', 'fast:B', 'slow:B']) requests.set(value, deferred<string>());
  const load = (name: string, value: string) => {
    const pending = requests.get(`${name}:${value}`);
    if (!pending) throw new Error('Missing request');
    return pending.promise;
  };
  const View = component(`comparison-nisli-coherence-${Math.random().toString(36).slice(2)}`, () => {
    const fast = resource(() => key.value, value => load('fast', value));
    const slow = resource(() => key.value, value => load('slow', value));
    return html`<output data-selected>${key}</output><output data-fast>${fast.data}</output><output data-slow>${slow.data}</output>`;
  });
  const template = html`${View({})}`; template.mount(host); await drain();
  requests.get('fast:A')?.resolve('fast A'); requests.get('slow:A')?.resolve('slow A');
  await until(() => host.textContent === 'Afast Aslow A', 'Nisli initial coherence');
  key.value = 'B'; await drain(); requests.get('fast:B')?.resolve('fast B');
  await until(() => host.querySelector('[data-fast]')?.textContent === 'fast B', 'Nisli fast B');
  const halfway = {
    selected: host.querySelector('[data-selected]')?.textContent,
    fast: host.querySelector('[data-fast]')?.textContent,
    slow: host.querySelector('[data-slow]')?.textContent,
  };
  requests.get('slow:B')?.resolve('slow B'); await until(() => host.textContent === 'Bfast Bslow B', 'Nisli final coherence');
  host.replaceChildren(); await drain(); template.dispose();
  return halfway;
}
