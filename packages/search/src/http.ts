import { createSearch } from './search.js';
import type { ManagedEncoder, SearchEngine, SearchOptions, SearchResponse } from './contracts.js';

interface Manifest { readonly index: string; readonly vectors: string; readonly space: string; readonly model: unknown }
export interface HttpSearchOptions {
  readonly manifestUrl: string;
  /** Called only for a related query. The session owns and eventually closes this model. */
  readonly createEncoder?: (model: unknown) => Promise<ManagedEncoder>;
  readonly onStatus?: (phase: 'index' | 'model' | 'refresh') => void;
  readonly fetch?: typeof fetch;
  readonly refreshAfterMs?: number;
}
export interface SearchSession {
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
  /** Reject new work, wait for accepted searches, then release owned models. */
  close(): Promise<void>;
}
class RetiredCorpus extends Error {}

function readManifest(value: unknown, base: URL): Manifest {
  if (!value || typeof value !== 'object' || !('format' in value) || value.format !== 1 || !('index' in value) || typeof value.index !== 'string' || !('vectors' in value) || typeof value.vectors !== 'string' || !('space' in value) || typeof value.space !== 'string' || !value.space || !('model' in value)) throw new Error('Unsupported search manifest.');
  function asset(path: string): string {
    const url = new URL(path, base);
    if (url.origin !== base.origin || url.username || url.password || url.search || url.hash || /[\u0000-\u0020\\]/u.test(path)) throw new Error('Search assets must use the manifest origin.');
    return url.href;
  }
  return { index: asset(value.index), vectors: asset(value.vectors), space: value.space, model: value.model };
}

/** HTTP is an adapter: the portable retrieval domain knows no URLs, clocks or model host. */
export function createHttpSearch(options: HttpSearchOptions): SearchSession {
  const base = new URL(options.manifestUrl), request = options.fetch ?? fetch;
  const freshness = options.refreshAfterMs ?? 60_000;
  if (!Number.isFinite(freshness) || freshness < 0) throw new Error('Invalid search refresh interval.');
  let manifest: { value: Manifest; checkedAt: number } | undefined;
  let checking: Promise<Manifest> | undefined;
  let loaded: { key: string; engine: Promise<SearchEngine> } | undefined;
  const models = new Map<string, Promise<ManagedEncoder>>();
  let currentModel = '', active = 0, closed = false, closing: Promise<void> | undefined;
  const idle = new Set<() => void>();

  function modelKey(config: Manifest): string { return JSON.stringify([config.space, config.model]); }
  async function configuration(force = false): Promise<Manifest> {
    if (!force && manifest && Date.now() - manifest.checkedAt < freshness) return manifest.value;
    checking ??= (async () => {
      const previous = manifest;
      try {
        const response = await request(base.href, { cache: 'no-cache' });
        if (!response.ok) throw new Error('The search manifest is unavailable.');
        const value = readManifest(await response.json(), base);
        manifest = { value, checkedAt: Date.now() }; currentModel = modelKey(value);
        return value;
      } catch (error) {
        // Already-open word search remains useful when the connection disappears.
        if (previous && !force) { manifest = { ...previous, checkedAt: Date.now() }; return previous.value; }
        throw error;
      }
    })().finally(() => { checking = undefined; });
    return checking;
  }
  async function data(path: string): Promise<Response> {
    const response = await request(path, { cache: 'force-cache' });
    if (response.status === 404 || response.status === 410) throw new RetiredCorpus('The search corpus changed.');
    if (!response.ok) throw new Error('A search corpus file is unavailable.');
    return response;
  }
  async function engine(force = false): Promise<SearchEngine> {
    const config = await configuration(force), key = JSON.stringify(config);
    if (!loaded || loaded.key !== key) {
      const engine = (async () => {
        options.onStatus?.('index');
        return createSearch(await (await data(config.index)).text(), {
          ...(options.createEncoder ? { loadEncoder: async () => {
            const id = modelKey(config); let model = models.get(id);
            if (!model) {
              options.onStatus?.('model');
              const create = options.createEncoder;
              if (!create) throw new Error('Related search has no model adapter.');
              model = create(config.model).catch(error => { models.delete(id); throw error; }); models.set(id, model);
            }
            return model;
          } } : {}),
          loadVectors: async () => new Uint8Array(await (await data(config.vectors)).arrayBuffer()),
        });
      })().catch(error => { if (loaded?.key === key) loaded = undefined; throw error; });
      loaded = { key, engine };
    }
    return loaded.engine;
  }
  async function releaseRetired(): Promise<void> {
    if (active) return;
    for (const [key, promise] of models) if (closed || key !== currentModel) {
      models.delete(key);
      let model: ManagedEncoder;
      try { model = await promise; } catch { continue; }
      await model.close();
    }
  }
  return {
    async search(query, searchOptions = {}) {
      if (closed) throw new Error('The search session is closed.');
      active++;
      try {
        for (let attempt = 0; ; attempt++) {
          try { return await (await engine(attempt === 1)).search(query, searchOptions); }
          catch (error) {
            if (!(error instanceof RetiredCorpus) || attempt !== 0) throw error;
            loaded = undefined; options.onStatus?.('refresh');
          }
        }
      } finally {
        active--;
        if (!active) { for (const resolve of idle) resolve(); idle.clear(); }
        if (!closed) await releaseRetired();
      }
    },
    close() {
      closed = true;
      closing ??= (async () => {
        if (active) await new Promise<void>(resolve => idle.add(resolve));
        await releaseRetired(); loaded = undefined; manifest = undefined;
      })();
      return closing;
    },
  };
}
