import { renderSearchResults } from './search-render.js';
import type { SearchCommand, SearchEvent } from './search-transport.js';

let requestNumber = 0;
let searchWorker: Worker | undefined;
const listeners = new Map<number, (event: SearchEvent) => void>();
function worker(): Worker {
  if (searchWorker) return searchWorker;
  searchWorker = new Worker('/search-worker.js', { type: 'module', name: 'publication-search' });
  searchWorker.addEventListener('message', (event: MessageEvent<SearchEvent>) => listeners.get(event.data.id)?.(event.data));
  searchWorker.addEventListener('error', () => { for (const [id, listener] of listeners) listener({ id, type: 'error', message: 'Local search could not load. The search page can still run a word search.' }); searchWorker?.terminate(); searchWorker = undefined; });
  return searchWorker;
}

export interface SearchSurface { readonly input: HTMLInputElement; run(): void }
const surfaces = new WeakMap<HTMLElement, SearchSurface>();
let relatedEnabled = false;

export function enhanceSearch(root: HTMLElement): SearchSurface | undefined {
  const existing = surfaces.get(root); if (existing) return existing;
  const form = root.querySelector('form'), input = root.querySelector('input'), mode = root.querySelector('select[name="mode"]'), section = root.querySelector('select[name="section"]'), results = root.querySelector('.search-results'), status = root.querySelector('.search-status'), enable = root.querySelector('.search-enable'), note = root.querySelector('.search-model-note');
  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(mode instanceof HTMLSelectElement) || !(section instanceof HTMLSelectElement) || !(results instanceof HTMLElement) || !(status instanceof HTMLElement) || !(enable instanceof HTMLButtonElement) || !(note instanceof HTMLElement)) return undefined;
  const controls = root.querySelector('[data-search-enhanced]'); if (controls instanceof HTMLElement) controls.hidden = false;
  let timer: ReturnType<typeof setTimeout> | undefined, active = 0, article = '', articleTitle = '', passageBudget = 3;
  let focusNext: { article: string; position: number } | undefined;
  const scope = document.createElement('button'); scope.className = 'search-scope'; scope.type = 'button'; scope.hidden = true; form.append(scope);
  scope.addEventListener('click', () => { article = ''; articleTitle = ''; passageBudget = 3; scope.hidden = true; input.focus(); run(); });
  const invalidate = (): void => { if (timer) clearTimeout(timer); if (active) listeners.delete(active); active = ++requestNumber; results.setAttribute('aria-busy', 'false'); };
  const run = (): void => {
    invalidate();
    const value = input.value.trim();
    note.hidden = mode.value !== 'related'; enable.hidden = mode.value !== 'related' || relatedEnabled;
    if (!value) { results.replaceChildren(); status.textContent = 'Search project names, exact words, or ideas you remember.'; return; }
    if (mode.value === 'related' && !relatedEnabled) { results.replaceChildren(); status.textContent = 'Enable the model to search by related ideas, or choose Words for immediate search.'; return; }
    const id = active; results.setAttribute('aria-busy', 'true'); status.textContent = mode.value === 'related' ? 'Finding related passages…' : 'Searching the publication…';
    const command: SearchCommand = { id, query: value, mode: mode.value === 'related' ? 'related' : 'words', section: section.value, article, passagesPerArticle: passageBudget };
    listeners.set(id, event => {
      if (id !== active) return;
      if (event.type === 'status') { status.textContent = event.message; return; }
      listeners.delete(id); results.setAttribute('aria-busy', 'false');
      if (event.type === 'error') { status.textContent = event.message; return; }
      const focused = document.activeElement; const previous = focused instanceof HTMLAnchorElement && results.contains(focused) ? focused.getAttribute('href') : null;
      const within = (identity: string, title: string): void => { article = identity; articleTitle = title; scope.textContent = `Within: ${title} · Clear`; scope.hidden = false; };
      renderSearchResults(results, event.result, (identity, title) => { within(identity, title); passageBudget = 3; input.focus(); run(); }, (identity, title, shown) => { within(identity, title); passageBudget = Math.min(20, shown + 5); focusNext = { article: identity, position: shown }; run(); });
      if (focusNext) {
        const target = [...results.querySelectorAll<HTMLElement>('[data-search-article]')].find(node => node.dataset['searchArticle'] === focusNext?.article)?.querySelectorAll<HTMLAnchorElement>('.search-passage')[focusNext.position];
        (target ?? input).focus(); focusNext = undefined;
      } else if (previous) ([...results.querySelectorAll('a')].find(link => link.getAttribute('href') === previous) ?? input).focus();
      else if (focused instanceof HTMLElement && !focused.isConnected) input.focus();
      const absent = event.result.missingWords.length ? ` No indexed word matches: ${event.result.missingWords.slice(0, 5).join(', ')}.` : '';
      const count = event.result.articles.length;
      status.textContent = `${count ? `${count} ${count === 1 ? 'article' : 'articles'} shown` : 'No results'}${articleTitle ? ' within this article' : ''}. ${event.result.mode === 'related' ? 'Related passages may not answer the question.' : 'Matching words and source passages.'}${absent}`;
    });
    try { worker().postMessage(command); } catch { listeners.delete(id); results.setAttribute('aria-busy', 'false'); status.textContent = 'Local search is unavailable. Submit a word search on the search page.'; }
  };
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  input.addEventListener('input', () => { passageBudget = 3; focusNext = undefined; invalidate(); timer = setTimeout(run, 180); });
  mode.addEventListener('change', () => { passageBudget = 3; focusNext = undefined; run(); }); section.addEventListener('change', () => { passageBudget = 3; focusNext = undefined; run(); });
  enable.addEventListener('click', () => { relatedEnabled = true; enable.hidden = true; run(); });
  root.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const links = [...results.querySelectorAll<HTMLAnchorElement>('[data-search-result]')]; if (!links.length) return;
    if (event.target !== input && (!(document.activeElement instanceof HTMLAnchorElement) || !links.includes(document.activeElement))) return;
    const position = links.findIndex(link => link === document.activeElement);
    const next = event.key === 'ArrowDown' ? Math.min(position + 1, links.length - 1) : position <= 0 ? -1 : position - 1;
    event.preventDefault(); if (next < 0) input.focus(); else links[next]?.focus();
  });
  const surface = { input, run }; surfaces.set(root, surface); return surface;
}
