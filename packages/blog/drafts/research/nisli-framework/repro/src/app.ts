import { litNarrow, litRace, litSignals, litWide } from './lit';
import { nisli, nisliConsistency, nisliLifetimes, nisliRace } from './nisli';
import { solid, solidConsistency, solidRace } from './solid';
import { check, drain, requireElement, type Adapter } from './shared';

const adapters: Adapter[] = [litWide, litSignals, litNarrow, solid, nisli];
const fixture = requireElement(document.querySelector<HTMLElement>('#fixture'));
const report = requireElement(document.querySelector<HTMLElement>('#report'));
const progress = requireElement(document.querySelector<HTMLElement>('#progress'));
const button = requireElement(document.querySelector<HTMLButtonElement>('#run'));

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const value = sorted[Math.floor(sorted.length / 2)];
  if (value === undefined) throw new Error('Empty samples');
  return value;
};

async function sample(adapter: Adapter, size: number, updates: number) {
  fixture.replaceChildren();
  const host = document.createElement('div'); fixture.append(host);
  const mountStart = performance.now();
  const mounted = await adapter.mount(host, size, false);
  const mountMs = performance.now() - mountStart;
  const outputs = host.querySelectorAll('output');
  check(outputs.length === size, `${adapter.name}: row count`);
  const target = requireElement(outputs[0] ?? null);
  check(target.textContent === '0', `${adapter.name}: initial text`);
  const start = performance.now();
  for (let i = 1; i <= updates; i++) {
    mounted.set(0, i);
    await drain();
    check(target.textContent === String(i), `${adapter.name}: update ${i} did not settle`);
  }
  const updateMs = performance.now() - start;
  check(target.textContent === String(updates), `${adapter.name}: final text`);
  check(target === host.querySelector('output'), `${adapter.name}: text-node host identity`);
  await mounted.dispose(); host.remove();
  return { mountMs, updateMs };
}

async function probe(adapter: Adapter) {
  fixture.replaceChildren();
  const host = document.createElement('div'); fixture.append(host);
  const mounted = await adapter.mount(host, 1000, true);
  const beforeReads = mounted.counts.reads;
  let mutations = 0;
  const observer = new MutationObserver(records => { mutations += records.length; });
  observer.observe(host, { subtree: true, childList: true, characterData: true, attributes: true });
  for (let i = 1; i <= 10; i++) { mounted.set(0, i); await drain(); }
  observer.disconnect();
  const result = {
    name: adapter.name,
    expressionReads: adapter === litSignals ? null : mounted.counts.reads - beforeReads,
    readsNote: adapter === litSignals ? 'Not instrumented inside watch(); only DOM mutations compared' : 'Separate instrumented pass; excluded from timing',
    mutationRecords: mutations,
    setupCount: mounted.counts.setups,
  };
  await mounted.dispose(); host.remove(); return result;
}

async function run() {
  button.disabled = true;
  const results: {
    metadata: Record<string, unknown>;
    timings: Array<{ name: string; mountMs: number[]; updateMs: number[]; medianMountMs: number; medianUpdateMs: number }>;
    probes: Array<Awaited<ReturnType<typeof probe>>>;
    behavior: Record<string, unknown>;
  } = {
    metadata: {
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      visibilityState: document.visibilityState,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      rows: 1000, updates: 10000, warmupRounds: 1, measuredRounds: 7,
      timingBoundary: 'State write + six shared microtask turns; DOM settled; no paint/layout measurement',
      fixture: 'One changed cell in a fixed 1000-row panel. Lit narrow adds custom-element boundaries.',
      versions: { nisli: '0.56.0', nisliCommit: '4afde49c728a330e10ce887a38b8013d63b58498', lit: '3.3.3', litSignals: '0.3.0', litTask: '1.0.3', solid: '2.0.0-rc.14', solidCompiler: '2.0.0-rc.14', vite: '8.3.2' },
    },
    timings: [], probes: [], behavior: {},
  };
  try {
    for (const adapter of adapters) {
      progress.textContent = `Checking ${adapter.name}`;
      results.probes.push(await probe(adapter));
      await sample(adapter, 1000, 10000); // Unreported warmup, including parse cache/JIT.
      results.timings.push({ name: adapter.name, mountMs: [], updateMs: [], medianMountMs: 0, medianUpdateMs: 0 });
    }
    for (let round = 0; round < 7; round++) {
      // Rotate run order so one adapter is not always first or last.
      for (let offset = 0; offset < adapters.length; offset++) {
        const index = (round + offset) % adapters.length;
        const adapter = adapters[index]; const summary = results.timings[index];
        if (!adapter || !summary) throw new Error('Missing adapter');
        progress.textContent = `Round ${round + 1}/7: ${adapter.name}`;
        const value = await sample(adapter, 1000, 10000);
        summary.mountMs.push(value.mountMs); summary.updateMs.push(value.updateMs);
      }
    }
    for (const summary of results.timings) {
      summary.medianMountMs = median(summary.mountMs);
      summary.medianUpdateMs = median(summary.updateMs);
    }
    fixture.replaceChildren();
    progress.textContent = 'Checking asynchronous work and lifetimes';
    results.behavior.litRace = await litRace(fixture); fixture.replaceChildren();
    results.behavior.nisliRace = await nisliRace(fixture); fixture.replaceChildren();
    results.behavior.solidRace = await solidRace(fixture); fixture.replaceChildren();
    results.behavior.nisliLifetimes = await nisliLifetimes(fixture); fixture.replaceChildren();
    results.behavior.nisliConsistency = await nisliConsistency(fixture); fixture.replaceChildren();
    results.behavior.solidConsistency = await solidConsistency(fixture); fixture.replaceChildren();
    report.textContent = JSON.stringify(results, null, 2);
    progress.textContent = 'Complete — saving results';
    const response = await fetch('/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results, null, 2) });
    if (!response.ok) throw new Error('Could not save results');
    progress.textContent = 'Complete — results saved';
  } catch (error) {
    progress.textContent = 'Failed';
    report.textContent = JSON.stringify({ error: error instanceof Error ? error.stack : String(error), partial: results }, null, 2);
    await fetch('/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: report.textContent });
  } finally { button.disabled = false; }
}
button.addEventListener('click', () => { void run(); });
