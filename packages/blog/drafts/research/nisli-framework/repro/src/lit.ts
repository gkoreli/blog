import { LitElement, html, render, nothing } from 'lit';
import { Task } from '@lit/task';
import { SignalWatcher, signal, watch } from '@lit-labs/signals';
import { check, deferred, drain, requireElement, until, type Adapter, type Counts } from './shared';

class WidePanel extends LitElement {
  values: number[] = [];
  counts: Counts = { reads: 0, setups: 0 };
  instrument = false;
  protected createRenderRoot() { return this; }
  protected render() {
    return html`<section>${this.values.map((value, index) => {
      if (this.instrument) this.counts.reads++;
      return html`<div class="row"><span>row ${index}</span><output data-cell=${index}>${value}</output></div>`;
    })}</section>`;
  }
}
customElements.define('comparison-lit-wide', WidePanel);

class SignalPanel extends SignalWatcher(LitElement) {
  cells = Array.from({ length: 0 }, () => signal(0));
  protected createRenderRoot() { return this; }
  protected render() {
    return html`<section>${this.cells.map((cell, index) => html`<div class="row"><span>row ${index}</span><output data-cell=${index}>${watch(cell)}</output></div>`)}</section>`;
  }
}
customElements.define('comparison-lit-signals', SignalPanel);

class NarrowRow extends LitElement {
  static properties = { value: { state: true } };
  declare value: number;
  counts: Counts = { reads: 0, setups: 0 };
  instrument = false;
  index = 0;
  constructor() { super(); this.value = 0; }
  protected createRenderRoot() { return this; }
  protected render() {
    if (this.instrument) this.counts.reads++;
    return html`<div class="row"><span>row ${this.index}</span><output data-cell=${this.index}>${this.value}</output></div>`;
  }
}
customElements.define('comparison-lit-row', NarrowRow);

export const litWide: Adapter = {
  name: 'Lit: one component',
  async mount(host, size, instrument) {
    const element = new WidePanel();
    element.values = Array.from({ length: size }, () => 0);
    element.instrument = instrument;
    host.append(element);
    await drain();
    return {
      counts: element.counts,
      set(index, value) { element.values[index] = value; element.requestUpdate(); },
      async dispose() { element.remove(); await drain(); },
    };
  },
};

export const litSignals: Adapter = {
  name: 'Lit: pinpoint signals',
  async mount(host, size, instrument) {
    const element = new SignalPanel();
    const counts = { reads: 0, setups: 1 };
    element.cells = Array.from({ length: size }, () => signal(0));
    // watch() reads the signal internally; its host-render count is not an
    // expression-read count. Probe DOM mutation counts in the common harness.
    host.append(element);
    await drain();
    return {
      counts,
      set(index, value) {
        const cell = element.cells[index];
        if (!cell) throw new Error('Unknown cell');
        cell.set(value);
        if (instrument) counts.reads++; // writes, explicitly NOT template reads
      },
      async dispose() { element.remove(); await drain(); },
    };
  },
};

export const litNarrow: Adapter = {
  name: 'Lit: component per row',
  async mount(host, size, instrument) {
    const counts = { reads: 0, setups: size };
    const rows = Array.from({ length: size }, (_, index) => {
      const row = new NarrowRow();
      row.index = index; row.counts = counts; row.instrument = instrument;
      return row;
    });
    render(html`<section>${rows}</section>`, host);
    await drain();
    return {
      counts,
      set(index, value) {
        const row = rows[index];
        if (!row) throw new Error('Unknown cell');
        row.value = value;
      },
      async dispose() { render(nothing, host); await drain(); },
    };
  },
};

export async function litRace(host: HTMLElement) {
  const requests = new Map<string, ReturnType<typeof deferred<string>>>();
  const aborts = new Map<string, AbortSignal>();
  const request = (key: string) => {
    const result = deferred<string>(); requests.set(key, result); return result;
  };
  for (const key of ['A', 'B', 'C']) request(key);
  class RacePanel extends LitElement {
    static properties = { key: { state: true } };
    declare key: string;
    constructor() { super(); this.key = 'A'; }
    task = new Task(this, {
      args: () => [this.key] as const,
      task: ([key], { signal: abortSignal }) => {
        aborts.set(key, abortSignal);
        const result = requests.get(key);
        if (!result) throw new Error('Missing request');
        return result.promise; // Deliberately ignores cancellation.
      },
    });
    protected createRenderRoot() { return this; }
    protected render() { return html`<output>${this.task.value ?? 'pending'}</output>`; }
  }
  const tag = `comparison-lit-race-${Math.random().toString(36).slice(2)}`;
  customElements.define(tag, RacePanel);
  const element = new RacePanel(); host.append(element);
  await until(() => aborts.has('A'), 'Lit request A');
  element.key = 'B';
  await until(() => aborts.has('B'), 'Lit request B');
  requests.get('B')?.resolve('B');
  await until(() => host.textContent === 'B', 'Lit B result');
  requests.get('A')?.resolve('A'); await drain();
  check(host.textContent === 'B', 'Lit stale result replaced B');
  element.key = 'C'; await until(() => aborts.has('C'), 'Lit request C');
  element.remove(); await drain();
  return {
    staleResultSuppressed: true,
    supersededRequestAborted: aborts.get('A')?.aborted,
    pendingRequestAbortedOnDisconnect: aborts.get('C')?.aborted,
  };
}
