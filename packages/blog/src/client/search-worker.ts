import { createHttpSearch } from '@gkoreli/search/http';
import { readCommand, type SearchCommand, type SearchEvent } from './search-transport.js';

// Transport scheduling belongs to the host; corpus/model lifetime belongs to the package.
const worker: { onmessage: ((event: MessageEvent<unknown>) => void) | null; postMessage: (value: SearchEvent) => void; location: Location } = globalThis;
let newest = 0, latestRelated = 0;
const session = createHttpSearch({
  manifestUrl: new URL('/search-manifest.json', worker.location.href).href,
  onStatus(phase) {
    worker.postMessage({ id: phase === 'model' ? latestRelated : newest, type: 'status', message: phase === 'refresh' ? 'The publication changed. Refreshing its search index…' : phase === 'model' ? 'Loading related search (about 54 MB before browser caching)… Words is still available.' : 'Opening the passage index…' });
  },
  async createEncoder(configuration) {
    const [adapter, model] = await Promise.all([import('@gkoreli/search/e5-web'), import('@gkoreli/search/e5')]);
    let last = -1;
    return adapter.createBrowserE5(model.readE5WebFiles(configuration), { baseUrl: worker.location.href, progress(loaded, total) {
      const percent = Math.floor(loaded * 100 / total / 10) * 10;
      if (percent !== last) { last = percent; worker.postMessage({ id: latestRelated, type: 'status', message: `Loading model ${percent}%. You can switch to Words while it loads.` }); }
    } });
  },
});
let pending: SearchCommand | undefined, draining = false;
async function execute(command: SearchCommand): Promise<void> {
  const started = performance.now();
  try {
    const result = await session.search(command.query, { mode: command.mode, passagesPerArticle: command.passagesPerArticle, ...(command.section ? { section: command.section } : {}), ...(command.article ? { article: command.article } : {}) });
    if (command.id === newest) worker.postMessage({ id: command.id, type: 'result', result, milliseconds: performance.now() - started });
  } catch {
    if (command.id === newest) worker.postMessage({ id: command.id, type: 'error', message: 'Search could not finish. Try a shorter query, choose Words, or reload to get the latest search files.' });
  }
}
async function drain(): Promise<void> {
  if (draining) return; draining = true;
  try { while (pending) { const command = pending; pending = undefined; await execute(command); } }
  finally { draining = false; }
}
worker.onmessage = event => {
  try {
    const command = readCommand(event.data); newest = command.id;
    if (command.mode === 'related') { latestRelated = command.id; pending = command; void drain(); }
    else { pending = undefined; void execute(command); }
  } catch { /* Ignore malformed transport messages, without echoing their contents. */ }
};
