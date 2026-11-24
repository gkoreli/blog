import { renderSearchResults } from './search-render.js';
import { issueSearchStatus } from '../lib/search-status.js';
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

interface SearchSurface { run(): void; restore(params: URLSearchParams): void }
const surfaces = new WeakMap<HTMLElement, SearchSurface>();
let relatedEnabled = false;

export function enhanceSearch(root: HTMLElement): SearchSurface | undefined {
  const existing = surfaces.get(root); if (existing) return existing;
  const form = root.querySelector('form'), input = root.querySelector('input'), mode = root.querySelector('select[name="mode"]'), section = root.querySelector('select[name="section"]'), results = root.querySelector('.search-results'), status = root.querySelector('.search-status'), enable = root.querySelector('.search-enable'), note = root.querySelector('.search-model-note');
  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(mode instanceof HTMLSelectElement) || !(section instanceof HTMLSelectElement) || !(results instanceof HTMLElement) || !(status instanceof HTMLElement) || !(enable instanceof HTMLButtonElement) || !(note instanceof HTMLElement)) return undefined;
  const controls = root.querySelector('[data-search-enhanced]'); if (controls instanceof HTMLElement) controls.hidden = false;
  const full = root.querySelector<HTMLAnchorElement>('.palette-full');
  const clear = root.querySelector<HTMLButtonElement>('[data-search-clear]');
  const latest = root.querySelector<HTMLElement>('.palette-latest');
  const filterSelection = root.querySelector('.palette-filter-selection');
  const initialBudget = full ? 1 : 3;
  let article = '', articleTitle = '';
  let timer: ReturnType<typeof setTimeout> | undefined, active = 0, passageBudget = initialBudget;
  let focusNext: { article: string; position: number } | undefined;
  const scope = document.createElement('button');
  scope.className = 'search-scope'; scope.type = 'button'; form.append(scope);
  const nativeQuery = new URLSearchParams(location.search);
  let nativeResults = !full && results.childElementCount > 0;
  const setScope = (identity: string, title: string): void => {
    article = identity; articleTitle = title;
    scope.textContent = title ? `Clear article filter · ${title}` : 'Clear article filter';
    scope.hidden = !identity;
  };
  setScope(article, articleTitle);
  scope.addEventListener('click', () => { setScope('', ''); passageBudget = initialBudget; input.focus(); run(); });
  const busy = (pending: boolean): void => {
    results.inert = pending;
    results.setAttribute('aria-busy', String(pending));
  };
  const invalidate = (): void => { if (timer) clearTimeout(timer); if (active) listeners.delete(active); active = ++requestNumber; busy(false); };
  const updatePalette = (): void => {
    if (!full) return;
    const query = input.value.trim();
    if (clear) clear.hidden = !input.value;
    const labels = [section.value && section.selectedOptions[0]?.textContent, mode.value === 'related' && 'Related ideas'].filter(Boolean);
    if (filterSelection) filterSelection.textContent = labels.join(' · ');
    if (latest) latest.hidden = Boolean(query || labels.length || article);
    const params = new URLSearchParams({ q: query });
    if (section.value) params.set('section', section.value);
    if (mode.value === 'related') params.set('mode', mode.value);
    if (article) { params.set('article', article); params.set('title', articleTitle); }
    // Interactive queries stay client-side when moving to the full search page.
    full.href = query || params.size > 1 ? '/search#' + params.toString() : '/search';
  };
  const run = (): void => {
    invalidate(); updatePalette();
    const value = input.value.trim();
    nativeResults &&= mode.value === 'words' && !article && value === nativeQuery.get('q')?.trim()
      && section.value === (nativeQuery.get('section') ?? '');
    note.hidden = mode.value !== 'related'; enable.hidden = mode.value !== 'related' || relatedEnabled;
    if (!value) {
      results.replaceChildren();
      status.textContent = (article || section.value) ? 'Type a query to search this selection.' : '';
      return;
    }
    if (mode.value === 'related' && !relatedEnabled) { results.replaceChildren(); status.textContent = ''; return; }
    const id = active; busy(true); status.textContent = mode.value === 'related' ? 'Finding related passages…' : 'Searching the publication…';
    const command: SearchCommand = { id, query: value, mode: mode.value === 'related' ? 'related' : 'words', section: section.value, article, passagesPerArticle: passageBudget };
    listeners.set(id, event => {
      if (id !== active) return;
      if (event.type === 'status') { status.textContent = event.message; return; }
      listeners.delete(id); busy(false);
      if (event.type === 'error') {
        if (!nativeResults) results.replaceChildren();
        status.textContent = event.message;
        return;
      }
      nativeResults = false;
      const focused = document.activeElement; const previous = focused instanceof HTMLAnchorElement && results.contains(focused) ? focused.getAttribute('href') : null;
      renderSearchResults(results, event.result, (identity, title) => { setScope(identity, title); passageBudget = initialBudget; input.focus(); run(); }, (identity, title, shown) => { setScope(identity, title); passageBudget = Math.min(20, shown + 5); focusNext = { article: identity, position: shown }; run(); });
      if (focusNext) {
        const target = [...results.querySelectorAll<HTMLElement>('[data-search-article]')].find(node => node.dataset['searchArticle'] === focusNext?.article)?.querySelectorAll<HTMLAnchorElement>('.search-passage')[focusNext.position];
        (target ?? input).focus(); focusNext = undefined;
      } else if (previous) ([...results.querySelectorAll('a')].find(link => link.getAttribute('href') === previous) ?? input).focus();
      else if (focused instanceof HTMLElement && !focused.isConnected) input.focus();
      const absent = event.result.missingWords.length ? ` No indexed word matches: ${event.result.missingWords.slice(0, 5).join(', ')}.` : '';
      const count = event.result.articles.length;
      status.textContent = issueSearchStatus(event.result) ?? `${count ? `${count} ${count === 1 ? 'article' : 'articles'} shown` : 'No results'}${articleTitle ? ' within this article' : ''}.${event.result.mode === 'related' ? ' Ranked by related ideas.' : ''}${absent}`;
    });
    try { worker().postMessage(command); } catch { listeners.delete(id); busy(false); if (!nativeResults) results.replaceChildren(); status.textContent = 'Local search is unavailable. Submit a word search on the search page.'; }
  };
  clear?.addEventListener('click', () => {
    input.value = ''; input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  input.addEventListener('input', () => {
    passageBudget = initialBudget; focusNext = undefined;
    invalidate(); updatePalette();
    if (input.value.trim() && (mode.value !== 'related' || relatedEnabled)) {
      busy(true); status.textContent = 'Searching…';
      timer = setTimeout(run, 180);
    } else run();
  });
  mode.addEventListener('change', () => { passageBudget = initialBudget; focusNext = undefined; run(); }); section.addEventListener('change', () => { passageBudget = initialBudget; focusNext = undefined; run(); });
  enable.addEventListener('click', () => { relatedEnabled = true; enable.hidden = true; run(); });
  root.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const source = latest && !latest.hidden ? latest : results;
    if (source.inert) return;
    const links = [...source.querySelectorAll<HTMLAnchorElement>('[data-search-result]')]; if (!links.length) return;
    if (event.target !== input && (!(document.activeElement instanceof HTMLAnchorElement) || !links.includes(document.activeElement))) return;
    const position = links.findIndex(link => link === document.activeElement);
    const next = event.key === 'ArrowDown' ? Math.min(position + 1, links.length - 1) : position <= 0 ? -1 : position - 1;
    event.preventDefault(); if (next < 0) input.focus(); else links[next]?.focus();
  });
  const restore = (params: URLSearchParams): void => {
    input.value = (params.get('q') ?? '').slice(0, 512);
    section.value = params.get('section') ?? '';
    if (section.selectedIndex < 0) section.selectedIndex = 0;
    mode.value = params.get('mode') === 'related' ? 'related' : 'words';
    setScope(params.get('article') ?? '', params.get('title') ?? '');
    passageBudget = initialBudget; focusNext = undefined;
    run();
  };
  const surface = { run, restore }; surfaces.set(root, surface); return surface;
}
