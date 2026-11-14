import { createSearch, type EmbeddingEncoder, type SearchEngine } from '@gkoreli/search';
import { readCommand, type SearchCommand, type SearchEvent } from './search-transport.js';

// A dedicated worker keeps model loading and ranking away from reader interactions.
const worker: { onmessage: ((event: MessageEvent<unknown>) => void) | null; postMessage: (value: SearchEvent) => void; location: Location } = globalThis;
let lexical: Promise<SearchEngine> | undefined, related: Promise<SearchEngine> | undefined;
let latestRelated = 0;
let manifest: Promise<{ index: string; vectors: string; model: unknown; relatedDownloadBytes: number }> | undefined;
let serialized: Promise<string> | undefined;
let checkedAt = 0;
let encoder: Promise<EmbeddingEncoder> | undefined;
class RetiredCorpus extends Error {}
async function dataAsset(path: string): Promise<Response> {
  const response = await fetch(path, { cache: 'force-cache' });
  if (response.status === 404 || response.status === 410) throw new RetiredCorpus('The publication index changed.');
  if (!response.ok) throw new Error('The publication index is unavailable.');
  return response;
}
function resetCorpus(): void { manifest = undefined; serialized = undefined; lexical = undefined; related = undefined; checkedAt = 0; }
function configuration() {
  manifest ??= fetch('/search-manifest.json', { cache: 'no-cache' }).then(async response => {
    if (!response.ok) throw new Error('The publication index is unavailable.');
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || !('index' in value) || typeof value.index !== 'string' || !value.index.startsWith('/search-assets/') || !('vectors' in value) || typeof value.vectors !== 'string' || !value.vectors.startsWith('/search-assets/') || !('model' in value) || !('relatedDownloadBytes' in value) || typeof value.relatedDownloadBytes !== 'number') throw new Error('Unsupported publication index.');
    checkedAt = Date.now();
    return { index: value.index, vectors: value.vectors, model: value.model, relatedDownloadBytes: value.relatedDownloadBytes };
  }).catch(error => { manifest = undefined; throw error; });
  return manifest;
}
async function indexText(): Promise<string> {
  serialized ??= configuration().then(async config => (await dataAsset(config.index)).text()).catch(error => { serialized = undefined; throw error; });
  return serialized;
}
async function engine(command: SearchCommand): Promise<SearchEngine> {
  if (command.mode === 'words') {
    lexical ??= indexText().then(text => createSearch(text)).catch(error => { lexical = undefined; throw error; }); return lexical;
  }
  related ??= (async () => {
    const [config, text, adapter, model] = await Promise.all([configuration(), indexText(), import('@gkoreli/search/e5-web'), import('@gkoreli/search/e5')]);
    worker.postMessage({ id: latestRelated, type: 'status', message: encoder ? 'Refreshing the passage index…' : `Loading related search (${(config.relatedDownloadBytes / 1_000_000).toFixed(1)} MB before browser caching)… Words search is still available.` });
    let last = -1;
    encoder ??= adapter.createBrowserE5(model.readE5WebFiles(config.model), { baseUrl: worker.location.href, progress(loaded, total) {
      const percent = Math.floor(loaded * 100 / total / 10) * 10;
      if (percent !== last) { last = percent; worker.postMessage({ id: latestRelated, type: 'status', message: `Loading model ${percent}%. You can switch to Words while it loads.` }); }
    } }).catch(error => { encoder = undefined; throw error; });
    return createSearch(text, { encoder: await encoder, loadVectors: async () => new Uint8Array(await (await dataAsset(config.vectors)).arrayBuffer()) });
  })().catch(error => { related = undefined; throw error; });
  return related;
}
let newest = 0; let pending: SearchCommand | undefined; let draining = false;
async function execute(command: SearchCommand): Promise<void> {
  const started = performance.now();
  // Refresh a long-open page without issuing a manifest request for every keystroke.
  if (manifest && checkedAt !== 0 && Date.now() - checkedAt > 60_000) {
    const previous = await manifest; manifest = undefined;
    try { const current = await configuration(); if (current.index !== previous.index) { serialized = undefined; lexical = undefined; related = undefined; } }
    catch { manifest = Promise.resolve(previous); checkedAt = Date.now(); }
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const search = await engine(command); if (command.id !== newest) return;
      const result = await search.search(command.query, { mode: command.mode, ...(command.section ? { section: command.section } : {}), ...(command.article ? { article: command.article } : {}) });
      if (command.id === newest) worker.postMessage({ id: command.id, type: 'result', result, milliseconds: performance.now() - started });
      return;
    } catch (error) {
      if (!(error instanceof RetiredCorpus) || attempt !== 0) throw error;
      resetCorpus();
      if (command.id !== newest) return;
      worker.postMessage({ id: command.id, type: 'status', message: 'The publication changed. Refreshing its search index…' });
    }
  }
}
async function drain(): Promise<void> {
  if (draining) return; draining = true;
  try {
    while (pending) {
      const command = pending; pending = undefined;
      try {
        await execute(command);
      } catch { if (command.id === newest) worker.postMessage({ id: command.id, type: 'error', message: 'Search could not finish. Try Words or reload this page to get the latest search files.' }); }
    }
  } finally { draining = false; }
}
worker.onmessage = event => {
  try {
    const command = readCommand(event.data); newest = command.id;
    if (command.mode === 'related') { latestRelated = command.id; pending = command; void drain(); }
    else {
      pending = undefined;
      void (async () => {
        try { await execute(command); }
        catch { if (command.id === newest) worker.postMessage({ id: command.id, type: 'error', message: 'Word search is unavailable. Reload this page or use the search page.' }); }
      })();
    }
  } catch { /* Ignore malformed messages; never echo query text into diagnostics. */ }
};
