import { createSearch, type SearchEngine, type SearchResponse } from '@gkoreli/search';

function escape(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function resultsHtml(result: SearchResponse): string {
  if (!result.articles.length) return '<p class="search-empty">No matching passages. Try fewer words or another spelling.</p>';
  return result.articles.map(match => `<article class="search-hit"><p class="search-hit-meta">${escape(match.article.section ?? '')}</p><h3 class="search-hit-title"><a href="${escape(match.article.url)}">${escape(match.article.title)}</a></h3>${match.passages.map(passage => `<a class="search-passage" href="${escape(passage.url)}"><span class="search-passage-heading">${escape(passage.passage.headings.at(-1) ?? '')}</span><span class="search-passage-text">${passage.preview.start ? '…' : ''}${escape(passage.preview.text)}${passage.preview.end < passage.passage.text.length ? '…' : ''}</span><span class="search-passage-action">Open passage</span></a>`).join('')}</article>`).join('');
}

/** Per-isolate lexical cache. Asset URL, not an application-global singleton corpus, is its identity. */
export function createSearchHandler() {
  let loaded: { path: string; engine: Promise<SearchEngine> } | undefined;
  return async (request: Request, assets: Fetcher): Promise<Response | null> => {
    const url = new URL(request.url);
    if (url.pathname !== '/search' && url.pathname !== '/search/') return null;
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Use a GET search.', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const query = url.searchParams.get('q'); if (query === null) return null;
    const assetUrl = new URL('/search', url);
    const page = await assets.fetch(new Request(assetUrl));
    if (!page.ok) return page;
    let html = '', status = ''; let code = 200;
    try {
      if (query.length > 512) throw new Error('Please shorten the search to 512 characters.');
      const manifestResponse = await assets.fetch(new Request(new URL('/search-manifest.json', url)));
      if (!manifestResponse.ok) throw new Error('The article index is unavailable.');
      const manifest: unknown = await manifestResponse.json();
      if (!manifest || typeof manifest !== 'object' || !('index' in manifest) || typeof manifest.index !== 'string' || !/^\/search-assets\/[a-f0-9]+\/index\.json$/u.test(manifest.index)) throw new Error('The article index is unavailable.');
      if (!loaded || loaded.path !== manifest.index) {
        const path = manifest.index;
        loaded = { path, engine: (async () => { const response = await assets.fetch(new Request(new URL(path, url))); if (!response.ok) throw new Error('The article index is unavailable.'); return createSearch(await response.text()); })().catch(error => { loaded = undefined; throw error; }) };
      }
      const engine = await loaded.engine, result = await engine.search(query);
      html = resultsHtml(result); status = `${result.articles.length} ${result.articles.length === 1 ? 'article' : 'articles'} shown from ${engine.articleCount} published articles. Results link to source passages.`;
    } catch { code = query.length > 512 ? 400 : 503; status = code === 400 ? 'Please shorten the search to 512 characters.' : 'Search is temporarily unavailable. Please try again.'; }
    const headers = new Headers(page.headers); headers.set('Cache-Control', 'no-store'); headers.set('X-Robots-Tag', 'noindex');
    const transformed = new HTMLRewriter()
      .on('#page-query', { element(element) { element.setAttribute('value', query.slice(0, 512)); } })
      .on('.search-page .search-results', { element(element) { element.setInnerContent(html, { html: true }); } })
      .on('.search-page .search-status', { element(element) { element.setInnerContent(status); } })
      .transform(new Response(page.body, { status: code, headers }));
    return request.method === 'HEAD' ? new Response(null, { status: transformed.status, headers: transformed.headers }) : transformed;
  };
}
