import { escapeHtml } from './navigation.mjs';

const methods = { hybrid: 'Hybrid', keyword: 'Keyword', semantic: 'Semantic' };
const queryUrl = (query, method, focus) => '/?' + new URLSearchParams({ q: query, method, focus }).toString();
const e = escapeHtml;

function renderUnit(unit) {
  const tag = unit.kind === 'pre' ? 'pre' : 'p';
  return `<section class="source-unit">
    <p class="source-heading">${e(unit.heading || 'Article text')}</p>
    <${tag} class="source-text">${e(unit.text.length > 1000 ? unit.text.slice(0, 1000) + '…' : unit.text)}</${tag}>
    ${unit.text.length > 1000 ? `<details><summary>Read the full excerpt</summary><p class="source-text">${e(unit.text)}</p></details>` : ''}
    <a class="paragraph-link" href="${e(unit.navigation.url)}" target="_blank" rel="noreferrer">${e(unit.navigation.label)}</a>
  </section>`;
}

function renderContexts(contexts) {
  if (!contexts?.length) return '';
  return `<details class="matching-context"><summary>More matching sections in this article</summary>
    <p class="context-note">These longer passages produced the article match. They provide context beyond the three selected excerpts.</p>
    ${contexts.map(context => `<section class="source-unit"><p class="source-heading">${e(context.heading || 'Article text')}</p>
      <p class="source-text">${e(context.text)}</p>
      <a class="paragraph-link" href="${e(context.navigation.url)}" target="_blank" rel="noreferrer">${e(context.navigation.label)}</a></section>`).join('')}
  </details>`;
}

function renderResults(result, method) {
  const missing = result.missingLiteralTerms;
  const note = missing.length ? `<p class="evidence-note">No word matches in this index for <strong>${missing.map(e).join(', ')}</strong>. Related passages can still appear; this does not verify that the topic is covered.</p>` : '';
  const articles = `<ol class="articles">${result.articles.map(article => `<li class="article-result">
    <h3><a href="https://gkoreli.com/${e(article.article)}" target="_blank" rel="noreferrer">${e(article.title)}</a></h3>
    ${article.matches.length ? article.matches.map(renderUnit).join('') : '<p>No excerpt selected for this method. The article link remains available.</p>'}
    ${renderContexts(article.contexts)}
  </li>`).join('')}</ol>`;
  const empty = '<p>No keyword matches. Try a topic description or compare semantic search.</p>';
  const list = !result.articles.length ? empty : result.allLiteralTermsMissing
    ? `<details class="unverified"><summary>Show closest semantic suggestions</summary><p class="context-note">These suggestions have no matching query words in the index.</p>${articles}</details>`
    : articles;
  return `<section aria-labelledby="results-heading"><h2 id="results-heading">${!result.articles.length ? 'Search results' : result.allLiteralTermsMissing ? 'Related passages' : 'Matching articles'}</h2>
    <p class="results-summary">${result.articles.length} distinct articles ranked · ${e(methods[method])} · ${result.elapsedMs.toFixed(1)} ms local computation</p>
    ${note}${list}</section>`;
}

export function renderPage({ catalog, query = '', method = 'hybrid', focus = 'literal', result = null, error = '' }) {
  const radios = Object.entries(methods).map(([value, label]) => `<label><input type="radio" name="method" value="${value}"${method === value ? ' checked' : ''}> ${label}</label>`).join('');
  const examples = ['animated icons for Svelte 5', 'the thing that hid words in a PDF but left them there', 'the app that wrote local reports after blocking the internet', 'a tablet pretending to be a desktop and getting the wrong installer'];
  const focusNote = result?.changed
    ? `<p class="focus-note">Searching for <strong>${e(result.searchText)}</strong> · <a href="${e(queryUrl(query, method, 'literal'))}">Use the whole question</a></p>`
    : focus === 'literal' && result?.focusAvailable
      ? `<p class="focus-note">Using the whole question. <a href="${e(queryUrl(query, method, 'topic'))}">Focus on its topic</a></p>` : '';
  const body = result ? renderResults(result, method) : `<section class="examples"><h2>Try a recollection</h2><ul>${examples.map(example => `<li><a href="${e(queryUrl(example, method, focus))}">${e(example)}</a></li>`).join('')}</ul></section>`;
  return `<!doctype html><html lang="en"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Search the blog · Reader experiment</title><link rel="stylesheet" href="/style.css">
  </head><body><main>
    <header><p class="eyebrow">Goga Koreli · Local search experiment</p>
      <h1>Find the article.<br>Open the paragraph.</h1>
      <p class="intro">Search the text of ${catalog.articles} articles. Describe an idea or project, then inspect the source passages.</p></header>
    <form action="/" method="get"><label class="query-label" for="query">What do you remember?</label>
      <textarea id="query" name="q" rows="2" maxlength="4096" required>${e(query)}</textarea>
      <input type="hidden" name="focus" value="${e(focus)}"><div class="search-controls">
        <fieldset><legend>Ranking</legend>${radios}</fieldset><button type="submit">Find articles</button>
      </div></form>
    ${error ? `<p role="alert" class="evidence-note">${e(error)}</p>` : ''}${focusNote}${body}
    <footer>
      <p>${catalog.passages} passage units choose the articles; ${catalog.paragraphs} source-block units select excerpts within them. The paragraph stage preserves article order. Optional context shows longer source passages.</p>
      <p>Source snapshot: ${e(catalog.sourceCommit.slice(0, 8))}. All ${catalog.articles} live article pages were captured on ${e(catalog.liveCapturedAt.slice(0, 10))}. Text links use phrases verified in that capture; browser support and later page edits can affect the destination.</p>
      <p>Local E5-small-v2 transformer, BM25 and rank fusion. Separate from Modern Web Guidance’s seven-line encoder. Ranked matches are not answers or confidence estimates. The server does not log search queries; the browser may retain local search URLs.</p>
      <p>This prototype runs on a local Node CPU server and is not a search feature deployed to gkoreli.com. It works without client JavaScript.</p>
    </footer>
  </main></body></html>`;
}
