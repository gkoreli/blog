import { html } from '@nisli/core';
import { dropdown } from '@gkoreli/design/dropdown';
import { SECTION_LABELS, type PostMeta } from '../lib/frontmatter.js';
import { formatDateShort } from '../lib/dates.js';
import { utilityIcon } from '../templates/utility-icon.js';

function searchFilters(id: string) {
  return html`<div class="search-controls">
    ${dropdown({ id: id + '-mode', name: 'mode', label: 'Match by', options: [
      { value: 'words', label: 'Words' }, { value: 'related', label: 'Related ideas' },
    ] })}
    ${dropdown({ id: id + '-section', name: 'section', label: 'Section', options: [
      { value: '', label: 'All sections' },
      ...Object.entries(SECTION_LABELS).map(([value, label]) => ({ value, label })),
    ] })}
  </div>`;
}

function searchOutput(id: string) {
  return html`<p class="search-model-note" hidden>Related search downloads a model and passage index to your browser.</p>
    <button type="button" class="search-enable" hidden>Enable related search · about 54 MB</button>
    <p class="search-status" role="status" aria-live="polite"></p>
    <div class="search-results" id=${id + '-results'}><!--search-results--></div>`;
}

export function searchDialog(recent: readonly PostMeta[] = []) {
  return html`<dialog id="site-publication-search" data-publication-search-dialog class="search-dialog" aria-label="Search the publication">
    <div data-search-surface="palette">
      <form action="/search" method="get" class="search-form" role="search">
        <div class="palette-entry">
          ${utilityIcon('search')}
          <input id="palette-query" name="q" type="search" aria-label="Search articles and passages" placeholder="Search the publication…" autocomplete="off" maxlength="512" enterkeyhint="search" aria-keyshortcuts="ArrowDown">
          <button type="button" class="icon-control" data-search-clear aria-label="Clear query" hidden>${utilityIcon('close')}</button>
          <button type="button" class="palette-close" data-search-close aria-keyshortcuts="Escape" aria-label="Close search">Close</button>
        </div>
        <div class="palette-toolbar">
          <details class="palette-filters" hidden data-search-enhanced>
            <summary>Filters<span class="palette-filter-selection"></span></summary>
            ${searchFilters('palette')}
          </details>
          <a class="palette-full" href="/search">Full search</a>
        </div>
      </form>
      <div class="palette-body">
        ${recent.length ? html`<section class="palette-latest" aria-labelledby="palette-latest-title">
          <div class="palette-latest-heading"><h2 id="palette-latest-title">Latest articles</h2><span class="palette-key-hint" aria-hidden="true"><kbd>↓</kbd> to browse</span></div>
          <ul>${recent.map(post => html`<li><a href=${'/' + post.slug} data-search-result>
            ${utilityIcon('posts')}<span>${post.title}</span><time datetime=${post.date}>${formatDateShort(post.date)}</time>
          </a></li>`)}</ul>
        </section>` : ''}
        ${searchOutput('palette')}
      </div>
    </div>
  </dialog>`;
}

export function searchPage() {
  return html`<section class="search-page tool-app">
    <p class="search-eyebrow">The publication, paragraph by paragraph</p>
    <h1>Find something you read.</h1>
    <p>Search a project name, a detail, or a topic you half remember.</p>
    <div data-search-surface="page">
      <form action="/search" method="get" class="search-form" role="search">
        <label for="page-query">Search articles and passages</label>
        <div class="search-input-row"><input id="page-query" name="q" type="search" maxlength="512" autocomplete="off" placeholder="Article, topic or phrase…" enterkeyhint="search"><button type="submit">Search</button></div>
        <div hidden data-search-enhanced>${searchFilters('page')}</div>
      </form>
      ${searchOutput('page')}
    </div>
    <p class="search-footnote">Results are passages to inspect, including related material. They do not confirm that a remembered topic appears here. Interactive queries run in your browser. Submitting the plain search form sends its query in the URL to this site.</p>
  </section>`;
}
