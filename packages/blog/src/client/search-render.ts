import type { SearchResponse, TextRange } from '@gkoreli/search';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node;
}
function highlight(text: string, ranges: readonly TextRange[]): DocumentFragment {
  const fragment = document.createDocumentFragment(); let position = 0;
  for (const range of ranges) { fragment.append(text.slice(position, range.start), element('mark', '', text.slice(range.start, range.end))); position = range.end; }
  fragment.append(text.slice(position)); return fragment;
}

/** All indexed text uses textContent; source markup can never become executable result HTML. */
export function renderSearchResults(container: HTMLElement, response: SearchResponse, scope: (article: string, title: string) => void): void {
  const fragment = document.createDocumentFragment();
  if (!response.articles.length && response.query) fragment.append(element('p', 'search-empty', 'No matching passages. Try fewer words, another spelling, or Related ideas.'));
  for (const match of response.articles) {
    const article = element('article', 'search-hit');
    const meta = element('p', 'search-hit-meta', [match.article.section?.replaceAll('-', ' '), match.article.date].filter(Boolean).join(' · '));
    const heading = element('h3', 'search-hit-title'), title = element('a', '', match.article.title); title.href = match.article.url; title.dataset['searchResult'] = ''; heading.append(title);
    article.append(meta, heading);
    for (const excerpt of match.passages) {
      const link = element('a', 'search-passage'); link.href = excerpt.url; link.dataset['searchResult'] = '';
      const context = excerpt.passage.headings.filter(text => text !== match.article.title).at(-1);
      if (context) link.append(element('span', 'search-passage-heading', context));
      const quote = element('span', 'search-passage-text');
      if (excerpt.preview.start) quote.append('…'); quote.append(highlight(excerpt.preview.text, excerpt.preview.matches)); if (excerpt.preview.end < excerpt.passage.text.length) quote.append('…');
      link.append(quote, element('span', 'search-passage-action', 'Open passage')); article.append(link);
      const contextBox = element('details', 'search-context'), summary = element('summary', '', 'Read in context'); contextBox.append(summary);
      for (const passage of excerpt.context) contextBox.append(element('p', passage.id === excerpt.passage.id ? 'search-context-selected' : '', passage.text));
      article.append(contextBox);
    }
    const refine = element('button', 'search-within', 'Search within this article'); refine.type = 'button'; refine.addEventListener('click', () => scope(match.article.id, match.article.title)); article.append(refine);
    fragment.append(article);
  }
  container.replaceChildren(fragment);
}
