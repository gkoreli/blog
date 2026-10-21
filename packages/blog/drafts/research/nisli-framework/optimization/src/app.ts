import * as baseline from '@nisli/core-baseline';
import * as scheduler from '@nisli/core-scheduler';
import * as promise from '@nisli/core-promise';
import * as pathCache from '@nisli/core-path';
import * as candidate from '@nisli/core';
import { litNarrow } from '../../repro/src/lit';
import { nisliConsistency, nisliLifetimes, nisliRace } from '../../repro/src/nisli';
import { check, drain, requireElement, type Adapter } from '../../repro/src/shared';

declare const __NISLI_PERF__: Record<string, unknown>;
interface Template { __templateResult: true; mount(host: HTMLElement): void; dispose(): void }
interface Cell { value: number }
interface Core {
  signal(initial: number): Cell;
  html(strings: TemplateStringsArray, ...values: unknown[]): Template;
  component(tag: string, setup: () => Template): (props: Record<string, never>) => Template;
  effect(fn: () => void): () => void;
  flush(): void;
}
type Shape = 'original' | 'static-heavy' | 'binding-heavy';
const fixture = requireElement(document.querySelector<HTMLElement>('#fixture'));
const report = requireElement(document.querySelector<HTMLElement>('#report'));
const progress = requireElement(document.querySelector<HTMLElement>('#progress'));
const button = requireElement(document.querySelector<HTMLButtonElement>('#run'));
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function framework(core: Core, label: string) {
  let cells: Cell[] = [];
  let shape: Shape = 'original';
  let templateCreationMs = 0;
  const Panel = core.component(`optimization-${label}`, () => {
    const start = performance.now();
    const rows = cells.map((cell, index) => {
      if (shape === 'static-heavy') return core.html`<div class="row"><header><b>Static heading</b><small>Details</small></header><main><span><i>Fixed</i><strong>Content</strong></span><aside><em>Note</em><label>Label</label></aside><div><span>row ${index}</span><output data-cell=${index}>${cell}</output></div></main><footer><span>Footer</span><small>End</small></footer></div>`;
      if (shape === 'binding-heavy') return core.html`<div class="row" data-value=${cell} title="value-${cell}" class:active=${cell}><span>row ${index}</span><output data-cell=${index}>${cell}</output><small>${cell}</small><b>${cell}</b></div>`;
      return core.html`<div class="row"><span>row ${index}</span><output data-cell=${index}>${cell}</output></div>`;
    });
    const result = core.html`<section>${rows}</section>`;
    templateCreationMs = performance.now() - start;
    return result;
  });
  return {
    core, label,
    async mount(host: HTMLElement, size: number, nextShape: Shape) {
      shape = nextShape;
      const start = performance.now();
      cells = Array.from({ length: size }, () => core.signal(0));
      const signalsMs = performance.now() - start;
      const template = core.html`${Panel({})}`;
      template.mount(host); await drain();
      const mountMs = performance.now() - start;
      return {
        signalsMs, templateCreationMs, mountMs,
        remainderMs: mountMs - signalsMs - templateCreationMs,
        counts: { reads: 0, setups: 1 },
        set(index: number, value: number) {
          const cell = cells[index]; if (!cell) throw new Error('Unknown cell'); cell.value = value;
        },
        async dispose() { host.replaceChildren(); await drain(); template.dispose(); },
      };
    },
  };
}
const frameworks = [framework(baseline, 'baseline'), framework(scheduler, 'scheduler'), framework(promise, 'promise'), framework(pathCache, 'path-cache'), framework(candidate, 'candidate')];

async function sample(adapter: Adapter, updates: number) {
  const host = document.createElement('div'); fixture.append(host);
  const start = performance.now();
  const mounted = await adapter.mount(host, 1000, false);
  const mountMs = performance.now() - start;
  const target = requireElement(host.querySelector('output'));
  const updateStart = performance.now();
  for (let i = 1; i <= updates; i++) {
    mounted.set(0, i); await drain();
    check(target.textContent === String(i), `${adapter.name}: ${i}`);
  }
  const updateMs = performance.now() - updateStart;
  check(host.querySelectorAll('output').length === 1000, `${adapter.name}: row count`);
  check(target === host.querySelector('output'), `${adapter.name}: output identity`);
  await mounted.dispose(); host.remove();
  await yieldToBrowser(); // Outside both timed intervals.
  return { mountMs, updateMs };
}

async function run() {
  button.disabled = true;
  const result: {
    metadata: Record<string, unknown>;
    firstSeenMounts: Array<{ name: string; mountMs: number }>;
    updates: Array<{ name: string; mountMs: number[]; updateMs: number[] }>;
    mounts: Array<{ name: string; shape: Shape; signalsMs: number[]; templateCreationMs: number[]; remainderMs: number[]; mountMs: number[] }>;
    synchronous: Array<{ name: string; effectMs: number[]; templateMs: number[] }>;
    controls: number[];
    microtasks: Array<{ name: string; milliseconds: number[] }>;
    behavior: Record<string, unknown>;
  } = {
    metadata: { capturedAt: new Date().toISOString(), source: __NISLI_PERF__, userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, visibility: document.visibilityState, rows: 1000, updates: 10000, synchronousUpdates: 100000, warmups: 3, rounds: 15, method: 'Paired rotating order; six shared microtask turns per verified async write; synchronous probes use flush equally for all Nisli variants; no paint measurement' },
    firstSeenMounts: [], updates: [], mounts: [], synchronous: [], controls: [], microtasks: [], behavior: {},
  };
  try {
    const adapters: Adapter[] = frameworks.map(framework => ({ name: framework.label, mount: (host, size) => framework.mount(host, size, 'original') }));
    adapters.push(litNarrow);
    result.updates = adapters.map(adapter => ({ name: adapter.name, mountMs: [], updateMs: [] }));
    for (let round = -3; round < 15; round++) {
      for (let offset = 0; offset < adapters.length; offset++) {
        const index = (round + 3 + offset) % adapters.length;
        const adapter = adapters[index]; const summary = result.updates[index];
        if (!adapter || !summary) throw new Error('Missing update variant');
        progress.textContent = `Update round ${round + 1}: ${adapter.name}`;
        const value = await sample(adapter, 10000);
        if (round === -3) result.firstSeenMounts.push({ name: adapter.name, mountMs: value.mountMs });
        if (round >= 0) { summary.mountMs.push(value.mountMs); summary.updateMs.push(value.updateMs); }
      }
    }
    for (const shape of ['original', 'static-heavy', 'binding-heavy'] as const) {
      const summaries: typeof result.mounts = frameworks.map(framework => ({ name: framework.label, shape, signalsMs: [], templateCreationMs: [], remainderMs: [], mountMs: [] }));
      result.mounts.push(...summaries);
      for (let round = -3; round < 15; round++) {
        for (let offset = 0; offset < frameworks.length; offset++) {
          const index = (round + 3 + offset) % frameworks.length;
          const framework = frameworks[index]; const summary = summaries[index];
          if (!framework || !summary) throw new Error('Missing mount variant');
          progress.textContent = `Mount ${shape}, round ${round + 1}: ${framework.label}`;
          const host = document.createElement('div'); fixture.append(host);
          const value = await framework.mount(host, 1000, shape);
          check(host.querySelectorAll('output').length === 1000, 'Mount row count');
          if (round >= 0) for (const key of ['signalsMs', 'templateCreationMs', 'remainderMs', 'mountMs'] as const) summary[key].push(value[key]);
          await value.dispose(); host.remove();
          await yieldToBrowser();
        }
      }
    }
    for (const framework of frameworks) {
      const summary: (typeof result.synchronous)[number] = { name: framework.label, effectMs: [], templateMs: [] };
      result.synchronous.push(summary);
      for (let round = -3; round < 15; round++) {
        const cell = framework.core.signal(0);
        const node = document.createTextNode('');
        const stop = framework.core.effect(() => { node.data = String(cell.value); });
        let start = performance.now();
        for (let i = 1; i <= 100000; i++) { cell.value = i; framework.core.flush(); }
        const effectMs = performance.now() - start;
        check(node.data === '100000', 'Effect final value'); stop(); await drain();
        const host = document.createElement('div');
        const template = framework.core.html`<output>${cell}</output>`;
        template.mount(host);
        const text = host.querySelector('output')?.childNodes[1];
        start = performance.now();
        for (let i = 1; i <= 100000; i++) { cell.value = i; framework.core.flush(); }
        const templateMs = performance.now() - start;
        check(host.textContent === '100000' && text === host.querySelector('output')?.childNodes[1], 'Template final value and text identity');
        template.dispose(); await drain();
        if (round >= 0) { summary.effectMs.push(effectMs); summary.templateMs.push(templateMs); }
        await yieldToBrowser();
      }
    }
    for (let round = 0; round < 15; round++) {
      const text = document.createTextNode(''); const start = performance.now();
      for (let i = 1; i <= 10000; i++) { text.data = String(i); await drain(); check(text.data === String(i), 'Control'); }
      result.controls.push(performance.now() - start);
      await yieldToBrowser();
    }
    result.microtasks = ['queueMicrotask', 'resolved-Promise'].map(name => ({ name, milliseconds: [] }));
    for (let round = -3; round < 15; round++) {
      for (let offset = 0; offset < 2; offset++) {
        const item = result.microtasks[(round + 3 + offset) % 2];
        if (!item) throw new Error('Missing scheduler control');
        const resolved = Promise.resolve();
        const schedule = item.name === 'queueMicrotask'
          ? (fn: () => void) => { queueMicrotask(fn); }
          : (fn: () => void) => { void resolved.then(fn); };
        let value = 0;
        const text = document.createTextNode('');
        const callback = () => { text.data = String(value); };
        const start = performance.now();
        for (let i = 1; i <= 10000; i++) {
          value = i; schedule(callback); await drain();
          check(text.data === String(i), 'Microtask control');
        }
        const milliseconds = performance.now() - start;
        if (round >= 0) item.milliseconds.push(milliseconds);
        await yieldToBrowser();
      }
    }
    result.behavior.race = await nisliRace(fixture); fixture.replaceChildren();
    result.behavior.lifetimes = await nisliLifetimes(fixture); fixture.replaceChildren();
    result.behavior.consistency = await nisliConsistency(fixture); fixture.replaceChildren();
    const value = candidate.signal(1);
    const reference = candidate.ref<HTMLButtonElement>();
    let clicks = 0;
    const view = () => candidate.html`${[candidate.html`<i>one</i>`, candidate.html`<i>two</i>`]}<table><tr><td>${value}</td></tr></table><svg viewBox="0 0 10 10"><text>${value}</text></svg><button ref=${reference} title="value-${value}" class:active=${value} @click.prevent=${() => { clicks++; }}>Click</button>`;
    for (let i = 0; i < 2; i++) {
      const template = view(); template.mount(fixture);
      const button = reference.current; check(button !== null, 'Ref populated');
      if (!button) throw new Error('Missing button');
      const event = new MouseEvent('click', { cancelable: true }); button.dispatchEvent(event);
      check(event.defaultPrevented && clicks === i + 1, 'Event modifier');
      value.value = i + 5; await drain();
      check(fixture.querySelector('tbody td')?.textContent === String(i + 5), 'Browser-inserted tbody');
      check(fixture.querySelector('svg text')?.textContent === String(i + 5), 'SVG binding');
      check(button.title === `value-${i + 5}` && button.classList.contains('active'), 'Mixed attribute and class');
      template.dispose();
      button.click(); check(clicks === i + 1 && reference.current === null, 'Event and ref disposal');
      fixture.replaceChildren();
    }
    result.behavior.cachedBindingContracts = { expandingEarlierSibling: true, impliedTbody: true, svg: true, mixedAttribute: true, classDirective: true, ref: true, eventModifier: true, disposal: true, repeatedMount: true };
    report.textContent = JSON.stringify({ medians: { updates: result.updates.map(item => ({ name: item.name, mountMs: median(item.mountMs), updateMs: median(item.updateMs) })), mounts: result.mounts.map(item => ({ name: item.name, shape: item.shape, signalsMs: median(item.signalsMs), templateCreationMs: median(item.templateCreationMs), remainderMs: median(item.remainderMs), mountMs: median(item.mountMs) })), synchronous: result.synchronous.map(item => ({ name: item.name, effectMs: median(item.effectMs), templateMs: median(item.templateMs) })), controlMs: median(result.controls), microtasks: result.microtasks.map(item => ({ name: item.name, milliseconds: median(item.milliseconds) })) }, behavior: result.behavior }, null, 2);
    const response = await fetch('/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result, null, 2) });
    check(response.ok, 'Saving result'); progress.textContent = 'Complete — results saved';
  } catch (error) { progress.textContent = 'Failed'; report.textContent = String(error instanceof Error ? error.stack : error); }
  finally { button.disabled = false; }
}
button.addEventListener('click', () => { void run(); });
